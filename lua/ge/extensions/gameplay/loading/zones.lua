local M = {}

local Config = gameplay_loading_config

M.sitesData = nil
M.sitesFilePath = nil
M.availableGroups = {}
M.groupCache = {}
M.stockRegenTimer = 0
M.groupCachePrecomputeQueued = false
M.sitesLoadTimer = 0

local function findOffRoadCentroid(zone, minRoadDist, maxPoints)
  if not zone or not zone.aabb or zone.aabb.invalid then return nil end
  if not map or not map.findClosestRoad then return nil end

  minRoadDist = minRoadDist or 5
  maxPoints = maxPoints or 1000

  local xMin, xMax = zone.aabb.xMin, zone.aabb.xMax
  local yMin, yMax = zone.aabb.yMin, zone.aabb.yMax
  local xRange, yRange = math.max(0.1, xMax - xMin), math.max(0.1, yMax - yMin)

  local step = math.max(2, math.sqrt((xRange * yRange) / maxPoints))

  local sum = vec3(0,0,0)
  local count = 0

  local x = xMin
  while x <= xMax do
    local y = yMin
    while y <= yMax do
      local p = vec3(x, y, 0)
      p.z = core_terrain.getTerrainHeight(p)
      if zone:containsPoint2D(p) then
        local _, _, dist = map.findClosestRoad(p)
        if dist and dist > minRoadDist then
          sum = sum + p
          count = count + 1
        end
      end
      y = y + step
    end
    x = x + step
  end

  if count == 0 then return nil end
  local centroid = sum / count
  centroid.z = core_terrain.getTerrainHeight(centroid)
  return centroid
end

function M.ensureGroupCache(group, getCurrentGameHour)
  if not group or not group.secondaryTag then return nil end
  local key = tostring(group.secondaryTag)
  local cache = M.groupCache[key]
  if not cache then
    cache = {
      stock = {
        current = Config.Config.Stock.DefaultMaxStock,
        max = Config.Config.Stock.DefaultMaxStock,
        regenRate = Config.Config.Stock.DefaultRegenRate,
        lastRegenCheck = getCurrentGameHour(),
      },
      spawnedPropCount = 0,
    }
    M.groupCache[key] = cache
    print(string.format("[Loading] Initialized stock for zone '%s': %d/%d", 
      key, cache.stock.current, cache.stock.max))
  end
  return cache
end

function M.ensureGroupOffRoadCentroid(group, getCurrentGameHour)
  local cache = M.ensureGroupCache(group, getCurrentGameHour)
  if not cache then return nil end
  if group and group.loading and not cache.offRoadCentroid then
    cache.offRoadCentroid = findOffRoadCentroid(group.loading, 5, 1000)
  end
  return cache
end

function M.updateZoneStocks(dt, getCurrentGameHour)
  M.stockRegenTimer = M.stockRegenTimer + dt
  if M.stockRegenTimer < Config.Config.Stock.RegenCheckInterval then return end
  M.stockRegenTimer = 0

  local currentHour = getCurrentGameHour()

  for _, group in ipairs(M.availableGroups) do
    local cache = M.groupCache[tostring(group.secondaryTag)]
    if cache and cache.stock then
      local stock = cache.stock
      local hoursPassed = currentHour - stock.lastRegenCheck
      if hoursPassed < 0 then hoursPassed = hoursPassed + 24 end
      
      if hoursPassed >= 1 then
        local regenAmount = math.floor(hoursPassed * stock.regenRate)
        if regenAmount > 0 and stock.current < stock.max then
          local oldStock = stock.current
          stock.current = math.min(stock.max, stock.current + regenAmount)
          stock.lastRegenCheck = currentHour
          
          if stock.current > oldStock then
            print(string.format("[Loading] Zone '%s': Stock regenerated %d -> %d/%d", 
              group.secondaryTag, oldStock, stock.current, stock.max))
          end
        else
          stock.lastRegenCheck = currentHour
        end
      end
    end
  end
end

function M.getZoneStockInfo(group, getCurrentGameHour)
  if not group then return nil end
  local cache = M.ensureGroupCache(group, getCurrentGameHour)
  if not cache or not cache.stock then return nil end
  
  return {
    current = cache.stock.current,
    max = cache.stock.max,
    regenRate = cache.stock.regenRate,
    spawnedProps = cache.spawnedPropCount or 0,
    materialType = group.materialType or "rocks"
  }
end

local function discoverGroups(sites)
  local groups = {}
  if not sites or not sites.sortedTags then return groups end

  local primary = { spawn = true, destination = true, loading = true }
  local materialTags = { marble = true, rocks = true }

  for _, secondaryTag in ipairs(sites.sortedTags) do
    if not primary[secondaryTag] and not materialTags[secondaryTag] then
      local spawnLoc, destLoc, loadingZone
      local sCount, dCount, zCount = 0, 0, 0

      for _, loc in ipairs(sites.tagsToLocations.spawn or {}) do
        if loc.customFields and loc.customFields.tags and loc.customFields.tags[secondaryTag] then
          sCount = sCount + 1
          spawnLoc = loc
        end
      end
      for _, loc in ipairs(sites.tagsToLocations.destination or {}) do
        if loc.customFields and loc.customFields.tags and loc.customFields.tags[secondaryTag] then
          dCount = dCount + 1
          destLoc = loc
        end
      end
      for _, zone in ipairs(sites.tagsToZones.loading or {}) do
        if zone.customFields and zone.customFields.tags and zone.customFields.tags[secondaryTag] then
          zCount = zCount + 1
          loadingZone = zone
        end
      end

      if sCount == 1 and dCount == 1 and zCount == 1 then
        local materialType = nil
        if loadingZone.customFields and loadingZone.customFields.tags then
          for tag, _ in pairs(loadingZone.customFields.tags) do
            if materialTags[tag] then
              materialType = tag
              break
            end
          end
        end
        
        table.insert(groups, {
          secondaryTag = secondaryTag,
          spawn = spawnLoc,
          destination = destLoc,
          loading = loadingZone,
          materialType = materialType or "rocks"
        })
        
        print(string.format("[Loading] Discovered zone '%s' with material type: %s", 
          secondaryTag, materialType or "rocks (default)"))
      end
    end
  end

  table.sort(groups, function(a, b) return tostring(a.secondaryTag) < tostring(b.secondaryTag) end)
  return groups
