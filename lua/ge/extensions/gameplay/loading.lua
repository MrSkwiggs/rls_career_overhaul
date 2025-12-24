local M = {}
M.dependencies = {"gameplay_sites_sitesManager"}

local Config, Contracts, Zones, Manager, UI

local currentState
local compatibleZones = {}
local uiUpdateTimer = 0
local contractUpdateTimer = 0

local cachedPlayerVeh = nil
local cachedPlayerPos = nil
local playerCacheTimer = 0

local loadedExtensions = {}

local function loadSubModules()
  local path = "/lua/ge/extensions/gameplay/loading/"
  local files = FS:findFiles(path, "*.lua", -1, true, false)
  
  loadedExtensions = {}
  if files then
    for _, filePath in ipairs(files) do
      local filename = string.match(filePath, "([^/]+)%.lua$")
      if filename then
        local extName = "gameplay_loading_" .. filename
        extensions.unload(extName)
        setExtensionUnloadMode(extName, "manual")
        table.insert(loadedExtensions, extName)
      end
    end
  end
  loadManualUnloadExtensions()

  Config = gameplay_loading_config
  Contracts = gameplay_loading_contracts
  Zones = gameplay_loading_zones
  Manager = gameplay_loading_manager
  UI = gameplay_loading_ui

  if Config then currentState = Config.STATE_IDLE end
end

local function unloadSubModules()
  for _, extName in ipairs(loadedExtensions) do
    extensions.unload(extName)
  end
  loadedExtensions = {}
end

