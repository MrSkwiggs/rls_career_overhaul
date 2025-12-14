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
    MarbleConfigs = { 
        { config = "big_rails", mass = 38000 },
        { config = "rails",     mass = 19000 }
    },

    MaxRockPiles    = 2,
    RockDespawnTime = 120,
    TargetLoad      = 25000,
    RockMassPerPile = 41000,
    MarbleMassDefault = 8000,

    -- DELIVERY DESTINATIONS
    Destinations = {
        marble = {
            position = vec3(1193.102, -1649.836, 177.371),
            radius = 20,
            name = "Marble Processing Plant",
        },
        rocks = {
            position = vec3(1193.102, -1649.836, 177.371),
            radius = 20,
            name = "Rock Depot",
        }
    },

    ReturnLocation = vec3(612.312, -1767.023, 225.748),
    ReturnRadius = 20,

    -- Truck bed configurations
    TruckBedSettings = {
        dumptruck = {
            offsetBack = 4.0,
            offsetSide = -0.75,
            length = 6.5,
            width = 4,
            floorHeight = 1.0,
            loadHeight = 3.5
        },
        us_semi = {
            offsetBack = 3.0,
            offsetSide = 0,
            length = 6.0,
            width = 2.4,
            floorHeight = 0.3,
            loadHeight = 3.5
        }
    },

    -- CONTRACT SYSTEM
    Contracts = {
        MaxActiveContracts = 6,
        RefreshDays = 3,
        
        Tiers = {
            [1] = {
                name = "Easy",
                tonnageRange = {single = {15, 25}, bulk = {30, 50}},
                basePayRate = {min = 80, max = 100},
                modifierChance = 0.2,
                specialChance = 0.02
            },
            [2] = {
                name = "Standard",
                tonnageRange = {single = {20, 35}, bulk = {60, 100}},
                basePayRate = {min = 100, max = 130},
                modifierChance = 0.4,
                specialChance = 0.05
            },
            [3] = {
                name = "Hard",
                tonnageRange = {single = {30, 45}, bulk = {100, 180}},
                basePayRate = {min = 130, max = 170},
                modifierChance = 0.6,
                specialChance = 0.08
            },
            [4] = {
                name = "Expert",
                tonnageRange = {single = {40, 60}, bulk = {200, 350}},
                basePayRate = {min = 180, max = 250},
                modifierChance = 0.8,
                specialChance = 0.12
            }
        },
        
        Modifiers = {
            time = {
                {name = "Rush Delivery", deadline = 8, bonus = 0.30, weight = 2},
                {name = "Scheduled", deadline = 15, bonus = 0.15, weight = 3},
                {name = "Relaxed", deadline = 25, bonus = 0.05, weight = 2},
            },
            challenge = {
                {name = "Fragile Client", damageLimit = 15, bonus = 0.25, weight = 2},
                {name = "Careful Haul", damageLimit = 25, bonus = 0.15, weight = 3},
                {name = "Precision Parking", parkingPrecision = 3, bonus = 0.20, weight = 2},
            }
        },
        
        AbandonPenalty = 500,
        CrashPenalty = 1000,
    },

    -- ECONOMY SETTINGS
    Economy = {
        BasePay       = 300,   
        PayPerTon     = 100,   
        BaseXP        = 25,    
        XPPerTon      = 5,      
        DeliveryBonus = 200
    }
}

-- DEBUG MODE
local ENABLE_DEBUG = false

-----------------------------------------------------------
-- VARIABLES
-----------------------------------------------------------
local imgui = ui_imgui
local markerModule = require("ge/extensions/core/groundMarkers")

local STATE_IDLE             = 0
local STATE_CONTRACT_SELECT  = 1
local STATE_DRIVING_TO_SITE  = 2
local STATE_TRUCK_ARRIVING   = 3 
local STATE_LOADING          = 4
local STATE_DELIVERING       = 5
local STATE_RETURN_TO_QUARRY = 6
local STATE_AT_QUARRY_DECIDE = 7

local currentState = STATE_IDLE
local wl40ID = nil

local jobObjects = {
    truckID            = nil,
    currentLoadMass    = 0,
    materialType       = nil,
    totalDeliveredMass = 0,
    tripCount          = 0
}

local rockPileQueue = {} 
local uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
local jobOfferSuppressed = false

local markerAnim = {
    time          = 0,
    pulseScale    = 1.0,
    rotationAngle = 0,
    beamHeight    = 0,
    ringExpand    = 0
}

-- CONTRACT SYSTEM
local ContractSystem = {
    availableContracts = {},
    activeContract = nil,
    lastRefreshDay = -999,
    contractProgress = {
        deliveredTons = 0,
        totalPaidSoFar = 0,
        startTime = 0,
        deliveryCount = 0
    }
}

-- PLAYER DATA
local PlayerData = {
    level = 1,
    contractsCompleted = 0,
    contractsFailed = 0
}

-----------------------------------------------------------
-- HELPERS
-----------------------------------------------------------
local function lerp(a, b, t) 
    return a + (b - a) * t 
end

local function getDistanceTo(targetPos)
    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return 99999 end
    return (playerVeh:getPosition() - targetPos):length()
