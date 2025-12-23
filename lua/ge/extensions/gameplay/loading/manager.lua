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
  itemDamage = {},
  totalItemDamagePercent = 0,
  anyItemDamaged = false,
  lastDeliveryDamagePercent = 0,
  deliveryDestination = nil,
  deliveryBlocksStatus = nil,
}

M.propQueue = {}
M.propQueueById = {}
M.itemInitialState = {}
M.itemDamageState = {}
M.debugDrawCache = {
  bedData = nil,
  nodePoints = {},
  itemPieces = {}
}

M.markerCleared = false
M.truckStoppedInLoading = false
M.isDispatching = false
M.payloadUpdateTimer = 0
M.truckStoppedTimer = 0
M.truckLastPosition = nil
M.truckResendCount = 0

M.cachedBedData = {}
M.cachedMaterialConfigs = {}
M.lastPayloadMass = 0
M.payloadStationaryCount = 0

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

function M.getMaterialConfig(materialType)
  if M.cachedMaterialConfigs[materialType] then
    return M.cachedMaterialConfigs[materialType]
  end
  local matConfig = Config.materials and Config.materials[materialType]
  if matConfig then
    M.cachedMaterialConfigs[materialType] = matConfig
  end
  return matConfig
end

function M.managePropCapacity()
  while #M.propQueue > Config.settings.maxProps do
    local oldEntry = table.remove(M.propQueue, 1)
    if oldEntry and oldEntry.id then
      M.propQueueById[oldEntry.id] = nil
      local obj = be:getObjectByID(oldEntry.id)
      if obj then obj:delete() end
    end
  end
end