-- Coordination callbacks for modules
local uiCallbacks = {
  onAcceptContract = function(index)
    local contract, zones = Contracts.acceptContract(index, Zones.getZonesByTypeName)
    if contract then
      currentState = Config.STATE_CHOOSING_ZONE
      compatibleZones = zones
    end
  end,
  onDeclineAll = function()
    currentState = Config.STATE_IDLE
    Manager.jobOfferSuppressed = true
    UI.requestQuarryState(currentState, nil, Contracts, Manager, Zones)
  end,
  getCompatibleZones = function()
    if #compatibleZones == 0 and Contracts.ContractSystem.activeContract and Contracts.ContractSystem.activeContract.materialTypeName then
      compatibleZones = Zones.getZonesByTypeName(Contracts.ContractSystem.activeContract.materialTypeName)
    end
    return compatibleZones
  end,
  onSwapZone = function()
    local contract = Contracts.ContractSystem.activeContract
    if contract and contract.materialTypeName then
      compatibleZones = Zones.getZonesByTypeName(contract.materialTypeName)
      if #compatibleZones > 1 then
        if currentState == Config.STATE_DELIVERING and Manager.jobObjects.truckID then
          local truck = be:getObjectByID(Manager.jobObjects.truckID)
          if truck then
            local loadedPropIds = Manager.getLoadedPropIdsInTruck(0.1)
            if loadedPropIds and #loadedPropIds > 0 then
              local materialType = Manager.jobObjects.materialType
              local matConfig = materialType and Config.materials and Config.materials[materialType]
              
              if matConfig and matConfig.unitType == "item" then
                Manager.jobObjects.deliveryBlocksStatus = Manager.getItemBlocksStatus()
              end
              
              local deliveredMass = Manager.jobObjects.lastDeliveredMass or Manager.jobObjects.currentLoadMass or 0
              local tons = deliveredMass / 1000
              Contracts.ContractSystem.contractProgress.deliveredTons = (Contracts.ContractSystem.contractProgress.deliveredTons or 0) + tons
              Contracts.ContractSystem.contractProgress.deliveryCount = (Contracts.ContractSystem.contractProgress.deliveryCount or 0) + 1
              
              local contractTypeName = contract.materialTypeName
              if contractTypeName and contract.unitType == "item" then
                local deliveredSet = {}
                for _, id in ipairs(loadedPropIds) do deliveredSet[id] = true end
                
                if not Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial then
                  Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial = {}
                end
                
                for _, entry in ipairs(Manager.propQueue) do
                  if entry.id and deliveredSet[entry.id] and entry.materialType then
                    local entryMatConfig = Config.materials and Config.materials[entry.materialType]
                    if entryMatConfig and entryMatConfig.typeName == contractTypeName then
                      Contracts.ContractSystem.contractProgress.deliveredItems = (Contracts.ContractSystem.contractProgress.deliveredItems or 0) + 1
                      Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] = (Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] or 0) + 1
                    end
                  end
                end
              end
              
              Manager.despawnPropIds(loadedPropIds, Zones, Contracts)
              Manager.jobObjects.deliveredPropIds = nil
              Manager.jobObjects.deliveryBlocksStatus = nil
            end
          end
        end
        
        Manager.clearProps()
        currentState = Config.STATE_CHOOSING_ZONE
        Manager.jobObjects.zoneSwapPending = true
        Manager.jobObjects.zoneSwapTargetZone = nil
        Manager.jobObjects.zoneSwapTruckAtDestination = false
        
        if Manager.jobObjects.truckID then
          local destPos = Manager.jobObjects.deliveryDestination and vec3(Manager.jobObjects.deliveryDestination.pos) or (Manager.jobObjects.activeGroup and Manager.jobObjects.activeGroup.destination and vec3(Manager.jobObjects.activeGroup.destination.pos))
          if destPos then
            Manager.driveTruckToPoint(Manager.jobObjects.truckID, destPos)
            ui_message("Select new zone. Truck driving to destination...", 5, "info")
          else
            ui_message("Select new zone...", 5, "info")
          end
        else
          ui_message("Select new zone...", 5, "info")
        end
        
        Manager.jobObjects.currentLoadMass = 0
        Manager.jobObjects.lastDeliveredMass = 0
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
      end
    end
  end,
  onSelectZone = function(zoneIndex)
    if zoneIndex and zoneIndex > 0 and zoneIndex <= #compatibleZones then
      local selectedZone = compatibleZones[zoneIndex]
      local contract = Contracts.ContractSystem.activeContract
      if contract and selectedZone then
        if Manager.jobObjects.zoneSwapPending then
          Manager.jobObjects.zoneSwapTargetZone = selectedZone
          contract.group = selectedZone
          contract.loadingZoneTag = selectedZone.secondaryTag
          Manager.jobObjects.activeGroup = selectedZone
          Manager.jobObjects.materialType = selectedZone.materialType or contract.material or "rocks"
          
          if Manager.jobObjects.truckID then
            local truck = be:getObjectByID(Manager.jobObjects.truckID)
            if truck and selectedZone.spawn and selectedZone.spawn.pos and selectedZone.loading then
              Manager.stopTruck(Manager.jobObjects.truckID)
              local targetPos = vec3(selectedZone.loading.center)
              local pos, rot = Manager.calculateSpawnTransformForLocation(vec3(selectedZone.spawn.pos), targetPos)
              spawn.safeTeleport(truck, pos, rot, nil, nil, nil, true)
              Manager.jobObjects.zoneSwapTruckAtDestination = true
            else
              if not truck then
                Manager.jobObjects.truckID = nil
              end
              Manager.jobObjects.zoneSwapTruckAtDestination = false
            end
          else
            Manager.jobObjects.zoneSwapTruckAtDestination = false
          end
          
          local playerVeh = be:getPlayerVehicle(0)
          local playerPos = playerVeh and playerVeh:getPosition() or cachedPlayerPos
          if #Manager.propQueue == 0 then
            Manager.spawnJobMaterials(Contracts, Zones, playerPos)
          end
          
          currentState = Config.STATE_DRIVING_TO_SITE
          Manager.markerCleared = false
          compatibleZones = {}
          ui_message(string.format("Zone swapped to %s. Drive to zone - truck will move when you arrive.", selectedZone.secondaryTag), 5, "info")
        else
          contract.group = selectedZone
          contract.loadingZoneTag = selectedZone.secondaryTag
          Manager.jobObjects.activeGroup = selectedZone
          Manager.jobObjects.materialType = selectedZone.materialType or contract.material or "rocks"
          Manager.jobObjects.truckSpawnQueued = true
          local playerVeh = be:getPlayerVehicle(0)
          local playerPos = playerVeh and playerVeh:getPosition() or cachedPlayerPos
          if #Manager.propQueue == 0 then
            Manager.spawnJobMaterials(Contracts, Zones, playerPos)
          end
          currentState = Config.STATE_DRIVING_TO_SITE
          Manager.markerCleared = false
          compatibleZones = {}
          ui_message(string.format("Loading from %s. Drive to zone - truck will arrive when you get there.", selectedZone.secondaryTag), 5, "info")
        end
      end
    end
  end,
  onAbandonContract = function()
    Contracts.abandonContract(function(deleteTruck) 
      Manager.cleanupJob(deleteTruck, Config.STATE_IDLE) 
      currentState = Config.STATE_IDLE
      compatibleZones = {}
    end)
  end,
  onSendTruck = function()
    if currentState == Config.STATE_DELIVERING then
      return
    end
    if not Manager.jobObjects.truckID then
      return
    end
    local truck = be:getObjectByID(Manager.jobObjects.truckID)
    if not truck then
      Manager.jobObjects.truckID = nil
      return
    end
    local destPos = Manager.jobObjects.deliveryDestination and vec3(Manager.jobObjects.deliveryDestination.pos) or (Manager.jobObjects.activeGroup and Manager.jobObjects.activeGroup.destination and vec3(Manager.jobObjects.activeGroup.destination.pos))
    if destPos then
      local materialType = Manager.jobObjects.materialType
      local matConfig = materialType and Config.materials and Config.materials[materialType]
      if matConfig and matConfig.unitType == "item" then
        Manager.jobObjects.lastDeliveredMass = 0
        Manager.jobObjects.deliveryBlocksStatus = Manager.getItemBlocksStatus()
      else
        Manager.jobObjects.lastDeliveredMass = Manager.jobObjects.currentLoadMass or 0
      end
      Manager.jobObjects.deliveredPropIds = Manager.getLoadedPropIdsInTruck(0.1)
      Manager.deliveryTimer = 0
      core_groundMarkers.setPath(nil)
      Manager.driveTruckToPoint(Manager.jobObjects.truckID, destPos)
      currentState = Config.STATE_DELIVERING
    end
  end,
  onFinalizeContract = function()
    Contracts.completeContract(function(deleteTruck) 
      Manager.cleanupJob(deleteTruck, Config.STATE_IDLE)
      currentState = Config.STATE_IDLE
    end, Manager.clearProps)
  end,
  onLoadMore = function()
    if Manager.beginActiveContractTrip(Contracts, Zones, UI) then
      currentState = Config.STATE_DRIVING_TO_SITE
    end
  end
}

