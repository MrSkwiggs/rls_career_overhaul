local M = {}
M.dependencies = {"gameplay_sites_sitesManager"}

local Config = {
  -- Trucks per material type
  RockTruckModel   = "us_semi",
  RockTruckConfig  = "tc83s_dump",
  MarbleTruckModel  = "dumptruck",
  MarbleTruckConfig = "quarry",

  -- Material props
  RockProp      = "rock_pile",
  MarbleProp    = "marble_block",
  MarbleConfigs = { "big_rails", "rails" },

  MaxRockPiles    = 2,
  RockDespawnTime = 120,
  TargetLoad      = 25000,
  RockMassPerPile = 41000,

  Economy = {
    BasePay   = 300,
    PayPerTon = 100,
    BaseXP    = 25,
    XPPerTon  = 5
  }
}

local ENABLE_DEBUG = false

local imgui = ui_imgui

local STATE_IDLE            = 0
local STATE_OFFER           = 1
local STATE_DRIVING_TO_SITE = 2
local STATE_LOADING         = 4
local STATE_DELIVERING      = 5

local currentState = STATE_IDLE

local sitesData = nil
local sitesFilePath = nil
local availableGroups = {}
local selectedGroupIndex = 1

local jobObjects = {
  truckID = nil,
  currentLoadMass = 0,
  materialType = nil,
  activeGroup = nil,
  deferredTruckTargetPos = nil,
  loadingZoneTargetPos = nil,
}

local uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
local markerAnim = { time = 0, pulseScale = 1.0, rotationAngle = 0, beamHeight = 0, ringExpand = 0 }

local rockPileQueue = {}
local jobOfferSuppressed = false

local markerCleared = false
local truckStoppedInLoading = false
local isDispatching = false

local function lerp(a, b, t) return a + (b - a) * t end

local function calculateTaxiTransform(position, direction)
  local normal = vec3(0,0,1)
  if map and map.surfaceNormal then normal = map.surfaceNormal(position, 1) end
  local vecY = vec3(0, 1, 0)
  if direction:length() == 0 then direction = vec3(0,1,0) end
  local rotation = quatFromDir(vecY:rotated(quatFromDir(direction, normal)), normal)
  return position, rotation
end

local function calculateLanePosition(roadCenterPos, drivingDirection)
  local isRightHandTraffic = true
  if map and map.getMap and map.getMap().rules then isRightHandTraffic = map.getMap().rules.rightHandDrive or true end
  local rightVector = vec3(-drivingDirection.y, drivingDirection.x, 0):normalized()
  local laneOffset  = isRightHandTraffic and rightVector or -rightVector
  local lanePosition = roadCenterPos + laneOffset * 3.5
  lanePosition.z = core_terrain.getTerrainHeight(lanePosition)
  return lanePosition, drivingDirection
end

local function findClosestRoadInfo(pos)
  if not map or not map.findClosestRoad or not map.getMap then return nil end
  local name_a, name_b, distance = map.findClosestRoad(vec3(pos))
  if not name_a or not name_b or not distance then return nil end
  local nodes = map.getMap().nodes
  local a = nodes[name_a]
  local b = nodes[name_b]
  if not a or not b or not a.pos or not b.pos then return nil end

  local xnorm = vec3(pos):xnormOnLine(a.pos, b.pos)
  if xnorm > 1 then xnorm = 1 end
  if xnorm < 0 then xnorm = 0 end

  local roadPos = lerp(a.pos, b.pos, xnorm)
  local dir = (b.pos - a.pos)
  dir.z = 0
  if dir:length() == 0 then dir = vec3(0,1,0) end
  dir = dir:normalized()

  return {
    pos = roadPos,
    distance = distance,
    a = a,
    b = b,
    dir = dir
  }
end

local function findRoadAdjacentPoint(zone)
  if not zone or not zone.center then return nil, nil end
  local info = findClosestRoadInfo(zone.center)
  if not info then return vec3(zone.center), vec3(0,1,0) end
  local lanePos, dir = calculateLanePosition(info.pos, info.dir)
  return lanePos, dir
end

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