end

local function isItalyMap()
    local level = getCurrentLevelIdentifier()
    return level and (string.find(level:lower(), "italy") ~= nil)
end

local function despawnMaterials()
    for _, entry in ipairs(rockPileQueue) do
        if entry.id then
            local obj = be:getObjectByID(entry.id)
            if obj then obj:delete() end
        end
    end
    rockPileQueue = {}
end

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
-- CONTRACT GENERATION
-----------------------------------------------------------
local function pickTierForPlayer()
    local level = PlayerData.level
    local roll = math.random()
    
    if level <= 3 then
        return roll < 0.7 and 1 or 2
    elseif level <= 7 then
        if roll < 0.15 then return 1
        elseif roll < 0.65 then return 2
        else return 3 end
    elseif level <= 12 then
        if roll < 0.20 then return 2
        elseif roll < 0.65 then return 3
        else return 4 end
    else
        if roll < 0.10 then return 2
        elseif roll < 0.45 then return 3
        else return 4 end
    end
end

local function weightedRandomChoice(items)
    local totalWeight = 0
    for _, item in ipairs(items) do
        totalWeight = totalWeight + (item.weight or 1)
    end
    
    local roll = math.random() * totalWeight
    local current = 0
    
    for _, item in ipairs(items) do
        current = current + (item.weight or 1)
        if roll <= current then
            return item
        end
    end
    
    return items[1]
end

