local M = {}

local Config = gameplay_loading_config

M.jobObjects = {
  truckID = nil,
  currentLoadMass = 0,
  lastDeliveredMass = 0,
  deliveredPropIds = nil,
  materialType = nil,
  activeGroup = nil,
  deferredTruckTargetPos = nil,
  loadingZoneTargetPos = nil,
  truckSpawnQueued = false,
  truckSpawnPos = nil,
  truckSpawnRot = nil,
  marbleDamage = {},
  totalMarbleDamagePercent = 0,
  anyMarbleDamaged = false,
  lastDeliveryDamagePercent = 0,
  deliveryDestination = nil,
  deliveryBlocksStatus = nil,
}

M.rockPileQueue = {}
M.marbleInitialState = {}
M.marbleDamageState = {}
M.debugDrawCache = {
  bedData = nil,
  nodePoints = {},
  marblePieces = {}
}

M.markerCleared = false
M.truckStoppedInLoading = false
M.isDispatching = false
M.payloadUpdateTimer = 0
M.truckStoppedTimer = 0
M.truckLastPosition = nil
M.truckResendCount = 0

local truckStoppedThreshold = 2.0
local truckStopSpeedThreshold = 1.0
local truckMaxResends = 15

function M.calculateSpawnTransformForLocation(spawnPos, targetPos)
  local dir = vec3(0, 1, 0)
  if targetPos and map and map.findClosestRoad and map.getPath and map.getMap then
    local spawnRoadName, spawnNodeIdx, spawnDist = map.findClosestRoad(spawnPos)
    local targetRoadName, targetNodeIdx, targetDist = map.findClosestRoad(targetPos)
    
    if spawnRoadName and targetRoadName then
      local path = nil
      if spawnRoadName ~= targetRoadName then
        path = map.getPath(spawnRoadName, targetRoadName)
      elseif spawnNodeIdx and targetNodeIdx then
        local mapData = map.getMap()
        if mapData and mapData.nodes then
          local spawnNode = mapData.nodes[spawnNodeIdx]
          local targetNode = mapData.nodes[targetNodeIdx]
          if spawnNode and targetNode and spawnNode.pos and targetNode.pos then
            local spawnNodePos = vec3(spawnNode.pos)
            local targetNodePos = vec3(targetNode.pos)
            local directDir = targetNodePos - spawnNodePos
            directDir.z = 0
            if directDir:length() > 0.1 then dir = directDir:normalized() end
          end
        end
      end
      
      if path and #path > 0 then
        local mapData = map.getMap()
        if mapData and mapData.nodes then
          local nextNodeIdx = nil
          local spawnPosVec = vec3(spawnPos)
          
          local closestPathIdx = 1
          local closestDist = math.huge
          for i, nodeIdx in ipairs(path) do
            local node = mapData.nodes[nodeIdx]
            if node and node.pos then
              local nodePos = vec3(node.pos)
              local dist = (nodePos - spawnPosVec):length()
              if dist < closestDist then
                closestDist = dist
                closestPathIdx = i
              end
            end
          end
          
          if closestPathIdx < #path then
            nextNodeIdx = path[closestPathIdx + 1]
          elseif #path > 1 then
            nextNodeIdx = path[2]
          else
            nextNodeIdx = path[1]
          end
          
          if nextNodeIdx then
            local nextNode = mapData.nodes[nextNodeIdx]
            if nextNode and nextNode.pos then
              local nextNodePos = vec3(nextNode.pos)
              local pathDir = nextNodePos - spawnPosVec
              pathDir.z = 0
              if pathDir:length() > 0.1 then dir = pathDir:normalized() end
            end
          end
        end
      end
    end
    
    if dir:length() < 0.1 then
      local targetDir = vec3(targetPos) - spawnPos
      targetDir.z = 0
      if targetDir:length() > 0 then dir = targetDir:normalized() end
    end
  elseif targetPos then
    local targetDir = vec3(targetPos) - spawnPos
    targetDir.z = 0
    if targetDir:length() > 0 then dir = targetDir:normalized() end
  end
  
  local normal = vec3(0,0,1)
  if map and map.surfaceNormal then normal = map.surfaceNormal(spawnPos, 1) end
  if dir:length() == 0 then dir = vec3(0,1,0) end
  local rotation = quatFromDir(dir, normal)
  return spawnPos, rotation