local function discoverGroups(sites)
  local groups = {}
  if not sites or not sites.sortedTags then return groups end

  local primary = { spawn = true, destination = true, loading = true }

  for _, secondaryTag in ipairs(sites.sortedTags) do
    if not primary[secondaryTag] then
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
        table.insert(groups, {
          secondaryTag = secondaryTag,
          spawn = spawnLoc,
          destination = destLoc,
          loading = loadingZone
        })
      end
    end
  end

  table.sort(groups, function(a, b) return tostring(a.secondaryTag) < tostring(b.secondaryTag) end)
  return groups
end

local function loadQuarrySites()
  local lvl = getCurrentLevelIdentifier()
  if not lvl then return end

  if sitesData and sitesFilePath then return end
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

  sitesData = loaded
  sitesFilePath = fp
  availableGroups = discoverGroups(sitesData)
  selectedGroupIndex = math.min(selectedGroupIndex, math.max(#availableGroups, 1))
end

local function clearProps()
  for i = #rockPileQueue, 1, -1 do
    local id = rockPileQueue[i].id
    if id then
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
    end
    table.remove(rockPileQueue, i)
  end
end

local function cleanupJob(deleteTruck)
  core_groundMarkers.setPath(nil)
  markerCleared = false
  truckStoppedInLoading = false
  isDispatching = false
  jobOfferSuppressed = true

  clearProps()

  if deleteTruck and jobObjects.truckID then
    local obj = be:getObjectByID(jobObjects.truckID)
    if obj then obj:delete() end
  end

  jobObjects.truckID = nil
  jobObjects.currentLoadMass = 0
  jobObjects.materialType = nil
  jobObjects.activeGroup = nil
  jobObjects.deferredTruckTargetPos = nil
  jobObjects.loadingZoneTargetPos = nil

  currentState = STATE_IDLE
end

local function manageRockCapacity()
  while #rockPileQueue > Config.MaxRockPiles do
    local oldEntry = table.remove(rockPileQueue, 1)
    if oldEntry and oldEntry.id then
      local obj = be:getObjectByID(oldEntry.id)
      if obj then obj:delete() end
    end
  end
end

local function spawnJobMaterials()
  if not jobObjects.activeGroup or not jobObjects.activeGroup.loading then return end

  local materialType = jobObjects.materialType or "rocks"
  local zone = jobObjects.activeGroup.loading

  local basePos = findOffRoadCentroid(zone, 5, 1000)
  if not basePos then
    log('W', 'RLS_Quarry', 'No off-road point found inside loading zone; not spawning props.')
    ui_message("No off-road spawn point found for materials.", 5, "warning")
    return
  end
  basePos = basePos + vec3(0,0,0.2)

  if materialType == "rocks" then
    local rocks = core_vehicles.spawnNewVehicle(Config.RockProp, { config = "default", pos = basePos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false })
    if rocks then
      table.insert(rockPileQueue, { id = rocks:getID(), mass = Config.RockMassPerPile })
      manageRockCapacity()
    end
  elseif materialType == "marble" then
    local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0) }
    for idx, cfg in ipairs(Config.MarbleConfigs) do
      local pos = basePos + (offsets[idx] or vec3(0,0,0))
      local block = core_vehicles.spawnNewVehicle(Config.MarbleProp, { config = cfg, pos = pos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false })
      if block then
        local baseMass = nil
        if block.getInitialMass then baseMass = block:getInitialMass() end
        table.insert(rockPileQueue, { id = block:getID(), mass = baseMass })
        manageRockCapacity()
      end
    end
  end
end

local function spawnTruckAtLocation(location, materialType, targetPos)
  if not location then return nil end

  local spawnPos = vec3(location.pos)
  local dir = vec3(0, 1, 0)

  local targetDir = nil
  if targetPos then
    targetDir = vec3(targetPos) - spawnPos
    targetDir.z = 0
    if targetDir:length() > 0 then
      targetDir = targetDir:normalized()
    else
      targetDir = nil
    end
  end

  local info = findClosestRoadInfo(spawnPos)
  if info then
    local roadDir = info.dir
    if targetDir then
      if (-roadDir):dot(targetDir) > roadDir:dot(targetDir) then
        roadDir = -roadDir
      end
    end
    local lanePos
    lanePos, dir = calculateLanePosition(info.pos, roadDir)
    spawnPos = lanePos
  else
    spawnPos.z = core_terrain.getTerrainHeight(spawnPos)
    if targetDir then dir = targetDir end
  end

  local pos, rot = calculateTaxiTransform(spawnPos, dir)

  local truckModel = (materialType == "marble") and Config.MarbleTruckModel or Config.RockTruckModel
  local truckConfig = (materialType == "marble") and Config.MarbleTruckConfig or Config.RockTruckConfig

  local truck = core_vehicles.spawnNewVehicle(truckModel, { pos = pos, rot = rot, config = truckConfig, autoEnterVehicle = false })
  if not truck then return nil end

  local id = truck:getID()
  return id
