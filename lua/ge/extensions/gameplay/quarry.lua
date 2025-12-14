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
  MarbleConfigs = {
    { config = "big_rails", mass = 38000 },
    { config = "rails", mass = 19000 }
  },
  MarbleMassDefault = 8000,

  MaxRockPiles    = 2,
  RockDespawnTime = 120,
  TargetLoad      = 25000,
  RockMassPerPile = 41000,

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

  Economy = {
    BasePay   = 300,
    PayPerTon = 100,
    BaseXP    = 25,
    XPPerTon  = 5
  },

  Contracts = {
    MaxActiveContracts = 6,
    RefreshDays = 3,

    Tiers = {
      [1] = { name = "Easy",    tonnageRange = { single = {15, 25}, bulk = {30, 50} },   basePayRate = { min = 80,  max = 100 }, modifierChance = 0.2, specialChance = 0.02 },
      [2] = { name = "Standard",tonnageRange = { single = {20, 35}, bulk = {60, 100} },  basePayRate = { min = 100, max = 130 }, modifierChance = 0.4, specialChance = 0.05 },
      [3] = { name = "Hard",    tonnageRange = { single = {30, 45}, bulk = {100, 180} }, basePayRate = { min = 130, max = 170 }, modifierChance = 0.6, specialChance = 0.08 },
      [4] = { name = "Expert",  tonnageRange = { single = {40, 60}, bulk = {200, 350} }, basePayRate = { min = 180, max = 250 }, modifierChance = 0.8, specialChance = 0.12 },
    },

    Modifiers = {
      time = {
        {name = "Rush Delivery", deadline = 8,  bonus = 0.30, weight = 2},
        {name = "Scheduled",     deadline = 15, bonus = 0.15, weight = 3},
        {name = "Relaxed",       deadline = 25, bonus = 0.05, weight = 2},
      },
      challenge = {
        {name = "Fragile Client",     damageLimit = 15, parkingPrecision = 3, bonus = 0.25, weight = 2},
        {name = "Careful Haul",       damageLimit = 25, parkingPrecision = 3, bonus = 0.15, weight = 3},
        {name = "Precision Parking",  damageLimit = 25, parkingPrecision = 3, bonus = 0.20, weight = 2},
      }
    },

    AbandonPenalty = 500,
    CrashPenalty = 1000,
  }
}

local ENABLE_DEBUG = false

local imgui = ui_imgui

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

local PlayerData = {
  level = 1,
  contractsCompleted = 0,
  contractsFailed = 0
}

local STATE_IDLE             = 0
local STATE_CONTRACT_SELECT  = 1
local STATE_DRIVING_TO_SITE  = 2
local STATE_TRUCK_ARRIVING   = 3
local STATE_LOADING          = 4
local STATE_DELIVERING       = 5
local STATE_RETURN_TO_QUARRY = 6
local STATE_AT_QUARRY_DECIDE = 7

local currentState = STATE_IDLE

local sitesData = nil
local sitesFilePath = nil
local availableGroups = {}
local selectedGroupIndex = 1
local groupCache = {}

local jobObjects = {
  truckID = nil,
  currentLoadMass = 0,
  lastDeliveredMass = 0,
  materialType = nil,
  activeGroup = nil,
  deferredTruckTargetPos = nil,
  loadingZoneTargetPos = nil,
  truckSpawnQueued = false,
}

local uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
local markerAnim = { time = 0, pulseScale = 1.0, rotationAngle = 0, beamHeight = 0, ringExpand = 0 }

local rockPileQueue = {}
local jobOfferSuppressed = false

local markerCleared = false
local truckStoppedInLoading = false
local isDispatching = false

local payloadUpdateTimer = 0
local anyZoneCheckTimer = 0
local cachedInAnyLoadingZone = false
local sitesLoadTimer = 0
local groupCachePrecomputeQueued = false

local function pickTierForPlayer()
  local level = PlayerData.level or 1
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
  for _, item in ipairs(items or {}) do
    totalWeight = totalWeight + (item.weight or 1)
  end
  if totalWeight <= 0 then return (items or {})[1] end

  local roll = math.random() * totalWeight
  local current = 0
  for _, item in ipairs(items or {}) do
    current = current + (item.weight or 1)
    if roll <= current then
      return item
    end
  end
  return (items or {})[1]
end

