-- This Source Code Form is subject to the terms of the bCDDL, v. 1.1.
-- If a copy of the bCDDL was not distributed with this
-- file, You can obtain one at http://beamng.com/bCDDL-1.1.txt

local M = {}

-- Dependencies
M.dependencies = {
    'freeroam_facilities', 'gameplay_sites_sitesManager', 'gameplay_walk'
}

-- Require necessary modules
local freeroam_facilities = require('freeroam.facilities')
local gameplay_sites_sitesManager = require('gameplay.sites.sitesManager')
local marker

local completionFadeDuration = 0.5

local function stopFadeSafe()
  if ui_fadeScreen and ui_fadeScreen.stop then
    pcall(function() ui_fadeScreen.stop(completionFadeDuration) end)
  end
end

-- Create a single forestry job instance for the whole module
local forestryJobInstance = nil

local function createMarker(position)
    if not marker then
        marker = createObject('TSStatic')
        marker.shapeName = "art/shapes/interface/checkpoint_marker.dae"
        marker.scale = vec3(4, 4, 4)
        marker.useInstanceRenderData = true
        marker.instanceColor = ColorF(0.2, 0.6, 0.2, 0.7):asLinear4F() 
        marker:setPosition(position)
        marker:registerObject("forestry_delivery_marker")
    end
end

local ForestryLoggingJob = {}
ForestryLoggingJob.__index = ForestryLoggingJob

-- Constructor for ForestryLoggingJob
function ForestryLoggingJob:new()
    local instance = setmetatable({}, ForestryLoggingJob)
    instance.logVehicleIds = {}
    instance.forestryLocation = nil
    instance.deliveryLocation = nil
    instance.jobStartTime = nil
    instance.isMonitoring = false
    instance.selectedSawmill = nil
    instance.isJobStarted = false
    instance.totalDistanceTraveled = 0
    instance.spawnedLogs = false
    instance.isCompleted = false
    instance.isCompleting = false
    instance.reward = nil
    instance.jobCoroutine = nil
    instance.updateTimer = nil
    instance.playerVehicleId = nil
    instance.logCount = 0
    if core_groundMarkers then
        core_groundMarkers.resetAll()
    end
    return instance
end

-- Reset to initial state (ready to generate new mission)
function ForestryLoggingJob:resetToInitialState()
    -- Delete all spawned log vehicles
    for _, logId in ipairs(self.logVehicleIds) do
        local vehicle = getObjectByID(logId)
        if vehicle then
            pcall(function() vehicle:delete() end)
        end
    end
    self.logVehicleIds = {}

    if marker then
        pcall(function() marker:unregisterObject() end)
        pcall(function() marker:delete() end)
        marker = nil
    end

    self.forestryLocation = nil
    self.deliveryLocation = nil
    self.jobStartTime = nil
    self.isMonitoring = false
    self.selectedSawmill = nil
    self.isJobStarted = false
    self.totalDistanceTraveled = 0
    self.spawnedLogs = false
    self.isCompleted = false
    self.isCompleting = false
    self.reward = nil
    self.jobCoroutine = nil
    self.updateTimer = nil
    self.playerVehicleId = nil
    self.logCount = 0
    if core_groundMarkers then
        core_groundMarkers.resetAll()
    end
end

-- Destroy the current job and clean up resources
function ForestryLoggingJob:destroy()
    self:resetToInitialState()
end

-- Check if log vehicles exist, reset if they don't
function ForestryLoggingJob:checkLogVehiclesExist()
    for i = #self.logVehicleIds, 1, -1 do
        local logId = self.logVehicleIds[i]
        local vehicle = getObjectByID(logId)
        if not vehicle then
            table.remove(self.logVehicleIds, i)
        else
            local success = pcall(function() vehicle:getPosition() end)
            if not success then
                table.remove(self.logVehicleIds, i)
            end
        end
    end
    
    if #self.logVehicleIds == 0 and self.isMonitoring then
        self:resetToInitialState()
        return false
    end
    
    return true
end

local function isForestryDisabled()
    local disabled = false
    local reason = ""

    -- Check if player is walking (highest priority)
    if gameplay_walk and gameplay_walk.isWalking() then
        disabled = true
        reason = "Forestry logging is not available while walking"
        return disabled, reason
    end

    -- Check if forestry multiplier is 0 (if economy adjuster supports it)
    if career_economyAdjuster then
        local forestryMultiplier = career_economyAdjuster.getSectionMultiplier("forestry") or 1.0
        if forestryMultiplier == 0 then
            disabled = true
            reason = "Forestry multiplier is set to 0"
        end
    end

    return disabled, reason