local function getContractMaterialRequirements(contract)
  if not contract or contract.unitType ~= "item" or not contract.materialTypeName then
    return {}
  end
  
  if contract.materialRequirements and next(contract.materialRequirements) then
    return contract.materialRequirements
  end
  
  local Config = extensions.gameplay_loading_config
  local materialsOfType = {}
  if Config and Config.materials then
    for matKey, matConfig in pairs(Config.materials) do
      if matConfig.typeName == contract.materialTypeName then
        table.insert(materialsOfType, { key = matKey, config = matConfig })
      end
    end
  end
  
  if #materialsOfType <= 1 then
    if #materialsOfType == 1 then
      return { [materialsOfType[1].key] = contract.requiredItems or 0 }
    end
    return {}
  end
  
  table.sort(materialsOfType, function(a, b)
    local aMass = (a.config.unitType == "mass" and a.config.massPerProp) or 0
    local bMass = (b.config.unitType == "mass" and b.config.massPerProp) or 0
    return aMass < bMass
  end)
  
  local totalRequired = contract.requiredItems or 0
  local breakdown = {}
  
  if totalRequired <= 0 then
    return {}
  end
  
  if #materialsOfType == 2 and totalRequired == 2 then
    breakdown[materialsOfType[1].key] = 1
    breakdown[materialsOfType[2].key] = 1
  elseif #materialsOfType == 2 then
    local smaller = materialsOfType[1]
    local larger = materialsOfType[2]
    local smallerCount = math.max(1, math.floor(totalRequired / 2))
    breakdown[smaller.key] = smallerCount
    breakdown[larger.key] = totalRequired - smallerCount
  else
    local remaining = totalRequired
    for i, mat in ipairs(materialsOfType) do
      if i == #materialsOfType then
        breakdown[mat.key] = remaining
      else
        local count = math.max(1, math.floor(totalRequired / #materialsOfType))
        breakdown[mat.key] = count
        remaining = remaining - count
      end
    end
  end
  
  return breakdown
end

function M.repairAndRespawnDamagedItem(propId, zonesMod, contractsMod)
  local entry = M.propQueueById[propId]
  if not entry then return false end
  
  local obj = be:getObjectByID(propId)
  if not obj then return false end
  
  local matConfig = M.getMaterialConfig(entry.materialType)
  if not matConfig then return false end
  
  local group = M.jobObjects.activeGroup
  if not group then return false end
  
  local cache = zonesMod.ensureGroupCache(group, contractsMod.getCurrentGameHour)
  if not cache or not cache.materialStocks then return false end
  
  local stock = cache.materialStocks[entry.materialType]
  if not stock or stock.current <= 0 then return false end
  
  local basePos = cache.offRoadCentroid
  if not basePos then
    basePos = zonesMod.findOffRoadCentroid(group.loading, 5, 1000)
    if basePos then cache.offRoadCentroid = basePos end
  end
  if not basePos then return false end
  
  obj:repair()
  obj:setPosition(basePos + vec3(0, 0, 0.2))
  obj:setLinearVelocity(vec3(0, 0, 0))
  obj:setAngularVelocity(vec3(0, 0, 0))
  
  if M.jobObjects.itemDamage and M.jobObjects.itemDamage[propId] then
    M.jobObjects.itemDamage[propId].isDamaged = false
    M.jobObjects.itemDamage[propId].damage = 0
  end
  if M.itemDamageState[propId] then
    M.itemDamageState[propId].isDamaged = false
  end
  
  stock.current = stock.current - 1
  
  print(string.format("[Loading] Repaired and respawned damaged item %s (consumed 1 stock)", entry.materialType))
  return true
end

function M.spawnJobMaterials(contractsMod, zonesMod)
  if not M.jobObjects.activeGroup or not M.jobObjects.activeGroup.loading then return end

  local group = M.jobObjects.activeGroup
  local zone = group.loading
  
  local cache = zonesMod.ensureGroupCache(group, contractsMod.getCurrentGameHour)
  if not cache or not cache.materialStocks then return end
  
  zonesMod.ensureGroupOffRoadCentroid(group, contractsMod.getCurrentGameHour)
  
  local contract = contractsMod.ContractSystem.activeContract
  if not contract or not contract.materialTypeName then
    print("[Loading] Error: No active contract with materialTypeName for spawn")
    return
  end
  
  local contractTypeName = contract.materialTypeName
  local compatibleMaterials = {}
  
  if group.materials then
    for _, matKey in ipairs(group.materials) do
      local matConfig = M.getMaterialConfig(matKey)
      if matConfig and matConfig.typeName == contractTypeName then
        table.insert(compatibleMaterials, matKey)
      end
    end
  elseif group.materialType then
    local matConfig = M.getMaterialConfig(group.materialType)
    if matConfig and matConfig.typeName == contractTypeName then
      table.insert(compatibleMaterials, group.materialType)
    end
  end
  
  if #compatibleMaterials == 0 then
    print(string.format("[Loading] No compatible materials found for typeName '%s' in zone '%s'", contractTypeName, group.secondaryTag))
    return
  end
  
  if not cache.spawnedPropCounts then
    cache.spawnedPropCounts = {}
  end
  
  local materialRequirements = {}
  if contract.unitType == "item" then
    materialRequirements = getContractMaterialRequirements(contract)
  else
    for _, matKey in ipairs(compatibleMaterials) do
      materialRequirements[matKey] = math.huge
    end
  end
  
  local basePos = cache.offRoadCentroid or nil
  if not basePos then
    basePos = zonesMod.findOffRoadCentroid(zone, 5, 1000)
    if cache then cache.offRoadCentroid = basePos end
  end
  if not basePos then return end
  basePos = basePos + vec3(0,0,0.2)

  local totalPropsSpawned = 0
  local offsetIdx = 1
  local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0), vec3(0, 2, 0), vec3(0, -2, 0), vec3(-2, 2, 0), vec3(2, 2, 0), vec3(-2, -2, 0), vec3(2, -2, 0) }
  
  for _, materialType in ipairs(compatibleMaterials) do
    local matConfig = M.getMaterialConfig(materialType)
    if matConfig then
      local stock = cache.materialStocks[materialType]
      if stock and stock.current > 0 then
        local currentlySpawned = 0
        for _, entry in ipairs(M.propQueue) do
          if entry.materialType == materialType then
            currentlySpawned = currentlySpawned + 1
          end
        end
        
        local required = materialRequirements[materialType] or 0
        local delivered = 0
        if contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.deliveredItemsByMaterial then
          delivered = contractsMod.ContractSystem.contractProgress.deliveredItemsByMaterial[materialType] or 0
        end
        local stillNeeded = math.max(0, required - delivered - currentlySpawned)
        
        if stillNeeded > 0 then
          local stockAvailable = stock.current
          local propsToSpawn = math.min(stillNeeded, stockAvailable)
          
          if propsToSpawn > 0 then
            if matConfig.unitType == "mass" then
              for i = 1, propsToSpawn do
                local offset = vec3((i - 1) * 3, 0, 0)
                local obj = core_vehicles.spawnNewVehicle(matConfig.model, { 
                  config = matConfig.config, 
                  pos = basePos + offset, 
                  rot = quatFromDir(vec3(0,1,0)), 
                  autoEnterVehicle = false 
                })
                if obj then
                  local propId = obj:getID()
                  local entry = { id = propId, mass = matConfig.massPerProp or 41000, materialType = materialType }
                  table.insert(M.propQueue, entry)
                  M.propQueueById[propId] = entry
                  totalPropsSpawned = totalPropsSpawned + 1
                  stock.current = stock.current - 1
                  if not cache.spawnedPropCounts[materialType] then
                    cache.spawnedPropCounts[materialType] = 0
                  end
                  cache.spawnedPropCounts[materialType] = cache.spawnedPropCounts[materialType] + 1
                  M.managePropCapacity()
                end
              end
            elseif matConfig.unitType == "item" then
              for i = 1, propsToSpawn do
                local pos = basePos + (offsets[offsetIdx] or vec3(0,0,0))
                offsetIdx = (offsetIdx % #offsets) + 1
                
                local obj = core_vehicles.spawnNewVehicle(matConfig.model, { 
                  config = matConfig.config, 
                  pos = pos, 
                  rot = quatFromDir(vec3(0,1,0)), 
                  autoEnterVehicle = false 
                })
                if obj then
                  local propId = obj:getID()
                  local entry = { 
                    id = propId, 
                    mass = 0, 
                    materialType = materialType, 
                    blockType = matConfig.config 
                  }
                  table.insert(M.propQueue, entry)
                  M.propQueueById[propId] = entry
                  totalPropsSpawned = totalPropsSpawned + 1
                  stock.current = stock.current - 1
                  if not cache.spawnedPropCounts[materialType] then
                    cache.spawnedPropCounts[materialType] = 0
                  end
                  cache.spawnedPropCounts[materialType] = cache.spawnedPropCounts[materialType] + 1
                  M.managePropCapacity()
                end
              end
            end
          end
        end
      end
    else
      print(string.format("[Loading] Material type '%s' not found in config; skipping.", materialType))
    end
  end
  
  if totalPropsSpawned > 0 then
    print(string.format("[Loading] Spawned %d props for contract typeName '%s'", totalPropsSpawned, contractTypeName))
  end
end

function M.clearProps()
  for i = #M.propQueue, 1, -1 do
    local id = M.propQueue[i].id
    if id then
      M.propQueueById[id] = nil
      M.itemInitialState[id] = nil
      M.itemDamageState[id] = nil
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
    end
    table.remove(M.propQueue, i)
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
  M.debugDrawCache.itemPieces = {}

  M.clearProps()

  if deleteTruck and M.jobObjects.truckID then
    M.cachedBedData[M.jobObjects.truckID] = nil
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
  M.jobObjects.itemDamage = {}
  M.jobObjects.totalItemDamagePercent = 0
  M.jobObjects.anyItemDamaged = false
  M.jobObjects.lastDeliveryDamagePercent = 0
  M.jobObjects.deliveryBlocksStatus = nil
  M.itemDamageState = {}
  
  M.truckStoppedTimer = 0
  M.truckLastPosition = nil
  M.truckResendCount = 0
  M.lastPayloadMass = 0
  M.payloadStationaryCount = 0
  
  return stateIdle
end

function M.spawnTruckForGroup(group, materialType, targetPos)
  if not group or not group.spawn or not group.spawn.pos then return nil end
  
  local matConfig = M.getMaterialConfig(materialType)
  if not matConfig or not matConfig.deliveryVehicle then
    print(string.format("[Loading] No delivery vehicle configured for material '%s'.", materialType))
    return nil
  end

  local truckModel = matConfig.deliveryVehicle.model
  local truckConfig = matConfig.deliveryVehicle.config

  local pos, rot = M.calculateSpawnTransformForLocation(vec3(group.spawn.pos), targetPos)
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
  local truckId = obj:getID()
  if M.cachedBedData[truckId] then
    local cached = M.cachedBedData[truckId]
    local pos = obj:getPosition()
    local dir = obj:getDirectionVector():normalized()
    local up = obj:getDirectionVectorUp():normalized()
    local right = dir:cross(up):normalized()
    up = right:cross(dir):normalized()
    
    local offsetBack, offsetSide = cached.settings.offsetBack or 0, cached.settings.offsetSide or 0
    local bedCenterHeight = (cached.settings.floorHeight or 0) + ((cached.settings.loadHeight or 0) / 2)
    local bedCenter = pos - (dir * offsetBack) + (right * offsetSide) + (up * bedCenterHeight)
    
    cached.center = bedCenter
    cached.axisX = right
    cached.axisY = dir
    cached.axisZ = up
    return cached
  end
  
  local pos = obj:getPosition()
  local dir = obj:getDirectionVector():normalized()
  local up = obj:getDirectionVectorUp():normalized()
  local right = dir:cross(up):normalized()
  up = right:cross(dir):normalized()
  
  local modelName = obj:getJBeamFilename()
  
  local bedSettings = Config.bedSettings and Config.bedSettings[modelName]
  
  if not bedSettings then
    local materialType = M.jobObjects.materialType
    local matConfig = M.getMaterialConfig(materialType)
    if matConfig and matConfig.deliveryVehicle and matConfig.deliveryVehicle.bedSettings then
      bedSettings = Config.bedSettings and Config.bedSettings[matConfig.deliveryVehicle.bedSettings]
    end
  end

  if not bedSettings then
    bedSettings = Config.bedSettings and (Config.bedSettings[next(Config.bedSettings)] or Config.bedSettings.dumptruck)
  end

  if not bedSettings then return nil end

  local offsetBack, offsetSide = bedSettings.offsetBack or 0, bedSettings.offsetSide or 0
  local bedCenterHeight = (bedSettings.floorHeight or 0) + ((bedSettings.loadHeight or 0) / 2)
  local bedCenter = pos - (dir * offsetBack) + (right * offsetSide) + (up * bedCenterHeight)
  
  local bedData = {
    center = bedCenter, axisX = right, axisY = dir, axisZ = up,
    halfWidth = (bedSettings.width or 1) / 2, halfLength = (bedSettings.length or 1) / 2,
    halfHeight = (bedSettings.loadHeight or 1) / 2, floorHeight = bedSettings.floorHeight or 0,
    settings = bedSettings
  }
  
  M.cachedBedData[truckId] = bedData
  return bedData
end

function M.isPointInTruckBed(point, bedData)
  if not bedData then return false end
  local diff = point - bedData.center
  local localX, localY, localZ = diff:dot(bedData.axisX), diff:dot(bedData.axisY), diff:dot(bedData.axisZ)
  return (math.abs(localX) <= bedData.halfWidth and math.abs(localY) <= bedData.halfLength and math.abs(localZ) <= bedData.halfHeight)
end

local function calculatePayloadForProps(propEntries, bedData, materialType, includeDamaged)
  local matConfig = M.getMaterialConfig(materialType)
  local defaultMass = 0
  if matConfig and matConfig.unitType == "mass" then
    defaultMass = matConfig.massPerProp or 41000
  end
  local nodeStep = Config.settings.payload and Config.settings.payload.nodeSamplingStep or 10
  
  local totalMass = 0
  for _, rockEntry in ipairs(propEntries) do
    if not includeDamaged and M.jobObjects.itemDamage and M.jobObjects.itemDamage[rockEntry.id] and M.jobObjects.itemDamage[rockEntry.id].isDamaged then
      -- Skip damaged items
    else
      local obj = be:getObjectByID(rockEntry.id)
      if obj then
        local tf = obj:getTransform()
        local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
        local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
        local nodesInside, nodesChecked = 0, 0
        for i = 0, nodeCount - 1, nodeStep do
          nodesChecked = nodesChecked + 1
          local worldPoint = objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z)
          if M.isPointInTruckBed(worldPoint, bedData) then nodesInside = nodesInside + 1 end
          if Config.settings.enableDebug then table.insert(M.debugDrawCache.nodePoints, {pos = worldPoint, inside = M.isPointInTruckBed(worldPoint, bedData)}) end
        end
        if nodesChecked > 0 then totalMass = totalMass + ((rockEntry.mass or defaultMass) * (nodesInside / nodesChecked)) end
      end
    end
  end
  return totalMass
