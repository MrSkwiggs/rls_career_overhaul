local M = {}

-----------------------------------------------------------
-- CONFIGURATION
-----------------------------------------------------------
local Config = {
    QuarryZoneCenter = vec3(602.507, -1786.035, 225.748), 
    QuarryZoneRadius = 100,
    WorkSiteLocation = vec3(612.312, -1767.023, 225.748),
    WorkSiteTriggerRadius = 15,

    TruckSpawnPos = vec3(625.794, -1765.815, 225.748),
    TruckSpawnRot = quatFromDir(vec3(0, -1, 0)), 
    TruckParkingPos = vec3(630.375, -1777.698, 225.748),

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

    -- ECONOMY SETTINGS
    Economy = {
        BasePay     = 300,   
        PayPerTon   = 100,   
        BaseXP      = 25,    
        XPPerTon    = 5      
    }
}

-- DEBUG MODE
local ENABLE_DEBUG = false

-----------------------------------------------------------
-- VARIABLES
-----------------------------------------------------------
local imgui = ui_imgui
local markerModule = require("ge/extensions/core/groundMarkers")

local STATE_IDLE            = 0
local STATE_OFFER           = 1
local STATE_DRIVING_TO_SITE = 2
local STATE_TRUCK_ARRIVING  = 3
local STATE_LOADING         = 4

local currentState = STATE_IDLE
local wl40ID = nil

local jobObjects = {
    truckID        = nil,
    currentLoadMass = 0,
    materialType   = nil 
}

local rockPileQueue = {} 
local uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
local jobOfferSuppressed = false

local markerAnim = {
    time         = 0,
    pulseScale   = 1.0,
    rotationAngle = 0,
    beamHeight   = 0,
    ringExpand   = 0
}

-----------------------------------------------------------
-- OFFICIAL CAREER PAYMENT LOGIC
-----------------------------------------------------------
local function payPlayer()
    local massKg = jobObjects.currentLoadMass or 0
    local tons   = massKg / 1000

    -- 1. Calculate Amount
    local moneyReward = Config.Economy.BasePay + (tons * Config.Economy.PayPerTon)
    local xpReward    = math.floor(Config.Economy.BaseXP + (tons * Config.Economy.XPPerTon))

    if moneyReward > 15000 then moneyReward = 15000 end 

    -- 2. Detect Career Mode
    local career = extensions.career_career
    local isCareerActive = career and career.isActive()

    if isCareerActive then
        local paymentModule = extensions.career_modules_payment
        if paymentModule then
            local rewards = {
                money = { amount = moneyReward, canBeNegative = false },
                labor = { amount = xpReward, canBeNegative = false }
            }
            local reason = {
                label = "Quarry Logistics Job",
                tags = {"gameplay", "mission", "reward"}
            }
            paymentModule.reward(rewards, reason)
            Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Buy_01')
            ui_message(string.format("JOB DONE! Earned $%.2f and %d Labor XP", moneyReward, xpReward), 8, "success")
        else
            log('E', 'WL40', "Career Payment Module not found!")
        end
    else
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
        ui_message(string.format("SANDBOX: Theoretical Payout: $%.2f (%.1f Tons)", moneyReward, tons), 6, "success")
    end
end