local function generateContract(forceTier)
    local tier = forceTier or pickTierForPlayer()
    local tierData = Config.Contracts.Tiers[tier]
    
    local isSpecial = math.random() < tierData.specialChance
    local isBulk = math.random() < 0.4
    
    local materials = {"rocks", "marble"}
    local material = materials[math.random(#materials)]
    
    local tonnageRange = isBulk and tierData.tonnageRange.bulk or tierData.tonnageRange.single
    local requiredTons = math.random(tonnageRange[1], tonnageRange[2])
    
    if isSpecial then
        if math.random() < 0.5 then
            requiredTons = math.random(10, 20)
            tierData = Config.Contracts.Tiers[4]
        else
            requiredTons = math.random(300, 500)
        end
    end
    
    local payRate = math.random(tierData.basePayRate.min, tierData.basePayRate.max)
    
    local modifiers = {}
    local bonusMultiplier = 1.0
    
    if math.random() < tierData.modifierChance then
        local timeMod = weightedRandomChoice(Config.Contracts.Modifiers.time)
        table.insert(modifiers, timeMod)
        bonusMultiplier = bonusMultiplier + timeMod.bonus
    end
    
    if math.random() < tierData.modifierChance * 0.6 then
        local challengeMod = weightedRandomChoice(Config.Contracts.Modifiers.challenge)
        table.insert(modifiers, challengeMod)
        bonusMultiplier = bonusMultiplier + challengeMod.bonus
    end
    
    if isSpecial then
        bonusMultiplier = bonusMultiplier + math.random(50, 150) / 100
    end
    
    local totalPayout = math.floor(requiredTons * payRate * bonusMultiplier)
    
    local paymentType = isBulk and (math.random() < 0.6 and "progressive" or "completion_only") or "completion_only"
    
    local contractNames = {
        "Standard Haul", "Local Delivery", "Construction Supply",
        "Industrial Order", "Building Materials", "Infrastructure Project",
        "Development Contract", "Municipal Supply"
    }
    
    local name = contractNames[math.random(#contractNames)]
    if isBulk then name = "Bulk " .. name end
    
    local contract = {
        id = os.time() + math.random(1000, 9999),
        name = name,
        tier = tier,
        material = material,
        requiredTons = requiredTons,
        isBulk = isBulk,
        payRate = payRate,
        totalPayout = totalPayout,
        paymentType = paymentType,
        modifiers = modifiers,
        bonusMultiplier = bonusMultiplier,
        isSpecial = isSpecial,
        destination = Config.Destinations[material],
        difficulty = tier,
        estimatedTrips = math.ceil(requiredTons / (Config.TargetLoad / 1000))
    }
    
    return contract
end

local function generateContracts()
    ContractSystem.availableContracts = {}
    
    local tierDistribution = {
        pickTierForPlayer(),
        pickTierForPlayer(),
        pickTierForPlayer(),
        math.random(1, 2),
        math.random(2, 3),
        math.random(3, 4)
    }
    
    for i = 1, Config.Contracts.MaxActiveContracts do
        local contract = generateContract(tierDistribution[i])
        table.insert(ContractSystem.availableContracts, contract)
    end
    
    table.sort(ContractSystem.availableContracts, function(a, b)
        if a.tier == b.tier then
            return a.totalPayout < b.totalPayout
        end
        return a.tier < b.tier
    end)
end

local function shouldRefreshContracts()
    local currentDay = math.floor(os.time() / 86400)
    
    if currentDay - ContractSystem.lastRefreshDay >= Config.Contracts.RefreshDays then
        ContractSystem.lastRefreshDay = currentDay
        return true
    end
    
    return false
end

-----------------------------------------------------------
-- MARKER LOGIC
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

local function drawDestinationMarker(dt)
    if currentState ~= STATE_DELIVERING and currentState ~= STATE_RETURN_TO_QUARRY then return end
    
    local targetPos = nil
    local markerName = ""
    local color = ColorF(0.2, 0.6, 1.0, 0.85)
    
    if currentState == STATE_DELIVERING then
        if not ContractSystem.activeContract then return end
        local dest = ContractSystem.activeContract.destination
        if not dest or not dest.position then return end
        targetPos = dest.position
        markerName = dest.name
        color = ColorF(0.2, 0.6, 1.0, 0.85)
    elseif currentState == STATE_RETURN_TO_QUARRY then
        targetPos = Config.ReturnLocation
        markerName = "Quarry"
        color = ColorF(1.0, 0.6, 0.2, 0.85)
    end
    
    if not targetPos then return end
    
    markerAnim.time = markerAnim.time + dt
    local pulseSpeed = 3.0
    markerAnim.pulseScale = 1.0 + math.sin(markerAnim.time * pulseSpeed) * 0.15
    
    local basePos = targetPos
    local colorFaded = ColorF(color.r, color.g, color.b, 0.3)
    
    local beamHeight = 15.0
    local beamTop = basePos + vec3(0, 0, beamHeight)
    local beamRadius = 0.6 * markerAnim.pulseScale
    
    debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
    debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.3, colorFaded)
    
    local sphereRadius = 1.2 * markerAnim.pulseScale
    debugDrawer:drawSphere(beamTop, sphereRadius, color)
    
    local playerVeh = be:getPlayerVehicle(0)
    if playerVeh then
        local playerDist = (playerVeh:getPosition() - basePos):length()
        local textPos = beamTop + vec3(0, 0, 2.5)
        debugDrawer:drawTextAdvanced(textPos, String(markerName), ColorF(1, 1, 1, 0.95), true, false, ColorI(0, 0, 0, 180))
        
        local infoPos = beamTop + vec3(0, 0, 1.5)
        debugDrawer:drawTextAdvanced(infoPos, String(string.format("%.0fm", playerDist)), ColorF(0.8, 0.8, 0.8, 0.9), true, false, ColorI(0, 0, 0, 150))
    end
end

-----------------------------------------------------------
-- TRUCK BED DETECTION
-----------------------------------------------------------
local function getTruckBedData(obj)
    if not obj then return nil end
    
    local pos = obj:getPosition()
    local dir = obj:getDirectionVector():normalized()
    local up = obj:getDirectionVectorUp():normalized()
    local right = dir:cross(up):normalized()
    up = right:cross(dir):normalized()
    
    local modelName = obj:getJBeamFilename()
    local bedSettings = Config.TruckBedSettings[modelName] or Config.TruckBedSettings.dumptruck
    
    local offsetBack = bedSettings.offsetBack or 0
    local offsetSide = bedSettings.offsetSide or 0
    
    local bedCenterHeight = bedSettings.floorHeight + (bedSettings.loadHeight / 2)
    local bedCenter = pos 
                    - (dir * offsetBack)
                    + (right * offsetSide)
                    + (up * bedCenterHeight)
    
    return {
        center = bedCenter,
        axisX = right,
        axisY = dir,
        axisZ = up,
        halfWidth = bedSettings.width / 2,
        halfLength = bedSettings.length / 2,
        halfHeight = bedSettings.loadHeight / 2,
        floorHeight = bedSettings.floorHeight,
        settings = bedSettings
    }
end

local function isPointInTruckBed(point, bedData)
    if not bedData then return false end
    
    local diff = point - bedData.center
    local localX = diff:dot(bedData.axisX)
    local localY = diff:dot(bedData.axisY)
    local localZ = diff:dot(bedData.axisZ)
    
    return (math.abs(localX) <= bedData.halfWidth and
            math.abs(localY) <= bedData.halfLength and
            math.abs(localZ) <= bedData.halfHeight)
end

local function drawTruckBedDebug(bedData)
    if not ENABLE_DEBUG or not bedData then return end
    
    local c = bedData.center
    local hw, hl, hh = bedData.halfWidth, bedData.halfLength, bedData.halfHeight
    local rx, ry, rz = bedData.axisX, bedData.axisY, bedData.axisZ
    
    local corners = {
        c - rx*hw - ry*hl - rz*hh, c + rx*hw - ry*hl - rz*hh,
        c + rx*hw + ry*hl - rz*hh, c - rx*hw + ry*hl - rz*hh,
        c - rx*hw - ry*hl + rz*hh, c + rx*hw - ry*hl + rz*hh,
        c + rx*hw + ry*hl + rz*hh, c - rx*hw + ry*hl + rz*hh,
    }
    
    local color = ColorF(0, 1, 0, 0.5)
    
    debugDrawer:drawLine(corners[1], corners[2], color)
    debugDrawer:drawLine(corners[2], corners[3], color)
    debugDrawer:drawLine(corners[3], corners[4], color)
    debugDrawer:drawLine(corners[4], corners[1], color)
    debugDrawer:drawLine(corners[5], corners[6], color)
    debugDrawer:drawLine(corners[6], corners[7], color)
    debugDrawer:drawLine(corners[7], corners[8], color)
    debugDrawer:drawLine(corners[8], corners[5], color)
    
    for i = 1, 4 do
        debugDrawer:drawLine(corners[i], corners[i+4], color)
    end
    
    debugDrawer:drawSphere(c, 0.2, ColorF(1, 1, 0, 0.8))
end

local function calculateTruckPayload()
    if not jobObjects.truckID then return 0 end
    local truck = be:getObjectByID(jobObjects.truckID)
    if not truck then return 0 end
    
    local bedData = getTruckBedData(truck)
    if not bedData then return 0 end
    
    drawTruckBedDebug(bedData)
    
    local defaultMass = Config.RockMassPerPile
    if jobObjects.materialType == "marble" then
        defaultMass = Config.MarbleMassDefault
    end
    
    local totalMass = 0
    for _, rockEntry in ipairs(rockPileQueue) do
        local obj = be:getObjectByID(rockEntry.id)
        if obj then
            local entryMass = rockEntry.mass or defaultMass
            
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
                
                if isPointInTruckBed(worldPoint, bedData) then
                    nodesInside = nodesInside + 1
                    if ENABLE_DEBUG then
                        debugDrawer:drawSphere(worldPoint, 0.05, ColorF(0, 1, 0, 0.5))
                    end
                elseif ENABLE_DEBUG then
                    debugDrawer:drawSphere(worldPoint, 0.03, ColorF(1, 0, 0, 0.3))
                end
            end
            
            if nodesChecked > 0 then
                local loadRatio = nodesInside / nodesChecked
                totalMass = totalMass + (entryMass * loadRatio)
                
                if ENABLE_DEBUG then
                    debugDrawer:drawTextAdvanced(
                        objPos + vec3(0, 0, 2), 
                        String(string.format("%.0f kg (%.0f%%)", entryMass * loadRatio, loadRatio * 100)),
                        ColorF(1, 1, 0, 1), true, false, ColorI(0, 0, 0, 180)
                    )
                end
            end
        end
    end
    return totalMass
end

-----------------------------------------------------------
-- MATERIAL MANAGEMENT
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

local function spawnJobMaterials()
    local materialType = jobObjects.materialType or "rocks"
    local basePos = Config.WorkSiteLocation + vec3(0,0,0.2)
    
    if materialType == "rocks" then
        local rocks = core_vehicles.spawnNewVehicle(Config.RockProp, { 
            config = "default", pos = basePos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false 
        })
        if rocks then 
            table.insert(rockPileQueue, { id = rocks:getID(), mass = Config.RockMassPerPile }) 
            manageRockCapacity() 
        end
        
    elseif materialType == "marble" then
        local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0) }
        for idx, marbleData in ipairs(Config.MarbleConfigs) do
            local pos = basePos + (offsets[idx] or vec3(0,0,0))
            local block = core_vehicles.spawnNewVehicle(Config.MarbleProp, { 
                config = marbleData.config, 
                pos = pos, 
                rot = quatFromDir(vec3(0,1,0)), 
                autoEnterVehicle = false 
            })
            if block then
                local mass = marbleData.mass or Config.MarbleMassDefault
                table.insert(rockPileQueue, { id = block:getID(), mass = mass })
                manageRockCapacity()
            end
        end
    end
end

-----------------------------------------------------------
-- TRUCK MANAGEMENT
-----------------------------------------------------------
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
            if not isPositionInPlayerView(optimalPos, playerPos) then 
                teleportTruckToPosition(truckId, optimalPos, optimalDir, playerPos) 
                return 
            end
            if not bestPosition or targetDistance > bestDistance then
                bestPosition, bestDirection, bestDistance = optimalPos, optimalDir, targetDistance
            end
        end
    end
    if bestPosition then 
        teleportTruckToPosition(truckId, bestPosition, bestDirection, playerPos) 
    else 
        finalizeTruckPosition(truckId, playerPos) 
    end
end

local function spawnAndCallTruck()
    spawnJobMaterials()
    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return end
    local playerPos = playerVeh:getPosition()
    local spawnPos, roadDirection = findBasicSpawnPosition(playerPos, 50)
    if not spawnPos then 
        spawnPos = playerPos + vec3(50,0,0) 
        spawnPos.z = core_terrain.getTerrainHeight(spawnPos) 
    end
    local direction = roadDirection or (playerPos - spawnPos):normalized()
    direction.z = 0
    local pos, rotation = calculateTaxiTransform(spawnPos, direction)

    local materialType = jobObjects.materialType or "rocks"
    local truckModel = (materialType == "marble") and Config.MarbleTruckModel or Config.RockTruckModel
    local truckConfig = (materialType == "marble") and Config.MarbleTruckConfig or Config.RockTruckConfig

    local truck = core_vehicles.spawnNewVehicle(truckModel, { 
        pos = pos, rot = rotation, config = truckConfig, autoEnterVehicle = false 
    })
    if not truck then return end
    jobObjects.truckID = truck:getID()
    truck:queueLuaCommand('extensions.load("driver") ai.setMode("manual") electrics.values.lightbar = 1')
    truck:setMeshAlpha(0, '') 
    ui_message("Truck dispatched to your location...", 5, "info")
    core_jobsystem.create(function(job) job.sleep(0.5) positionTruckOnPath(jobObjects.truckID, playerPos) end)
end

local function parkTruckScript()
    if not jobObjects.truckID then return end
    local truck = be:getObjectByID(jobObjects.truckID)
    if not truck then return end
    truck:queueLuaCommand("ai.setMode('stop') controller.mainController.setHandbrake(1)")
    ui_message("Truck Arrived! Start Loading.", 5, "success")
end

-----------------------------------------------------------
-- CONTRACT MANAGEMENT
-----------------------------------------------------------
local function acceptContract(contractIndex)
    local contract = ContractSystem.availableContracts[contractIndex]
    if not contract then return end
    
    ContractSystem.activeContract = contract
    ContractSystem.contractProgress = {
        deliveredTons = 0,
        totalPaidSoFar = 0,
        startTime = os.clock(),
        deliveryCount = 0
    }
    
    jobObjects.materialType = contract.material
    currentState = STATE_DRIVING_TO_SITE
    
    local veh = be:getPlayerVehicle(0)
    if veh then wl40ID = veh:getID() end
    markerModule.setPath(Config.WorkSiteLocation)
    
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
    ui_message(string.format("Contract accepted: %s", contract.name), 5, "info")
end

local function abandonContract()
    if not ContractSystem.activeContract then return end
    
    ui_message(string.format("Contract abandoned! Penalty: $%d", Config.Contracts.AbandonPenalty), 6, "warning")
    
    local career = extensions.career_career
    if career and career.isActive() then
        local paymentModule = extensions.career_modules_payment
        if paymentModule then
            paymentModule.pay(-Config.Contracts.AbandonPenalty, {label = "Contract Abandonment"})
        end
    end
    
    PlayerData.contractsFailed = PlayerData.contractsFailed + 1
    
    ContractSystem.activeContract = nil
    ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}
    
    cleanupJob(true, false)
    jobObjects.totalDeliveredMass = 0
    jobObjects.tripCount = 0