end

function M.loadQuarrySites(getCurrentGameHour)
  local lvl = getCurrentLevelIdentifier()
  if not lvl then return end

  if M.sitesData and M.sitesFilePath then return end
  if not gameplay_sites_sitesManager then return end

  local fp = gameplay_sites_sitesManager.getCurrentLevelSitesFileByName("quarry")
  if not fp then
    for _, f in ipairs(gameplay_sites_sitesManager.getCurrentLevelSitesFiles() or {}) do
      if string.find(string.lower(f), "quarry") then
        fp = f
        break
      end
    end
  end

  if not fp then return end

  local loaded = gameplay_sites_sitesManager.loadSites(fp)
  if not loaded then return end

  M.sitesData = loaded
  M.sitesFilePath = fp
  M.availableGroups = discoverGroups(M.sitesData)
  
  print("[Loading] Sites loaded. Checking loading zones:")
  if M.sitesData.tagsToZones and M.sitesData.tagsToZones.loading then
    for i, zone in ipairs(M.sitesData.tagsToZones.loading) do
      local tagStr = ""
      if zone.customFields and zone.customFields.tags then
        for tag, _ in pairs(zone.customFields.tags) do
          tagStr = tagStr .. tostring(tag) .. ", "
        end
      end
      print(string.format("  Zone %d: name=%s, tags=[%s]", i, zone.name or "?", tagStr))
    end
  else
    print("  No loading zones found in tagsToZones!")
  end

  if not M.groupCachePrecomputeQueued and #M.availableGroups > 0 then
    M.groupCachePrecomputeQueued = true
    core_jobsystem.create(function(job)
      for _, g in ipairs(M.availableGroups) do
        M.ensureGroupOffRoadCentroid(g, getCurrentGameHour)
        job.sleep(0.01)
      end
    end)
  end
end

function M.isPlayerInAnyLoadingZone(playerPos)
  for _, g in ipairs(M.availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return true
    end
  end
  return false
end

function M.getPlayerCurrentZone(playerPos)
  for _, g in ipairs(M.availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return g
    end
  end
  return nil
end

function M.isStarterZone(group)
  if not group or not group.secondaryTag then return false end
  return string.lower(tostring(group.secondaryTag)) == "starter"
end

function M.getStarterZone()
  for _, g in ipairs(M.availableGroups) do
    if M.isStarterZone(g) then
      return g
    end
  end
  return nil
end

function M.getStarterZoneFromSites()
  if not M.sitesData or not M.sitesData.tagsToZones or not M.sitesData.tagsToZones.loading then
    return nil
  end
  for _, zone in ipairs(M.sitesData.tagsToZones.loading) do
    local hasStarter = zone.customFields and zone.customFields.tags and zone.customFields.tags["starter"]
    if hasStarter then
      return zone
    end
  end
  return nil
end

function M.getZonesByMaterial(materialType)
  local zones = {}
  for _, g in ipairs(M.availableGroups) do
    if not M.isStarterZone(g) and g.materialType == materialType then
      table.insert(zones, g)
    end
  end
  return zones
end

local starterZoneDebugTimer = 0
function M.isPlayerInStarterZone(playerPos)
  local currentZone = M.getPlayerCurrentZone(playerPos)
  if currentZone and M.isStarterZone(currentZone) then
    return true
  end
  
  if M.sitesData and M.sitesData.tagsToZones and M.sitesData.tagsToZones.loading then
    local loadingZones = M.sitesData.tagsToZones.loading
    for _, zone in ipairs(loadingZones) do
      local hasStarter = zone.customFields and zone.customFields.tags and zone.customFields.tags["starter"]
      if hasStarter then
        if zone.containsPoint2D then
          local isInZone = zone:containsPoint2D(playerPos)
          if isInZone then
            return true
          end
        end
      end
    end
  else
    starterZoneDebugTimer = starterZoneDebugTimer + 0.016
    if starterZoneDebugTimer > 5 then
      starterZoneDebugTimer = 0
      print(string.format("[Loading] isPlayerInStarterZone debug: sitesData=%s, tagsToZones=%s, loading=%s",
        tostring(M.sitesData ~= nil),
        tostring(M.sitesData and M.sitesData.tagsToZones ~= nil),
        tostring(M.sitesData and M.sitesData.tagsToZones and M.sitesData.tagsToZones.loading ~= nil)))
    end
  end
  
  return false
end

M.findOffRoadCentroid = findOffRoadCentroid

return M