end

-- Generate a new forestry job
function ForestryLoggingJob:generateJob(triggerPos)
    -- Set loading state immediately
    local data = {
        state = "loading",
        deliveryLocation = "",
        distanceToDestination = 0,
        totalDistance = 0,
        forestryDisabled = false,
        disabledReason = ""
    }
    guihooks.trigger('updateForestryState', data)
    
    -- Store trigger position as forestry location
    self.forestryLocation = { pos = triggerPos }
    
    -- Start the coroutine for job generation
    self.jobCoroutine = coroutine.create(function()
        -- Initialize player vehicle and yield to allow other processes
        self:initializePlayerVehicle()
        for i = 1, 5 do coroutine.yield() end

        -- Select a sawmill and yield
        self:selectSawmill()
        for i = 1, 5 do coroutine.yield() end

        -- Determine delivery location and yield
        self:determineDeliveryLocation() 
        for i = 1, 5 do coroutine.yield() end

        -- Spawn log vehicles and yield
        self:spawnLogVehicles()
        for i = 1, 5 do coroutine.yield() end
        
        -- Set final state after generation is complete
        local forestryDisabled, disabledReason = isForestryDisabled()
        local effectiveState = forestryDisabled and "disabled" or "loading_logs"

        local distanceToDestination = 0
        if self.deliveryLocation and self.forestryLocation then
            distanceToDestination = (self.forestryLocation.pos - self.deliveryLocation.pos):length()
        end

        local finalData = {
            state = effectiveState,
            deliveryLocation = self.selectedSawmill and self.selectedSawmill.name or "",
            distanceToDestination = distanceToDestination,
            totalDistance = self.totalDistanceTraveled or 0,
            forestryDisabled = forestryDisabled,
            disabledReason = disabledReason
        }
        guihooks.trigger('updateForestryState', finalData)
    end)
end

-- Initialize the player's vehicle
function ForestryLoggingJob:initializePlayerVehicle()
    local playerVehicle = be:getPlayerVehicle(0)
    if not playerVehicle then
        return
    end
    self.playerVehicleId = playerVehicle:getID()
    self.playerPosition = playerVehicle:getPosition()
end