local function updatePlayerCache(dt)
  playerCacheTimer = playerCacheTimer + dt
  local checkInterval = Config.settings.zones and Config.settings.zones.checkInterval or 0.1
  if playerCacheTimer >= checkInterval then
    cachedPlayerVeh = be:getPlayerVehicle(0)
    if cachedPlayerVeh then
      cachedPlayerPos = cachedPlayerVeh:getPosition()
    else
      cachedPlayerPos = nil
    end
    playerCacheTimer = 0
  end
end

local function onUpdate(dt)
  if not Config or not Contracts or not Zones or not Manager or not UI then return end

  updatePlayerCache(dt)

  if not Zones.sitesData then
    Zones.sitesLoadTimer = Zones.sitesLoadTimer + dt
    local retryInterval = Config.settings.zones and Config.settings.zones.sitesLoadRetryInterval or 1.0
    if Zones.sitesLoadTimer >= retryInterval then
      Zones.loadQuarrySites(Contracts.getCurrentGameHour)
      Zones.sitesLoadTimer = 0
    end
  end

  Zones.updateZoneStocks(dt, Contracts.getCurrentGameHour)
  UI.drawWorkSiteMarker(dt, currentState, Config.STATE_DRIVING_TO_SITE, Manager.markerCleared, Manager.jobObjects.activeGroup)
  UI.drawZoneChoiceMarkers(dt, currentState, Config.STATE_CHOOSING_ZONE, compatibleZones)
  
  if currentState == Config.STATE_LOADING then
    Manager.payloadUpdateTimer = Manager.payloadUpdateTimer + dt
    local payloadInterval = Config.settings.payload and Config.settings.payload.updateInterval or 0.25
    if Manager.payloadUpdateTimer >= payloadInterval then
      Manager.jobObjects.currentLoadMass = Manager.calculateTruckPayload()
      Manager.calculateItemDamage()
      Manager.processPendingRespawns(dt, Zones, Contracts)
      Manager.payloadUpdateTimer = 0
    end
  end

  UI.drawUI(dt, currentState, Config, nil, Contracts, Manager, Zones, uiCallbacks)

  local function spawnOrMoveTruckToZone(zone, isZoneSwap)
    if not zone or not zone.loading or not zone.spawn or not zone.spawn.pos then
      return false
    end
    
    local truckExists = false
    if Manager.jobObjects.truckID then
      local truck = be:getObjectByID(Manager.jobObjects.truckID)
      truckExists = truck ~= nil
      if not truckExists then
        Manager.jobObjects.truckID = nil
      end
    end
    
    local shouldSpawnTruck = not Manager.jobObjects.truckID
    local truckReady = false
    
    if shouldSpawnTruck then
      truckReady = true
    elseif truckExists then
      if isZoneSwap then
        truckReady = Manager.jobObjects.zoneSwapTruckAtDestination or false
      else
        truckReady = Manager.jobObjects.truckSpawnQueued or false
      end
    end
    
    if not truckReady then
      return false
    end
    
    local targetPos = vec3(zone.loading.center)
    Manager.jobObjects.loadingZoneTargetPos = targetPos
    
    if shouldSpawnTruck then
      local truckId = Manager.spawnTruckForGroup(zone, Manager.jobObjects.materialType, targetPos)
      if truckId then
        Manager.jobObjects.truckID = truckId
        Manager.driveTruckToPoint(truckId, targetPos)
        Manager.jobObjects.truckSpawnQueued = false
        return true
      end
        elseif truckExists and Manager.jobObjects.truckID then
          local truck = be:getObjectByID(Manager.jobObjects.truckID)
          if truck then
            local pos, rot = Manager.calculateSpawnTransformForLocation(vec3(zone.spawn.pos), targetPos)
            spawn.safeTeleport(truck, pos, rot, nil, nil, nil, true)
            Manager.driveTruckToPoint(Manager.jobObjects.truckID, targetPos)
            return true
      else
        Manager.jobObjects.truckID = nil
        local truckId = Manager.spawnTruckForGroup(zone, Manager.jobObjects.materialType, targetPos)
        if truckId then
          Manager.jobObjects.truckID = truckId
          Manager.driveTruckToPoint(truckId, targetPos)
          Manager.jobObjects.truckSpawnQueued = false
          return true
        end
      end
    end
    
    return false
  end

  if Manager.jobObjects.zoneSwapPending and Manager.jobObjects.zoneSwapTargetZone and Manager.jobObjects.truckID then
    local truck = be:getObjectByID(Manager.jobObjects.truckID)
    if truck then
      local destPos = Manager.jobObjects.deliveryDestination and vec3(Manager.jobObjects.deliveryDestination.pos) or (Manager.jobObjects.activeGroup and Manager.jobObjects.activeGroup.destination and vec3(Manager.jobObjects.activeGroup.destination.pos))
      if destPos then
        local arrivalDist = Config.settings.truck and Config.settings.truck.arrivalDistanceThreshold or 10.0
        local truckPos = truck:getPosition()
        if not Manager.jobObjects.zoneSwapTruckAtDestination and (truckPos - destPos):length() < arrivalDist then
          Manager.jobObjects.zoneSwapTruckAtDestination = true
          Manager.stopTruck(Manager.jobObjects.truckID)
        end
      end
    end
  end

  if not cachedPlayerVeh or not cachedPlayerPos then return end
  local playerVeh = cachedPlayerVeh
  local playerPos = cachedPlayerPos

  if Manager.jobObjects.zoneSwapPending and Manager.jobObjects.zoneSwapTargetZone then
    local selectedZone = Manager.jobObjects.zoneSwapTargetZone
    if selectedZone.loading and selectedZone.loading:containsPoint2D(playerPos) then
      if Manager.jobObjects.truckID then
        local truck = be:getObjectByID(Manager.jobObjects.truckID)
        if truck then
          Manager.jobObjects.zoneSwapTruckAtDestination = true
        else
          Manager.jobObjects.truckID = nil
        end
      end
      if spawnOrMoveTruckToZone(selectedZone, true) then
        currentState = Config.STATE_LOADING
        Manager.truckStoppedInLoading = false
        Manager.markerCleared = false
        Manager.jobObjects.zoneSwapPending = false
        Manager.jobObjects.zoneSwapTargetZone = nil
        Manager.jobObjects.zoneSwapTruckAtDestination = false
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
      end
    end
  end

  if currentState == Config.STATE_IDLE then
    if Manager.jobOfferSuppressed and not Zones.isPlayerInAnyLoadingZone(playerPos) then
      Manager.jobOfferSuppressed = false
    end
    if not Manager.jobOfferSuppressed and playerVeh:getJBeamFilename() == "wl40" then
      if Zones.isPlayerInAnyLoadingZone(playerPos) then
        local currentZone = Zones.getPlayerCurrentZone and Zones.getPlayerCurrentZone(playerPos)
        local zoneTag = currentZone and currentZone.secondaryTag
        if Contracts.shouldRefreshContracts(zoneTag) or not Contracts.ContractSystem.initialContractsGenerated then
          Contracts.generateInitialContracts(Zones.availableGroups)
        end
        currentState = Config.STATE_CONTRACT_SELECT
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      end
    end

  elseif currentState == Config.STATE_CONTRACT_SELECT then
    contractUpdateTimer = contractUpdateTimer + dt
    if contractUpdateTimer >= 1.0 then
      contractUpdateTimer = 0
      Contracts.checkContractExpiration()
      Contracts.trySpawnNewContract(Zones.availableGroups)
    end
    if #Contracts.ContractSystem.availableContracts == 0 and #Zones.availableGroups > 0 then
      Contracts.generateInitialContracts(Zones.availableGroups)
    end
    if not Zones.isPlayerInAnyLoadingZone(playerPos) then
      currentState = Config.STATE_IDLE
    end

  elseif currentState == Config.STATE_CHOOSING_ZONE then

  elseif currentState == Config.STATE_DRIVING_TO_SITE then
    local group = Manager.jobObjects.activeGroup
    if not group or not group.loading then
      Contracts.abandonContract(function(deleteTruck) Manager.cleanupJob(deleteTruck, Config.STATE_IDLE) end)
      currentState = Config.STATE_IDLE
      return
    end
    if group.loading:containsPoint2D(playerPos) then
      if spawnOrMoveTruckToZone(group, false) then
        currentState = Config.STATE_LOADING
        Manager.truckStoppedInLoading = false
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
      end
      if not Manager.markerCleared then
        Manager.markerCleared = true
        if #Manager.propQueue == 0 then
          Manager.spawnJobMaterials(Contracts, Zones, playerPos)
        end
      end
    end
    if Manager.markerCleared and not Manager.jobObjects.truckID and Manager.jobObjects.deferredTruckTargetPos then
      Manager.queueTruckSpawn(group, Manager.jobObjects.materialType, Manager.jobObjects.deferredTruckTargetPos, currentState, Config.STATE_DRIVING_TO_SITE, Config.STATE_TRUCK_ARRIVING, function(s) currentState = s end)
    end

  elseif currentState == Config.STATE_TRUCK_ARRIVING then
    local group = Manager.jobObjects.activeGroup
    if not group or not group.loading then
      Contracts.abandonContract(function(deleteTruck) Manager.cleanupJob(deleteTruck, Config.STATE_IDLE) end)
      currentState = Config.STATE_IDLE
      return
    end
    if Manager.jobObjects.truckID and not Manager.truckStoppedInLoading then
      local truck = be:getObjectByID(Manager.jobObjects.truckID)
      if not truck then
        Contracts.failContract(0, "Truck lost! Contract failed.", "error", Manager.cleanupJob)
        currentState = Config.STATE_IDLE
        return
      end
      local arrivalSpeed = Config.settings.truck and Config.settings.truck.arrivalSpeedThreshold or 2.0
      if group.loading:containsPoint2D(truck:getPosition()) and truck:getVelocity():length() < arrivalSpeed then
        Manager.stopTruck(Manager.jobObjects.truckID)
        Manager.truckStoppedInLoading = true
        if #Manager.propQueue == 0 then
          Manager.spawnJobMaterials(Contracts, Zones, playerPos)
        end
        ui_message("Truck arrived at loading zone.", 5, "success")
        currentState = Config.STATE_LOADING
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
      end
    end

  elseif currentState == Config.STATE_LOADING then
    local group = Manager.jobObjects.activeGroup
    if not group or not group.loading then
      Contracts.abandonContract(function(deleteTruck) Manager.cleanupJob(deleteTruck, Config.STATE_IDLE) end)
      currentState = Config.STATE_IDLE
      return
    end
    
    Manager.deliveryTimer = 0
    Manager.truckStoppedTimer = 0
    Manager.truckLastPosition = nil
    
    if Manager.jobObjects.truckID and not Manager.truckStoppedInLoading then
      local truck = be:getObjectByID(Manager.jobObjects.truckID)
      if not truck then
        Contracts.failContract(0, "Truck lost! Contract failed.", "error", Manager.cleanupJob)
        currentState = Config.STATE_IDLE
        return
      end
      local arrivalSpeed = Config.settings.truck and Config.settings.truck.arrivalSpeedThreshold or 2.0
      if group.loading:containsPoint2D(truck:getPosition()) and truck:getVelocity():length() < arrivalSpeed then
        Manager.stopTruck(Manager.jobObjects.truckID)
        Manager.truckStoppedInLoading = true
        if #Manager.propQueue == 0 then
          Manager.spawnJobMaterials(Contracts, Zones, playerPos)
        end
        ui_message("Truck arrived at loading zone.", 5, "success")
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
      end
    end

  elseif currentState == Config.STATE_DELIVERING then
    local destPos = Manager.jobObjects.deliveryDestination and vec3(Manager.jobObjects.deliveryDestination.pos) or (Manager.jobObjects.activeGroup and Manager.jobObjects.activeGroup.destination and vec3(Manager.jobObjects.activeGroup.destination.pos))
    local movementResult, deliveryTime = Manager.handleTruckMovement(dt, destPos, Contracts)
    if movementResult == "stuck" then
      local contract = Contracts.ContractSystem.activeContract
      if not contract then currentState = Manager.cleanupJob(true, Config.STATE_IDLE); return end
      
      local stuckPropIds = Manager.getLoadedPropIdsInTruck(0.1)
      
      if deliveryTime and deliveryTime >= 30.0 then
        local deliveredMass = Manager.jobObjects.lastDeliveredMass or 0
        local tons = deliveredMass / 1000
        Contracts.ContractSystem.contractProgress.deliveredTons = (Contracts.ContractSystem.contractProgress.deliveredTons or 0) + tons
        Contracts.ContractSystem.contractProgress.deliveryCount = (Contracts.ContractSystem.contractProgress.deliveryCount or 0) + 1
        
        local contractTypeName = contract.materialTypeName
        if contractTypeName and contract.unitType == "item" and stuckPropIds and #stuckPropIds > 0 then
          local deliveredSet = {}
          for _, id in ipairs(stuckPropIds) do deliveredSet[id] = true end
          
          if not Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial then
            Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial = {}
          end
          
          for _, entry in ipairs(Manager.propQueue) do
            if entry.id and deliveredSet[entry.id] and entry.materialType then
              local entryMatConfig = Config.materials and Config.materials[entry.materialType]
              if entryMatConfig and entryMatConfig.typeName == contractTypeName then
                Contracts.ContractSystem.contractProgress.deliveredItems = (Contracts.ContractSystem.contractProgress.deliveredItems or 0) + 1
                Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] = (Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] or 0) + 1
              end
            end
          end
        end
        
        if #stuckPropIds > 0 then
          Manager.despawnPropIds(stuckPropIds, Zones, Contracts)
        end
        
        Manager.jobObjects.deliveredPropIds, Manager.jobObjects.currentLoadMass, Manager.jobObjects.lastDeliveredMass = nil, 0, 0
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
        
        if Contracts.checkContractCompletion() then
          if Manager.jobObjects.truckID then
            local obj = be:getObjectByID(Manager.jobObjects.truckID)
            if obj then obj:delete() end
          end
          Manager.jobObjects.truckID, Manager.truckStoppedInLoading, Manager.markerCleared = nil, false, true
          if Zones.isPlayerInAnyLoadingZone(playerPos) then
            currentState = Config.STATE_AT_QUARRY_DECIDE
            Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
            ui_message("Contract complete! Ready to finalize.", 6, "success")
          else
            currentState = Config.STATE_RETURN_TO_QUARRY
            Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
            ui_message("Contract complete! Return to any loading zone to finalize and get paid.", 6, "success")
          end
        else
          Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
          if #Manager.propQueue == 0 then Manager.spawnJobMaterials(Contracts, Zones, playerPos) end
          local group = Manager.jobObjects.activeGroup
          local truck = be:getObjectByID(Manager.jobObjects.truckID)
          if truck then
            Manager.stopTruck(Manager.jobObjects.truckID)
            local pos, rot = Manager.calculateSpawnTransformForLocation(vec3(group.spawn.pos), vec3(group.loading.center))
            spawn.safeTeleport(truck, pos, rot, nil, nil, nil, true)
            Manager.driveTruckToPoint(Manager.jobObjects.truckID, vec3(group.loading.center))
            currentState = Config.STATE_LOADING
            Manager.truckStoppedInLoading = false
          end
        end
      else
        if #stuckPropIds > 0 then
          Manager.despawnPropIds(stuckPropIds, Zones, Contracts)
        end
        
        Manager.jobObjects.deliveredPropIds, Manager.jobObjects.currentLoadMass, Manager.jobObjects.lastDeliveredMass = nil, 0, 0
        Manager.deliveryTimer = 0
        Manager.truckStoppedTimer = 0
        Manager.truckLastPosition = nil
        
        if #Manager.propQueue == 0 then Manager.spawnJobMaterials(Contracts, Zones, playerPos) end
        local group = Manager.jobObjects.activeGroup
        local truck = be:getObjectByID(Manager.jobObjects.truckID)
        if truck then
          Manager.stopTruck(Manager.jobObjects.truckID)
          local pos, rot = Manager.calculateSpawnTransformForLocation(vec3(group.spawn.pos), vec3(group.loading.center))
          spawn.safeTeleport(truck, pos, rot, nil, nil, nil, true)
          Manager.driveTruckToPoint(Manager.jobObjects.truckID, vec3(group.loading.center))
          currentState = Config.STATE_LOADING
          Manager.truckStoppedInLoading = false
        end
      end
    elseif movementResult == true then
      -- Delivery arrived
      local contract = Contracts.ContractSystem.activeContract
      if not contract then currentState = Manager.cleanupJob(true, Config.STATE_IDLE); return end
      
      -- Update progress
      local deliveredMass = Manager.jobObjects.lastDeliveredMass or 0
      local tons = deliveredMass / 1000
      Contracts.ContractSystem.contractProgress.deliveredTons = (Contracts.ContractSystem.contractProgress.deliveredTons or 0) + tons
      Contracts.ContractSystem.contractProgress.deliveryCount = (Contracts.ContractSystem.contractProgress.deliveryCount or 0) + 1
      
      local contractTypeName = contract.materialTypeName
      if contractTypeName and contract.unitType == "item" and Manager.jobObjects.deliveredPropIds then
        local deliveredSet = {}
        for _, id in ipairs(Manager.jobObjects.deliveredPropIds) do deliveredSet[id] = true end
        
        if not Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial then
          Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial = {}
        end
        
        for _, entry in ipairs(Manager.propQueue) do
          if entry.id and deliveredSet[entry.id] and entry.materialType then
            local entryMatConfig = Config.materials and Config.materials[entry.materialType]
            if entryMatConfig and entryMatConfig.typeName == contractTypeName then
              Contracts.ContractSystem.contractProgress.deliveredItems = (Contracts.ContractSystem.contractProgress.deliveredItems or 0) + 1
              Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] = (Contracts.ContractSystem.contractProgress.deliveredItemsByMaterial[entry.materialType] or 0) + 1
            end
          end
        end
      end

      if Manager.jobObjects.deliveredPropIds and #Manager.jobObjects.deliveredPropIds > 0 then
        Manager.despawnPropIds(Manager.jobObjects.deliveredPropIds, Zones, Contracts)
      end
      Manager.jobObjects.deliveredPropIds, Manager.jobObjects.currentLoadMass, Manager.jobObjects.lastDeliveredMass = nil, 0, 0
      Manager.deliveryTimer = 0
      Manager.truckStoppedTimer = 0
      Manager.truckLastPosition = nil
      
      if Manager.jobObjects.activeGroup and contract.unitType == "item" then
          Manager.spawnJobMaterials(Contracts, Zones, playerPos)
      end
      
      if Contracts.checkContractCompletion() then
        if Manager.jobObjects.truckID then
          local obj = be:getObjectByID(Manager.jobObjects.truckID)
          if obj then obj:delete() end
        end
        Manager.jobObjects.truckID, Manager.truckStoppedInLoading, Manager.markerCleared = nil, false, true
        if Zones.isPlayerInAnyLoadingZone(playerPos) then
          currentState = Config.STATE_AT_QUARRY_DECIDE
          Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
          ui_message("Contract complete! Ready to finalize.", 6, "success")
        else
          currentState = Config.STATE_RETURN_TO_QUARRY
          Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
          ui_message("Contract complete! Return to any loading zone to finalize and get paid.", 6, "success")
        end
      else
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
        if #Manager.propQueue == 0 then Manager.spawnJobMaterials(Contracts, Zones) end
        local group = Manager.jobObjects.activeGroup
        local truck = be:getObjectByID(Manager.jobObjects.truckID)
        if truck then
          Manager.stopTruck(Manager.jobObjects.truckID)
          local pos, rot = Manager.calculateSpawnTransformForLocation(vec3(group.spawn.pos), vec3(group.loading.center))
          spawn.safeTeleport(truck, pos, rot, nil, nil, nil, true)
          Manager.driveTruckToPoint(Manager.jobObjects.truckID, vec3(group.loading.center))
          currentState = Config.STATE_LOADING
          Manager.truckStoppedInLoading = false
          Manager.deliveryTimer = 0
          Manager.truckStoppedTimer = 0
          Manager.truckLastPosition = nil
        end
      end
    end

  elseif currentState == Config.STATE_RETURN_TO_QUARRY then
    if Zones.isPlayerInAnyLoadingZone(playerPos) then
      currentState = Config.STATE_AT_QUARRY_DECIDE
      core_groundMarkers.setPath(nil)
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      ui_message("At loading zone! Finalize your contract.", 5, "info")
    end

  elseif currentState == Config.STATE_AT_QUARRY_DECIDE then
    if not Zones.isPlayerInAnyLoadingZone(playerPos) then
      currentState = Config.STATE_RETURN_TO_QUARRY
    end
  end

  local uiUpdateInterval = Config.settings.ui and Config.settings.ui.updateInterval or 0.5
  if currentState ~= Config.STATE_IDLE then
    uiUpdateTimer = uiUpdateTimer + dt
    if uiUpdateTimer >= uiUpdateInterval then
      uiUpdateTimer = 0
      UI.requestQuarryState(currentState, nil, Contracts, Manager, Zones)
    end
  end