-----------------------------------------------------------
-- MINIMALIST MARKER LOGIC
-----------------------------------------------------------
local function drawWorkSiteMarker(dt)
    if currentState ~= STATE_DRIVING_TO_SITE then return end
    markerAnim.time = markerAnim.time + dt
    local pulseSpeed = 2.5
    markerAnim.pulseScale = 1.0 + math.sin(markerAnim.time * pulseSpeed) * 0.1
    markerAnim.rotationAngle = markerAnim.rotationAngle + dt * 0.4
    local targetBeamHeight = 12.0
    markerAnim.beamHeight = math.min(targetBeamHeight, markerAnim.beamHeight + dt * 30)
    markerAnim.ringExpand = (markerAnim.ringExpand + dt * 1.5) % 1.5
    
    local basePos = Config.WorkSiteLocation
    local color      = ColorF(0.2, 1.0, 0.4, 0.85)
    local colorFaded = ColorF(0.2, 1.0, 0.4, 0.3)
    local beamTop   = basePos + vec3(0, 0, markerAnim.beamHeight)
    local beamRadius = 0.5 * markerAnim.pulseScale
    
    debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
    debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.2, colorFaded)
    
    local sphereRadius = 1.0 * markerAnim.pulseScale
    debugDrawer:drawSphere(beamTop, sphereRadius, color)
    debugDrawer:drawSphere(beamTop, sphereRadius + 0.3, ColorF(0.2, 1.0, 0.4, 0.15))
    
    local ringPhase  = markerAnim.ringExpand
    local ringRadius = Config.WorkSiteTriggerRadius * (0.6 + ringPhase * 0.4)
    local ringColor  = ColorF(0.2, 1.0, 0.4, math.max(0, 1.0 - ringPhase * 0.8) * 0.5)
    local segments   = 48
    
    for j = 0, segments - 1 do
        local angle1 = (j / segments) * math.pi * 2
        local angle2 = ((j + 1) / segments) * math.pi * 2
        local p1 = basePos + vec3(math.cos(angle1) * ringRadius, math.sin(angle1) * ringRadius, 0.3)
        local p2 = basePos + vec3(math.cos(angle2) * ringRadius, math.sin(angle2) * ringRadius, 0.3)
        debugDrawer:drawLine(p1, p2, ringColor)
    end
    
    for i = 0, 2 do
        local angle    = markerAnim.rotationAngle + (i * (math.pi * 2 / 3))
        local distance = Config.WorkSiteTriggerRadius - 1
        local markerPos  = basePos + vec3(math.cos(angle) * distance, math.sin(angle) * distance, 0)
        local markerHeight = 3 + math.sin(markerAnim.time * 2.5 + i * 1.2) * 0.8
        local markerTop = markerPos + vec3(0, 0, markerHeight)
        debugDrawer:drawCylinder(markerPos, markerTop, 0.15, colorFaded)
        debugDrawer:drawSphere(markerTop, 0.4, color)
    end
    
    local playerVeh = be:getPlayerVehicle(0)
    if playerVeh then
        local dist    = (playerVeh:getPosition() - basePos):length()
        local textPos = beamTop + vec3(0, 0, 2)
        debugDrawer:drawTextAdvanced(textPos, String(string.format("%.0fm", dist)), ColorF(1, 1, 1, 0.95), true, false, ColorI(0, 0, 0, 180))
    end
end

-----------------------------------------------------------
-- OOBB DETECTION LOGIC
-----------------------------------------------------------
local function isPointInOOBB_Data(point, tData)
    local diff = point - tData.origin
    local lx = diff:dot(tData.uX)
    local ly = diff:dot(tData.uY)
    local lz = diff:dot(tData.uZ)
    return (lx >= tData.bounds.minX and lx <= tData.bounds.maxX and
            ly >= tData.bounds.minY and ly <= tData.bounds.maxY and
            lz >= tData.bounds.minZ and lz <= tData.bounds.maxZ)
end

local function getVehicleOOBBData(obj)
    if not obj then return nil end
    local oobb = obj:getSpawnWorldOOBB()
    if not oobb then return nil end
    local p0 = vec3(oobb:getPoint(0))
    local p1 = vec3(oobb:getPoint(1)) 
    local p3 = vec3(oobb:getPoint(3)) 
    local p4 = vec3(oobb:getPoint(4)) 
    local vX, vY, vZ = p1 - p0, p3 - p0, p4 - p0
    return {
        origin = p0,
        uX = vX:normalized(), uY = vY:normalized(), uZ = vZ:normalized(),
        bounds = { minX = -0.1, maxX = vX:length() + 0.1, minY = -0.1, maxY = vY:length() + 0.1, minZ = -0.1, maxZ = vZ:length() + 10.0 }
    }