end

local function driveTruckToPoint(truckId, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  truck:queueLuaCommand('if not driver then extensions.load("driver") end')
  core_jobsystem.create(function(job)
    job.sleep(0.5)
    truck:queueLuaCommand('driver.returnTargetPosition(' .. serialize(targetPos) .. ')')
  end)
end

local function stopTruck(truckId)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  truck:queueLuaCommand("ai.setMode('stop') controller.mainController.setHandbrake(1)")
end

local function calculateTruckPayload()
  if not jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then return 0 end

  local oobb = truck:getSpawnWorldOOBB()
  if not oobb then return 0 end

  local p0 = vec3(oobb:getPoint(0))
  local p1 = vec3(oobb:getPoint(1))
  local p3 = vec3(oobb:getPoint(3))
  local p4 = vec3(oobb:getPoint(4))
  local vX, vY, vZ = p1 - p0, p3 - p0, p4 - p0

  local tData = {
    origin = p0,
    uX = vX:normalized(), uY = vY:normalized(), uZ = vZ:normalized(),
    bounds = { minX = -0.1, maxX = vX:length() + 0.1, minY = -0.1, maxY = vY:length() + 0.1, minZ = -0.1, maxZ = vZ:length() + 10.0 }
  }

  local function isPointInOOBB(point)
    local diff = point - tData.origin
    local lx = diff:dot(tData.uX)
    local ly = diff:dot(tData.uY)
    local lz = diff:dot(tData.uZ)
    return (lx >= tData.bounds.minX and lx <= tData.bounds.maxX and
            ly >= tData.bounds.minY and ly <= tData.bounds.maxY and
            lz >= tData.bounds.minZ and lz <= tData.bounds.maxZ)
  end

  local totalMass = 0
  for _, rockEntry in ipairs(rockPileQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      local tf = obj:getTransform()
      local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
      local objPos = obj:getPosition()
      local nodeCount = obj:getNodeCount()
      local step = 10
      local nodesInside, nodesChecked = 0, 0
      for i = 0, nodeCount - 1, step do
        nodesChecked = nodesChecked + 1
        local localPos = obj:getNodePosition(i)
        local worldPoint = objPos - (axisX * localPos.x) - (axisY * localPos.y) + (axisZ * localPos.z)
        if isPointInOOBB(worldPoint) then nodesInside = nodesInside + 1 end
      end
      if nodesChecked > 0 then
        totalMass = totalMass + ((rockEntry.mass or Config.RockMassPerPile) * (nodesInside / nodesChecked))
      end
    end
  end
  return totalMass
end

local function payPlayer()
  local massKg = jobObjects.currentLoadMass or 0
  local tons = massKg / 1000

  local moneyReward = Config.Economy.BasePay + (tons * Config.Economy.PayPerTon)
  local xpReward = math.floor(Config.Economy.BaseXP + (tons * Config.Economy.XPPerTon))
  if moneyReward > 15000 then moneyReward = 15000 end

  local career = extensions.career_career
  local isCareerActive = career and career.isActive()

  if isCareerActive then
    local paymentModule = extensions.career_modules_payment
    if paymentModule then
      local rewards = {
        money = { amount = moneyReward, canBeNegative = false },
        labor = { amount = xpReward, canBeNegative = false }
      }
      local reason = { label = "Quarry Logistics Job", tags = {"gameplay", "mission", "reward"} }
      paymentModule.reward(rewards, reason)
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Buy_01')
      ui_message(string.format("JOB DONE! Earned $%.2f and %d Labor XP", moneyReward, xpReward), 8, "success")
    else
      log('E', 'RLS_Quarry', "Career Payment Module not found!")
    end
  else
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message(string.format("SANDBOX: Theoretical Payout: $%.2f (%.1f Tons)", moneyReward, tons), 6, "success")
  end
end

local function drawWorkSiteMarker(dt)
  if currentState ~= STATE_DRIVING_TO_SITE then return end
  if markerCleared then return end
  if not jobObjects.activeGroup or not jobObjects.activeGroup.loading then return end

  markerAnim.time = markerAnim.time + dt
  markerAnim.pulseScale = 1.0 + math.sin(markerAnim.time * 2.5) * 0.1
  markerAnim.rotationAngle = markerAnim.rotationAngle + dt * 0.4
  markerAnim.beamHeight = math.min(12.0, markerAnim.beamHeight + dt * 30)
  markerAnim.ringExpand = (markerAnim.ringExpand + dt * 1.5) % 1.5

  local basePos = vec3(jobObjects.activeGroup.loading.center)
  local color = ColorF(0.2, 1.0, 0.4, 0.85)
  local colorFaded = ColorF(0.2, 1.0, 0.4, 0.3)
  local beamTop = basePos + vec3(0, 0, markerAnim.beamHeight)
  local beamRadius = 0.5 * markerAnim.pulseScale

  debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
  debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.2, colorFaded)

  local sphereRadius = 1.0 * markerAnim.pulseScale
  debugDrawer:drawSphere(beamTop, sphereRadius, color)
  debugDrawer:drawSphere(beamTop, sphereRadius + 0.3, ColorF(0.2, 1.0, 0.4, 0.15))
end

local function drawUI(dt)
  if not imgui then return end

  if currentState ~= STATE_IDLE then uiAnim.targetOpacity = 1.0 else uiAnim.targetOpacity = 0.0 end
  local speed = 8.0
  uiAnim.opacity = lerp(uiAnim.opacity, uiAnim.targetOpacity, dt * speed)
  uiAnim.yOffset = lerp(uiAnim.yOffset, (1.0 - uiAnim.opacity) * 50, dt * speed)
  if uiAnim.opacity < 0.01 then return end

  uiAnim.pulse = uiAnim.pulse + dt * 5
  local pulseAlpha = (math.sin(uiAnim.pulse) * 0.3) + 0.7

  imgui.PushStyleVar2(imgui.StyleVar_WindowPadding, imgui.ImVec2(20, 20))
  imgui.PushStyleVar1(imgui.StyleVar_WindowRounding, 12)
  imgui.PushStyleColor2(imgui.Col_WindowBg, imgui.ImVec4(0.1, 0.1, 0.12, 0.95 * uiAnim.opacity))
  imgui.PushStyleColor2(imgui.Col_Border, imgui.ImVec4(1.0, 0.7, 0.0, 0.8 * uiAnim.opacity))
  imgui.PushStyleVar1(imgui.StyleVar_WindowBorderSize, 2)
  imgui.SetNextWindowBgAlpha(0.95 * uiAnim.opacity)

  if imgui.Begin("##WL40System", nil, imgui.WindowFlags_NoTitleBar + imgui.WindowFlags_AlwaysAutoResize + imgui.WindowFlags_NoCollapse) then
    imgui.SetWindowFontScale(1.5)
    imgui.TextColored(imgui.ImVec4(1, 0.75, 0, uiAnim.opacity), "LOGISTICS JOB SYSTEM")
    imgui.SetWindowFontScale(1.0)
    imgui.Separator()
    imgui.Dummy(imgui.ImVec2(0, 10))

    local contentWidth = imgui.GetContentRegionAvailWidth()

    if currentState == STATE_OFFER then
      imgui.TextColored(imgui.ImVec4(1, 1, 1, uiAnim.opacity), "New Contract Available")

      if #availableGroups > 0 then
        local currentLabel = availableGroups[selectedGroupIndex] and availableGroups[selectedGroupIndex].secondaryTag or "(none)"
        if imgui.BeginCombo("Group##quarryGroup", currentLabel) then
          for i, g in ipairs(availableGroups) do
            local isSel = (i == selectedGroupIndex)
            if imgui.Selectable1(g.secondaryTag, isSel) then
              selectedGroupIndex = i
            end
            if isSel then imgui.SetItemDefaultFocus() end
          end
          imgui.EndCombo()
        end
      else
        imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, uiAnim.opacity), "No valid sites groups found")
      end

      imgui.Dummy(imgui.ImVec2(0, 10))
      imgui.TextColored(imgui.ImVec4(0.8, 0.8, 0.8, uiAnim.opacity), "Choose material to load:")
      imgui.Dummy(imgui.ImVec2(0, 8))

      local function acceptJob(material)
        if #availableGroups == 0 then return end
        if isDispatching then return end
        isDispatching = true

        jobObjects.materialType = material
        jobObjects.activeGroup = availableGroups[selectedGroupIndex]

        markerCleared = false
        core_groundMarkers.setPath(vec3(jobObjects.activeGroup.loading.center))

        local targetPos = nil
        if jobObjects.activeGroup and jobObjects.activeGroup.loading then
          targetPos = select(1, findRoadAdjacentPoint(jobObjects.activeGroup.loading))
        end

        spawnJobMaterials()
        jobObjects.deferredTruckTargetPos = targetPos
        jobObjects.loadingZoneTargetPos = targetPos
        jobObjects.truckID = nil

        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
        ui_message("Contract accepted. Drive to the loading zone to dispatch the truck.", 5, "info")

        currentState = STATE_DRIVING_TO_SITE
        isDispatching = false
      end

      if imgui.Button("LOAD ROCKS", imgui.ImVec2(contentWidth, 40)) then
        acceptJob("rocks")
      end
      imgui.Dummy(imgui.ImVec2(0, 5))

      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.2, 0.4, 0.2, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.3, 0.6, 0.3, uiAnim.opacity))
      if imgui.Button("LOAD MARBLE BLOCKS", imgui.ImVec2(contentWidth, 40)) then
        acceptJob("marble")
      end
      imgui.PopStyleColor(2)

      imgui.Dummy(imgui.ImVec2(0, 8))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, uiAnim.opacity))
      if imgui.Button("DECLINE", imgui.ImVec2(contentWidth, 30)) then
        currentState = STATE_IDLE
        jobObjects.materialType = nil
        jobOfferSuppressed = true
      end
      imgui.PopStyleColor(2)

    elseif currentState == STATE_DRIVING_TO_SITE then
      if jobObjects.activeGroup and jobObjects.activeGroup.loading then
        local playerVeh = be:getPlayerVehicle(0)
        if not markerCleared then
          imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * uiAnim.opacity), ">> TRAVEL TO MARKER <<")
          local dist = 99999
          if playerVeh then
            dist = (playerVeh:getPosition() - vec3(jobObjects.activeGroup.loading.center)):length()
          end
          local progress = 1.0 - math.min(1, dist / 200)
          imgui.ProgressBar(progress, imgui.ImVec2(-1, 20), string.format("%.0fm", dist))
        else
          imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * uiAnim.opacity), ">> IN LOADING ZONE <<")
          if not truckStoppedInLoading then
            imgui.Text("Waiting for truck to arrive...")
          else
            imgui.Text("Truck arrived. Ready to load.")
          end
        end
      end

      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("CANCEL", imgui.ImVec2(-1, 30)) then
        cleanupJob(true)
      end

    elseif currentState == STATE_LOADING then
      imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha * uiAnim.opacity), ">> LOADING IN PROGRESS <<")
      local mass = jobObjects.currentLoadMass or 0
      local percent = math.min(1.0, mass / Config.TargetLoad)

      local tons = mass / 1000
      local estPay = Config.Economy.BasePay + (tons * Config.Economy.PayPerTon)
      imgui.Text(string.format("Payload: %.0f / %.0f kg", mass, Config.TargetLoad))
      imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Est. Payout: $%.2f", estPay))

      local barColor = imgui.ImVec4(1, 1, 0, 1)
      if percent > 0.8 then barColor = imgui.ImVec4(0, 1, 0, 1) end
      imgui.PushStyleColor2(imgui.Col_PlotHistogram, barColor)
      imgui.ProgressBar(percent, imgui.ImVec2(-1, 30), string.format("%.0f%%", percent * 100))
      imgui.PopStyleColor(1)

      imgui.Dummy(imgui.ImVec2(0, 20))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.4, 0, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.6, 0, uiAnim.opacity))
      if imgui.Button("FINISH JOB", imgui.ImVec2(-1, 45)) then
        payPlayer()

        if jobObjects.truckID and jobObjects.activeGroup and jobObjects.activeGroup.destination then
          local destPos = vec3(jobObjects.activeGroup.destination.pos)
          local truck = be:getObjectByID(jobObjects.truckID)
          driveTruckToPoint(jobObjects.truckID, destPos)
          currentState = STATE_DELIVERING
        else
          cleanupJob(true)
        end
      end
      imgui.PopStyleColor(2)

      imgui.Dummy(imgui.ImVec2(0, 5))
      if imgui.Button("CANCEL", imgui.ImVec2(-1, 30)) then
        cleanupJob(true)
      end

    elseif currentState == STATE_DELIVERING then
      imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * uiAnim.opacity), ">> DELIVERING <<")
      imgui.Text("Truck driving to destination...")
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("CANCEL", imgui.ImVec2(-1, 30)) then
        cleanupJob(true)
      end
    end
  end

  imgui.End()
  imgui.PopStyleColor(2)
  imgui.PopStyleVar(3)