end

local function checkContractCompletion()
    if not ContractSystem.activeContract then return false end
    return ContractSystem.contractProgress.deliveredTons >= ContractSystem.activeContract.requiredTons
end

local function completeContract()
    if not ContractSystem.activeContract then return end
    
    local contract = ContractSystem.activeContract
    local progress = ContractSystem.contractProgress
    
    local totalPay = contract.totalPayout
    if contract.paymentType == "progressive" then
        totalPay = totalPay - progress.totalPaidSoFar
    end
    
    local career = extensions.career_career
    if career and career.isActive() then
        local paymentModule = extensions.career_modules_payment
        if paymentModule then
            local xpReward = math.floor(contract.requiredTons * 10)
            local rewards = {
                money = { amount = totalPay, canBeNegative = false },
                labor = { amount = xpReward, canBeNegative = false }
            }
            paymentModule.reward(rewards, {
                label = string.format("Contract: %s", contract.name),
                tags = {"gameplay", "mission", "reward"}
            })
            
            Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Buy_01')
            ui_message(string.format("CONTRACT COMPLETE! Earned $%d", totalPay), 8, "success")
        end
    else
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
        ui_message(string.format("SANDBOX: Contract payout: $%d", totalPay), 6, "success")
    end
    
    PlayerData.contractsCompleted = PlayerData.contractsCompleted + 1
    PlayerData.level = PlayerData.level + 1
    
    ContractSystem.activeContract = nil
    ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}
    
    cleanupJob(true, false)
    jobObjects.totalDeliveredMass = 0
    jobObjects.tripCount = 0