end

local function calculateTruckPayload()
    if not jobObjects.truckID then return 0 end
    local truck = be:getObjectByID(jobObjects.truckID)
    if not truck then return 0 end
    local truckBoxData = getVehicleOOBBData(truck)
    if not truckBoxData then return 0 end
    local totalMass = 0
    for _, rockEntry in ipairs(rockPileQueue) do
        local obj = be:getObjectByID(rockEntry.id)
        if obj then
            local tf     = obj:getTransform()
            local axisX, axisY, axisZ = tf:getColumn(0), tf:getColumn(1), tf:getColumn(2)
            local objPos = obj:getPosition()
            local nodeCount = obj:getNodeCount()
            local step = 10 
            local nodesInside, nodesChecked = 0, 0
            for i = 0, nodeCount - 1, step do
                nodesChecked = nodesChecked + 1
                local localPos  = obj:getNodePosition(i)
                local worldPoint = objPos - (axisX * localPos.x) - (axisY * localPos.y) + (axisZ * localPos.z)
                if isPointInOOBB_Data(worldPoint, truckBoxData) then nodesInside = nodesInside + 1 end
            end
            if nodesChecked > 0 then
                totalMass = totalMass + ((rockEntry.mass or Config.RockMassPerPile) * (nodesInside / nodesChecked))
            end
        end
    end
    return totalMass
end

-----------------------------------------------------------
-- HELPERS
-----------------------------------------------------------
local function lerp(a, b, t) return a + (b - a) * t end

local function calculateTaxiTransform(position, direction)
    local normal = vec3(0,0,1)
    if map and map.surfaceNormal then normal = map.surfaceNormal(position, 1) end
    local vecY = vec3(0, 1, 0)
    if direction:length() == 0 then direction = vec3(0,1,0) end
    local rotation = quatFromDir(vecY:rotated(quatFromDir(direction, normal)), normal)
    return position, rotation
end

local function isPositionInPlayerView(position, playerPos)
    local playerCameraPos = core_camera.getPosition()
    local playerViewDir   = core_camera.getForward()
    local dirToPos        = (position - playerCameraPos):normalized()
    if dirToPos:dot(playerViewDir) <= 0.3 then return false end
    local distanceToPos = playerCameraPos:distance(position)
    return castRayStatic(playerCameraPos, dirToPos, distanceToPos) >= distanceToPos - 2
end

local function calculateLanePosition(roadCenterPos, drivingDirection, playerPos)
    local isRightHandTraffic = true
    if map and map.getMap and map.getMap().rules then isRightHandTraffic = map.getMap().rules.rightHandDrive or true end
    local rightVector = vec3(-drivingDirection.y, drivingDirection.x, 0):normalized()
    local laneOffset  = isRightHandTraffic and rightVector or -rightVector
    local lanePosition = roadCenterPos + laneOffset * 3.5
    lanePosition.z     = core_terrain.getTerrainHeight(lanePosition)
    return lanePosition, drivingDirection
end

local function interpolatePathPosition(currentSeg, nextSeg, distanceFromStart, playerPos)
    local segmentLength = nextSeg.distance - currentSeg.distance
    if segmentLength <= 0 then return nil, nil end
    local segmentProgress = (distanceFromStart - currentSeg.distance) / segmentLength
    local roadCenterPos = vec3(
        currentSeg.pos.x + (nextSeg.pos.x - currentSeg.pos.x) * segmentProgress,
        currentSeg.pos.y + (nextSeg.pos.y - currentSeg.pos.y) * segmentProgress,
        currentSeg.pos.z + (nextSeg.pos.z - currentSeg.pos.z) * segmentProgress
    )
    local drivingDirection = (currentSeg.pos - nextSeg.pos):normalized()
    return calculateLanePosition(roadCenterPos, drivingDirection, playerPos)
end