end

function M.manageRockCapacity()
  while #M.rockPileQueue > Config.Config.MaxRockPiles do
    local oldEntry = table.remove(M.rockPileQueue, 1)
    if oldEntry and oldEntry.id then
      local obj = be:getObjectByID(oldEntry.id)
      if obj then obj:delete() end
    end
  end
end

function M.spawnJobMaterials(contractsMod, zonesMod)
  if not M.jobObjects.activeGroup or not M.jobObjects.activeGroup.loading then return end

  local group = M.jobObjects.activeGroup
  local materialType = group.materialType or M.jobObjects.materialType or "rocks"
  local zone = group.loading
  
  local cache = zonesMod.ensureGroupCache(group, contractsMod.getCurrentGameHour)
  if not cache then return end
  
  zonesMod.ensureGroupOffRoadCentroid(group, contractsMod.getCurrentGameHour)
  
  if cache.stock and cache.stock.current <= 0 then
    ui_message("This zone is out of stock! Wait for regeneration.", 5, "warning")
    return
  end
  
  local maxSpawned = Config.Config.Stock.MaxSpawnedProps[materialType] or 2
  local currentlySpawned = 0
  for _, entry in ipairs(M.rockPileQueue) do
    if entry.materialType == materialType then
      currentlySpawned = currentlySpawned + 1
    end
  end
  cache.spawnedPropCount = currentlySpawned
  
  if currentlySpawned >= maxSpawned then return end
  
  local roomForMore = maxSpawned - currentlySpawned
  local stockAvailable = cache.stock and cache.stock.current or Config.Config.Stock.DefaultMaxStock
  local stockCost = Config.Config.Stock.StockCostPerProp[materialType] or 1
  local propsToSpawn = math.min(roomForMore, math.floor(stockAvailable / stockCost))
  
  if propsToSpawn <= 0 then return end
  
  local basePos = cache.offRoadCentroid or nil
  if not basePos then
    basePos = zonesMod.findOffRoadCentroid(zone, 5, 1000)
    if cache then cache.offRoadCentroid = basePos end
  end
  if not basePos then return end
  basePos = basePos + vec3(0,0,0.2)

  local propsSpawned = 0
  
  if materialType == "rocks" then
    for i = 1, propsToSpawn do
      local offset = vec3((i - 1) * 3, 0, 0)
      local rocks = core_vehicles.spawnNewVehicle(Config.Config.RockProp, { 
        config = "default", 
        pos = basePos + offset, 
        rot = quatFromDir(vec3(0,1,0)), 
        autoEnterVehicle = false 
      })
      if rocks then
        table.insert(M.rockPileQueue, { id = rocks:getID(), mass = Config.Config.RockMassPerPile, materialType = "rocks" })
        propsSpawned = propsSpawned + 1
        M.manageRockCapacity()
      end
    end
  elseif materialType == "marble" then
    local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0) }
    local offsetIdx = 1
    
    local contract = contractsMod.ContractSystem.activeContract
    local requiredBlocks = contract and contract.requiredBlocks or { big = 1, small = 1 }
    local delivered = contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.deliveredBlocks or { big = 0, small = 0 }
    
    local spawnedBig = 0
    local spawnedSmall = 0
    for _, entry in ipairs(M.rockPileQueue) do
      if entry.materialType == "marble" then
        if entry.blockType == "big_rails" then spawnedBig = spawnedBig + 1
        elseif entry.blockType == "rails" then spawnedSmall = spawnedSmall + 1 end
      end
    end
    
    local needBig = math.max(0, (requiredBlocks.big or 0) - (delivered.big or 0) - spawnedBig)
    local needSmall = math.max(0, (requiredBlocks.small or 0) - (delivered.small or 0) - spawnedSmall)
    
    local blocksToSpawn = {}
    local maxToSpawn = math.min(propsToSpawn, 2)
    
    for i = 1, math.min(needBig, maxToSpawn - #blocksToSpawn) do
      table.insert(blocksToSpawn, { config = "big_rails", mass = 38000 })
    end
    for i = 1, math.min(needSmall, maxToSpawn - #blocksToSpawn) do
      table.insert(blocksToSpawn, { config = "rails", mass = 19000 })
    end
    
    for _, blockData in ipairs(blocksToSpawn) do
      local pos = basePos + (offsets[offsetIdx] or vec3(0,0,0))
      offsetIdx = offsetIdx + 1
      local block = core_vehicles.spawnNewVehicle(Config.Config.MarbleProp, { 
        config = blockData.config, 
        pos = pos, 
        rot = quatFromDir(vec3(0,1,0)), 
        autoEnterVehicle = false 
      })
      if block then
        table.insert(M.rockPileQueue, { 
          id = block:getID(), 
          mass = blockData.mass, 
          materialType = "marble", 
          blockType = blockData.config 
        })
        propsSpawned = propsSpawned + 1
        M.manageRockCapacity()
      end
    end
  end
  
  if propsSpawned > 0 then
    cache.spawnedPropCount = (cache.spawnedPropCount or 0) + propsSpawned
  end
end

function M.clearProps()
  for i = #M.rockPileQueue, 1, -1 do
    local id = M.rockPileQueue[i].id
    if id then
      M.marbleInitialState[id] = nil
      M.marbleDamageState[id] = nil
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
    end
    table.remove(M.rockPileQueue, i)
  end
end

function M.cleanupJob(deleteTruck, stateIdle)
  core_groundMarkers.setPath(nil)
  M.markerCleared = false
  M.truckStoppedInLoading = false
  M.isDispatching = false
  M.payloadUpdateTimer = 0

  M.debugDrawCache.bedData = nil
  M.debugDrawCache.nodePoints = {}
  M.debugDrawCache.marblePieces = {}

  M.clearProps()

  if deleteTruck and M.jobObjects.truckID then
    local obj = be:getObjectByID(M.jobObjects.truckID)
    if obj then obj:delete() end
  end

  M.jobObjects.truckID = nil
  M.jobObjects.currentLoadMass = 0
  M.jobObjects.lastDeliveredMass = 0
  M.jobObjects.deliveredPropIds = nil
  M.jobObjects.materialType = nil
  M.jobObjects.activeGroup = nil
  M.jobObjects.deliveryDestination = nil
  M.jobObjects.deferredTruckTargetPos = nil
  M.jobObjects.loadingZoneTargetPos = nil
  M.jobObjects.truckSpawnQueued = false
  M.jobObjects.truckSpawnPos = nil
  M.jobObjects.truckSpawnRot = nil
  M.jobObjects.marbleDamage = {}
  M.jobObjects.totalMarbleDamagePercent = 0
  M.jobObjects.anyMarbleDamaged = false
  M.jobObjects.lastDeliveryDamagePercent = 0
  M.jobObjects.deliveryBlocksStatus = nil
  M.marbleDamageState = {}
  
  M.truckStoppedTimer = 0
  M.truckLastPosition = nil
  M.truckResendCount = 0
  
  return stateIdle
end

function M.spawnTruckForGroup(group, materialType, targetPos)
  if not group or not group.spawn or not group.spawn.pos then return nil end
  local pos, rot = M.calculateSpawnTransformForLocation(vec3(group.spawn.pos), targetPos)
  local truckModel = (materialType == "marble") and Config.Config.MarbleTruckModel or Config.Config.RockTruckModel
  local truckConfig = (materialType == "marble") and Config.Config.MarbleTruckConfig or Config.Config.RockTruckConfig
  local truck = core_vehicles.spawnNewVehicle(truckModel, { pos = pos, rot = rot, config = truckConfig, autoEnterVehicle = false })
  if not truck then return nil end
  M.jobObjects.truckSpawnPos = pos
  M.jobObjects.truckSpawnRot = rot
  return truck:getID()
end

function M.driveTruckToPoint(truckId, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  truck:queueLuaCommand('if not driver then extensions.load("driver") end')
  truck:queueLuaCommand("controller.mainController.setHandbrake(0)")
  core_jobsystem.create(function(job)
    job.sleep(0.5)
    truck:queueLuaCommand('ai.setAggressionMode("rubberBand")')
    truck:queueLuaCommand('ai.setAggression(0.8)')
    truck:queueLuaCommand('ai.setIgnoreCollision(true)')
    job.sleep(0.1)
    truck:queueLuaCommand('driver.returnTargetPosition(' .. serialize(targetPos) .. ')')
  end)
end

function M.stopTruck(truckId)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  truck:queueLuaCommand("ai.setMode('stop') controller.mainController.setHandbrake(1)")
end

function M.getTruckBedData(obj)
  if not obj then return nil end
  local pos = obj:getPosition()
  local dir = obj:getDirectionVector():normalized()
  local up = obj:getDirectionVectorUp():normalized()
  local right = dir:cross(up):normalized()
  up = right:cross(dir):normalized()
  local modelName = obj:getJBeamFilename()
  local bedSettings = Config.Config.TruckBedSettings[modelName] or Config.Config.TruckBedSettings.dumptruck
  local offsetBack, offsetSide = bedSettings.offsetBack or 0, bedSettings.offsetSide or 0
  local bedCenterHeight = (bedSettings.floorHeight or 0) + ((bedSettings.loadHeight or 0) / 2)
  local bedCenter = pos - (dir * offsetBack) + (right * offsetSide) + (up * bedCenterHeight)
  return {
    center = bedCenter, axisX = right, axisY = dir, axisZ = up,
    halfWidth = (bedSettings.width or 1) / 2, halfLength = (bedSettings.length or 1) / 2,
    halfHeight = (bedSettings.loadHeight or 1) / 2, floorHeight = bedSettings.floorHeight or 0,
    settings = bedSettings
  }
end

function M.isPointInTruckBed(point, bedData)
  if not bedData then return false end
  local diff = point - bedData.center
  local localX, localY, localZ = diff:dot(bedData.axisX), diff:dot(bedData.axisY), diff:dot(bedData.axisZ)
  return (math.abs(localX) <= bedData.halfWidth and math.abs(localY) <= bedData.halfLength and math.abs(localZ) <= bedData.halfHeight)
end

function M.calculateTruckPayload()
  if #M.rockPileQueue == 0 or not M.jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return 0 end
  local bedData = M.getTruckBedData(truck)
  if not bedData then return 0 end
  M.debugDrawCache.bedData = bedData
  local defaultMass = (M.jobObjects.materialType == "marble") and (Config.Config.MarbleMassDefault or Config.Config.RockMassPerPile) or Config.Config.RockMassPerPile
  if Config.Config.ENABLE_DEBUG then M.debugDrawCache.nodePoints = {} end
  local totalMass = 0
  for _, rockEntry in ipairs(M.rockPileQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      local tf = obj:getTransform()
      local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
      local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
      local step, nodesInside, nodesChecked = 10, 0, 0
      for i = 0, nodeCount - 1, step do
        nodesChecked = nodesChecked + 1
        local worldPoint = objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z)
        local isInside = M.isPointInTruckBed(worldPoint, bedData)
        if isInside then nodesInside = nodesInside + 1 end
        if Config.Config.ENABLE_DEBUG then table.insert(M.debugDrawCache.nodePoints, {pos = worldPoint, inside = isInside}) end
      end
      if nodesChecked > 0 then totalMass = totalMass + ((rockEntry.mass or defaultMass) * (nodesInside / nodesChecked)) end
    end
  end
  return totalMass
end

function M.calculateUndamagedTruckPayload()
  if #M.rockPileQueue == 0 or not M.jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return 0 end
  local bedData = M.getTruckBedData(truck)
  if not bedData then return 0 end
  local defaultMass = (M.jobObjects.materialType == "marble") and (Config.Config.MarbleMassDefault or Config.Config.RockMassPerPile) or Config.Config.RockMassPerPile
  local totalMass = 0
  for _, rockEntry in ipairs(M.rockPileQueue) do
    if not (M.jobObjects.marbleDamage and M.jobObjects.marbleDamage[rockEntry.id] and M.jobObjects.marbleDamage[rockEntry.id].isDamaged) then
      local obj = be:getObjectByID(rockEntry.id)
      if obj then
        local tf = obj:getTransform()
        local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
        local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
        local step, nodesInside, nodesChecked = 10, 0, 0
        for i = 0, nodeCount - 1, step do
          nodesChecked = nodesChecked + 1
          local worldPoint = objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z)
          if M.isPointInTruckBed(worldPoint, bedData) then nodesInside = nodesInside + 1 end
        end
        if nodesChecked > 0 then totalMass = totalMass + ((rockEntry.mass or defaultMass) * (nodesInside / nodesChecked)) end
      end
    end
  end
  return totalMass
end

function M.captureMarbleInitialState(objId)
  local obj = be:getObjectByID(objId)
  if not obj then return end
  M.marbleInitialState[objId] = { nodeCount = obj:getNodeCount(), captureTime = os.clock(), captured = true }
  M.marbleDamageState[objId] = { isDamaged = false, lastUpdate = 0 }
end

function M.calculateMarbleDamage()
  if M.jobObjects.materialType ~= "marble" or #M.rockPileQueue == 0 then
    M.jobObjects.marbleDamage, M.jobObjects.totalMarbleDamagePercent, M.jobObjects.anyMarbleDamaged = {}, 0, false
    M.debugDrawCache.marblePieces = {}
    return
  end
  local totalDamage, damagedCount, checkedCount = 0, 0, 0
  if Config.Config.ENABLE_DEBUG then M.debugDrawCache.marblePieces = {} end
  for _, rockEntry in ipairs(M.rockPileQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      checkedCount = checkedCount + 1
      if not M.marbleInitialState[rockEntry.id] then M.captureMarbleInitialState(rockEntry.id) end
      local initialState = M.marbleInitialState[rockEntry.id]
      if initialState and (os.clock() - initialState.captureTime) < 2.0 then
        M.jobObjects.marbleDamage[rockEntry.id] = { damage = 0, isDamaged = false, settling = true, brokenPieces = 0 }
      else
        local damageCache = M.marbleDamageState[rockEntry.id]
        if not damageCache or (os.clock() - damageCache.lastUpdate) > 0.5 then
          obj:queueLuaCommand('obj:queueGameEngineLua("gameplay_loading.onMarbleDamageCallback(' .. rockEntry.id .. ', " .. tostring(beamstate and beamstate.getPartDamageData and (function() for k,v in pairs(beamstate.getPartDamageData()) do if not string.find(string.lower(k), "rails") and v.damage > 0 then return true end end return false end)()) .. ")")')
        end
        local isDamaged = damageCache and damageCache.isDamaged or false
        local damagePercent = isDamaged and 1 or 0
        M.jobObjects.marbleDamage[rockEntry.id] = { damage = damagePercent, isDamaged = isDamaged, brokenPieces = isDamaged and 1 or 0 }
        if Config.Config.ENABLE_DEBUG then
          table.insert(M.debugDrawCache.marblePieces, { center = obj:getPosition(), brokenCount = isDamaged and 1 or 0, totalGroups = 1, damagePercent = damagePercent * 100 })
        end
        totalDamage = totalDamage + damagePercent
        if isDamaged then damagedCount = damagedCount + 1 end
      end
    end
  end
  if checkedCount > 0 then
    M.jobObjects.totalMarbleDamagePercent = (totalDamage / checkedCount) * 100
    M.jobObjects.anyMarbleDamaged = damagedCount > 0
  else
    M.jobObjects.totalMarbleDamagePercent, M.jobObjects.anyMarbleDamaged = 0, false
  end
end

function M.getLoadedPropIdsInTruck(minRatio)
  minRatio = minRatio or 0.25
  if #M.rockPileQueue == 0 or not M.jobObjects.truckID then return {} end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return {} end
  local bedData = M.getTruckBedData(truck)
  if not bedData then return {} end
  local ids = {}
  for _, rockEntry in ipairs(M.rockPileQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      local tf = obj:getTransform()
      local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
      local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
      local step, nodesInside, nodesChecked = 10, 0, 0
      for i = 0, nodeCount - 1, step do
        nodesChecked = nodesChecked + 1
        if M.isPointInTruckBed(objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z), bedData) then nodesInside = nodesInside + 1 end
      end
      if nodesChecked > 0 and (nodesInside / nodesChecked) >= minRatio then table.insert(ids, rockEntry.id) end
    end
  end
  return ids
end

function M.getBlockLoadRatio(blockId)
  if not M.jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return 0 end
  local bedData = M.getTruckBedData(truck)
  if not bedData then return 0 end
  local obj = be:getObjectByID(blockId)
  if not obj then return 0 end
  local tf = obj:getTransform()
  local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
  local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
  local step, nodesInside, nodesChecked = 10, 0, 0
  for i = 0, nodeCount - 1, step do
    nodesChecked = nodesChecked + 1
    if M.isPointInTruckBed(objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z), bedData) then nodesInside = nodesInside + 1 end
  end
  return nodesChecked > 0 and (nodesInside / nodesChecked) or 0
end

function M.getMarbleBlocksStatus()
  local blocks = {}
  for i, rockEntry in ipairs(M.rockPileQueue) do
    local loadRatio = M.getBlockLoadRatio(rockEntry.id)
    table.insert(blocks, {
      index = i, id = rockEntry.id, loadRatio = loadRatio, isLoaded = loadRatio >= 0.1,
      isDamaged = M.jobObjects.marbleDamage and M.jobObjects.marbleDamage[rockEntry.id] and M.jobObjects.marbleDamage[rockEntry.id].isDamaged or false
    })
  end
  return blocks
end

function M.consumeZoneStock(group, propsDelivered, zonesMod, contractsMod)
  if not group then return end
  local cache = zonesMod.ensureGroupCache(group, contractsMod.getCurrentGameHour)
  if not cache or not cache.stock then return end
  local totalCost = propsDelivered * (Config.Config.Stock.StockCostPerProp[group.materialType or "rocks"] or 1)
  cache.stock.current = math.max(0, cache.stock.current - totalCost)
  cache.spawnedPropCount = math.max(0, (cache.spawnedPropCount or 0) - propsDelivered)
end

function M.despawnPropIds(propIds, zonesMod, contractsMod)
  if not propIds or #propIds == 0 then return end
  local idSet = {}
  for _, id in ipairs(propIds) do idSet[id] = true end
  local propsRemoved = 0
  for i = #M.rockPileQueue, 1, -1 do
    local id = M.rockPileQueue[i].id
    if id and idSet[id] then
      M.marbleInitialState[id], M.marbleDamageState[id] = nil, nil
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
      table.remove(M.rockPileQueue, i)
      propsRemoved = propsRemoved + 1
    end
  end
  if propsRemoved > 0 and M.jobObjects.activeGroup then M.consumeZoneStock(M.jobObjects.activeGroup, propsRemoved, zonesMod, contractsMod) end
end

function M.queueTruckSpawn(group, materialType, targetPos, currentStateVal, stateDrivingToSiteVal, stateTruckArrivingVal, setStateCallback)
  if M.jobObjects.truckSpawnQueued then return end
  M.jobObjects.truckSpawnQueued = true
  core_jobsystem.create(function(job)
    job.sleep(0.05)
    if currentStateVal ~= stateDrivingToSiteVal or not M.markerCleared or M.jobObjects.truckID or not group or not group.spawn then
      M.jobObjects.truckSpawnQueued = false
      return
    end
    targetPos = targetPos or (group.loading and group.loading.center and vec3(group.loading.center))
    if not targetPos then M.jobObjects.truckSpawnQueued = false; return end
    local truckId = M.spawnTruckForGroup(group, materialType, targetPos)
    if truckId then
      M.jobObjects.truckID = truckId
      setStateCallback(stateTruckArrivingVal)
      local truck = be:getObjectByID(truckId)
      if truck then truck:queueLuaCommand('if not driver then extensions.load("driver") end') end
      M.driveTruckToPoint(truckId, targetPos)
      M.jobObjects.deferredTruckTargetPos = nil
    else
      M.jobObjects.truckSpawnQueued = false
    end
  end)
end

function M.handleTruckMovement(dt, destPos, contractsMod)
  if not M.jobObjects.truckID or not destPos then return end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then
    contractsMod.failContract(Config.Config.Contracts.CrashPenalty, "Truck destroyed! Contract failed.", "warning", M.cleanupJob)
    return
  end
  local truckPos = truck:getPosition()
  if (truckPos - destPos):length() < 10 then
    M.truckStoppedTimer, M.truckLastPosition, M.truckResendCount = 0, nil, 0
    return true -- Signal arrived
  end
  local speed = truck:getVelocity():length()
  local throttle = truck.electrics and truck.electrics.values and truck.electrics.values.throttle or 0
  if (throttle > 0.1 and speed > truckStopSpeedThreshold) or speed > 3.0 then
    M.truckStoppedTimer, M.truckLastPosition, M.truckResendCount = 0, truckPos, 0
  elseif M.truckLastPosition then
    if (truckPos - M.truckLastPosition):length() < 0.5 or (throttle <= 0.1 and speed < 2.0) then
      M.truckStoppedTimer = M.truckStoppedTimer + dt
      if M.truckStoppedTimer >= truckStoppedThreshold then
        if M.truckResendCount < truckMaxResends then
          M.truckResendCount = M.truckResendCount + 1
          truck:queueLuaCommand('ai.setAggressionMode("rubberBand") ai.setAggression(0.9)')
          M.driveTruckToPoint(M.jobObjects.truckID, destPos)
          M.truckStoppedTimer, M.truckLastPosition = 0, truckPos
        else
          contractsMod.failContract(Config.Config.Contracts.CrashPenalty, "Truck stuck! Contract failed.", "warning", M.cleanupJob)
        end
      end
    else
      M.truckStoppedTimer, M.truckLastPosition = 0, truckPos
    end
  else
    M.truckLastPosition = truckPos
  end
  return false
end

function M.beginActiveContractTrip(contractsMod, zonesMod, uiMod)
  local contract = contractsMod.ContractSystem.activeContract
  if not contract or not contract.group then return false end
  if M.isDispatching then return false end
  M.isDispatching = true

  if uiMod then uiMod.uiHidden = false end

  M.jobObjects.activeGroup = contract.group
  M.jobObjects.materialType = contract.group.materialType or contract.material or "rocks"
  M.jobObjects.deliveryDestination = contract.destination

  M.markerCleared = false
  M.truckStoppedInLoading = false
  M.payloadUpdateTimer = 0

  core_groundMarkers.setPath(vec3(M.jobObjects.activeGroup.loading.center))

  local targetPos = vec3(M.jobObjects.activeGroup.loading.center)

  if #M.rockPileQueue == 0 then
    M.spawnJobMaterials(contractsMod, zonesMod)
  end
  M.jobObjects.deferredTruckTargetPos = targetPos
  M.jobObjects.loadingZoneTargetPos = targetPos
  M.jobObjects.truckID = nil
  M.jobObjects.truckSpawnQueued = false

  M.isDispatching = false
  return true
end

return M