end

-----------------------------------------------------------
-- JOB CLEANUP
-----------------------------------------------------------
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
        end)
    else
        despawnMaterials()
    end
    
    if deleteTruck and jobObjects.truckID then
        local obj = be:getObjectByID(jobObjects.truckID)
        if obj then obj:delete() end
        jobObjects.truckID = nil
    end
    
    jobObjects.currentLoadMass = 0
    jobObjects.materialType = nil
    markerModule.setPath(nil)
    currentState = STATE_IDLE
    wl40ID = nil
    markerAnim.beamHeight = 0
    markerAnim.ringExpand = 0
end

-----------------------------------------------------------
-- DELIVERY LOGIC
-----------------------------------------------------------
local function startDelivery()
    if not ContractSystem.activeContract then return end
    
    currentState = STATE_DELIVERING
    local dest = ContractSystem.activeContract.destination
    if dest and dest.position then
        markerModule.setPath(dest.position)
    end
    
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
    ui_message("Drive to the destination!", 6, "info")
end

local function completeDelivery()
    if not ContractSystem.activeContract then return end
    
    local contract = ContractSystem.activeContract
    local deliveredMass = jobObjects.currentLoadMass or 0
    local tons = deliveredMass / 1000
    
    ContractSystem.contractProgress.deliveredTons = ContractSystem.contractProgress.deliveredTons + tons
    ContractSystem.contractProgress.deliveryCount = ContractSystem.contractProgress.deliveryCount + 1
    
    local payment = 0
    if contract.paymentType == "progressive" then
        payment = math.floor(tons * contract.payRate)
        ContractSystem.contractProgress.totalPaidSoFar = ContractSystem.contractProgress.totalPaidSoFar + payment
        
        local career = extensions.career_career
        if career and career.isActive() then
            local paymentModule = extensions.career_modules_payment
            if paymentModule then
                paymentModule.pay(payment, {label = "Delivery Payment"})
            end
        end
        ui_message(string.format("Delivery payment: $%d", payment), 3, "success")
    end
    
    despawnMaterials()
    jobObjects.currentLoadMass = 0
    markerModule.setPath(nil)
    
    if checkContractCompletion() then
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
        ui_message("Contract complete! Return to quarry to finalize.", 6, "success")
    else
        local remaining = contract.requiredTons - ContractSystem.contractProgress.deliveredTons
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
        ui_message(string.format("Delivery #%d complete! %.1f tons remaining.", 
            ContractSystem.contractProgress.deliveryCount, remaining), 6, "success")
    end
    
    currentState = STATE_RETURN_TO_QUARRY
    markerModule.setPath(Config.ReturnLocation)