local function findOptimalPositionOnPath(pathSegments, targetDistance, playerPos)
    if not pathSegments or #pathSegments < 2 then return nil, nil end
    local totalPathLength   = pathSegments[#pathSegments].distance
    local distanceFromStart = math.max(0, totalPathLength - targetDistance)
    local fallbackPos, fallbackDir = nil, nil
    for i = 1, #pathSegments - 1 do
        local currentSeg = pathSegments[i]
        local nextSeg    = pathSegments[i + 1]
        if distanceFromStart >= currentSeg.distance and distanceFromStart <= nextSeg.distance then
            local lanePos, finalDirection = interpolatePathPosition(currentSeg, nextSeg, distanceFromStart, playerPos)
            if lanePos then
                if not isPositionInPlayerView(lanePos, playerPos) then return lanePos, finalDirection end
                if not fallbackPos then fallbackPos, fallbackDir = lanePos, finalDirection end
            end
        end
    end
    return fallbackPos, fallbackDir
end

local function findBasicSpawnPosition(playerPos, minDistance)
    if not gameplay_traffic_trafficUtils then extensions.load('gameplay_traffic_trafficUtils') end
    local options = { gap = 20, usePrivateRoads = false, minDrivability = 0.5, minRadius = 1.0, pathRandomization = 0.1 }
    for i = 1, 3 do
        local randomAngle = math.random() * math.pi * 2
        local searchDir   = vec3(math.cos(randomAngle), math.sin(randomAngle), 0)
        local spawnData, isValid = gameplay_traffic_trafficUtils.findSpawnPointRadial(playerPos, searchDir, minDistance, minDistance * 3, minDistance * 1.5, options)
        if isValid and spawnData.pos then
            local finalPos, finalDir = gameplay_traffic_trafficUtils.finalizeSpawnPoint(spawnData.pos, spawnData.dir, spawnData.n1, spawnData.n2, {legalDirection = true, dirRandomization = 0.5})
            return finalPos, finalDir
        end
    end
    local fallbackDistance = math.max(minDistance, 50)
    local randomAngle = math.random() * math.pi * 2
    local offsetPos   = playerPos + vec3(math.cos(randomAngle) * fallbackDistance, math.sin(randomAngle) * fallbackDistance, 0)
    offsetPos.z       = core_terrain.getTerrainHeight(offsetPos)
    return offsetPos, (playerPos - offsetPos):normalized()
end

-----------------------------------------------------------
-- ROCK / TRUCK MANAGEMENT
-----------------------------------------------------------
local function manageRockCapacity()
    while #rockPileQueue > Config.MaxRockPiles do
        local oldEntry = table.remove(rockPileQueue, 1)
        if oldEntry and oldEntry.id then
            local obj = be:getObjectByID(oldEntry.id)
            if obj then obj:delete() end
        end
    end
end

local function finalizeTruckPosition(truckId, playerPos)
    local truck = getObjectByID(truckId)
    if truck then
        core_jobsystem.create(function(job) job.sleep(0.5) truck:setMeshAlpha(1, '') end)
        truck:queueLuaCommand('driver.returnTargetPosition(' .. serialize(playerPos) .. ')')
        truck:queueLuaCommand('ai.setCutOffDrivability(0)')
        truck:queueLuaCommand('ai.setAggression(0.6)')
    end
end

local function teleportTruckToPosition(truckId, position, direction, playerPos)
    local truck = getObjectByID(truckId)
    if not truck then return end
    truck:setMeshAlpha(0, '') 
    local pos, rotation = calculateTaxiTransform(position, direction)
    truck:setPosRot(pos.x, pos.y, pos.z, rotation.x, rotation.y, rotation.z, rotation.w)
    core_jobsystem.create(function(job) job.sleep(0.2) finalizeTruckPosition(truckId, playerPos) end)
end

local function positionTruckOnPath(truckId, playerPos)
    local truck = getObjectByID(truckId)
    if not truck then return end
    local truckPos = truck:getPosition()
    local path = map.getPointToPointPath(truckPos, playerPos, 0, 1000, 200, 10000, 1)

    if not path or #path == 0 then finalizeTruckPosition(truckId, playerPos) return end
    local pathSegments = {{pos = truckPos, distance = 0}}
    local totalDistance = 0
    local prevNodePos = truckPos
    for i = 1, #path do
        local nodePos = map.getMap().nodes[path[i]].pos
        if nodePos then
            totalDistance = totalDistance + prevNodePos:distance(nodePos)
            table.insert(pathSegments, {pos = nodePos, distance = totalDistance})
            prevNodePos = nodePos
        end
    end
    totalDistance = totalDistance + prevNodePos:distance(playerPos)
    table.insert(pathSegments, {pos = playerPos, distance = totalDistance})

    local maxTargetDistance = math.min(100, totalDistance * 0.9)
    local bestPosition, bestDirection, bestDistance = nil, nil, 0
    for targetDistance = maxTargetDistance, 30, -5 do
        local optimalPos, optimalDir = findOptimalPositionOnPath(pathSegments, targetDistance, playerPos)
        if optimalPos then
            if not isPositionInPlayerView(optimalPos, playerPos) then teleportTruckToPosition(truckId, optimalPos, optimalDir, playerPos) return end
            if not bestPosition or targetDistance > bestDistance then
                bestPosition, bestDirection, bestDistance = optimalPos, optimalDir, targetDistance
            end
        end
    end
    if bestPosition then teleportTruckToPosition(truckId, bestPosition, bestDirection, playerPos) else finalizeTruckPosition(truckId, playerPos) end
end

local function spawnJobMaterials()
    local materialType = jobObjects.materialType or "rocks"
    local basePos      = Config.WorkSiteLocation + vec3(0,0,0.2)
    if materialType == "rocks" then
        local rocks = core_vehicles.spawnNewVehicle(Config.RockProp, { config = "default", pos = basePos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false })
        if rocks then table.insert(rockPileQueue, { id = rocks:getID(), mass = Config.RockMassPerPile }) manageRockCapacity() end
    elseif materialType == "marble" then
        local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0) }
        for idx, cfg in ipairs(Config.MarbleConfigs) do
            local pos     = basePos + (offsets[idx] or vec3(0,0,0))
            local block = core_vehicles.spawnNewVehicle(Config.MarbleProp, { config = cfg, pos = pos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false })
            if block then
                local baseMass = nil
                if block.getInitialMass then baseMass = block:getInitialMass() end
                table.insert(rockPileQueue, { id = block:getID(), mass = baseMass }) manageRockCapacity()
            end
        end
    end