end

local function isPlayerInAnyLoadingZone(playerPos)
  for _, g in ipairs(availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return true
    end
  end
  return false
end

local function onUpdate(dt)
  loadQuarrySites()

  drawWorkSiteMarker(dt)
  if currentState == STATE_LOADING then
    jobObjects.currentLoadMass = calculateTruckPayload()
  end
  drawUI(dt)

  local playerVeh = be:getPlayerVehicle(0)
  if not playerVeh then return end

  local playerPos = playerVeh:getPosition()
  local inAnyZone = isPlayerInAnyLoadingZone(playerPos)

  if currentState == STATE_IDLE then
    if jobOfferSuppressed and not inAnyZone then
      jobOfferSuppressed = false
    end
    if not jobOfferSuppressed and playerVeh:getJBeamFilename() == "wl40" then
      if inAnyZone then
        currentState = STATE_OFFER
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      end
    end

  elseif currentState == STATE_OFFER then
    if not inAnyZone then
      currentState = STATE_IDLE
      jobObjects.materialType = nil
      jobObjects.activeGroup = nil
    end

  elseif currentState == STATE_DRIVING_TO_SITE then
    local group = jobObjects.activeGroup
    if not group or not group.loading then
      cleanupJob(true)
      return
    end

    if group.loading:containsPoint2D(playerPos) and not markerCleared then
      core_groundMarkers.setPath(nil)
      markerCleared = true
    end

    if markerCleared and not jobObjects.truckID and jobObjects.deferredTruckTargetPos then
      local truckId = spawnTruckAtLocation(group.spawn, jobObjects.materialType, jobObjects.deferredTruckTargetPos)
      if truckId then
        jobObjects.truckID = truckId
        driveTruckToPoint(truckId, jobObjects.deferredTruckTargetPos)
        jobObjects.deferredTruckTargetPos = nil
      end
    end

    if jobObjects.truckID and not truckStoppedInLoading then
      local truck = be:getObjectByID(jobObjects.truckID)
      if truck and jobObjects.loadingZoneTargetPos then
        local dist = (truck:getPosition() - vec3(jobObjects.loadingZoneTargetPos)):length()
        if dist < 10 then
          stopTruck(jobObjects.truckID)
          truckStoppedInLoading = true
          ui_message("Truck arrived at loading zone.", 5, "success")
        end
      end
    end

    if markerCleared and truckStoppedInLoading then
      currentState = STATE_LOADING
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
    end

  elseif currentState == STATE_DELIVERING then
    local group = jobObjects.activeGroup
    if jobObjects.truckID and group and group.destination then
      local truck = be:getObjectByID(jobObjects.truckID)
      if truck then
        local dist = (truck:getPosition() - vec3(group.destination.pos)):length()
        if dist < 10 then
          cleanupJob(true)
        end
      else
        cleanupJob(true)
      end
    else
      cleanupJob(true)
    end
  end
end

local function onClientStartMission()
  sitesData = nil
  sitesFilePath = nil
  availableGroups = {}
  selectedGroupIndex = 1
  cleanupJob(true)
  jobOfferSuppressed = false
end

local function onClientEndMission()
  cleanupJob(true)
  sitesData = nil
  sitesFilePath = nil
  availableGroups = {}
end

M.onUpdate = onUpdate
M.onClientStartMission = onClientStartMission
M.onClientEndMission = onClientEndMission

return M