end

local function loadMore()
    spawnJobMaterials()
    currentState = STATE_LOADING
    markerModule.setPath(nil)
    
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
    ui_message("New materials ready! Load them up.", 5, "info")
end

local function finishJobAndDepart()
    startDelivery()
end

-----------------------------------------------------------
-- UI
-----------------------------------------------------------
local function drawUI(dt)
    if not imgui then return end

    -- Fade UI in/out depending on state
    if currentState ~= STATE_IDLE then
        uiAnim.targetOpacity = 1.0
    else
        uiAnim.targetOpacity = 0.0
    end

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

    if imgui.Begin("##WL40System", nil,
        imgui.WindowFlags_NoTitleBar +
        imgui.WindowFlags_AlwaysAutoResize +
        imgui.WindowFlags_NoCollapse) then

        imgui.SetWindowFontScale(1.5)
        imgui.TextColored(imgui.ImVec4(1, 0.75, 0, uiAnim.opacity), "LOGISTICS JOB SYSTEM")
        imgui.SetWindowFontScale(1.0)
        imgui.Separator()
        imgui.Dummy(imgui.ImVec2(0, 10))

        local contract = ContractSystem.activeContract

        ---------------------------------------------------
        -- CONTRACT SELECTION
        ---------------------------------------------------
        if currentState == STATE_CONTRACT_SELECT then
            imgui.TextColored(imgui.ImVec4(1, 1, 1, uiAnim.opacity), "Available Contracts")
            imgui.TextColored(
                imgui.ImVec4(0.7, 0.7, 0.7, uiAnim.opacity),
                string.format("Player Level: %d | Completed: %d",
                    PlayerData.level, PlayerData.contractsCompleted)
            )
            imgui.Dummy(imgui.ImVec2(0, 10))
            imgui.Separator()
            imgui.Dummy(imgui.ImVec2(0, 10))

            local tierColors = {
                imgui.ImVec4(0.5, 0.8, 0.5, 1),   -- Tier 1 - Green
                imgui.ImVec4(0.5, 0.7, 1.0, 1),   -- Tier 2 - Blue
                imgui.ImVec4(1.0, 0.7, 0.4, 1),   -- Tier 3 - Orange
                imgui.ImVec4(1.0, 0.4, 0.4, 1)    -- Tier 4 - Red
            }

            local contentWidth = imgui.GetContentRegionAvailWidth()

            for i, c in ipairs(ContractSystem.availableContracts) do
                -- Big clickable row
                imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.15, 0.15, 0.2, 0.9))
                imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.25, 0.25, 0.35, 1))
                imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.3, 0.3, 0.4, 1))

                if imgui.Button(string.format("[%d] %s##contract%d", i, c.name, i), imgui.ImVec2(contentWidth, 0)) then
                    acceptContract(i)
                end

                imgui.PopStyleColor(3)

                -- Details under the button
                imgui.Indent(20)

                local tierColor = tierColors[c.tier] or imgui.ImVec4(1, 1, 1, 1)
                imgui.TextColored(tierColor, string.format("Tier %d | %s", c.tier, c.material:upper()))
                imgui.SameLine()
                imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("  $%d", c.totalPayout))

                imgui.Text(string.format("• %d tons total (%d-%d trips)",
                    c.requiredTons, c.estimatedTrips, c.estimatedTrips + 1))

                imgui.Text(string.format("• Payment: %s",
                    c.paymentType == "progressive" and "Progressive (per delivery)" or "On completion only"))

                -- Modifiers (time/damage/etc)
                if #c.modifiers > 0 then
                    local modText = "• Modifiers: "
                    for j, mod in ipairs(c.modifiers) do
                        modText = modText .. mod.name
                        if j < #c.modifiers then
                            modText = modText .. ", "
                        end
                    end
                    imgui.TextColored(imgui.ImVec4(1, 1, 0.5, 1), modText)
                end

                -- Difficulty stars
                local diffStars = string.rep("★", c.tier) .. string.rep("☆", 4 - c.tier)
                imgui.TextColored(tierColor, diffStars)

                imgui.Unindent(20)
                imgui.Dummy(imgui.ImVec2(0, 10))

                if i < #ContractSystem.availableContracts then
                    imgui.Separator()
                    imgui.Dummy(imgui.ImVec2(0, 5))
                end
            end

            imgui.Dummy(imgui.ImVec2(0, 15))
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, uiAnim.opacity))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, uiAnim.opacity))
            if imgui.Button("DECLINE ALL", imgui.ImVec2(-1, 35)) then
                currentState = STATE_IDLE
                jobOfferSuppressed = true
            end
            imgui.PopStyleColor(2)

        ---------------------------------------------------
        -- DRIVING TO SITE
        ---------------------------------------------------
        elseif currentState == STATE_DRIVING_TO_SITE then
            imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * uiAnim.opacity), ">> TRAVEL TO WORK SITE <<")
            if contract then
                imgui.Text(string.format("Contract: %s", contract.name))
                imgui.Text(string.format("Material: %s | Target: %d tons",
                    contract.material, contract.requiredTons))
            end
            imgui.Dummy(imgui.ImVec2(0, 5))
            local dist = getDistanceTo(Config.WorkSiteLocation)
            imgui.ProgressBar(1.0 - math.min(1, dist / 200), imgui.ImVec2(-1, 20), string.format("%.0fm", dist))

        ---------------------------------------------------
        -- TRUCK ARRIVING
        ---------------------------------------------------
        elseif currentState == STATE_TRUCK_ARRIVING then
            imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * uiAnim.opacity), ">> TRUCK ARRIVING <<")
            local truckDist = 0
            if jobObjects.truckID then
                local truck = be:getObjectByID(jobObjects.truckID)
                local playerVeh = be:getPlayerVehicle(0)
                if truck and playerVeh then
                    truckDist = (truck:getPosition() - playerVeh:getPosition()):length()
                end
            end
            imgui.Text("ETA: Driving to your location...")
            imgui.ProgressBar(1.0 - math.min(1, truckDist / 100), imgui.ImVec2(-1, 20), "")
            imgui.Dummy(imgui.ImVec2(0, 10))
            if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
                abandonContract()
            end

        ---------------------------------------------------
        -- LOADING
        ---------------------------------------------------
        elseif currentState == STATE_LOADING then
            imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha * uiAnim.opacity), ">> LOADING <<")

            if contract then
                local p = ContractSystem.contractProgress
                imgui.Text(string.format("Contract: %s", contract.name))
                imgui.Text(string.format("Progress: %.1f / %.1f tons",
                    p.deliveredTons, contract.requiredTons))
                imgui.Separator()
            end

            local mass = jobObjects.currentLoadMass or 0
            local percent = math.min(1.0, mass / Config.TargetLoad)

            imgui.Text(string.format("Current Load: %.0f / %.0f kg", mass, Config.TargetLoad))

            local barColor = imgui.ImVec4(1, 1, 0, 1)
            if percent > 0.8 then barColor = imgui.ImVec4(0, 1, 0, 1) end
            imgui.PushStyleColor2(imgui.Col_PlotHistogram, barColor)
            imgui.ProgressBar(percent, imgui.ImVec2(-1, 30), string.format("%.0f%%", percent * 100))
            imgui.PopStyleColor(1)

            imgui.Dummy(imgui.ImVec2(0, 20))
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.4, 0, uiAnim.opacity))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.6, 0, uiAnim.opacity))
            if imgui.Button("START DELIVERY", imgui.ImVec2(-1, 45)) then
                finishJobAndDepart()
            end
            imgui.PopStyleColor(2)

            imgui.Dummy(imgui.ImVec2(0, 5))
            if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
                abandonContract()
            end

        ---------------------------------------------------
        -- DELIVERING
        ---------------------------------------------------
        elseif currentState == STATE_DELIVERING then
            imgui.TextColored(imgui.ImVec4(0.2, 0.6, 1.0, pulseAlpha * uiAnim.opacity), ">> DELIVERING <<")

            if contract then
                local dest = contract.destination
                imgui.Text(string.format("Contract: %s", contract.name))
                if dest then
                    imgui.Text(string.format("Destination: %s", dest.name))
                    local playerDist = 9999
                    local playerVeh = be:getPlayerVehicle(0)
                    if playerVeh then
                        playerDist = (playerVeh:getPosition() - dest.position):length()
                    end
                    imgui.ProgressBar(1.0 - math.min(1, playerDist / 500),
                        imgui.ImVec2(-1, 20), string.format("%.0fm", playerDist))

                    if playerDist < dest.radius then
                        imgui.Dummy(imgui.ImVec2(0, 10))
                        imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "ARRIVED AT DESTINATION!")
                        imgui.Dummy(imgui.ImVec2(0, 5))
                        imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.5, 0, uiAnim.opacity))
                        imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.7, 0, uiAnim.opacity))
                        if imgui.Button("COMPLETE DELIVERY", imgui.ImVec2(-1, 45)) then
                            completeDelivery()
                        end
                        imgui.PopStyleColor(2)
                    end
                end
            end

            imgui.Dummy(imgui.ImVec2(0, 10))
            if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
                abandonContract()
            end

        ---------------------------------------------------
        -- RETURN TO QUARRY
        ---------------------------------------------------
        elseif currentState == STATE_RETURN_TO_QUARRY then
            imgui.TextColored(imgui.ImVec4(1.0, 0.6, 0.2, pulseAlpha * uiAnim.opacity), ">> RETURN TO QUARRY <<")

            if contract then
                local p = ContractSystem.contractProgress
                imgui.Text(string.format("Contract: %s", contract.name))
                imgui.Text(string.format("Delivered: %.1f / %.1f tons",
                    p.deliveredTons, contract.requiredTons))
                if contract.paymentType == "progressive" then
                    imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1),
                        string.format("Earned so far: $%d", p.totalPaidSoFar))
                end
            end

            imgui.Dummy(imgui.ImVec2(0, 5))
            local playerDist = getDistanceTo(Config.ReturnLocation)
            imgui.ProgressBar(1.0 - math.min(1, playerDist / 500),
                imgui.ImVec2(-1, 20), string.format("%.0fm", playerDist))

        ---------------------------------------------------
        -- AT QUARRY DECIDE
        ---------------------------------------------------
        elseif currentState == STATE_AT_QUARRY_DECIDE then
            imgui.TextColored(imgui.ImVec4(0.2, 1.0, 0.4, pulseAlpha * uiAnim.opacity), ">> AT QUARRY <<")
            imgui.Dummy(imgui.ImVec2(0, 10))

            if contract then
                local p = ContractSystem.contractProgress

                imgui.Text(string.format("Contract: %s", contract.name))
                imgui.Separator()
                imgui.Dummy(imgui.ImVec2(0, 5))

                local pct = (p.deliveredTons / contract.requiredTons)
                imgui.Text(string.format("Progress: %.1f / %.1f tons (%.0f%%)",
                    p.deliveredTons, contract.requiredTons, pct * 100))

                if contract.paymentType == "progressive" then
                    imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1),
                        string.format("Already paid: $%d", p.totalPaidSoFar))
                end

                imgui.Dummy(imgui.ImVec2(0, 15))

                local completed = checkContractCompletion()
                if completed then
                    imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "CONTRACT COMPLETE!")
                    imgui.Dummy(imgui.ImVec2(0, 10))
                    if imgui.Button("FINALIZE CONTRACT", imgui.ImVec2(-1, 45)) then
                        completeContract()
                    end
                else
                    imgui.Text("What would you like to do?")
                    imgui.Dummy(imgui.ImVec2(0, 10))

                    if imgui.Button("LOAD MORE", imgui.ImVec2(-1, 45)) then
                        loadMore()
                    end

                    imgui.Dummy(imgui.ImVec2(0, 8))

                    if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
                        abandonContract()
                    end
                end
            else
                imgui.Text("No active contract.")
            end
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
    drawDestinationMarker(dt)
    
    if currentState == STATE_LOADING then 
        jobObjects.currentLoadMass = calculateTruckPayload() 
    end
    drawUI(dt)

    local playerVeh = be:getPlayerVehicle(0)
    if not playerVeh then return end

    if currentState == STATE_IDLE then
        local distToQuarry = getDistanceTo(Config.QuarryZoneCenter)
        if distToQuarry > (Config.QuarryZoneRadius + 20) then jobOfferSuppressed = false end
        if not jobOfferSuppressed then
            if playerVeh:getJBeamFilename() == "wl40" then
                if isItalyMap() and distToQuarry < Config.QuarryZoneRadius then
                    if shouldRefreshContracts() or #ContractSystem.availableContracts == 0 then
                        generateContracts()
                    end
                    currentState = STATE_CONTRACT_SELECT
                    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
                end
            end
        end

    elseif currentState == STATE_CONTRACT_SELECT then
        if getDistanceTo(Config.QuarryZoneCenter) > (Config.QuarryZoneRadius + 20) then
            currentState = STATE_IDLE
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
    
    elseif currentState == STATE_DELIVERING then
        if jobObjects.truckID then
            local truck = be:getObjectByID(jobObjects.truckID)
            if not truck then
                abandonContract()
                ui_message("Truck lost! Contract failed.", 5, "error")
            end
        end
    
    elseif currentState == STATE_RETURN_TO_QUARRY then
        local distToQuarry = getDistanceTo(Config.ReturnLocation)
        if distToQuarry < Config.ReturnRadius then
            currentState = STATE_AT_QUARRY_DECIDE
            markerModule.setPath(nil)
            Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
            ui_message("Back at quarry!", 5, "info")
        end
        
        if jobObjects.truckID then
            local truck = be:getObjectByID(jobObjects.truckID)
            if not truck then
                abandonContract()
                ui_message("Truck destroyed! Contract failed.", 5, "warning")
            end
        end
    
    elseif currentState == STATE_AT_QUARRY_DECIDE then
        local distToQuarry = getDistanceTo(Config.ReturnLocation)
        if distToQuarry > (Config.ReturnRadius + 50) then
            abandonContract()
            ui_message("Left quarry area. Contract abandoned.", 4, "info")
        end
    end
end

local function onExtensionLoaded()
    log('I', 'WL40', "Contract System Loaded Successfully!")
end

M.onUpdate = onUpdate
M.onExtensionLoaded = onExtensionLoaded

return M