end

local function spawnAndCallTruck()
    spawnJobMaterials()
    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return end
    local playerPos = playerVeh:getPosition()
    local spawnPos, roadDirection = findBasicSpawnPosition(playerPos, 50)
    if not spawnPos then spawnPos = playerPos + vec3(50,0,0) spawnPos.z = core_terrain.getTerrainHeight(spawnPos) end
    local direction = roadDirection or (playerPos - spawnPos):normalized()
    direction.z = 0
    local pos, rotation = calculateTaxiTransform(spawnPos, direction)

    local materialType = jobObjects.materialType or "rocks"
    local truckModel = (materialType == "marble") and Config.MarbleTruckModel or Config.RockTruckModel
    local truckConfig = (materialType == "marble") and Config.MarbleTruckConfig or Config.RockTruckConfig

    local truck = core_vehicles.spawnNewVehicle(truckModel, { pos = pos, rot = rotation, config = truckConfig, autoEnterVehicle = false })
    if not truck then return end
    jobObjects.truckID = truck:getID()
    truck:queueLuaCommand('extensions.load("driver") ai.setMode("manual") electrics.values.lightbar = 1')
    truck:setMeshAlpha(0, '') 
    ui_message("Truck dispatched to your location...", 5, "info")
    core_jobsystem.create(function(job) job.sleep(0.5) positionTruckOnPath(jobObjects.truckID, playerPos) end)
end