end

function M.calculateTruckPayload()
  if #M.propQueue == 0 or not M.jobObjects.truckID then 
    M.lastPayloadMass = 0
    return 0 
  end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then 
    M.lastPayloadMass = 0
    return 0 
  end

  local materialType = M.jobObjects.materialType
  if not materialType then
    print("[Loading] Error: No material type in jobObjects")
    return 0
  end
  
  local matConfig = M.getMaterialConfig(materialType)
  if matConfig and matConfig.unitType == "item" then
    M.lastPayloadMass = 0
    return 0
  end
  
  local currentMass = truck:getMass()
  if M.lastPayloadMass > 0 and math.abs(currentMass - M.lastPayloadMass) < 10 then
    M.payloadStationaryCount = M.payloadStationaryCount + 1
    if M.payloadStationaryCount > 10 then
      return M.lastPayloadMass
    end
  else
    M.payloadStationaryCount = 0
  end
  
  local bedData = M.getTruckBedData(truck)
  if not bedData then 
    M.lastPayloadMass = 0
    return 0 
  end
  M.debugDrawCache.bedData = bedData
  
  if Config.settings.enableDebug then M.debugDrawCache.nodePoints = {} end
  local totalMass = calculatePayloadForProps(M.propQueue, bedData, materialType, true)
  M.lastPayloadMass = totalMass
  return totalMass