end

local function onExtensionLoaded()
  loadSubModules()
end

local function onExtensionUnloaded()
  unloadSubModules()
end

local function onClientStartMission()
  if not Zones then return end
  Zones.sitesData, Zones.availableGroups, Zones.groupCache = nil, {}, {}
  Manager.cleanupJob(true, Config.STATE_IDLE)
  Contracts.ContractSystem.availableContracts, Contracts.ContractSystem.activeContract = {}, nil
  Contracts.ContractSystem.nextContractSpawnTime = nil
  Contracts.ContractSystem.initialContractsGenerated = false
  currentState = Config.STATE_IDLE
  compatibleZones = {}
  cachedPlayerVeh = nil
  cachedPlayerPos = nil
  playerCacheTimer = 0
end

local function onClientEndMission()
  if not Manager then return end
  Manager.cleanupJob(true, Config.STATE_IDLE)
  Zones.sitesData, Zones.availableGroups, Zones.groupCache = nil, {}, {}
  Contracts.ContractSystem.availableContracts, Contracts.ContractSystem.activeContract = {}, nil
  Contracts.ContractSystem.nextContractSpawnTime = nil
  currentState = Config.STATE_IDLE
end

local function onItemDamageCallback(objId, isDamaged)
  if Manager then
    Manager.itemDamageState[objId] = { isDamaged = isDamaged, lastUpdate = os.clock() }
  end
end

-- API Exports
M.onUpdate = onUpdate
M.onExtensionLoaded = onExtensionLoaded
M.onExtensionUnloaded = onExtensionUnloaded
M.onClientStartMission = onClientStartMission
M.onClientEndMission = onClientEndMission
M.onItemDamageCallback = onItemDamageCallback

M.requestQuarryState = function() if UI then UI.requestQuarryState(currentState, nil, Contracts, Manager, Zones) end end
M.acceptContractFromUI = function(index) uiCallbacks.onAcceptContract(index) end
M.declineAllContracts = function() uiCallbacks.onDeclineAll() end
M.abandonContractFromUI = function() uiCallbacks.onAbandonContract() end
M.sendTruckFromUI = function() uiCallbacks.onSendTruck() end
M.finalizeContractFromUI = function() uiCallbacks.onFinalizeContract() end
M.loadMoreFromUI = function() uiCallbacks.onLoadMore() end
M.resumeTruck = function() if Manager then Manager.resumeTruck() end end

return M