-----------------------------------------------------------
-- GAMEPLAY LOGIC
-----------------------------------------------------------
local function parkTruckScript()
    if not jobObjects.truckID then return end
    local truck = be:getObjectByID(jobObjects.truckID)
    if not truck then return end
    truck:queueLuaCommand("ai.setMode('stop') controller.mainController.setHandbrake(1)")
    ui_message("Truck Arrived! Start Loading.", 5, "success")
end

local function cleanupJob(deleteTruck, delayRocks)
    if delayRocks then
        local queueSnapshot = {}
        for _, v in ipairs(rockPileQueue) do table.insert(queueSnapshot, v.id) end
        core_jobsystem.create(function(job)
            job.sleep(Config.RockDespawnTime) 
            for _, rid in ipairs(queueSnapshot) do
                local obj = be:getObjectByID(rid)
                if obj then obj:delete() end
            end
            for i = #rockPileQueue, 1, -1 do
                if not be:getObjectByID(rockPileQueue[i].id) then table.remove(rockPileQueue, i) end
            end
        end)
    end
    if deleteTruck and jobObjects.truckID then
        local obj = be:getObjectByID(jobObjects.truckID)
        if obj then obj:delete() end
    end
    if deleteTruck then jobObjects.truckID = nil end
    jobObjects.currentLoadMass = 0
    jobObjects.materialType    = nil
    markerModule.setPath(nil)
    currentState = STATE_IDLE
    wl40ID = nil
    markerAnim.beamHeight = 0
    markerAnim.ringExpand = 0
end

local function finishJobAndDepart()
    payPlayer() 

    ui_message("Job Complete! Truck joining traffic...", 5, "success")
    if jobObjects.truckID then
        local truck = be:getObjectByID(jobObjects.truckID)
        if truck then
            -- FIXED: DO NOT use gameplay_traffic.insertTraffic in Career Mode
            -- It causes immediate despawn. Just set AI to traffic mode.
            truck:queueLuaCommand("ai.setMode('traffic') ai.setSpeedMode('legal') ai.setCutOffDrivability(0) controller.mainController.setHandbrake(0)")
        end
    end
    cleanupJob(false, true)
    
    -- Explicitly release the truck from our script so we don't accidentally delete it later
    jobObjects.truckID = nil 
end

local function isItalyMap()
    local level = getCurrentLevelIdentifier()
    return level and (string.find(level:lower(), "italy") ~= nil)
end

local function getDistanceTo(targetPos)
    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return 99999 end
    return (playerVeh:getPosition() - targetPos):length()
end