end

function M.calculateUndamagedTruckPayload()
  if #M.propQueue == 0 or not M.jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return 0 end

  local materialType = M.jobObjects.materialType
  if not materialType then
    print("[Loading] Error: No material type in jobObjects")
    return 0
  end
  
  local matConfig = M.getMaterialConfig(materialType)
  if matConfig and matConfig.unitType == "item" then
    return 0
  end
  
  local bedData = M.getTruckBedData(truck)
  if not bedData then return 0 end

  return calculatePayloadForProps(M.propQueue, bedData, materialType, false)
end

function M.captureItemInitialState(objId)
  local obj = be:getObjectByID(objId)
  if not obj then return end
  M.itemInitialState[objId] = { nodeCount = obj:getNodeCount(), captureTime = os.clock(), captured = true }
  M.itemDamageState[objId] = { isDamaged = false, lastUpdate = 0 }
end

function M.calculateItemDamage()
  local materialType = M.jobObjects.materialType
  if not materialType then
    print("[Loading] Error: No material type in jobObjects")
    return 0
  end
  local matConfig = M.getMaterialConfig(materialType)
  
  if not matConfig or matConfig.unitType ~= "item" or #M.propQueue == 0 then
    M.jobObjects.itemDamage, M.jobObjects.totalItemDamagePercent, M.jobObjects.anyItemDamaged = {}, 0, false
    M.debugDrawCache.itemPieces = {}
    return
  end
  
  local totalDamage, damagedCount, checkedCount = 0, 0, 0
  if Config.settings.enableDebug then M.debugDrawCache.itemPieces = {} end
  
  for _, rockEntry in ipairs(M.propQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      checkedCount = checkedCount + 1
      if not M.itemInitialState[rockEntry.id] then M.captureItemInitialState(rockEntry.id) end
      
      local initialState = M.itemInitialState[rockEntry.id]
      if initialState and (os.clock() - initialState.captureTime) < 2.0 then
        M.jobObjects.itemDamage[rockEntry.id] = { damage = 0, isDamaged = false, settling = true, brokenPieces = 0 }
      else
        local damageCache = M.itemDamageState[rockEntry.id]
        if not damageCache or (os.clock() - damageCache.lastUpdate) > 0.5 then
          -- Dynamic damage detection from JSON
          local ignoreList = matConfig.damage and matConfig.damage.ignore or {}
          local threshold = matConfig.damage and matConfig.damage.damageThreshold or 0.01
          local ignoreStr = ""
          if #ignoreList > 0 then
            local patterns = {}
            for _, p in ipairs(ignoreList) do table.insert(patterns, string.format('"%s"', p:lower())) end
            ignoreStr = "local patterns = {" .. table.concat(patterns, ",") .. "} "
            ignoreStr = ignoreStr .. "for _, p in ipairs(patterns) do if string.find(string.lower(k), p) then shouldIgnore = true; break end end "
          end
          
          local luaCmd = string.format('obj:queueGameEngineLua("gameplay_loading.onItemDamageCallback(' .. rockEntry.id .. ', " .. tostring(beamstate and beamstate.getPartDamageData and (function() for k,v in pairs(beamstate.getPartDamageData()) do local shouldIgnore = false; %s if not shouldIgnore and v.damage > %f then return true end end return false end)()) .. ")")', ignoreStr, threshold)
          obj:queueLuaCommand(luaCmd)
        end
        
        local isDamaged = damageCache and damageCache.isDamaged or false
        local wasDamaged = M.jobObjects.itemDamage[rockEntry.id] and M.jobObjects.itemDamage[rockEntry.id].isDamaged or false
        local damagePercent = isDamaged and 1 or 0
        M.jobObjects.itemDamage[rockEntry.id] = { damage = damagePercent, isDamaged = isDamaged, brokenPieces = isDamaged and 1 or 0 }
        
        if isDamaged and not wasDamaged then
          local Contracts = gameplay_loading_contracts
          local Zones = gameplay_loading_zones
          if Contracts and Zones then
            M.repairAndRespawnDamagedItem(rockEntry.id, Zones, Contracts)
          end
        end
        
        if Config.settings.enableDebug then
          table.insert(M.debugDrawCache.itemPieces, { center = obj:getPosition(), brokenCount = isDamaged and 1 or 0, totalGroups = 1, damagePercent = damagePercent * 100 })
        end
        
        totalDamage = totalDamage + damagePercent
        if isDamaged then damagedCount = damagedCount + 1 end
      end
    end
  end
  
  if checkedCount > 0 then
    M.jobObjects.totalItemDamagePercent = (totalDamage / checkedCount) * 100
    M.jobObjects.anyItemDamaged = damagedCount > 0
  else
    M.jobObjects.totalItemDamagePercent, M.jobObjects.anyItemDamaged = 0, false
  end
end

function M.getLoadedPropIdsInTruck(minRatio)
  minRatio = minRatio or (Config.settings.payload and Config.settings.payload.minLoadRatio or 0.25)
  if #M.propQueue == 0 or not M.jobObjects.truckID then return {} end
  local truck = be:getObjectByID(M.jobObjects.truckID)
  if not truck then return {} end
  local bedData = M.getTruckBedData(truck)
  if not bedData then return {} end
  local nodeStep = Config.settings.payload and Config.settings.payload.nodeSamplingStep or 10
  local ids = {}
  for _, rockEntry in ipairs(M.propQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      local tf = obj:getTransform()
      local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
      local objPos, nodeCount = obj:getPosition(), obj:getNodeCount()
      local nodesInside, nodesChecked = 0, 0
      for i = 0, nodeCount - 1, nodeStep do
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
  local nodeStep = Config.settings.payload and Config.settings.payload.nodeSamplingStep or 10
  local nodesInside, nodesChecked = 0, 0
  for i = 0, nodeCount - 1, nodeStep do
    nodesChecked = nodesChecked + 1
    if M.isPointInTruckBed(objPos - (axisX * obj:getNodePosition(i).x) - (axisY * obj:getNodePosition(i).y) + (axisZ * obj:getNodePosition(i).z), bedData) then nodesInside = nodesInside + 1 end
  end
  return nodesChecked > 0 and (nodesInside / nodesChecked) or 0
end

function M.getItemBlocksStatus()
  local blocks = {}
  for i, rockEntry in ipairs(M.propQueue) do
    local loadRatio = M.getBlockLoadRatio(rockEntry.id)
    table.insert(blocks, {
      index = i, id = rockEntry.id, loadRatio = loadRatio, isLoaded = loadRatio >= 0.1,
      isDamaged = M.jobObjects.itemDamage and M.jobObjects.itemDamage[rockEntry.id] and M.jobObjects.itemDamage[rockEntry.id].isDamaged or false
    })
  end
  return blocks
end

function M.consumeZoneStock(group, propsDelivered, zonesMod, contractsMod)
  if not group then return end
  local cache = zonesMod.ensureGroupCache(group, contractsMod.getCurrentGameHour)
  if not cache or not cache.materialStocks then return end
  
  local materialCounts = {}
  for _, entry in ipairs(M.propQueue) do
    if entry.materialType then
      materialCounts[entry.materialType] = (materialCounts[entry.materialType] or 0) + 1
    end
  end
  
  for matKey, count in pairs(materialCounts) do
    local stock = cache.materialStocks[matKey]
    if stock then
      local delivered = math.min(count, propsDelivered)
      stock.current = math.max(0, stock.current - delivered)
      if cache.spawnedPropCounts and cache.spawnedPropCounts[matKey] then
        cache.spawnedPropCounts[matKey] = math.max(0, cache.spawnedPropCounts[matKey] - delivered)
      end
    end
  end
end

function M.despawnPropIds(propIds, zonesMod, contractsMod)
  if not propIds or #propIds == 0 then return end
  local idSet = {}
  for _, id in ipairs(propIds) do idSet[id] = true end
  local propsRemoved = 0
  for i = #M.propQueue, 1, -1 do
    local id = M.propQueue[i].id
    if id and idSet[id] then
      M.propQueueById[id] = nil
      M.itemInitialState[id], M.itemDamageState[id] = nil, nil
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
      table.remove(M.propQueue, i)
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
    contractsMod.failContract(Config.contracts.crashPenalty, "Truck destroyed! Contract failed.", "warning", M.cleanupJob)
    return
  end
  
  local arrivalDist = Config.settings.truck and Config.settings.truck.arrivalDistanceThreshold or 10.0
  local truckPos = truck:getPosition()
  if (truckPos - destPos):length() < arrivalDist then
    M.truckStoppedTimer, M.truckLastPosition, M.truckResendCount = 0, nil, 0
    return true
  end
  
  local speedThreshold = Config.settings.truck and Config.settings.truck.stopSpeedThreshold or 1.0
  local stoppedThreshold = Config.settings.truck and Config.settings.truck.stoppedThreshold or 2.0
  local maxResends = Config.settings.truck and Config.settings.truck.maxResends or 15
  
  local speed = truck:getVelocity():length()
  local throttle = truck.electrics and truck.electrics.values and truck.electrics.values.throttle or 0
  if (throttle > 0.1 and speed > speedThreshold) or speed > 3.0 then
    M.truckStoppedTimer, M.truckLastPosition, M.truckResendCount = 0, truckPos, 0
  elseif M.truckLastPosition then
    if (truckPos - M.truckLastPosition):length() < 0.5 or (throttle <= 0.1 and speed < 2.0) then
      M.truckStoppedTimer = M.truckStoppedTimer + dt
      if M.truckStoppedTimer >= stoppedThreshold then
        if M.truckResendCount < maxResends then
          M.truckResendCount = M.truckResendCount + 1
          M.driveTruckToPoint(M.jobObjects.truckID, destPos)
          M.truckStoppedTimer, M.truckLastPosition = 0, truckPos
        else
          contractsMod.failContract(Config.contracts.crashPenalty, "Truck stuck! Contract failed.", "warning", M.cleanupJob)
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
  M.jobObjects.materialType = contract.group.materialType or contract.material
  if not M.jobObjects.materialType then
    print("[Loading] Error: Contract missing material type")
    return false
  end
  M.jobObjects.deliveryDestination = contract.destination

  M.markerCleared = false
  M.truckStoppedInLoading = false
  M.payloadUpdateTimer = 0

  core_groundMarkers.setPath(vec3(M.jobObjects.activeGroup.loading.center))

  local targetPos = vec3(M.jobObjects.activeGroup.loading.center)

  if #M.propQueue == 0 then
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