-- Select a random sawmill
function ForestryLoggingJob:selectSawmill()
    -- Try to find sawmill locations from sites data first
    local sitePath = gameplay_sites_sitesManager.getCurrentLevelSitesFileByName('forestry')
    if sitePath then
        local siteData = gameplay_sites_sitesManager.loadSites(sitePath, true, true)
        if siteData and siteData.tagsToLocations and siteData.tagsToLocations.destination then
            local destinations = siteData.tagsToLocations.destination
            if #destinations > 0 then
                local selectedDest = destinations[math.random(#destinations)]
                self.selectedSawmill = {
                    name = "Sawmill",
                    pos = selectedDest.pos
                }
                return
            end
        end
    end
    
    -- Fallback: try to find sawmill facilities
    local facilities = freeroam_facilities.getFacilities(getCurrentLevelIdentifier())
    local sawmills = {}
    
    -- Look for sawmill facilities
    if facilities and facilities.deliveryProviders then
        for _, provider in ipairs(facilities.deliveryProviders) do
            if provider.name and (provider.name:lower():find("sawmill") or provider.name:lower():find("mill")) then
                table.insert(sawmills, provider)
            end
        end
    end
    
    -- If found sawmills, use one
    if #sawmills > 0 then
        self.selectedSawmill = sawmills[math.random(#sawmills)]
        return
    end
    
    -- Ultimate fallback: use a default location far from forestry site
    -- This should be replaced with actual sawmill facility data
    log("W", "forestry", "No sawmill facilities found, using fallback location")
    if self.forestryLocation and self.forestryLocation.pos then
        -- Place sawmill at a reasonable distance from forestry site
        local offset = vec3(500, 500, 0)
        local fallbackPos = self.forestryLocation.pos + offset
        fallbackPos.z = core_terrain.getTerrainHeight(fallbackPos) or fallbackPos.z
        self.selectedSawmill = {
            name = "Sawmill",
            pos = fallbackPos
        }
    else
        self.selectedSawmill = {
            name = "Sawmill",
            pos = vec3(0, 0, 0)
        }
    end
end

-- Determine the delivery location
function ForestryLoggingJob:determineDeliveryLocation()
    if not self.selectedSawmill then
        return
    end
    
    -- Try to get parking spot for sawmill
    if self.selectedSawmill.pos then
        self.deliveryLocation = {
            pos = self.selectedSawmill.pos
        }
    else
        -- Use sites manager to find parking spot
        self.deliveryLocation = gameplay_sites_sitesManager.getBestParkingSpotForVehicleFromList(nil,
            freeroam_facilities.getParkingSpotsForFacility(self.selectedSawmill))
    end
    
    if not self.deliveryLocation or not self.deliveryLocation.pos then
        log("E", "forestry", "Could not determine delivery location")
    end
end

-- Spawn log vehicles at the forestry site
function ForestryLoggingJob:spawnLogVehicles()
    if not self.forestryLocation or not self.forestryLocation.pos then
        log("E", "forestry", "No forestry location set for spawning logs")
        return
    end
    
    local spawnPos = self.forestryLocation.pos
    local spawnCount = 3 -- Spawn 3 log vehicles by default
    
    -- Spawn log vehicles in a line or cluster
    for i = 1, spawnCount do
        local offset = vec3((i - 2) * 3, 0, 0) -- Space them 3 meters apart
        local logSpawnPos = spawnPos + offset
        logSpawnPos.z = core_terrain.getTerrainHeight(logSpawnPos) or logSpawnPos.z
        
        -- Spawn log vehicle
        -- Note: Need to identify the correct BeamNG log vehicle model
        -- Common log vehicle models might be: "log", "log_pile", or similar
        local logVehicle = core_vehicles.spawnNewVehicle("log", {
            config = "default",
            pos = logSpawnPos,
            rot = quat(0, 0, 0, 1),
            autoEnterVehicle = false,
            cling = true
        })
        
        if logVehicle then
            local logId = logVehicle:getID()
            table.insert(self.logVehicleIds, logId)
            self.logCount = self.logCount + 1
        else
            -- Try alternative log vehicle names
            local alternatives = {"log_pile", "logs", "log_vehicle"}
            for _, altName in ipairs(alternatives) do
                logVehicle = core_vehicles.spawnNewVehicle(altName, {
                    config = "default",
                    pos = logSpawnPos,
                    rot = quat(0, 0, 0, 1),
                    autoEnterVehicle = false,
                    cling = true
                })
                if logVehicle then
                    local logId = logVehicle:getID()
                    table.insert(self.logVehicleIds, logId)
                    self.logCount = self.logCount + 1
                    break
                end
            end
        end
    end
    
    if #self.logVehicleIds > 0 then
        self.spawnedLogs = true
        self.isMonitoring = true
        ui_message("Logs have been spawned at the forestry site.\nUse a wheel loader to load them onto your trailer.", 10, "New Job", "info")
    else
        log("E", "forestry", "Failed to spawn any log vehicles")
        ui_message("Failed to spawn logs. Check log vehicle model name.", 5, "error", "error")
    end
end

-- Calculate the reward for completing the job
function ForestryLoggingJob:calculateReward()
    if not career_career.isActive() then
        return nil
    end
    
    local distanceMultiplier = self.totalDistanceTraveled * 2
    local timeMultiplier = 1.0
    if self.jobStartTime then
        timeMultiplier = (self.totalDistanceTraveled / math.max(1, (os.time() - self.jobStartTime) * 10))
    end
    
    local logMultiplier = self.logCount * 500
    local reward = math.floor((distanceMultiplier + logMultiplier) * timeMultiplier / 4)
    reward = reward * 1.25 + 1000
    
    if career_modules_hardcore and career_modules_hardcore.isHardcoreMode() then
        reward = reward * 0.4
    end

    -- Apply economy adjuster if available
    local adjustedReward = reward
    if career_economyAdjuster then
        local multiplier = career_economyAdjuster.getSectionMultiplier("forestry") or 1.0
        adjustedReward = reward * multiplier
        adjustedReward = math.floor(adjustedReward + 0.5)
    end

    return adjustedReward
end

-- Update function called every frame
function ForestryLoggingJob:onUpdate(dtReal, dtSim, dtRaw) 
    -- Add timer for distance checks
    if not self.updateTimer then self.updateTimer = 0 end
    self.updateTimer = self.updateTimer + dtSim
    
    if self.jobCoroutine and coroutine.status(self.jobCoroutine) ~= "dead" then
        local success, message = coroutine.resume(self.jobCoroutine)
        if not success then
            self.jobCoroutine = nil
        end
    end

    if not self.isMonitoring then
        return
    end

    -- Check if log vehicles still exist
    if not self:checkLogVehiclesExist() then
        return
    end

    -- Only do distance checks once per second
    if self.updateTimer < 1 then
        return
    end

    -- Reset timer after checks
    self.updateTimer = 0

    local playerVehicle = be:getPlayerVehicle(0)
    if not playerVehicle then
        return
    end

    local playerPos = playerVehicle:getPosition()
    
    -- Check if player has started the job (loaded logs and ready to deliver)
    if not self.isJobStarted then
        -- Player needs to be at forestry site to start loading
        if self.spawnedLogs and #self.logVehicleIds > 0 then
            local distanceToForestry = (playerPos - self.forestryLocation.pos):length()
            
            -- If player is at forestry site, they can load logs
            -- For now, we'll start the job when player is ready (they've loaded logs manually)
            -- This could be enhanced with actual log loading detection later
            if distanceToForestry <= 30 then
                -- Player is at forestry site - allow them to start delivery when ready
                -- For now, we'll start automatically when they're close and have been there
                if not self.jobStartTime then
                    -- Check if player has been stationary for a moment (indicating they may have loaded)
                    local velSuccess, vel = pcall(function() return playerVehicle:getVelocity():length() end)
                    if velSuccess and vel and vel <= 1 then
                        -- Player is stationary at forestry site, assume they're ready
                        -- In future, this could check if logs are actually loaded
                    end
                end
            end
        end
    else
        -- Job is in progress, check dropoff
        if self.deliveryLocation and self.deliveryLocation.pos then
            local distanceFromDestination = (playerPos - self.deliveryLocation.pos):length()
            local velSuccess, vel = pcall(function() return playerVehicle:getVelocity():length() end)
            if not velSuccess or not vel then
                return
            end
            local velocity = vel
            
            if distanceFromDestination <= 3 and velocity <= 1 then
                if self.isCompleting then return end
                self.isCompleting = true
                core_jobsystem.create(function(job)
                  local self = job.args[1]
                  local ok = pcall(function()
                    if ui_fadeScreen and ui_fadeScreen.start then
                      ui_fadeScreen.start(completionFadeDuration)
                    end

                    job.sleep(completionFadeDuration)

                    local reward = self:calculateReward()
                    local rewardText = "You've delivered the logs to the sawmill."
                    if reward then
                      rewardText = rewardText .. "\nYou have been paid $" .. tostring(reward)
                    end

                    if career_career and career_career.isActive and career_career.isActive() and reward then
                      career_modules_payment.reward({
                        money = { amount = reward },
                        beamXP = { amount = math.floor(reward / 20) },
                        labourer = { amount = math.floor(reward / 20) }
                      }, {
                        label = "You've delivered logs to the sawmill.\nYou have been paid $" .. reward,
                        tags = {"gameplay", "reward", "laborer", "forestry"}
                      }, true)
                      career_saveSystem.saveCurrent()
                    end

                    if marker then
                      pcall(function() marker:unregisterObject() end)
                      pcall(function() marker:delete() end)
                      marker = nil
                    end

                    self.isJobStarted = false
                    self.isMonitoring = false
                    self.isCompleted = true
                    self.reward = reward
                    ui_message(rewardText, 15, "Job Completed", "info")
                  end)

                  self.isCompleting = false
                  stopFadeSafe()
                  if not ok then
                    log("E", "forestry", "Forestry completion failed; forced fade stop")
                  end
                end, 1, self)
            elseif distanceFromDestination <= 10 then
                ui_message("You've arrived at the sawmill.\nPlease position your vehicle at the dropoff point.", 10, "info", "info")
            else
                if self.deliveryLocation.pos ~= nil and (not core_groundMarkers.getTargetPos() or core_groundMarkers.getTargetPos() ~= self.deliveryLocation.pos) then
                    core_groundMarkers.setPath(self.deliveryLocation.pos, {clearPathOnReachingTarget = true})
                end
            end
        end
    end
    
    -- Start job when player begins moving away from forestry site (assumes logs are loaded)
    if not self.isJobStarted and self.spawnedLogs and self.deliveryLocation then
        local distanceToForestry = (playerPos - self.forestryLocation.pos):length()
        local velSuccess, vel = pcall(function() return playerVehicle:getVelocity():length() end)
        
        if velSuccess and vel and vel > 2 and distanceToForestry > 20 then
            -- Player is moving away from forestry site, start the job
            self.isJobStarted = true
            self.jobStartTime = os.time()
            createMarker(self.deliveryLocation.pos)
            core_groundMarkers.setPath(self.deliveryLocation.pos, {clearPathOnReachingTarget = true})
            self.totalDistanceTraveled = core_groundMarkers.getPathLength()
            ui_message("Logs loaded! Drive to " .. (self.selectedSawmill and self.selectedSawmill.name or "the sawmill") .. " to deliver them.", 10, "info", "info")
        end
    end
end

function ForestryLoggingJob:completeJob()
    self:destroy()
end

-- Get the current forestry job instance
function M.getForestryJobInstance()
    if not forestryJobInstance then
        forestryJobInstance = ForestryLoggingJob:new()
    end
    return forestryJobInstance
end

-- Handle trigger events
local function onBeamNGTrigger(data)
    if be:getPlayerVehicleID(0) ~= data.subjectID then
        return
    end
    if gameplay_walk and gameplay_walk.isWalking() then
        return
    end
    
    local triggerName = data.triggerName
    local event = data.event
    
    -- Check if it's a forestry trigger
    -- Triggers should be named like: forestry_* or fl_*
    if not triggerName:match("^forestry_") and not triggerName:match("^fl_") then
        return
    end
    
    if event == "enter" then
        local instance = M.getForestryJobInstance()
        if instance and not instance.isMonitoring then
            -- Get trigger position
            local triggerObj = scenetree.findObject(triggerName)
            local triggerPos = nil
            if triggerObj then
                triggerPos = triggerObj:getPosition()
            else
                -- Fallback: use player position
                local playerVeh = be:getPlayerVehicle(0)
                if playerVeh then
                    triggerPos = playerVeh:getPosition()
                end
            end
            
            if triggerPos then
                instance.playerVehicle = be:getPlayerVehicle(0)
                instance.playerVehicleId = be:getPlayerVehicle(0):getID()
                instance:generateJob(triggerPos)
            end
        end
    end
end

-- Update the forestry job (called from playerDriving's onUpdate)
function M.onUpdate(dtReal, dtSim, dtRaw)
    local instance = M.getForestryJobInstance()
    if instance then
        instance:onUpdate(dtReal, dtSim, dtRaw)
    end
end

function M.requestForestryState()
    local instance = M.getForestryJobInstance()

    local forestryDisabled, disabledReason = isForestryDisabled()
    local effectiveState = forestryDisabled and "disabled" or "no_mission"

    if instance then
        local state = "no_mission"
        if instance.isCompleted then
            state = "completed"
        elseif instance.jobCoroutine and coroutine.status(instance.jobCoroutine) ~= "dead" then
            state = "loading"
        elseif instance.isMonitoring then
            if instance.isJobStarted then
                state = "delivering"
            else
                state = "loading_logs"
            end
        end
        effectiveState = forestryDisabled and "disabled" or state
    end

    local distanceToDestination = 0
    if instance and instance.deliveryLocation and instance.forestryLocation then
        distanceToDestination = (instance.forestryLocation.pos - instance.deliveryLocation.pos):length()
    end

    local data = {
        state = effectiveState,
        deliveryLocation = instance and (instance.selectedSawmill and instance.selectedSawmill.name or "") or "",
        distanceToDestination = distanceToDestination,
        totalDistance = instance and (instance.totalDistanceTraveled or 0) or 0,
        reward = instance and (instance.reward or 0) or 0,
        forestryDisabled = forestryDisabled,
        disabledReason = disabledReason
    }

    guihooks.trigger('updateForestryState', data)
end

function M.cancelJob()
    local instance = M.getForestryJobInstance()
    if instance then
        instance:destroy()
    end
end

function M.completeJob()
    local instance = M.getForestryJobInstance()
    if instance then
        instance:completeJob()
    end
end

-- Start delivery manually (when player has loaded logs)
function M.startDelivery()
    local instance = M.getForestryJobInstance()
    if instance and instance.spawnedLogs and not instance.isJobStarted then
        if instance.deliveryLocation and instance.deliveryLocation.pos then
            instance.isJobStarted = true
            instance.jobStartTime = os.time()
            createMarker(instance.deliveryLocation.pos)
            core_groundMarkers.setPath(instance.deliveryLocation.pos, {clearPathOnReachingTarget = true})
            instance.totalDistanceTraveled = core_groundMarkers.getPathLength()
            ui_message("Logs loaded! Drive to " .. (instance.selectedSawmill and instance.selectedSawmill.name or "the sawmill") .. " to deliver them.", 10, "info", "info")
        else
            ui_message("Delivery location not set. Cannot start delivery.", 5, "error", "error")
        end
    else
        if not instance then
            ui_message("No active forestry job.", 5, "error", "error")
        elseif not instance.spawnedLogs then
            ui_message("Logs have not been spawned yet.", 5, "error", "error")
        elseif instance.isJobStarted then
            ui_message("Delivery already started.", 5, "info", "info")
        end
    end
end

-- Export the class
M.ForestryLoggingJob = ForestryLoggingJob
M.onBeamNGTrigger = onBeamNGTrigger

return M