-----------------------------------------------------------
-- UI
-----------------------------------------------------------
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

        if currentState == STATE_OFFER then
            imgui.TextColored(imgui.ImVec4(1, 1, 1, uiAnim.opacity), "New Contract Available")
            imgui.TextColored(imgui.ImVec4(0.7, 0.7, 0.7, uiAnim.opacity), "Location: Italy Quarry")
            imgui.Dummy(imgui.ImVec2(0, 10))
            imgui.TextColored(imgui.ImVec4(0.8, 0.8, 0.8, uiAnim.opacity), "Choose material to load:")
            imgui.Dummy(imgui.ImVec2(0, 8))
            local contentWidth = imgui.GetContentRegionAvailWidth()

            if imgui.Button("LOAD ROCKS", imgui.ImVec2(contentWidth, 40)) then
                jobObjects.materialType = "rocks"
                currentState = STATE_DRIVING_TO_SITE
                local veh = be:getPlayerVehicle(0)
                if veh then wl40ID = veh:getID() end
                markerModule.setPath(Config.WorkSiteLocation)
                Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
                ui_message("Rocks contract accepted. Drive to the work site.", 5, "info")
            end
            imgui.Dummy(imgui.ImVec2(0, 5))
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.2, 0.4, 0.2, uiAnim.opacity))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.3, 0.6, 0.3, uiAnim.opacity))
            if imgui.Button("LOAD MARBLE BLOCKS", imgui.ImVec2(contentWidth, 40)) then
                jobObjects.materialType = "marble"
                currentState = STATE_DRIVING_TO_SITE
                local veh = be:getPlayerVehicle(0)
                if veh then wl40ID = veh:getID() end
                markerModule.setPath(Config.WorkSiteLocation)
                Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
                ui_message("Marble blocks contract accepted. Drive to the work site.", 5, "info")
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
            imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * uiAnim.opacity), ">> TRAVEL TO MARKER <<")
            local dist = getDistanceTo(Config.WorkSiteLocation)
            local progress = 1.0 - math.min(1, dist / 200) 
            imgui.ProgressBar(progress, imgui.ImVec2(-1, 20), string.format("%.0fm", dist))

        elseif currentState == STATE_TRUCK_ARRIVING then
            imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * uiAnim.opacity), ">> TRUCK ARRIVING <<")
            local truckDist = 0
            if jobObjects.truckID then
                local truck = be:getObjectByID(jobObjects.truckID)
                if truck then truckDist = (truck:getPosition() - be:getPlayerVehicle(0):getPosition()):length() end
            end
            local progress = 1.0 - math.min(1, truckDist / 100)
            imgui.Text("ETA: Driving to your location...")
            imgui.ProgressBar(progress, imgui.ImVec2(-1, 20), "")
            imgui.Dummy(imgui.ImVec2(0, 10))
            if imgui.Button("CANCEL", imgui.ImVec2(-1, 30)) then cleanupJob(true, false) end

        elseif currentState == STATE_LOADING then
            imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha * uiAnim.opacity), ">> LOADING IN PROGRESS <<")
            local mass = jobObjects.currentLoadMass or 0
            local percent = math.min(1.0, mass / Config.TargetLoad)
            
            -- Estimated Pay
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
            if imgui.Button("FINISH JOB", imgui.ImVec2(-1, 45)) then finishJobAndDepart() end
            imgui.PopStyleColor(2)
            imgui.Dummy(imgui.ImVec2(0, 5))
            if imgui.Button("CANCEL", imgui.ImVec2(-1, 30)) then cleanupJob(true, false) end
        end
    end
    imgui.End()
    imgui.PopStyleColor(2)
    imgui.PopStyleVar(3)
end

-----------------------------------------------------------
-- MAIN UPDATE
-----------------------------------------------------------
local function onUpdate(dt)
    drawWorkSiteMarker(dt)
    if currentState == STATE_LOADING then jobObjects.currentLoadMass = calculateTruckPayload() end
    drawUI(dt)

    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return end

    if currentState == STATE_IDLE then
        local distToQuarry = getDistanceTo(Config.QuarryZoneCenter)
        if distToQuarry > (Config.QuarryZoneRadius + 20) then jobOfferSuppressed = false end
        if not jobOfferSuppressed then
            if playerVeh:getJBeamFilename() == "wl40" then
                if isItalyMap() and distToQuarry < Config.QuarryZoneRadius then
                    currentState = STATE_OFFER
                    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
                end
            end
        end

    elseif currentState == STATE_OFFER then
        if getDistanceTo(Config.QuarryZoneCenter) > (Config.QuarryZoneRadius + 20) then
            currentState = STATE_IDLE
            jobObjects.materialType = nil
        end

    elseif currentState == STATE_DRIVING_TO_SITE then
        if getDistanceTo(Config.WorkSiteLocation) < Config.WorkSiteTriggerRadius then
            markerModule.setPath(nil)
            spawnAndCallTruck()
            currentState = STATE_TRUCK_ARRIVING
        end

    elseif currentState == STATE_TRUCK_ARRIVING then
        if jobObjects.truckID then
            local truck = be:getObjectByID(jobObjects.truckID)
            if truck then
                local dist = (truck:getPosition() - playerVeh:getPosition()):length()
                if dist < 12 then 
                    parkTruckScript()
                    currentState = STATE_LOADING
                    Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
                end
            end
        end
    end
end

M.onUpdate = onUpdate

return M