local function generateContract(forceTier)
  if #availableGroups == 0 then return nil end
  local tier = forceTier or pickTierForPlayer()
  local tierData = Config.Contracts.Tiers[tier] or Config.Contracts.Tiers[1]

  local isSpecial = math.random() < (tierData.specialChance or 0)
  local isBulk = math.random() < 0.4

  local materials = {"rocks", "marble"}
  local material = materials[math.random(#materials)]

  local group = availableGroups[math.random(#availableGroups)]
  if not group then return nil end

  local tonnageRange = (isBulk and tierData.tonnageRange and tierData.tonnageRange.bulk) or (tierData.tonnageRange and tierData.tonnageRange.single) or {15, 25}
  local requiredTons = math.random(tonnageRange[1], tonnageRange[2])

  if isSpecial then
    if math.random() < 0.5 then
      requiredTons = math.random(10, 20)
    else
      requiredTons = math.random(300, 500)
    end
  end

  local payRate = math.random(tierData.basePayRate.min, tierData.basePayRate.max)

  local modifiers = {}
  local bonusMultiplier = 1.0
  if math.random() < (tierData.modifierChance or 0) then
    local timeMod = weightedRandomChoice(Config.Contracts.Modifiers.time)
    if timeMod then
      table.insert(modifiers, timeMod)
      bonusMultiplier = bonusMultiplier + (timeMod.bonus or 0)
    end
  end
  if math.random() < (tierData.modifierChance or 0) * 0.6 then
    local challengeMod = weightedRandomChoice(Config.Contracts.Modifiers.challenge)
    if challengeMod then
      table.insert(modifiers, challengeMod)
      bonusMultiplier = bonusMultiplier + (challengeMod.bonus or 0)
    end
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

  return {
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
    group = group,
    groupTag = group.secondaryTag,
    estimatedTrips = math.ceil(requiredTons / (Config.TargetLoad / 1000))
  }
end

local function generateContracts()
  ContractSystem.availableContracts = {}
  if #availableGroups == 0 then return end

  local tierDistribution = {
    pickTierForPlayer(),
    pickTierForPlayer(),
    pickTierForPlayer(),
    math.random(1, 2),
    math.random(2, 3),
    math.random(3, 4)
  }

  for i = 1, (Config.Contracts.MaxActiveContracts or 6) do
    local contract = generateContract(tierDistribution[i])
    if contract then
      table.insert(ContractSystem.availableContracts, contract)
    end
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
  if currentDay - (ContractSystem.lastRefreshDay or -999) >= (Config.Contracts.RefreshDays or 3) then
    ContractSystem.lastRefreshDay = currentDay
    return true
  end
  return false
end

local function checkContractCompletion()
  if not ContractSystem.activeContract then return false end
  local p = ContractSystem.contractProgress
  return (p and p.deliveredTons or 0) >= (ContractSystem.activeContract.requiredTons or math.huge)
end

local function beginActiveContractTrip()
  local contract = ContractSystem.activeContract
  if not contract or not contract.group then return false end
  if isDispatching then return false end
  isDispatching = true

  jobObjects.materialType = contract.material
  jobObjects.activeGroup = contract.group

  markerCleared = false
  truckStoppedInLoading = false
  payloadUpdateTimer = 0

  core_groundMarkers.setPath(vec3(jobObjects.activeGroup.loading.center))

  local targetPos = nil
  local cache = ensureGroupRoadAdjacentPoint(jobObjects.activeGroup)
  if cache and cache.roadAdjacentPoint then
    targetPos = cache.roadAdjacentPoint
  elseif jobObjects.activeGroup and jobObjects.activeGroup.loading then
    targetPos = select(1, findRoadAdjacentPoint(jobObjects.activeGroup.loading))
    if cache then cache.roadAdjacentPoint = targetPos end
  end
  if cache and jobObjects.activeGroup and jobObjects.activeGroup.spawn and jobObjects.activeGroup.spawn.pos then
    local key = targetPos and string.format("%.2f,%.2f,%.2f", targetPos.x, targetPos.y, targetPos.z) or "nil"
    cache.spawnPos, cache.spawnRot = calculateSpawnTransformForLocation(vec3(jobObjects.activeGroup.spawn.pos), targetPos)
    cache.spawnTransformKey = key
  end

  spawnJobMaterials()
  jobObjects.deferredTruckTargetPos = targetPos
  jobObjects.loadingZoneTargetPos = targetPos
  jobObjects.truckID = nil
  jobObjects.truckSpawnQueued = false

  currentState = STATE_DRIVING_TO_SITE
  isDispatching = false
  return true
end

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

  if beginActiveContractTrip() then
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
    ui_message(string.format("Contract accepted: %s", contract.name), 5, "info")
  end
end

local function abandonContract()
  if not ContractSystem.activeContract then return end
  ui_message(string.format("Contract abandoned! Penalty: $%d", Config.Contracts.AbandonPenalty or 0), 6, "warning")

  local career = extensions.career_career
  if career and career.isActive() then
    local paymentModule = extensions.career_modules_payment
    if paymentModule then
      paymentModule.pay(-(Config.Contracts.AbandonPenalty or 0), {label = "Contract Abandonment"})
    end
  end

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}

  cleanupJob(true)
end

local function failContract(penalty, message, msgType)
  if not ContractSystem.activeContract then
    cleanupJob(true)
    return
  end

  penalty = penalty or 0
  msgType = msgType or "warning"
  if message then
    ui_message(message, 5, msgType)
  end

  local career = extensions.career_career
  if career and career.isActive() then
    local paymentModule = extensions.career_modules_payment
    if paymentModule and penalty ~= 0 then
      paymentModule.pay(-math.abs(penalty), {label = "Contract Failure"})
    end
  end

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}

  cleanupJob(true)
end

local function completeContract()
  if not ContractSystem.activeContract then return end
  local contract = ContractSystem.activeContract
  local progress = ContractSystem.contractProgress or {}

  local totalPay = contract.totalPayout or 0
  if contract.paymentType == "progressive" then
    totalPay = totalPay - (progress.totalPaidSoFar or 0)
  end
  if totalPay < 0 then totalPay = 0 end

  local career = extensions.career_career
  if career and career.isActive() then
    local paymentModule = extensions.career_modules_payment
    if paymentModule then
      local xpReward = math.floor((contract.requiredTons or 0) * 10)
      paymentModule.reward({
        money = { amount = totalPay, canBeNegative = false },
        labor = { amount = xpReward, canBeNegative = false }
      }, { label = string.format("Contract: %s", contract.name), tags = {"gameplay", "mission", "reward"} })

      Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Buy_01')
      ui_message(string.format("CONTRACT COMPLETE! Earned $%d", totalPay), 8, "success")
    end
  else
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message(string.format("SANDBOX: Contract payout: $%d", totalPay), 6, "success")
  end

  PlayerData.contractsCompleted = (PlayerData.contractsCompleted or 0) + 1
  PlayerData.level = (PlayerData.level or 1) + 1

  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}

  cleanupJob(true)
end

local function lerp(a, b, t) return a + (b - a) * t end

local function calculateTaxiTransform(position, direction)
  local normal = vec3(0,0,1)
  if map and map.surfaceNormal then normal = map.surfaceNormal(position, 1) end
  local vecY = vec3(0, 1, 0)
  if direction:length() == 0 then direction = vec3(0,1,0) end
  local rotation = quatFromDir(vecY:rotated(quatFromDir(direction, normal)), normal)
  return position, rotation
end

local function isPositionInPlayerView(position)
  if not core_camera or not core_camera.getPosition or not core_camera.getForward then return false end
  local camPos = core_camera.getPosition()
  local viewDir = core_camera.getForward()
  if not camPos or not viewDir then return false end
  local dirToPos = (position - camPos):normalized()
  if dirToPos:dot(viewDir) <= 0.3 then return false end
  local dist = camPos:distance(position)
  if castRayStatic then
    return castRayStatic(camPos, dirToPos, dist) >= dist - 2
  end
  return true
end

local function interpolatePathPosition(currentSeg, nextSeg, distanceFromStart)
  local segmentLength = nextSeg.distance - currentSeg.distance
  if segmentLength <= 0 then return nil, nil end
  local segmentProgress = (distanceFromStart - currentSeg.distance) / segmentLength
  local roadCenterPos = vec3(
    currentSeg.pos.x + (nextSeg.pos.x - currentSeg.pos.x) * segmentProgress,
    currentSeg.pos.y + (nextSeg.pos.y - currentSeg.pos.y) * segmentProgress,
    currentSeg.pos.z + (nextSeg.pos.z - currentSeg.pos.z) * segmentProgress
  )
  local drivingDirection = (currentSeg.pos - nextSeg.pos)
  drivingDirection.z = 0
  if drivingDirection:length() == 0 then drivingDirection = vec3(0, 1, 0) end
  drivingDirection = drivingDirection:normalized()
  return calculateLanePosition(roadCenterPos, drivingDirection)
end

local function findOptimalPositionOnPath(pathSegments, targetDistance)
  if not pathSegments or #pathSegments < 2 then return nil, nil end
  local totalPathLength = pathSegments[#pathSegments].distance
  local distanceFromStart = math.max(0, totalPathLength - targetDistance)
  local fallbackPos, fallbackDir = nil, nil

  for i = 1, #pathSegments - 1 do
    local currentSeg = pathSegments[i]
    local nextSeg = pathSegments[i + 1]
    if distanceFromStart >= currentSeg.distance and distanceFromStart <= nextSeg.distance then
      local lanePos, finalDir = interpolatePathPosition(currentSeg, nextSeg, distanceFromStart)
      if lanePos then
        if not isPositionInPlayerView(lanePos) then return lanePos, finalDir end
        if not fallbackPos then fallbackPos, fallbackDir = lanePos, finalDir end
      end
    end
  end
  return fallbackPos, fallbackDir
end

local function finalizeTruckPosition(truckId, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  core_jobsystem.create(function(job)
    job.sleep(0.5)
    if truck.setMeshAlpha then truck:setMeshAlpha(1, '') end
  end)
  if targetPos then
    truck:queueLuaCommand('driver.returnTargetPosition(' .. serialize(targetPos) .. ')')
  end
  truck:queueLuaCommand('ai.setCutOffDrivability(0) ai.setAggression(0.6)')
end

local function teleportTruckToPosition(truckId, position, direction, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  if truck.setMeshAlpha then truck:setMeshAlpha(0, '') end
  local pos, rotation = calculateTaxiTransform(position, direction)
  truck:setPosRot(pos.x, pos.y, pos.z, rotation.x, rotation.y, rotation.z, rotation.w)
  core_jobsystem.create(function(job)
    job.sleep(0.2)
    finalizeTruckPosition(truckId, targetPos)
  end)
end

local function positionTruckOnPath(truckId, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  if not map or not map.getPointToPointPath or not map.getMap or not map.getMap().nodes then
    finalizeTruckPosition(truckId, targetPos)
    return
  end

  local truckPos = truck:getPosition()
  local path = map.getPointToPointPath(truckPos, targetPos, 0, 1000, 200, 10000, 1)
  if not path or #path == 0 then
    finalizeTruckPosition(truckId, targetPos)
    return
  end

  local nodes = map.getMap().nodes
  local pathSegments = { { pos = truckPos, distance = 0 } }
  local totalDistance = 0
  local prevNodePos = truckPos

  for i = 1, #path do
    local nodeId = path[i]
    local node = nodes[nodeId]
    local nodePos = node and node.pos or nil
    if nodePos then
      totalDistance = totalDistance + prevNodePos:distance(nodePos)
      table.insert(pathSegments, { pos = nodePos, distance = totalDistance })
      prevNodePos = nodePos
    end
  end

  totalDistance = totalDistance + prevNodePos:distance(targetPos)
  table.insert(pathSegments, { pos = targetPos, distance = totalDistance })

  local maxTargetDistance = math.min(100, totalDistance * 0.9)
  local bestPosition, bestDirection, bestDistance = nil, nil, 0

  for targetDistance = maxTargetDistance, 30, -5 do
    local optimalPos, optimalDir = findOptimalPositionOnPath(pathSegments, targetDistance)
    if optimalPos then
      if not isPositionInPlayerView(optimalPos) then
        teleportTruckToPosition(truckId, optimalPos, optimalDir, targetPos)
        return
      end
      if not bestPosition or targetDistance > bestDistance then
        bestPosition, bestDirection, bestDistance = optimalPos, optimalDir, targetDistance
      end
    end
  end

  if bestPosition then
    teleportTruckToPosition(truckId, bestPosition, bestDirection, targetPos)
  else
    finalizeTruckPosition(truckId, targetPos)
  end
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

local function ensureGroupCache(group)
  if not group or not group.secondaryTag then return nil end
  local key = tostring(group.secondaryTag)
  local cache = groupCache[key]
  if not cache then
    cache = {}
    groupCache[key] = cache
  end
  return cache
end

local function ensureGroupRoadAdjacentPoint(group)
  local cache = ensureGroupCache(group)
  if not cache then return nil end
  if group and group.loading and not cache.roadAdjacentPoint then
    cache.roadAdjacentPoint = select(1, findRoadAdjacentPoint(group.loading))
  end
  return cache
end

local function ensureGroupOffRoadCentroid(group)
  local cache = ensureGroupCache(group)
  if not cache then return nil end
  if group and group.loading and not cache.offRoadCentroid then
    cache.offRoadCentroid = findOffRoadCentroid(group.loading, 5, 1000)
  end
  return cache
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

  if not groupCachePrecomputeQueued and #availableGroups > 0 then
    groupCachePrecomputeQueued = true
    core_jobsystem.create(function(job)
      for _, g in ipairs(availableGroups) do
        ensureGroupRoadAdjacentPoint(g)
        job.sleep(0.01)
      end
      for _, g in ipairs(availableGroups) do
        ensureGroupOffRoadCentroid(g)
        job.sleep(0.01)
      end
    end)
  end
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
  payloadUpdateTimer = 0

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
  jobObjects.truckSpawnQueued = false

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

  local cache = ensureGroupOffRoadCentroid(jobObjects.activeGroup)
  local basePos = cache and cache.offRoadCentroid or nil
  if not basePos then
    basePos = findOffRoadCentroid(zone, 5, 1000)
    if cache then cache.offRoadCentroid = basePos end
  end
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
    for idx, marbleData in ipairs(Config.MarbleConfigs) do
      local pos = basePos + (offsets[idx] or vec3(0,0,0))
      local block = core_vehicles.spawnNewVehicle(Config.MarbleProp, { config = marbleData.config, pos = pos, rot = quatFromDir(vec3(0,1,0)), autoEnterVehicle = false })
      if block then
        local mass = marbleData.mass or Config.MarbleMassDefault
        if (not mass or mass <= 0) and block.getInitialMass then mass = block:getInitialMass() end
        table.insert(rockPileQueue, { id = block:getID(), mass = mass })
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

local function calculateSpawnTransformForLocation(spawnPos, targetPos)
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
    spawnPos, dir = calculateLanePosition(info.pos, roadDir)
  else
    spawnPos.z = core_terrain.getTerrainHeight(spawnPos)
    if targetDir then dir = targetDir end
  end

  return calculateTaxiTransform(spawnPos, dir)
end

local function spawnTruckForGroup(group, materialType, targetPos)
  if not group or not group.spawn or not group.spawn.pos then return nil end

  local cache = ensureGroupCache(group)
  local key = targetPos and string.format("%.2f,%.2f,%.2f", targetPos.x, targetPos.y, targetPos.z) or "nil"
  if cache and cache.spawnTransformKey ~= key then
    cache.spawnPos, cache.spawnRot = nil, nil
    cache.spawnTransformKey = key
  end

  local pos, rot
  if cache and cache.spawnPos and cache.spawnRot then
    pos, rot = cache.spawnPos, cache.spawnRot
  else
    pos, rot = calculateSpawnTransformForLocation(vec3(group.spawn.pos), targetPos)
    if cache then
      cache.spawnPos, cache.spawnRot = pos, rot
      cache.spawnTransformKey = key
    end
  end

  local truckModel = (materialType == "marble") and Config.MarbleTruckModel or Config.RockTruckModel
  local truckConfig = (materialType == "marble") and Config.MarbleTruckConfig or Config.RockTruckConfig

  local truck = core_vehicles.spawnNewVehicle(truckModel, { pos = pos, rot = rot, config = truckConfig, autoEnterVehicle = false })
  if not truck then return nil end
  return truck:getID()
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

  local bedCenterHeight = (bedSettings.floorHeight or 0) + ((bedSettings.loadHeight or 0) / 2)
  local bedCenter = pos - (dir * offsetBack) + (right * offsetSide) + (up * bedCenterHeight)

  return {
    center = bedCenter,
    axisX = right,
    axisY = dir,
    axisZ = up,
    halfWidth = (bedSettings.width or 1) / 2,
    halfLength = (bedSettings.length or 1) / 2,
    halfHeight = (bedSettings.loadHeight or 1) / 2,
    floorHeight = bedSettings.floorHeight or 0,
    settings = bedSettings
  }
end

local function isPointInTruckBed(point, bedData)
  if not bedData then return false end
  local diff = point - bedData.center
  local localX = diff:dot(bedData.axisX)
  local localY = diff:dot(bedData.axisY)
  local localZ = diff:dot(bedData.axisZ)
  return (math.abs(localX) <= bedData.halfWidth and math.abs(localY) <= bedData.halfLength and math.abs(localZ) <= bedData.halfHeight)
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
  if #rockPileQueue == 0 then return 0 end
  if not jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then return 0 end

  local bedData = getTruckBedData(truck)
  if not bedData then return 0 end
  drawTruckBedDebug(bedData)

  local defaultMass = Config.RockMassPerPile
  if jobObjects.materialType == "marble" then
    defaultMass = Config.MarbleMassDefault or Config.RockMassPerPile
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
        local entryMass = rockEntry.mass or defaultMass
        local ratio = nodesInside / nodesChecked
        totalMass = totalMass + (entryMass * ratio)
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

local function handleDeliveryArrived()
  local contract = ContractSystem.activeContract
  local group = jobObjects.activeGroup
  if not contract or not group then
    cleanupJob(true)
    return
  end

  local deliveredMass = jobObjects.lastDeliveredMass or 0
  local tons = deliveredMass / 1000

  ContractSystem.contractProgress = ContractSystem.contractProgress or {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}
  ContractSystem.contractProgress.deliveredTons = (ContractSystem.contractProgress.deliveredTons or 0) + tons
  ContractSystem.contractProgress.deliveryCount = (ContractSystem.contractProgress.deliveryCount or 0) + 1

  if contract.paymentType == "progressive" then
    local payment = math.floor(tons * (contract.payRate or 0))
    ContractSystem.contractProgress.totalPaidSoFar = (ContractSystem.contractProgress.totalPaidSoFar or 0) + payment

    local career = extensions.career_career
    if career and career.isActive() then
      local paymentModule = extensions.career_modules_payment
      if paymentModule then
        paymentModule.pay(payment, {label = "Delivery Payment"})
      end
      ui_message(string.format("Delivery payment: $%d", payment), 3, "success")
    else
      ui_message(string.format("SANDBOX: Delivery payment: $%d", payment), 3, "success")
    end
  end

  if jobObjects.truckID then
    local obj = be:getObjectByID(jobObjects.truckID)
    if obj then obj:delete() end
  end

  jobObjects.truckID = nil
  jobObjects.currentLoadMass = 0
  jobObjects.lastDeliveredMass = 0
  jobObjects.deferredTruckTargetPos = nil
  jobObjects.loadingZoneTargetPos = nil
  jobObjects.truckSpawnQueued = false

  markerCleared = false
  truckStoppedInLoading = false
  payloadUpdateTimer = 0

  currentState = STATE_RETURN_TO_QUARRY
  if group.loading and group.loading.center then
    core_groundMarkers.setPath(vec3(group.loading.center))
  else
    core_groundMarkers.setPath(nil)
  end

  if checkContractCompletion() then
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message("Contract complete! Return to quarry to finalize.", 6, "success")
  else
    local remaining = (contract.requiredTons or 0) - (ContractSystem.contractProgress.deliveredTons or 0)
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message(string.format("Delivery #%d complete! %.1f tons remaining.", ContractSystem.contractProgress.deliveryCount or 1, remaining), 6, "success")
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

    if currentState == STATE_CONTRACT_SELECT then
      imgui.TextColored(imgui.ImVec4(1, 1, 1, uiAnim.opacity), "Available Contracts")
      imgui.TextColored(imgui.ImVec4(0.7, 0.7, 0.7, uiAnim.opacity), string.format("Player Level: %d | Completed: %d", PlayerData.level or 1, PlayerData.contractsCompleted or 0))
      imgui.Dummy(imgui.ImVec2(0, 10))

      if #ContractSystem.availableContracts == 0 then
        imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, uiAnim.opacity), "No contracts available")
      else
        local tierColors = {
          imgui.ImVec4(0.5, 0.8, 0.5, 1),
          imgui.ImVec4(0.5, 0.7, 1.0, 1),
          imgui.ImVec4(1.0, 0.7, 0.4, 1),
          imgui.ImVec4(1.0, 0.4, 0.4, 1)
        }

        for i, c in ipairs(ContractSystem.availableContracts) do
          imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.15, 0.15, 0.2, 0.9))
          imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.25, 0.25, 0.35, 1))
          imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.3, 0.3, 0.4, 1))

          local label = string.format("[%d] %s##contract%d", i, c.name or "Contract", i)
          if imgui.Button(label, imgui.ImVec2(contentWidth, 0)) then
            acceptContract(i)
          end
          imgui.PopStyleColor(3)

          imgui.Indent(20)
          local tierColor = tierColors[c.tier or 1] or imgui.ImVec4(1, 1, 1, 1)
          imgui.TextColored(tierColor, string.format("Tier %d | %s | %s", c.tier or 1, tostring(c.groupTag or "?"), tostring((c.material or "rocks"):upper())))
          imgui.SameLine()
          imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("  $%d", c.totalPayout or 0))
          imgui.Text(string.format("• %d tons total (%d trips)", c.requiredTons or 0, c.estimatedTrips or 1))
          imgui.Text(string.format("• Payment: %s", (c.paymentType == "progressive") and "Progressive" or "On completion"))
          if c.modifiers and #c.modifiers > 0 then
            local modText = "• Modifiers: "
            for j, mod in ipairs(c.modifiers) do
              modText = modText .. tostring(mod.name or "?")
              if j < #c.modifiers then modText = modText .. ", " end
            end
            imgui.TextColored(imgui.ImVec4(1, 1, 0.5, 1), modText)
          end
          imgui.Unindent(20)
          imgui.Dummy(imgui.ImVec2(0, 8))

          if i < #ContractSystem.availableContracts then
            imgui.Separator()
            imgui.Dummy(imgui.ImVec2(0, 5))
          end
        end
      end

      imgui.Dummy(imgui.ImVec2(0, 10))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, uiAnim.opacity))
      if imgui.Button("DECLINE ALL", imgui.ImVec2(-1, 35)) then
        currentState = STATE_IDLE
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
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_TRUCK_ARRIVING then
      imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * uiAnim.opacity), ">> TRUCK ARRIVING <<")
      imgui.Text("Waiting for truck to arrive...")
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_LOADING then
      imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha * uiAnim.opacity), ">> LOADING <<")
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        imgui.Text(string.format("Progress: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        imgui.Separator()
      end
      local mass = jobObjects.currentLoadMass or 0
      local percent = math.min(1.0, mass / Config.TargetLoad)

      imgui.Text(string.format("Payload: %.0f / %.0f kg", mass, Config.TargetLoad))

      local barColor = imgui.ImVec4(1, 1, 0, 1)
      if percent > 0.8 then barColor = imgui.ImVec4(0, 1, 0, 1) end
      imgui.PushStyleColor2(imgui.Col_PlotHistogram, barColor)
      imgui.ProgressBar(percent, imgui.ImVec2(-1, 30), string.format("%.0f%%", percent * 100))
      imgui.PopStyleColor(1)

      imgui.Dummy(imgui.ImVec2(0, 20))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.4, 0, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.6, 0, uiAnim.opacity))
      if imgui.Button("START DELIVERY", imgui.ImVec2(-1, 45)) then
        if jobObjects.truckID and jobObjects.activeGroup and jobObjects.activeGroup.destination then
          jobObjects.lastDeliveredMass = jobObjects.currentLoadMass or 0
          clearProps()
          local destPos = vec3(jobObjects.activeGroup.destination.pos)
          core_groundMarkers.setPath(destPos)
          driveTruckToPoint(jobObjects.truckID, destPos)
          currentState = STATE_DELIVERING
        else
          abandonContract()
        end
      end
      imgui.PopStyleColor(2)

      imgui.Dummy(imgui.ImVec2(0, 5))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_DELIVERING then
      imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * uiAnim.opacity), ">> DELIVERING <<")
      imgui.Text("Truck driving to destination...")
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_RETURN_TO_QUARRY then
      imgui.TextColored(imgui.ImVec4(1.0, 0.6, 0.2, pulseAlpha * uiAnim.opacity), ">> RETURN TO QUARRY <<")
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        imgui.Text(string.format("Delivered: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        if c.paymentType == "progressive" then
          imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Earned so far: $%d", p.totalPaidSoFar or 0))
        end
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_AT_QUARRY_DECIDE then
      imgui.TextColored(imgui.ImVec4(0.2, 1.0, 0.4, pulseAlpha * uiAnim.opacity), ">> AT QUARRY <<")
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        local pct = 0
        if (c.requiredTons or 0) > 0 then pct = (p.deliveredTons or 0) / (c.requiredTons or 1) end
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        imgui.Text(string.format("Progress: %.1f / %.1f tons (%.0f%%)", p.deliveredTons or 0, c.requiredTons or 0, pct * 100))
        if c.paymentType == "progressive" then
          imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Already paid: $%d", p.totalPaidSoFar or 0))
        end
        imgui.Dummy(imgui.ImVec2(0, 10))
        if checkContractCompletion() then
          imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "CONTRACT COMPLETE!")
          imgui.Dummy(imgui.ImVec2(0, 10))
          if imgui.Button("FINALIZE CONTRACT", imgui.ImVec2(-1, 45)) then
            completeContract()
          end
        else
          if imgui.Button("LOAD MORE", imgui.ImVec2(-1, 45)) then
            beginActiveContractTrip()
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

local function isPlayerInAnyLoadingZone(playerPos)
  for _, g in ipairs(availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return true
    end
  end
  return false
end

local function getInAnyLoadingZoneThrottled(playerPos, dt)
  anyZoneCheckTimer = anyZoneCheckTimer + dt
  if anyZoneCheckTimer >= 0.25 then
    cachedInAnyLoadingZone = isPlayerInAnyLoadingZone(playerPos)
    anyZoneCheckTimer = 0
  end
  return cachedInAnyLoadingZone
end

local function queueTruckSpawn(group, materialType, targetPos)
  if jobObjects.truckSpawnQueued then return end
  jobObjects.truckSpawnQueued = true
  core_jobsystem.create(function(job)
    job.sleep(0.05)
    if currentState ~= STATE_DRIVING_TO_SITE then
      jobObjects.truckSpawnQueued = false
      return
    end
    if not markerCleared then
      jobObjects.truckSpawnQueued = false
      return
    end
    if jobObjects.truckID then return end
    if not group or not group.spawn then
      jobObjects.truckSpawnQueued = false
      return
    end

    if not targetPos and group.loading and group.loading.center then
      targetPos = vec3(group.loading.center)
    end

    local truckId = spawnTruckForGroup(group, materialType, targetPos)
    if truckId then
      jobObjects.truckID = truckId
      if currentState == STATE_DRIVING_TO_SITE then
        currentState = STATE_TRUCK_ARRIVING
      end
      local truck = be:getObjectByID(truckId)
      if truck then
        truck:queueLuaCommand('if not driver then extensions.load("driver") end')
      end
      if targetPos then
        core_jobsystem.create(function(job2)
          job2.sleep(0.2)
          positionTruckOnPath(truckId, targetPos)
        end)
      else
        driveTruckToPoint(truckId, targetPos)
      end
      jobObjects.deferredTruckTargetPos = nil
    else
      jobObjects.truckSpawnQueued = false
    end
  end)
end

local function onUpdate(dt)
  if not sitesData then
    sitesLoadTimer = sitesLoadTimer + dt
    if sitesLoadTimer >= 1.0 then
      loadQuarrySites()
      sitesLoadTimer = 0
    end
  end

  drawWorkSiteMarker(dt)
  if currentState == STATE_LOADING then
    payloadUpdateTimer = payloadUpdateTimer + dt
    if payloadUpdateTimer >= 0.25 then
      jobObjects.currentLoadMass = calculateTruckPayload()
      payloadUpdateTimer = 0
    end
  end
  drawUI(dt)

  local playerVeh = be:getPlayerVehicle(0)
  if not playerVeh then return end

  local playerPos = playerVeh:getPosition()
  local inAnyZone = false
  if currentState == STATE_IDLE or currentState == STATE_CONTRACT_SELECT then
    if currentState == STATE_CONTRACT_SELECT or jobOfferSuppressed or playerVeh:getJBeamFilename() == "wl40" then
      inAnyZone = getInAnyLoadingZoneThrottled(playerPos, dt)
    end
  else
    local g = jobObjects.activeGroup
    if g and g.loading and g.loading.containsPoint2D then
      inAnyZone = g.loading:containsPoint2D(playerPos)
    end
  end

  if currentState == STATE_IDLE then
    if jobOfferSuppressed and not inAnyZone then
      jobOfferSuppressed = false
    end
    if not jobOfferSuppressed and playerVeh:getJBeamFilename() == "wl40" then
      if inAnyZone then
        if shouldRefreshContracts() or #ContractSystem.availableContracts == 0 then
          generateContracts()
        end
        currentState = STATE_CONTRACT_SELECT
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      end
    end

  elseif currentState == STATE_CONTRACT_SELECT then
    if #ContractSystem.availableContracts == 0 and #availableGroups > 0 then
      generateContracts()
    end
    if not inAnyZone then
      currentState = STATE_IDLE
      jobObjects.materialType = nil
      jobObjects.activeGroup = nil
    end

  elseif currentState == STATE_DRIVING_TO_SITE then
    local group = jobObjects.activeGroup
    if not group or not group.loading then
      abandonContract()
      return
    end

    if group.loading:containsPoint2D(playerPos) and not markerCleared then
      core_groundMarkers.setPath(nil)
      markerCleared = true
    end

    if markerCleared and not jobObjects.truckID and jobObjects.deferredTruckTargetPos then
      queueTruckSpawn(group, jobObjects.materialType, jobObjects.deferredTruckTargetPos)
    end

  elseif currentState == STATE_TRUCK_ARRIVING then
    local group = jobObjects.activeGroup
    if not group or not group.loading then
      abandonContract()
      return
    end
    if jobObjects.truckID and not truckStoppedInLoading then
      local truck = be:getObjectByID(jobObjects.truckID)
      if not truck then
        failContract(Config.Contracts.CrashPenalty, "Truck lost! Contract failed.", "error")
        return
      end
      if truck and jobObjects.loadingZoneTargetPos then
        local dist = (truck:getPosition() - vec3(jobObjects.loadingZoneTargetPos)):length()
        if dist < 10 then
          stopTruck(jobObjects.truckID)
          truckStoppedInLoading = true
          ui_message("Truck arrived at loading zone.", 5, "success")
          currentState = STATE_LOADING
          Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
        end
      end
    end

  elseif currentState == STATE_LOADING then
    if jobObjects.truckID then
      local truck = be:getObjectByID(jobObjects.truckID)
      if not truck then
        failContract(Config.Contracts.CrashPenalty, "Truck destroyed! Contract failed.", "warning")
        return
      end
    end

  elseif currentState == STATE_DELIVERING then
    local group = jobObjects.activeGroup
    if jobObjects.truckID and group and group.destination then
      local truck = be:getObjectByID(jobObjects.truckID)
      if truck then
        local dist = (truck:getPosition() - vec3(group.destination.pos)):length()
        if dist < 10 then
          handleDeliveryArrived()
        end
      else
        failContract(Config.Contracts.CrashPenalty, "Truck destroyed! Contract failed.", "warning")
      end
    else
      abandonContract()
    end

  elseif currentState == STATE_RETURN_TO_QUARRY then
    local group = jobObjects.activeGroup
    if group and group.loading and group.loading.containsPoint2D and group.loading:containsPoint2D(playerPos) then
      currentState = STATE_AT_QUARRY_DECIDE
      core_groundMarkers.setPath(nil)
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      ui_message("Back at quarry!", 5, "info")
    end

  elseif currentState == STATE_AT_QUARRY_DECIDE then
    local group = jobObjects.activeGroup
    if not (group and group.loading and group.loading.containsPoint2D and group.loading:containsPoint2D(playerPos)) then
      currentState = STATE_RETURN_TO_QUARRY
      if group and group.loading and group.loading.center then
        core_groundMarkers.setPath(vec3(group.loading.center))
      end
    end
  end
end

local function onClientStartMission()
  sitesData = nil
  sitesFilePath = nil
  availableGroups = {}
  selectedGroupIndex = 1
  groupCache = {}
  cleanupJob(true)
  ContractSystem.availableContracts = {}
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0}
  jobOfferSuppressed = false
  anyZoneCheckTimer = 0
  cachedInAnyLoadingZone = false
  sitesLoadTimer = 0
  groupCachePrecomputeQueued = false
end

local function onClientEndMission()
  cleanupJob(true)
  sitesData = nil
  sitesFilePath = nil
  availableGroups = {}
  groupCache = {}
  groupCachePrecomputeQueued = false
  ContractSystem.availableContracts = {}
  ContractSystem.activeContract = nil
end

M.onUpdate = onUpdate
M.onClientStartMission = onClientStartMission
M.onClientEndMission = onClientEndMission

return M
