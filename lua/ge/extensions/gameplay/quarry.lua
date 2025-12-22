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
    { config = "big_rails", mass = 38000, blockType = "big", displayName = "Large Block" },
    { config = "rails", mass = 19000, blockType = "small", displayName = "Small Block" }
  },
  MarbleMassDefault = 8000,
  
  -- Block-based contract settings for marble
  MarbleBlockRanges = {
    -- Per tier: {bigMin, bigMax, smallMin, smallMax}
    [1] = { big = {0, 1}, small = {1, 2} },   -- Tier 1: 0-1 big, 1-2 small
    [2] = { big = {1, 2}, small = {1, 3} },   -- Tier 2: 1-2 big, 1-3 small
    [3] = { big = {1, 3}, small = {2, 4} },   -- Tier 3: 1-3 big, 2-4 small
    [4] = { big = {2, 4}, small = {3, 5} },   -- Tier 4: 2-4 big, 3-5 small
  },

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
      offsetSide = -0.45,
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
    InitialContracts = 4,           -- Start with only 4 contracts
    RefreshDays = 3,
    
    -- Dynamic contract generation
    ContractSpawnInterval = 2,      -- In-game hours between new contracts
    ContractExpirationTime = {      -- Hours until contract expires (by tier)
      [1] = 8,   -- Tier 1: Easy contracts stay 8 hours
      [2] = 6,   -- Tier 2: 6 hours
      [3] = 4,   -- Tier 3: Hard contracts are more urgent
      [4] = 3,   -- Tier 4: Expert contracts are rare opportunities
    },
    
    -- Urgency system
    UrgentContractChance = 0.15,    -- 15% chance a contract is "URGENT"
    UrgentExpirationMult = 0.5,     -- Urgent contracts expire 50% faster
    UrgentPayBonus = 0.25,          -- +25% pay for urgent contracts

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
  },

  -- ============================================================================
  -- ZONE STOCK SYSTEM CONFIG
  -- ============================================================================
  -- Each zone has limited stock that regenerates over time.
  -- Material type is determined by zone tags in the sites JSON (add "marble" or "rocks" tag)
  Stock = {
    -- Default stock settings per zone (can be extended per-zone via customFields.values if needed)
    DefaultMaxStock = 10,           -- Max units a zone can hold
    DefaultRegenRate = 1,           -- Units regenerated per in-game hour
    RegenCheckInterval = 30,        -- Seconds (real time) between regen checks
    
    -- Max props to spawn at once per material type (performance limit)
    -- This prevents spawning too many physics objects at once
    MaxSpawnedProps = {
      marble = 2,   -- Max 2 marble blocks spawned at once (1 big + 1 small typically)
      rocks = 2,    -- Max 2 rock piles spawned at once
    },
    
    -- How much stock each prop type consumes when spawned
    StockCostPerProp = {
      marble = 1,   -- Each marble block costs 1 stock unit
      rocks = 1,    -- Each rock pile costs 1 stock unit
    },
  },
}

local ENABLE_DEBUG = true

local imgui = ui_imgui

local ContractSystem = {
  availableContracts = {},
  activeContract = nil,
  lastRefreshDay = -999,
  contractProgress = {
    deliveredTons = 0,        -- For rocks contracts
    totalPaidSoFar = 0,
    startTime = 0,
    deliveryCount = 0,
    -- For marble contracts (block-based)
    deliveredBlocks = {
      big = 0,
      small = 0,
      total = 0
    }
  },
  
  -- Dynamic contract tracking
  lastContractSpawnTime = 0,      -- In-game hour of last spawn
  contractsGeneratedToday = 0,    -- Track daily generation
  expiredContractsTotal = 0,      -- Track how many expired (for stats)
  initialContractsGenerated = false,  -- Track if initial batch was generated
}

local PlayerData = {
  level = 1,
  contractsCompleted = 0,
  contractsFailed = 0
}

local STATE_IDLE             = 0
local STATE_CONTRACT_SELECT  = 1
local STATE_CHOOSING_ZONE    = 2   -- NEW: Player choosing which zone to load from
local STATE_DRIVING_TO_SITE  = 3
local STATE_TRUCK_ARRIVING   = 4
local STATE_LOADING          = 5
local STATE_DELIVERING       = 6
local STATE_RETURN_TO_QUARRY = 7
local STATE_AT_QUARRY_DECIDE = 8

local currentState = STATE_IDLE

-- Stores compatible zones for current contract (zones with matching material)
local compatibleZones = {}

local sitesData = nil
local sitesFilePath = nil
local availableGroups = {}
local selectedGroupIndex = 1
local groupCache = {}

local jobObjects = {
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
  marbleDamage = {},  -- Track damage per marble block: {id = {damage = 0-1, isDamaged = bool}}
  totalMarbleDamagePercent = 0,
  anyMarbleDamaged = false,
  lastDeliveryDamagePercent = 0,  -- Damage at time of sending truck
}

local uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
local uiHidden = false
local markerAnim = { time = 0, pulseScale = 1.0, rotationAngle = 0, beamHeight = 0, ringExpand = 0 }

local rockPileQueue = {}
local jobOfferSuppressed = false

-- Marble damage tracking (part damage detection)
local marbleInitialState = {}
local MARBLE_MIN_DISPLAY_DAMAGE = 5            -- Only show damage UI if above 5%

-- Part damage cache (received from vehicle Lua)
local marbleDamageState = {}  -- [objId] = {isDamaged = bool, lastUpdate = time}

-- Cache for debug drawing data so it can be drawn every frame
local debugDrawCache = {
  bedData = nil,
  nodePoints = {},
  marblePieces = {}  -- {centroids = {}, connections = {{from, to, broken}}, bounds = {}}
}

local markerCleared = false
local truckStoppedInLoading = false
local isDispatching = false

local payloadUpdateTimer = 0
local anyZoneCheckTimer = 0
local cachedInAnyLoadingZone = false
local sitesLoadTimer = 0
local contractUpdateTimer = 0
local CONTRACT_UPDATE_INTERVAL = 5  -- Check contracts every 5 seconds
local groupCachePrecomputeQueued = false
local stockRegenTimer = 0  -- Timer for zone stock regeneration checks

-- Truck movement tracking for delivery
local truckStoppedTimer = 0
local truckLastPosition = nil
local truckStoppedThreshold = 2.0  -- Seconds of being stopped before re-sending
local truckStopSpeedThreshold = 1.0  -- m/s - below this is considered "stopped"
local truckResendCount = 0
local truckMaxResends = 15  -- Maximum times to re-send truck before giving up

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

-- Helper to get current in-game hour (0-24)
local function getCurrentGameHour()
  if core_environment and core_environment.getTimeOfDay then
    local tod = core_environment.getTimeOfDay()
    if tod and type(tod) == "table" and tod.time then
      return tod.time * 24
    elseif tod and type(tod) == "number" then
      return tod * 24
    end
  end
  return 12  -- Default to noon if not available
end

local function generateContract(forceTier)
  if #availableGroups == 0 then return nil end
  local tier = forceTier or pickTierForPlayer()
  local tierData = Config.Contracts.Tiers[tier] or Config.Contracts.Tiers[1]

  local isSpecial = math.random() < (tierData.specialChance or 0)
  local isBulk = math.random() < 0.4

  -- Pick a random zone and use its material type from tags
  local group = availableGroups[math.random(#availableGroups)]
  if not group then return nil end
  
  -- Use the zone's material type (set from tags in discoverGroups)
  local material = group.materialType or "rocks"

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

  -- NEW: Urgency system
  local isUrgent = math.random() < (Config.Contracts.UrgentContractChance or 0.15)
  if isUrgent then
    bonusMultiplier = bonusMultiplier + (Config.Contracts.UrgentPayBonus or 0.25)
  end

  -- Material-specific contract requirements
  local requiredTons = 0
  local requiredBlocks = nil  -- Only set for marble
  local estimatedTrips = 1
  
  if material == "marble" then
    -- Marble contracts use block counts instead of tons
    local blockRanges = Config.MarbleBlockRanges[tier] or Config.MarbleBlockRanges[1]
    local bigBlocks = math.random(blockRanges.big[1], blockRanges.big[2])
    local smallBlocks = math.random(blockRanges.small[1], blockRanges.small[2])
    
    -- Ensure at least 1 block total
    if bigBlocks == 0 and smallBlocks == 0 then
      smallBlocks = 1
    end
    
    -- Special contracts get more blocks
    if isSpecial then
      bigBlocks = bigBlocks + math.random(1, 2)
      smallBlocks = smallBlocks + math.random(1, 2)
    end
    
    requiredBlocks = {
      big = bigBlocks,
      small = smallBlocks,
      total = bigBlocks + smallBlocks
    }
    
    -- Calculate equivalent tons for payout (big = 38t, small = 19t)
    requiredTons = (bigBlocks * 38) + (smallBlocks * 19)
    
    -- Estimate trips: truck can carry 1 big + 1 small per trip, or 2 small per trip
    -- Each trip can take: 1 big block, or 1 big + 1 small, or 2 small
    if bigBlocks >= smallBlocks then
      -- We have more big blocks, so trips = big blocks (small ones ride along)
      estimatedTrips = bigBlocks
    else
      -- More small blocks than big - big blocks ride with smalls, remaining smalls need extra trips
      local remainingSmall = smallBlocks - bigBlocks  -- Smalls that don't have a big to pair with
      estimatedTrips = bigBlocks + math.ceil(remainingSmall / 2)
    end
    estimatedTrips = math.max(1, estimatedTrips)  -- At least 1 trip
  else
    -- Rocks use tonnage system
    local tonnageRange = (isBulk and tierData.tonnageRange and tierData.tonnageRange.bulk) or (tierData.tonnageRange and tierData.tonnageRange.single) or {15, 25}
    requiredTons = math.random(tonnageRange[1], tonnageRange[2])

    if isSpecial then
      if math.random() < 0.5 then
        requiredTons = math.random(10, 20)
      else
        requiredTons = math.random(300, 500)
      end
    end
    
    estimatedTrips = math.ceil(requiredTons / (Config.TargetLoad / 1000))
  end

  local totalPayout = math.floor(requiredTons * payRate * bonusMultiplier)

  -- Contract names
  local contractNames
  if material == "marble" then
    contractNames = {
      "Marble Delivery", "Stone Block Order", "Monument Supply",
      "Sculpture Materials", "Premium Stone Haul", "Architectural Order",
      "Building Block Contract", "Luxury Stone Supply"
    }
  else
    contractNames = {
      "Standard Haul", "Local Delivery", "Construction Supply",
      "Industrial Order", "Building Materials", "Infrastructure Project",
      "Development Contract", "Municipal Supply"
    }
  end
  local name = contractNames[math.random(#contractNames)]
  if isBulk then name = "Bulk " .. name end
  if isUrgent then name = "URGENT: " .. name end

  -- NEW: Expiration calculation
  local currentHour = getCurrentGameHour()
  local baseExpiration = Config.Contracts.ContractExpirationTime[tier] or 6
  if isUrgent then
    baseExpiration = baseExpiration * (Config.Contracts.UrgentExpirationMult or 0.5)
  end
  local expiresAt = currentHour + baseExpiration

  return {
    id = os.time() + math.random(1000, 9999),
    name = name,
    tier = tier,
    material = material,
    requiredTons = requiredTons,
    requiredBlocks = requiredBlocks,  -- NEW: Block counts for marble {big = N, small = M, total = N+M}
    isBulk = isBulk,
    payRate = payRate,
    totalPayout = totalPayout,
    modifiers = modifiers,
    bonusMultiplier = bonusMultiplier,
    isSpecial = isSpecial,
    
    -- UNLINKED: Contracts now store destination only, not source zone
    -- The loading zone is determined by where the player is when they accept the contract
    destination = {
      pos = group.destination and group.destination.pos and vec3(group.destination.pos) or nil,
      name = group.destination and group.destination.name or "Destination",
      originZoneTag = group.secondaryTag,  -- For reference/display only
    },
    
    -- Legacy fields for compatibility (will be set when contract is accepted)
    group = nil,  -- Set to current zone when accepted
    groupTag = group.secondaryTag,  -- Original zone tag for display
    
    estimatedTrips = estimatedTrips,
    
    -- Lifecycle fields
    isUrgent = isUrgent,
    createdAt = currentHour,
    expiresAt = expiresAt,
    expirationHours = baseExpiration,
  }
end

-- Sort contracts by tier, then payout
local function sortContracts()
  table.sort(ContractSystem.availableContracts, function(a, b)
    -- Urgent contracts first
    if a.isUrgent ~= b.isUrgent then
      return a.isUrgent
    end
    if a.tier == b.tier then
      return a.totalPayout < b.totalPayout
    end
    return a.tier < b.tier
  end)
end

-- Generate initial batch of contracts (fewer than max)
local function generateInitialContracts()
  ContractSystem.availableContracts = {}
  if #availableGroups == 0 then return end

  local initialCount = Config.Contracts.InitialContracts or 4
  
  -- Weighted tier distribution for initial batch
  local tierDistribution = {
    pickTierForPlayer(),
    pickTierForPlayer(),
    math.random(1, 2),
    math.random(2, 3),
  }

  for i = 1, initialCount do
    local contract = generateContract(tierDistribution[i])
    if contract then
      table.insert(ContractSystem.availableContracts, contract)
    end
  end

  sortContracts()
  
  -- Reset spawn timer
  ContractSystem.lastContractSpawnTime = getCurrentGameHour()
  ContractSystem.contractsGeneratedToday = initialCount
  ContractSystem.initialContractsGenerated = true
  
  print("[Quarry] Generated " .. #ContractSystem.availableContracts .. " initial contracts")
end

-- Legacy function for compatibility - now calls initial generation
local function generateContracts()
  generateInitialContracts()
end

-- Try to spawn a new contract (called periodically)
local function trySpawnNewContract()
  -- Don't spawn if at max capacity
  if #ContractSystem.availableContracts >= (Config.Contracts.MaxActiveContracts or 6) then
    return false
  end
  
  local currentHour = getCurrentGameHour()
  local lastSpawn = ContractSystem.lastContractSpawnTime or 0
  local interval = Config.Contracts.ContractSpawnInterval or 2
  
  -- Handle day wrap (0-24 cycle)
  local hoursSinceSpawn = currentHour - lastSpawn
  if hoursSinceSpawn < 0 then
    hoursSinceSpawn = hoursSinceSpawn + 24  -- Wrapped around midnight
  end
  
  if hoursSinceSpawn >= interval then
    local contract = generateContract()
    if contract then
      table.insert(ContractSystem.availableContracts, contract)
      sortContracts()
      ContractSystem.lastContractSpawnTime = currentHour
      ContractSystem.contractsGeneratedToday = (ContractSystem.contractsGeneratedToday or 0) + 1
      
      -- Notify player
      local urgentText = contract.isUrgent and " (URGENT!)" or ""
      ui_message("New contract available: " .. contract.name .. urgentText, 4, "info")
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      
      print("[Quarry] Spawned new contract: " .. contract.name .. " (Tier " .. contract.tier .. ")")
      return true
    end
  end
  
  return false
end

-- Check for expired contracts and remove them
local function checkContractExpiration()
  local currentHour = getCurrentGameHour()
  local expiredCount = 0
  local remainingContracts = {}
  
  for _, contract in ipairs(ContractSystem.availableContracts) do
    local expiresAt = contract.expiresAt or math.huge
    
    -- Handle day wrap - if expiresAt is way higher than current (next day), adjust
    local hoursUntilExpire = expiresAt - currentHour
    if expiresAt > 24 and currentHour < 12 then
      -- Contract was created yesterday, adjust
      hoursUntilExpire = expiresAt - 24 - currentHour
    end
    
    if hoursUntilExpire > 0 then
      table.insert(remainingContracts, contract)
    else
      expiredCount = expiredCount + 1
      ContractSystem.expiredContractsTotal = (ContractSystem.expiredContractsTotal or 0) + 1
      print("[Quarry] Contract expired: " .. (contract.name or "Unknown"))
    end
  end
  
  if expiredCount > 0 then
    ContractSystem.availableContracts = remainingContracts
    ui_message(expiredCount .. " contract" .. (expiredCount > 1 and "s" or "") .. " expired", 3, "warning")
  end
  
  return expiredCount
end

-- Calculate hours remaining for a contract
local function getContractHoursRemaining(contract)
  if not contract or not contract.expiresAt then return 99 end
  local currentHour = getCurrentGameHour()
  local hoursLeft = contract.expiresAt - currentHour
  
  -- Handle day wrap
  if contract.expiresAt > 24 and currentHour < 12 then
    hoursLeft = contract.expiresAt - 24 - currentHour
  end
  if hoursLeft < 0 then hoursLeft = hoursLeft + 24 end
  
  return hoursLeft
end

local function shouldRefreshContracts()
  local currentDay = math.floor(os.time() / 86400)
  if currentDay - (ContractSystem.lastRefreshDay or -999) >= (Config.Contracts.RefreshDays or 3) then
    ContractSystem.lastRefreshDay = currentDay
    ContractSystem.initialContractsGenerated = false  -- Allow regeneration
    return true
  end
  return false
end

local function checkContractCompletion()
  if not ContractSystem.activeContract then return false end
  local contract = ContractSystem.activeContract
  local p = ContractSystem.contractProgress
  
  -- For marble contracts, check block counts
  if contract.material == "marble" and contract.requiredBlocks then
    local delivered = p.deliveredBlocks or { big = 0, small = 0 }
    local required = contract.requiredBlocks
    return (delivered.big >= required.big) and (delivered.small >= required.small)
  end
  
  -- For rocks contracts, check tons
  return (p and p.deliveredTons or 0) >= (contract.requiredTons or math.huge)
end

local function lerp(a, b, t) return a + (b - a) * t end

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
    cache = {
      -- Stock system initialization
      stock = {
        current = Config.Stock.DefaultMaxStock,
        max = Config.Stock.DefaultMaxStock,
        regenRate = Config.Stock.DefaultRegenRate,
        lastRegenCheck = getCurrentGameHour(),
      },
      spawnedPropCount = 0,  -- Track currently spawned props for this zone
    }
    groupCache[key] = cache
    print(string.format("[Quarry] Initialized stock for zone '%s': %d/%d", 
      key, cache.stock.current, cache.stock.max))
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

-- Update zone stock regeneration (called from onUpdate)
local function updateZoneStocks(dt)
  stockRegenTimer = stockRegenTimer + dt
  if stockRegenTimer < Config.Stock.RegenCheckInterval then return end
  stockRegenTimer = 0

  local currentHour = getCurrentGameHour()

  for _, group in ipairs(availableGroups) do
    local cache = groupCache[tostring(group.secondaryTag)]
    if cache and cache.stock then
      local stock = cache.stock
      local hoursPassed = currentHour - stock.lastRegenCheck
      
      -- Handle day wrap (0-24 cycle)
      if hoursPassed < 0 then hoursPassed = hoursPassed + 24 end
      
      if hoursPassed >= 1 then
        local regenAmount = math.floor(hoursPassed * stock.regenRate)
        if regenAmount > 0 and stock.current < stock.max then
          local oldStock = stock.current
          stock.current = math.min(stock.max, stock.current + regenAmount)
          stock.lastRegenCheck = currentHour
          
          if stock.current > oldStock then
            print(string.format("[Quarry] Zone '%s': Stock regenerated %d -> %d/%d", 
              group.secondaryTag, oldStock, stock.current, stock.max))
          end
        else
          -- Update last check time even if no regen happened
          stock.lastRegenCheck = currentHour
        end
      end
    end
  end
end

-- Get current stock info for a zone (for UI display)
local function getZoneStockInfo(group)
  if not group then return nil end
  local cache = ensureGroupCache(group)
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
  -- Known material types - add more here if needed
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
        -- Detect material type from loading zone tags
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
          materialType = materialType or "rocks"  -- Default to rocks if no material tag found
        })
        
        print(string.format("[Quarry] Discovered zone '%s' with material type: %s", 
          secondaryTag, materialType or "rocks (default)"))
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
  
  -- Debug: List all loading zones and their tags
  print("[Quarry] Sites loaded. Checking loading zones:")
  if sitesData.tagsToZones and sitesData.tagsToZones.loading then
    for i, zone in ipairs(sitesData.tagsToZones.loading) do
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

  if not groupCachePrecomputeQueued and #availableGroups > 0 then
    groupCachePrecomputeQueued = true
    core_jobsystem.create(function(job)
      for _, g in ipairs(availableGroups) do
        ensureGroupOffRoadCentroid(g)
        job.sleep(0.01)
      end
    end)
  end
end

-- ============================================================================
-- Zone Helper Functions (must be defined before acceptContract)
-- ============================================================================

-- Check if player is in any loading zone
local function isPlayerInAnyLoadingZone(playerPos)
  for _, g in ipairs(availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return true
    end
  end
  return false
end

-- Returns the specific zone group the player is currently in, or nil
local function getPlayerCurrentZone(playerPos)
  for _, g in ipairs(availableGroups) do
    if g.loading and g.loading.containsPoint2D and g.loading:containsPoint2D(playerPos) then
      return g
    end
  end
  return nil
end

-- Check if a zone is the "starter" zone (has "starter" in its tag)
local function isStarterZone(group)
  if not group or not group.secondaryTag then return false end
  return string.lower(tostring(group.secondaryTag)) == "starter"
end

-- Get the starter zone from availableGroups (may not exist if starter has no spawn/dest)
local function getStarterZone()
  for _, g in ipairs(availableGroups) do
    if isStarterZone(g) then
      return g
    end
  end
  return nil
end

-- Get the starter zone directly from sitesData (always works)
local function getStarterZoneFromSites()
  if not sitesData or not sitesData.tagsToZones or not sitesData.tagsToZones.loading then
    return nil
  end
  for _, zone in ipairs(sitesData.tagsToZones.loading) do
    local hasStarter = zone.customFields and zone.customFields.tags and zone.customFields.tags["starter"]
    if hasStarter then
      return zone
    end
  end
  return nil
end

-- Get all zones that serve a specific material type
-- EXCLUDES the starter zone (starter is only for accepting contracts, not loading)
local function getZonesByMaterial(materialType)
  local zones = {}
  for _, g in ipairs(availableGroups) do
    -- Skip starter zone - it's only for contract selection, not loading
    if not isStarterZone(g) and g.materialType == materialType then
      table.insert(zones, g)
    end
  end
  return zones
end

-- Check if player is in the starter zone
-- This checks ALL loading zones from sitesData, not just discovered groups
-- (because starter zone may not have spawn/destination and won't be in availableGroups)
local starterZoneDebugTimer = 0
local function isPlayerInStarterZone(playerPos)
  -- First try the discovered groups
  local currentZone = getPlayerCurrentZone(playerPos)
  if currentZone and isStarterZone(currentZone) then
    return true
  end
  
  -- Also check raw sites data for zones tagged "starter"
  -- (in case starter zone wasn't discovered as a full group)
  if sitesData and sitesData.tagsToZones and sitesData.tagsToZones.loading then
    local loadingZones = sitesData.tagsToZones.loading
    for _, zone in ipairs(loadingZones) do
      -- Tags are stored as dictionary: {starter = true, loading = true}
      local hasStarter = zone.customFields and zone.customFields.tags and zone.customFields.tags["starter"]
      if hasStarter then
        -- Check if player is in this zone
        if zone.containsPoint2D then
          local isInZone = zone:containsPoint2D(playerPos)
          if isInZone then
            return true
          end
        end
      end
    end
  else
    -- Debug: print why we can't check
    starterZoneDebugTimer = starterZoneDebugTimer + 0.016
    if starterZoneDebugTimer > 5 then
      starterZoneDebugTimer = 0
      print(string.format("[Quarry] isPlayerInStarterZone debug: sitesData=%s, tagsToZones=%s, loading=%s",
        tostring(sitesData ~= nil),
        tostring(sitesData and sitesData.tagsToZones ~= nil),
        tostring(sitesData and sitesData.tagsToZones and sitesData.tagsToZones.loading ~= nil)))
    end
  end
  
  return false
end

local function calculateSpawnTransformForLocation(spawnPos, targetPos)
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
            if directDir:length() > 0.1 then
              dir = directDir:normalized()
            end
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
              if pathDir:length() > 0.1 then
                dir = pathDir:normalized()
              end
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

  local group = jobObjects.activeGroup
  -- Use zone's material type from tags (set in discoverGroups), fallback to jobObjects.materialType
  local materialType = group.materialType or jobObjects.materialType or "rocks"
  local zone = group.loading
  
  -- Get or create cache for this zone
  local cache = ensureGroupCache(group)
  if not cache then return end
  
  -- Ensure offRoadCentroid is calculated
  ensureGroupOffRoadCentroid(group)
  
  -- ========== STOCK CHECKS ==========
  -- Check if zone has stock available
  if cache.stock and cache.stock.current <= 0 then
    ui_message("This zone is out of stock! Wait for regeneration.", 5, "warning")
    print(string.format("[Quarry] Zone '%s' out of stock (0/%d)", group.secondaryTag, cache.stock.max))
    return
  end
  
  -- Check spawn limit (performance) - count actual props in queue, not cached value
  local maxSpawned = Config.Stock.MaxSpawnedProps[materialType] or 2
  local currentlySpawned = 0
  for _, entry in ipairs(rockPileQueue) do
    if entry.materialType == materialType then
      currentlySpawned = currentlySpawned + 1
    end
  end
  -- Sync cache with actual count
  cache.spawnedPropCount = currentlySpawned
  
  if currentlySpawned >= maxSpawned then
    print(string.format("[Quarry] Zone '%s' at max spawned props (%d/%d)", 
      group.secondaryTag, currentlySpawned, maxSpawned))
    return
  end
  
  -- Calculate how many props we can spawn
  local roomForMore = maxSpawned - currentlySpawned
  local stockAvailable = cache.stock and cache.stock.current or Config.Stock.DefaultMaxStock
  local stockCost = Config.Stock.StockCostPerProp[materialType] or 1
  local propsToSpawn = math.min(roomForMore, math.floor(stockAvailable / stockCost))
  
  if propsToSpawn <= 0 then
    ui_message("Not enough stock to spawn materials.", 3, "warning")
    return
  end
  
  -- ========== POSITION CALCULATION ==========
  local basePos = cache.offRoadCentroid or nil
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

  -- ========== SPAWN PROPS ==========
  local propsSpawned = 0
  
  if materialType == "rocks" then
    for i = 1, propsToSpawn do
      local offset = vec3((i - 1) * 3, 0, 0)  -- Offset each rock pile
      local rocks = core_vehicles.spawnNewVehicle(Config.RockProp, { 
        config = "default", 
        pos = basePos + offset, 
        rot = quatFromDir(vec3(0,1,0)), 
        autoEnterVehicle = false 
      })
      if rocks then
        table.insert(rockPileQueue, { id = rocks:getID(), mass = Config.RockMassPerPile, materialType = "rocks" })
        propsSpawned = propsSpawned + 1
        manageRockCapacity()
      end
    end
  elseif materialType == "marble" then
    local offsets = { vec3(-2, 0, 0), vec3(2, 0, 0) }
    local offsetIdx = 1
    
    -- Get contract requirements and what's already delivered
    local contract = ContractSystem.activeContract
    local requiredBlocks = contract and contract.requiredBlocks or { big = 1, small = 1 }
    local delivered = ContractSystem.contractProgress and ContractSystem.contractProgress.deliveredBlocks or { big = 0, small = 0 }
    
    -- Count blocks already spawned (in rockPileQueue)
    local spawnedBig = 0
    local spawnedSmall = 0
    for _, entry in ipairs(rockPileQueue) do
      if entry.materialType == "marble" then
        if entry.blockType == "big_rails" then
          spawnedBig = spawnedBig + 1
        elseif entry.blockType == "rails" then
          spawnedSmall = spawnedSmall + 1
        end
      end
    end
    
    -- Calculate what's still needed (required - delivered - already spawned)
    local needBig = math.max(0, (requiredBlocks.big or 0) - (delivered.big or 0) - spawnedBig)
    local needSmall = math.max(0, (requiredBlocks.small or 0) - (delivered.small or 0) - spawnedSmall)
    
    print(string.format("[Quarry] Marble spawn check: need %d big, %d small (required: %d/%d, delivered: %d/%d, spawned: %d/%d)",
      needBig, needSmall, requiredBlocks.big or 0, requiredBlocks.small or 0, 
      delivered.big or 0, delivered.small or 0, spawnedBig, spawnedSmall))
    
    -- Build a list of blocks to spawn (up to propsToSpawn limit, max 2)
    local blocksToSpawn = {}
    local maxToSpawn = math.min(propsToSpawn, 2)
    
    -- Add big blocks needed
    for i = 1, math.min(needBig, maxToSpawn - #blocksToSpawn) do
      table.insert(blocksToSpawn, { config = "big_rails", mass = 38000 })
    end
    
    -- Add small blocks needed
    for i = 1, math.min(needSmall, maxToSpawn - #blocksToSpawn) do
      table.insert(blocksToSpawn, { config = "rails", mass = 19000 })
    end
    
    -- Spawn the blocks
    for _, blockData in ipairs(blocksToSpawn) do
      local pos = basePos + (offsets[offsetIdx] or vec3(0,0,0))
      offsetIdx = offsetIdx + 1
      
      local block = core_vehicles.spawnNewVehicle(Config.MarbleProp, { 
        config = blockData.config, 
        pos = pos, 
        rot = quatFromDir(vec3(0,1,0)), 
        autoEnterVehicle = false 
      })
      if block then
        table.insert(rockPileQueue, { 
          id = block:getID(), 
          mass = blockData.mass, 
          materialType = "marble", 
          blockType = blockData.config 
        })
        propsSpawned = propsSpawned + 1
        manageRockCapacity()
        print(string.format("[Quarry] Spawned marble block: %s", blockData.config))
      end
    end
    
    if #blocksToSpawn == 0 then
      print("[Quarry] No marble blocks needed to spawn")
    end
  end
  
  -- ========== UPDATE STOCK ==========
  if propsSpawned > 0 then
    cache.spawnedPropCount = (cache.spawnedPropCount or 0) + propsSpawned
    -- Stock is consumed when props are delivered, not when spawned
    -- This allows player to "borrow" from stock and return unused props
    print(string.format("[Quarry] Zone '%s': Spawned %d %s props (spawned: %d/%d, stock: %d/%d)", 
      group.secondaryTag, propsSpawned, materialType, 
      cache.spawnedPropCount, maxSpawned, cache.stock.current, cache.stock.max))
  end
end

local function beginActiveContractTrip()
  local contract = ContractSystem.activeContract
  if not contract or not contract.group then return false end
  if isDispatching then return false end
  isDispatching = true

  uiHidden = false  -- Show UI when starting a job

  -- activeGroup = the zone where we're loading (set when contract was accepted)
  jobObjects.activeGroup = contract.group
  -- Use the zone's material type from tags (takes precedence over contract.material)
  jobObjects.materialType = contract.group.materialType or contract.material or "rocks"
  
  -- Store the contract's destination (where the truck will deliver to)
  -- This is SEPARATE from the loading zone
  jobObjects.deliveryDestination = contract.destination

  markerCleared = false
  truckStoppedInLoading = false
  payloadUpdateTimer = 0

  core_groundMarkers.setPath(vec3(jobObjects.activeGroup.loading.center))

  local targetPos = vec3(jobObjects.activeGroup.loading.center)

  if #rockPileQueue == 0 then
    spawnJobMaterials()
  end
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

  local contractMaterial = contract.material or "rocks"
  
  -- Find all zones that can serve this material type
  compatibleZones = getZonesByMaterial(contractMaterial)
  
  if #compatibleZones == 0 then
    ui_message(string.format("No zones available for %s!", contractMaterial:upper()), 5, "error")
    return
  end
  
  -- Remove the contract from available list (it's now active)
  table.remove(ContractSystem.availableContracts, contractIndex)
  
  -- DON'T bind to a zone yet - player will choose by driving to one
  -- Store destination and material, but group = nil until zone is chosen
  contract.group = nil  -- Will be set when player enters a compatible zone
  contract.loadingZoneTag = nil
  
  -- Store the contract material for later
  jobObjects.materialType = contractMaterial
  jobObjects.deliveryDestination = contract.destination

  ContractSystem.activeContract = contract
  ContractSystem.contractProgress = {
    deliveredTons = 0,
    totalPaidSoFar = 0,
    startTime = os.clock(),
    deliveryCount = 0,
    deliveredBlocks = { big = 0, small = 0, total = 0 }
  }
  
  -- Enter "choosing zone" state - markers will be drawn on all compatible zones
  currentState = STATE_CHOOSING_ZONE
  
  Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
  
  local zoneNames = {}
  for _, z in ipairs(compatibleZones) do
    table.insert(zoneNames, z.secondaryTag or "Unknown")
  end
  
  ui_message(string.format("Contract accepted! Drive to any %s zone to load: %s", 
    contractMaterial:upper(), table.concat(zoneNames, ", ")), 8, "info")
  
  print(string.format("[Quarry] Contract accepted. Material: %s. Compatible zones: %s", 
    contractMaterial, table.concat(zoneNames, ", ")))
end

local function clearProps()
  for i = #rockPileQueue, 1, -1 do
    local id = rockPileQueue[i].id
    if id then
      marbleInitialState[id] = nil  -- Clear initial state tracking
      marbleDamageState[id] = nil  -- Clear damage cache
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

  -- Clear debug visualization cache
  debugDrawCache.bedData = nil
  debugDrawCache.nodePoints = {}
  debugDrawCache.marblePieces = {}

  clearProps()

  if deleteTruck and jobObjects.truckID then
    local obj = be:getObjectByID(jobObjects.truckID)
    if obj then obj:delete() end
  end

  jobObjects.truckID = nil
  jobObjects.currentLoadMass = 0
  jobObjects.lastDeliveredMass = 0
  jobObjects.deliveredPropIds = nil
  jobObjects.materialType = nil
  jobObjects.activeGroup = nil
  jobObjects.deliveryDestination = nil  -- Unlinked contract destination
  jobObjects.deferredTruckTargetPos = nil
  jobObjects.loadingZoneTargetPos = nil
  jobObjects.truckSpawnQueued = false
  jobObjects.truckSpawnPos = nil
  jobObjects.truckSpawnRot = nil
  jobObjects.marbleDamage = {}
  jobObjects.totalMarbleDamagePercent = 0
  jobObjects.anyMarbleDamaged = false
  jobObjects.lastDeliveryDamagePercent = 0
  jobObjects.deliveryBlocksStatus = nil
  marbleDamageState = {}
  
  -- Reset truck movement tracking
  truckStoppedTimer = 0
  truckLastPosition = nil
  truckResendCount = 0
  
  -- Clear zone choice markers
  compatibleZones = {}

  currentState = STATE_IDLE
end

local function abandonContract()
  if not ContractSystem.activeContract then return end
  ui_message(string.format("Contract abandoned! Penalty: $%d", Config.Contracts.AbandonPenalty or 0), 6, "warning")

  -- Safe career payment handling
  local success, err = pcall(function()
    local career = extensions.career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = extensions.career_modules_payment
      if paymentModule and type(paymentModule.pay) == "function" then
        paymentModule.pay(-(Config.Contracts.AbandonPenalty or 0), {label = "Contract Abandonment"})
      end
    end
  end)
  if not success then
    print("[Quarry] Warning: Could not apply abandonment penalty: " .. tostring(err))
  end

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

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

  -- Safe career payment handling
  local success, err = pcall(function()
    local career = extensions.career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = extensions.career_modules_payment
      if paymentModule and type(paymentModule.pay) == "function" and penalty ~= 0 then
        paymentModule.pay(-math.abs(penalty), {label = "Contract Failure"})
      end
    end
  end)
  if not success then
    print("[Quarry] Warning: Could not apply failure penalty: " .. tostring(err))
  end

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

  cleanupJob(true)
end

local function completeContract()
  if not ContractSystem.activeContract then return end
  local contract = ContractSystem.activeContract

  -- Full payment on contract completion (no progressive payments)
  local totalPay = contract.totalPayout or 0

  -- Safe career reward handling
  local careerPaid = false
  local success, err = pcall(function()
    local career = extensions.career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = extensions.career_modules_payment
      if paymentModule and type(paymentModule.reward) == "function" then
        local xpReward = math.floor((contract.requiredTons or 0) * 10)
        paymentModule.reward({
          money = { amount = totalPay, canBeNegative = false },
          labor = { amount = xpReward, canBeNegative = false }
        }, { label = string.format("Contract: %s", contract.name), tags = {"gameplay", "mission", "reward"} })
        careerPaid = true
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Career>Buy_01')
        ui_message(string.format("CONTRACT COMPLETE! Earned $%d", totalPay), 8, "success")
      end
    end
  end)
  
  if not success then
    print("[Quarry] Warning: Could not apply contract reward: " .. tostring(err))
  end
  
  if not careerPaid then
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message(string.format("SANDBOX: Contract payout: $%d", totalPay), 6, "success")
  end

  PlayerData.contractsCompleted = (PlayerData.contractsCompleted or 0) + 1
  PlayerData.level = (PlayerData.level or 1) + 1

  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

  clearProps()
  if jobObjects.truckID then
    local obj = be:getObjectByID(jobObjects.truckID)
    if obj then obj:delete() end
  end
  jobObjects.truckID = nil
  jobObjects.currentLoadMass = 0
  jobObjects.lastDeliveredMass = 0
  jobObjects.deliveredPropIds = nil
  jobObjects.materialType = nil
  jobObjects.activeGroup = nil
  jobObjects.deferredTruckTargetPos = nil
  jobObjects.loadingZoneTargetPos = nil
  jobObjects.truckSpawnQueued = false
  jobObjects.truckSpawnPos = nil
  jobObjects.truckSpawnRot = nil
  markerCleared = false
  truckStoppedInLoading = false
  payloadUpdateTimer = 0
  core_groundMarkers.setPath(nil)
  currentState = STATE_IDLE
end

local function spawnTruckForGroup(group, materialType, targetPos)
  if not group or not group.spawn or not group.spawn.pos then return nil end

  local pos, rot = calculateSpawnTransformForLocation(vec3(group.spawn.pos), targetPos)

  local truckModel = (materialType == "marble") and Config.MarbleTruckModel or Config.RockTruckModel
  local truckConfig = (materialType == "marble") and Config.MarbleTruckConfig or Config.RockTruckConfig

  local truck = core_vehicles.spawnNewVehicle(truckModel, { pos = pos, rot = rot, config = truckConfig, autoEnterVehicle = false })
  if not truck then return nil end
  
  jobObjects.truckSpawnPos = pos
  jobObjects.truckSpawnRot = rot
  
  return truck:getID()
end

local function driveTruckToPoint(truckId, targetPos)
  local truck = be:getObjectByID(truckId)
  if not truck then return end
  truck:queueLuaCommand('if not driver then extensions.load("driver") end')
  truck:queueLuaCommand("controller.mainController.setHandbrake(0)")
  core_jobsystem.create(function(job)
    job.sleep(0.5)
    -- Configure AI to be more persistent and ignore collisions
    truck:queueLuaCommand('ai.setAggressionMode("rubberBand")')  -- More aggressive driving
    truck:queueLuaCommand('ai.setAggression(0.8)')  -- More aggressive driving
    truck:queueLuaCommand('ai.setIgnoreCollision(true)')  -- Don't stop on collisions
    job.sleep(0.1)
    truck:queueLuaCommand('driver.returnTargetPosition(' .. serialize(targetPos) .. ')')
  end)
end

local function resumeTruck()
  if not jobObjects.truckID then
    print("[Quarry] No truck to resume")
    return
  end
  if not jobObjects.activeGroup then
    print("[Quarry] No active group")
    return
  end
  
  local targetPos = nil
  if currentState == STATE_DELIVERING and jobObjects.activeGroup.destination then
    targetPos = vec3(jobObjects.activeGroup.destination.pos)
    print("[Quarry] Resuming truck to destination")
  elseif currentState == STATE_TRUCK_ARRIVING and jobObjects.loadingZoneTargetPos then
    targetPos = jobObjects.loadingZoneTargetPos
    print("[Quarry] Resuming truck to loading zone")
  else
    print("[Quarry] Unknown state or no target - current state: " .. tostring(currentState))
    return
  end
  
  -- Apply aggressive AI settings before resuming
  local truck = be:getObjectByID(jobObjects.truckID)
  if truck then
    truck:queueLuaCommand('ai.setAggressionMode("rubberBand")')  -- More aggressive driving
    truck:queueLuaCommand('ai.setAggression(0.8)')  -- More aggressive driving
    truck:queueLuaCommand('ai.setIgnoreCollision(true)')  -- Don't stop on collisions
  end
  
  driveTruckToPoint(jobObjects.truckID, targetPos)
  print("[Quarry] Truck resumed!")
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
  
  -- Cache the bed data for persistent drawing
  debugDrawCache.bedData = bedData
end

local function drawDebugVisualization()
  if not ENABLE_DEBUG then return end
  
  local bedData = debugDrawCache.bedData
  if bedData then
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
  
  -- Draw cached node points
  for _, point in ipairs(debugDrawCache.nodePoints) do
    if point.inside then
      debugDrawer:drawSphere(point.pos, 0.05, ColorF(0, 1, 0, 0.5))
    else
      debugDrawer:drawSphere(point.pos, 0.03, ColorF(1, 0, 0, 0.3))
    end
  end
  
  -- Draw marble damage status
  for _, pieceData in ipairs(debugDrawCache.marblePieces) do
    if pieceData.center then
      local center = pieceData.center
      local brokenCount = pieceData.brokenCount or 0
      local totalGroups = pieceData.totalGroups or 18
      local damagePercent = pieceData.damagePercent or 0
      
      -- Draw sphere at marble center - color based on damage
      local color
      if brokenCount > 0 then
        -- Red intensity based on damage
        local redIntensity = math.min(1, 0.3 + (damagePercent / 100) * 0.7)
        color = ColorF(redIntensity, 0.2, 0.2, 0.9)
      else
        -- Green for undamaged
        color = ColorF(0.2, 1, 0.2, 0.7)
      end
      debugDrawer:drawSphere(center + vec3(0, 0, 1), 0.3, color)
      
      -- Draw damage text above the marble
      local textPos = center + vec3(0, 0, 2)
      local text = string.format("DMG: %d/%d (%.0f%%)", brokenCount, totalGroups, damagePercent)
      debugDrawer:drawTextAdvanced(textPos, text, ColorF(1, 1, 1, 1), true, false, ColorI(0, 0, 0, 200))
    end
  end
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

  -- Clear and rebuild debug cache for node points
  if ENABLE_DEBUG then
    debugDrawCache.nodePoints = {}
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
        local isInside = isPointInTruckBed(worldPoint, bedData)
        if isInside then
          nodesInside = nodesInside + 1
        end
        if ENABLE_DEBUG then
          table.insert(debugDrawCache.nodePoints, {pos = worldPoint, inside = isInside})
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

-- Calculate truck payload excluding damaged marble blocks
local function calculateUndamagedTruckPayload()
  if #rockPileQueue == 0 then return 0 end
  if not jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then return 0 end

  local bedData = getTruckBedData(truck)
  if not bedData then return 0 end

  local defaultMass = Config.RockMassPerPile
  if jobObjects.materialType == "marble" then
    defaultMass = Config.MarbleMassDefault or Config.RockMassPerPile
  end

  local totalMass = 0
  for _, rockEntry in ipairs(rockPileQueue) do
    -- Skip damaged marble blocks
    local damageInfo = jobObjects.marbleDamage and jobObjects.marbleDamage[rockEntry.id]
    if damageInfo and damageInfo.isDamaged then
      -- Skip this block - it's damaged
    else
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
          end
        end
        if nodesChecked > 0 then
          local entryMass = rockEntry.mass or defaultMass
          local ratio = nodesInside / nodesChecked
          totalMass = totalMass + (entryMass * ratio)
        end
      end
    end
  end
  return totalMass
end

local function captureMarbleInitialState(objId)
  local obj = be:getObjectByID(objId)
  if not obj then return end
  
  local nodeCount = obj:getNodeCount()
  if nodeCount <= 0 then return end
  
  marbleInitialState[objId] = {
    nodeCount = nodeCount,
    captureTime = os.clock(),
    captured = true,
    initialCentroids = nil  -- Will be set on first damage calculation after settling
  }
  
  -- Initialize damage cache for this marble
  marbleDamageState[objId] = {
    isDamaged = false,
    lastUpdate = 0
  }
end

-- Query the vehicle for part damage data
-- Sends a Lua command to the vehicle that will report damaged parts
local function queryMarbleDamageState(objId)
  local obj = be:getObjectByID(objId)
  if not obj then return end
  
  local vehicleScript = [[
    local myObjId = ]] .. tostring(objId) .. [[
    local isDamaged = false
    if beamstate and beamstate.getPartDamageData then
      local damageData = beamstate.getPartDamageData() or {}
      for partKey, partInfo in pairs(damageData) do
        if type(partKey) == "string" and not string.find(string.lower(partKey), "rails", 1, true) then
          local dmgValue = (type(partInfo) == "table" and partInfo.damage) or 0
          if dmgValue and dmgValue > 0 then
            isDamaged = true
            break
          end
        end
      end
    end

    obj:queueGameEngineLua("gameplay_quarry.onMarbleDamageCallback(" .. myObjId .. ", " .. tostring(isDamaged) .. ")")
  ]]
  
  obj:queueLuaCommand(vehicleScript)
end

-- Callback handler for part damage data from vehicle
local function onMarbleDamageCallback(objId, isDamaged)
  if not objId then return end
  
  local damaged = isDamaged and true or false
  
  marbleDamageState[objId] = {
    isDamaged = damaged,
    lastUpdate = os.clock()
  }
end

-- Calculate centroids for 8 spatial regions (octants) of the marble block
-- Filters out wooden rail nodes using LOCAL Z position (rails are below Z=0 in local coords)
local function calculatePieceCentroids(obj)
  local nodeCount = obj:getNodeCount()
  if nodeCount <= 0 then return nil end
  
  local objPos = obj:getPosition()
  local tf = obj:getTransform()
  local axisX = tf:getColumn(0)
  local axisY = tf:getColumn(1)
  local axisZ = tf:getColumn(2)
  
  -- Collect marble block nodes only (filter by LOCAL Z position)
  -- Marble block nodes have local Z >= 0, rails are below Z=0
  local worldPositions = {}
  local localPositions = {}
  
  for i = 0, nodeCount - 1 do
    local localPos = obj:getNodePosition(i)
    
    -- Only include nodes with local Z >= 0 (marble block, not rails)
    -- The marble block has Z from 0 to ~1.55m, rails are at Z = -0.01 to -0.22
    if localPos.z >= 0 then
      local worldPoint = objPos - (axisX * localPos.x) - (axisY * localPos.y) + (axisZ * localPos.z)
      table.insert(worldPositions, worldPoint)
      table.insert(localPositions, localPos)
    end
  end
  
  -- Need at least some nodes to calculate
  if #worldPositions == 0 then return nil end
  
  -- Calculate bounding box of filtered positions (in world coords for drawing)
  local minX, maxX = math.huge, -math.huge
  local minY, maxY = math.huge, -math.huge
  local minZ, maxZ = math.huge, -math.huge
  
  for _, pos in ipairs(worldPositions) do
    minX = math.min(minX, pos.x); maxX = math.max(maxX, pos.x)
    minY = math.min(minY, pos.y); maxY = math.max(maxY, pos.y)
    minZ = math.min(minZ, pos.z); maxZ = math.max(maxZ, pos.z)
  end
  
  -- Calculate center in LOCAL coordinates for consistent octant division
  local localMinX, localMaxX = math.huge, -math.huge
  local localMinY, localMaxY = math.huge, -math.huge
  local localMinZ, localMaxZ = math.huge, -math.huge
  
  for _, pos in ipairs(localPositions) do
    localMinX = math.min(localMinX, pos.x); localMaxX = math.max(localMaxX, pos.x)
    localMinY = math.min(localMinY, pos.y); localMaxY = math.max(localMaxY, pos.y)
    localMinZ = math.min(localMinZ, pos.z); localMaxZ = math.max(localMaxZ, pos.z)
  end
  
  local localCenterX = (localMinX + localMaxX) / 2
  local localCenterY = (localMinY + localMaxY) / 2
  local localCenterZ = (localMinZ + localMaxZ) / 2
  
  -- Divide nodes into 8 octants using LOCAL coordinates (consistent regardless of rotation)
  local octants = {}
  for i = 1, 8 do
    octants[i] = {sum = vec3(0, 0, 0), count = 0}
  end
  
  for idx, localPos in ipairs(localPositions) do
    local octantIdx = 1
    if localPos.x >= localCenterX then octantIdx = octantIdx + 1 end
    if localPos.y >= localCenterY then octantIdx = octantIdx + 2 end
    if localPos.z >= localCenterZ then octantIdx = octantIdx + 4 end
    
    -- Use world position for the centroid (for visualization)
    octants[octantIdx].sum = octants[octantIdx].sum + worldPositions[idx]
    octants[octantIdx].count = octants[octantIdx].count + 1
  end
  
  -- Calculate centroids for each octant
  local centroids = {}
  for i = 1, 8 do
    if octants[i].count > 0 then
      centroids[i] = octants[i].sum / octants[i].count
    end
  end
  
  local worldCenterX = (minX + maxX) / 2
  local worldCenterY = (minY + maxY) / 2
  local worldCenterZ = (minZ + maxZ) / 2
  
  return centroids, {
    center = vec3(worldCenterX, worldCenterY, worldCenterZ),
    size = vec3(maxX - minX, maxY - minY, maxZ - minZ)
  }
end

local function calculateMarbleDamage()
  if jobObjects.materialType ~= "marble" then
    jobObjects.marbleDamage = {}
    jobObjects.totalMarbleDamagePercent = 0
    jobObjects.anyMarbleDamaged = false
    debugDrawCache.marblePieces = {}
    return
  end

  if #rockPileQueue == 0 then
    jobObjects.marbleDamage = {}
    jobObjects.totalMarbleDamagePercent = 0
    jobObjects.anyMarbleDamaged = false
    debugDrawCache.marblePieces = {}
    return
  end

  local totalDamage = 0
  local damagedCount = 0
  local checkedCount = 0

  -- Clear and rebuild debug cache for marble pieces
  if ENABLE_DEBUG then
    debugDrawCache.marblePieces = {}
  end

  for _, rockEntry in ipairs(rockPileQueue) do
    local obj = be:getObjectByID(rockEntry.id)
    if obj then
      checkedCount = checkedCount + 1
      
      -- Capture initial state if not already done
      local initialState = marbleInitialState[rockEntry.id]
      if not initialState then
        captureMarbleInitialState(rockEntry.id)
        initialState = marbleInitialState[rockEntry.id]
      end
      
      -- Wait for settling period before calculating damage
      if initialState and initialState.captureTime and (os.clock() - initialState.captureTime) < 2.0 then
        jobObjects.marbleDamage[rockEntry.id] = {
          damage = 0,
          isDamaged = false,
          settling = true,
          brokenPieces = 0
        }
      else
        -- Query part damage from the vehicle (throttled by callback timing)
        local damageCache = marbleDamageState[rockEntry.id]
        local now = os.clock()
        
        -- Query every 0.5 seconds to avoid spamming
        if not damageCache or (now - damageCache.lastUpdate) > 0.5 then
          queryMarbleDamageState(rockEntry.id)
        end
        
        -- Use cached part damage to calculate damage
        local isDamaged = damageCache and damageCache.isDamaged or false
        local damagePercent = isDamaged and 1 or 0
        
        jobObjects.marbleDamage[rockEntry.id] = {
          damage = damagePercent,
          isDamaged = isDamaged,
          brokenPieces = isDamaged and 1 or 0,
          totalConnections = 1,
          brokenGroups = {}
        }
        
        -- Cache debug data for visualization
        if ENABLE_DEBUG then
          local objPos = obj:getPosition()
          -- Store simple damage info for visualization
          table.insert(debugDrawCache.marblePieces, {
            center = objPos,
            brokenCount = isDamaged and 1 or 0,
            totalGroups = 1,
            damagePercent = damagePercent * 100,
            brokenGroups = {}
          })
        end
        
        totalDamage = totalDamage + damagePercent
        if isDamaged then
          damagedCount = damagedCount + 1
        end
      end
    end
  end
  
  if checkedCount > 0 then
    jobObjects.totalMarbleDamagePercent = (totalDamage / checkedCount) * 100
    jobObjects.anyMarbleDamaged = damagedCount > 0
  else
    jobObjects.totalMarbleDamagePercent = 0
    jobObjects.anyMarbleDamaged = false
  end
end

local function getLoadedPropIdsInTruck(minRatio)
  minRatio = minRatio or 0.25
  if #rockPileQueue == 0 then return {} end
  if not jobObjects.truckID then return {} end

  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then return {} end

  local bedData = getTruckBedData(truck)
  if not bedData then return {} end

  local ids = {}
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
        end
      end
      if nodesChecked > 0 then
        local ratio = nodesInside / nodesChecked
        if ratio >= minRatio then
          table.insert(ids, rockEntry.id)
        end
      end
    end
  end
  return ids
end

-- Check if a specific block is loaded in the truck (returns ratio 0-1)
local function getBlockLoadRatio(blockId)
  if not jobObjects.truckID then return 0 end
  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then return 0 end

  local bedData = getTruckBedData(truck)
  if not bedData then return 0 end

  local obj = be:getObjectByID(blockId)
  if not obj then return 0 end

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
    end
  end
  if nodesChecked > 0 then
    return nodesInside / nodesChecked
  end
  return 0
end

-- Get block status info for all marble blocks
local function getMarbleBlocksStatus()
  local blocks = {}
  for i, rockEntry in ipairs(rockPileQueue) do
    local damageInfo = jobObjects.marbleDamage and jobObjects.marbleDamage[rockEntry.id]
    local isDamaged = damageInfo and damageInfo.isDamaged or false
    local loadRatio = getBlockLoadRatio(rockEntry.id)
    local isLoaded = loadRatio >= 0.1  -- 10% in truck = loaded
    
    table.insert(blocks, {
      index = i,
      id = rockEntry.id,
      isDamaged = isDamaged,
      isLoaded = isLoaded,
      loadRatio = loadRatio
    })
  end
  return blocks
end

-- Consume stock from a zone when materials are delivered
local function consumeZoneStock(group, propsDelivered)
  if not group then return end
  local cache = ensureGroupCache(group)
  if not cache or not cache.stock then return end
  
  local materialType = group.materialType or "rocks"
  local stockCost = Config.Stock.StockCostPerProp[materialType] or 1
  local totalCost = propsDelivered * stockCost
  
  local oldStock = cache.stock.current
  cache.stock.current = math.max(0, cache.stock.current - totalCost)
  cache.spawnedPropCount = math.max(0, (cache.spawnedPropCount or 0) - propsDelivered)
  
  print(string.format("[Quarry] Zone '%s': Consumed %d stock (delivered %d props). Stock: %d -> %d/%d, Spawned: %d", 
    group.secondaryTag, totalCost, propsDelivered, oldStock, cache.stock.current, cache.stock.max, cache.spawnedPropCount))
end

local function despawnPropIds(propIds)
  if not propIds or #propIds == 0 then return end
  local idSet = {}
  for _, id in ipairs(propIds) do idSet[id] = true end

  local propsRemoved = 0
  for i = #rockPileQueue, 1, -1 do
    local id = rockPileQueue[i].id
    if id and idSet[id] then
      marbleInitialState[id] = nil  -- Clear initial state tracking
      marbleDamageState[id] = nil  -- Clear damage cache
      local obj = be:getObjectByID(id)
      if obj then obj:delete() end
      table.remove(rockPileQueue, i)
      propsRemoved = propsRemoved + 1
    end
  end
  
  -- Consume stock from the active zone for delivered props
  if propsRemoved > 0 and jobObjects.activeGroup then
    consumeZoneStock(jobObjects.activeGroup, propsRemoved)
  end
end

local function handleDeliveryArrived()
  local contract = ContractSystem.activeContract
  local group = jobObjects.activeGroup
  if not contract or not group then
    cleanupJob(true)
    return
  end

  -- Initialize progress if needed
  ContractSystem.contractProgress = ContractSystem.contractProgress or {
    deliveredTons = 0, 
    totalPaidSoFar = 0, 
    deliveryCount = 0,
    deliveredBlocks = { big = 0, small = 0, total = 0 }
  }
  -- Ensure deliveredBlocks exists and has valid number values
  if not ContractSystem.contractProgress.deliveredBlocks or type(ContractSystem.contractProgress.deliveredBlocks) ~= "table" then
    ContractSystem.contractProgress.deliveredBlocks = { big = 0, small = 0, total = 0 }
  end
  -- Ensure values are numbers, not nil or something else
  ContractSystem.contractProgress.deliveredBlocks.big = tonumber(ContractSystem.contractProgress.deliveredBlocks.big) or 0
  ContractSystem.contractProgress.deliveredBlocks.small = tonumber(ContractSystem.contractProgress.deliveredBlocks.small) or 0
  ContractSystem.contractProgress.deliveredBlocks.total = tonumber(ContractSystem.contractProgress.deliveredBlocks.total) or 0
  
  -- Sanity check: if values are unreasonably high (corrupted), reset them
  local maxReasonableBlocks = 50  -- No contract should ever need more than 50 blocks
  if ContractSystem.contractProgress.deliveredBlocks.big > maxReasonableBlocks or
     ContractSystem.contractProgress.deliveredBlocks.small > maxReasonableBlocks then
    print("[Quarry] WARNING: Corrupted block counts detected, resetting!")
    ContractSystem.contractProgress.deliveredBlocks = { big = 0, small = 0, total = 0 }
  end
  
  local deliveredMass = jobObjects.lastDeliveredMass or 0
  local tons = deliveredMass / 1000
  
  -- For marble contracts, count delivered blocks by type
  local deliveredBigBlocks = 0
  local deliveredSmallBlocks = 0
  
  if contract.material == "marble" and jobObjects.deliveredPropIds then
    -- Create a lookup set for delivered prop IDs
    local deliveredSet = {}
    for _, id in ipairs(jobObjects.deliveredPropIds) do
      deliveredSet[id] = true
    end
    
    -- Check each entry in rockPileQueue to see what was delivered
    for _, entry in ipairs(rockPileQueue) do
      if entry.id and deliveredSet[entry.id] and entry.materialType == "marble" then
        -- Check block type from config name
        if entry.blockType == "big_rails" then
          deliveredBigBlocks = deliveredBigBlocks + 1
        elseif entry.blockType == "rails" then
          deliveredSmallBlocks = deliveredSmallBlocks + 1
        end
      end
    end
    
    -- Update block progress
    ContractSystem.contractProgress.deliveredBlocks.big = ContractSystem.contractProgress.deliveredBlocks.big + deliveredBigBlocks
    ContractSystem.contractProgress.deliveredBlocks.small = ContractSystem.contractProgress.deliveredBlocks.small + deliveredSmallBlocks
    ContractSystem.contractProgress.deliveredBlocks.total = ContractSystem.contractProgress.deliveredBlocks.big + ContractSystem.contractProgress.deliveredBlocks.small
    
    print(string.format("[Quarry] Marble delivery: +%d big, +%d small. Total: %d/%d big, %d/%d small",
      deliveredBigBlocks, deliveredSmallBlocks,
      ContractSystem.contractProgress.deliveredBlocks.big, contract.requiredBlocks.big,
      ContractSystem.contractProgress.deliveredBlocks.small, contract.requiredBlocks.small))
  end
  
  -- Track tons for rocks contracts and progress display
  ContractSystem.contractProgress.deliveredTons = (ContractSystem.contractProgress.deliveredTons or 0) + tons
  ContractSystem.contractProgress.deliveryCount = (ContractSystem.contractProgress.deliveryCount or 0) + 1
  
  -- No payment during delivery - full payment happens when contract is finalized at starter zone

  despawnPropIds(jobObjects.deliveredPropIds)
  jobObjects.deliveredPropIds = nil

  jobObjects.currentLoadMass = 0
  jobObjects.lastDeliveredMass = 0
  jobObjects.deferredTruckTargetPos = nil
  jobObjects.marbleDamage = {}
  jobObjects.totalMarbleDamagePercent = 0
  jobObjects.anyMarbleDamaged = false
  jobObjects.lastDeliveryDamagePercent = 0
  jobObjects.deliveryBlocksStatus = nil
  payloadUpdateTimer = 0

  core_groundMarkers.setPath(nil)

  if checkContractCompletion() then
    if jobObjects.truckID then
      local obj = be:getObjectByID(jobObjects.truckID)
      if obj then obj:delete() end
    end
    jobObjects.truckID = nil
    jobObjects.loadingZoneTargetPos = nil
    jobObjects.truckSpawnQueued = false
    markerCleared = true
    truckStoppedInLoading = false
    
    local playerVeh = be:getPlayerVehicle(0)
    local playerPos = playerVeh and playerVeh:getPosition() or nil
    
    -- Check if player is already at the starter zone
    local atStarterZone = isPlayerInStarterZone(playerPos)
    
    if atStarterZone then
      currentState = STATE_AT_QUARRY_DECIDE
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
      ui_message("Contract complete! Ready to finalize.", 6, "success")
    else
      currentState = STATE_RETURN_TO_QUARRY
      -- Set marker to starter zone
      local starterZone = getStarterZoneFromSites()
      if starterZone and starterZone.center then
        core_groundMarkers.setPath(vec3(starterZone.center))
      end
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
      ui_message("Contract complete! Return to the starter zone to finalize and get paid.", 6, "success")
    end
    return
  end

  Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
  
  -- Show appropriate message based on material type
  if contract.material == "marble" and contract.requiredBlocks then
    local delivered = ContractSystem.contractProgress.deliveredBlocks or { big = 0, small = 0 }
    local required = contract.requiredBlocks
    local remainingBig = math.max(0, required.big - delivered.big)
    local remainingSmall = math.max(0, required.small - delivered.small)
    
    local remainingStr = ""
    if remainingBig > 0 and remainingSmall > 0 then
      remainingStr = string.format("%d Large + %d Small remaining", remainingBig, remainingSmall)
    elseif remainingBig > 0 then
      remainingStr = string.format("%d Large remaining", remainingBig)
    elseif remainingSmall > 0 then
      remainingStr = string.format("%d Small remaining", remainingSmall)
    else
      remainingStr = "All blocks delivered!"
    end
    ui_message(string.format("Delivery #%d complete! %s", ContractSystem.contractProgress.deliveryCount or 1, remainingStr), 6, "success")
  else
    local remaining = (contract.requiredTons or 0) - (ContractSystem.contractProgress.deliveredTons or 0)
    ui_message(string.format("Delivery #%d complete! %.1f tons remaining.", ContractSystem.contractProgress.deliveryCount or 1, remaining), 6, "success")
  end

  if #rockPileQueue == 0 then
    spawnJobMaterials()
  end

  local targetPos = group.loading and group.loading.center and vec3(group.loading.center) or nil
  local spawnPos = group.spawn and group.spawn.pos and vec3(group.spawn.pos) or nil
  if not (jobObjects.truckID and targetPos and spawnPos) then
    failContract(Config.Contracts.CrashPenalty, "Truck return failed! Contract failed.", "warning")
    return
  end

  local truck = be:getObjectByID(jobObjects.truckID)
  if not truck then
    failContract(Config.Contracts.CrashPenalty, "Truck lost! Contract failed.", "warning")
    return
  end

  stopTruck(jobObjects.truckID)
  
  local savedTruckID = jobObjects.truckID
  local savedSpawnPos = jobObjects.truckSpawnPos
  local savedSpawnRot = jobObjects.truckSpawnRot
  
  core_jobsystem.create(function(job)
    job.sleep(0.1)
    local truck = be:getObjectByID(savedTruckID)
    if not truck then return end
    
    local pos = savedSpawnPos or spawnPos
    local rot
    pos, rot = calculateSpawnTransformForLocation(pos, targetPos)
    
    if spawn and spawn.safeTeleport then
      spawn.safeTeleport(truck, pos, rot)
    else
      truck:setPosRot(pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, rot.w)
      truck:setVelocity(vec3(0, 0, 0))
    end
    truck:queueLuaCommand("ai.setMode('stop') controller.mainController.setHandbrake(1)")
    
    job.sleep(0.3)
    
    jobObjects.loadingZoneTargetPos = targetPos
    truckStoppedInLoading = false
    currentState = STATE_TRUCK_ARRIVING
    driveTruckToPoint(savedTruckID, targetPos)
  end)
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

-- Draw markers on ALL compatible zones when choosing where to load
local function drawZoneChoiceMarkers(dt)
  if currentState ~= STATE_CHOOSING_ZONE then return end
  if #compatibleZones == 0 then return end

  markerAnim.time = markerAnim.time + dt
  markerAnim.pulseScale = 1.0 + math.sin(markerAnim.time * 2.5) * 0.15
  markerAnim.beamHeight = math.min(15.0, markerAnim.beamHeight + dt * 30)

  -- Draw a marker on each compatible zone
  for i, zone in ipairs(compatibleZones) do
    if zone.loading and zone.loading.center then
      local basePos = vec3(zone.loading.center)
      
      -- Alternate colors for different zones
      local hue = (i - 1) / math.max(1, #compatibleZones)
      local r = 0.3 + 0.7 * math.abs(math.sin(hue * 3.14159))
      local g = 0.8 + 0.2 * math.sin(markerAnim.time * 2)
      local b = 0.3 + 0.7 * math.abs(math.cos(hue * 3.14159))
      
      local color = ColorF(r, g, b, 0.85)
      local colorFaded = ColorF(r, g, b, 0.3)
      local beamTop = basePos + vec3(0, 0, markerAnim.beamHeight)
      local beamRadius = 0.6 * markerAnim.pulseScale

      debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
      debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.25, colorFaded)

      local sphereRadius = 1.2 * markerAnim.pulseScale
      debugDrawer:drawSphere(beamTop, sphereRadius, color)
      debugDrawer:drawSphere(beamTop, sphereRadius + 0.4, ColorF(r, g, b, 0.15))
      
      -- Draw zone name text above marker
      local textPos = beamTop + vec3(0, 0, 2)
      local materialType = zone.materialType or "rocks"
      local text = string.format("%s (%s)", zone.secondaryTag or "Zone", materialType:upper())
      debugDrawer:drawTextAdvanced(textPos, text, ColorF(1, 1, 1, 1), true, false, ColorI(0, 0, 0, 200))
    end
  end
end

local function drawUI(dt)
  if not imgui then return end

  -- If hidden, show a small button to restore
  if uiHidden and currentState ~= STATE_IDLE then
    imgui.SetNextWindowPos(imgui.ImVec2(10, 200), imgui.Cond_FirstUseEver)
    imgui.PushStyleVar1(imgui.StyleVar_WindowRounding, 8)
    imgui.PushStyleColor2(imgui.Col_WindowBg, imgui.ImVec4(0.1, 0.1, 0.12, 0.9))
    if imgui.Begin("##WL40Show", nil, imgui.WindowFlags_NoTitleBar + imgui.WindowFlags_AlwaysAutoResize + imgui.WindowFlags_NoCollapse) then
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.2, 0.4, 0.2, 0.9))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.3, 0.6, 0.3, 1))
      if imgui.Button("Show Job UI", imgui.ImVec2(100, 30)) then
        uiHidden = false
      end
      imgui.PopStyleColor(2)
    end
    imgui.End()
    imgui.PopStyleColor(1)
    imgui.PopStyleVar(1)
    return
  end

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
  imgui.SetNextWindowSizeConstraints(imgui.ImVec2(280, 100), imgui.ImVec2(350, 800))

  if imgui.Begin("##WL40System", nil, imgui.WindowFlags_NoTitleBar + imgui.WindowFlags_AlwaysAutoResize + imgui.WindowFlags_NoCollapse) then
    -- Hide button in top-right corner
    local windowWidth = imgui.GetWindowWidth()
    imgui.SetCursorPosX(windowWidth - 30)
    imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.2, 0.2, 0.8 * uiAnim.opacity))
    imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.2, 0.2, 1))
    if imgui.Button("X", imgui.ImVec2(20, 20)) then
      uiHidden = true
    end
    imgui.PopStyleColor(2)
    imgui.SetCursorPosX(0)
    
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
          -- Urgent contracts get special button styling
          if c.isUrgent then
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.3, 0.15, 0.1, 0.9))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.45, 0.25, 0.15, 1))
            imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.5, 0.3, 0.2, 1))
          else
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.15, 0.15, 0.2, 0.9))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.25, 0.25, 0.35, 1))
            imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.3, 0.3, 0.4, 1))
          end

          local label = string.format("[%d] %s##contract%d", i, c.name or "Contract", i)
          if imgui.Button(label, imgui.ImVec2(contentWidth, 0)) then
            acceptContract(i)
          end
          imgui.PopStyleColor(3)

          imgui.Indent(20)
          local tierColor = tierColors[c.tier or 1] or imgui.ImVec4(1, 1, 1, 1)
          imgui.TextColored(tierColor, string.format("Tier %d | %s", c.tier or 1, tostring((c.material or "rocks"):upper())))
          imgui.SameLine()
          imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("  $%d", c.totalPayout or 0))
          
          -- Show urgent badge
          if c.isUrgent then
            imgui.SameLine()
            imgui.TextColored(imgui.ImVec4(1, 0.6, 0, 1), " [+25% URGENT]")
          end
          
          -- Show requirements based on material type
          if c.material == "marble" and c.requiredBlocks then
            local blockInfo = ""
            if c.requiredBlocks.big > 0 and c.requiredBlocks.small > 0 then
              blockInfo = string.format("* %d Large + %d Small blocks", 
                c.requiredBlocks.big, c.requiredBlocks.small)
            elseif c.requiredBlocks.big > 0 then
              blockInfo = string.format("* %d Large block%s", 
                c.requiredBlocks.big, c.requiredBlocks.big > 1 and "s" or "")
            else
              blockInfo = string.format("* %d Small block%s", 
                c.requiredBlocks.small, c.requiredBlocks.small > 1 and "s" or "")
            end
            imgui.TextColored(imgui.ImVec4(0.8, 0.9, 1.0, 1), blockInfo)
          else
            imgui.Text(string.format("* %d tons total", c.requiredTons or 0))
          end
          imgui.Text(string.format("* Payment: %s", (c.paymentType == "progressive") and "Progressive" or "On completion"))
          
          -- Show expiration time
          local hoursLeft = getContractHoursRemaining(c)
          if hoursLeft <= 1 then
            imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, 1), string.format("* EXPIRES SOON: %d min", math.floor(hoursLeft * 60)))
          elseif hoursLeft <= 2 then
            imgui.TextColored(imgui.ImVec4(1, 0.7, 0.3, 1), string.format("* Expires in: %.1f hrs", hoursLeft))
          else
            imgui.TextColored(imgui.ImVec4(0.6, 0.6, 0.6, 1), string.format("* Expires in: %.0f hrs", hoursLeft))
          end
          
          if c.modifiers and #c.modifiers > 0 then
            local modText = "* Modifiers: "
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

    elseif currentState == STATE_CHOOSING_ZONE then
      imgui.TextColored(imgui.ImVec4(1, 0.8, 0.2, pulseAlpha * uiAnim.opacity), ">> CHOOSE LOADING ZONE <<")
      imgui.Dummy(imgui.ImVec2(0, 5))
      
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        imgui.Text(string.format("Material needed: %s", (c.material or "rocks"):upper()))
        imgui.Dummy(imgui.ImVec2(0, 8))
      end
      
      imgui.TextColored(imgui.ImVec4(0.7, 1, 0.7, uiAnim.opacity), "Drive to any highlighted zone:")
      imgui.Dummy(imgui.ImVec2(0, 5))
      
      -- List compatible zones
      for i, zone in ipairs(compatibleZones) do
        local zoneName = zone.secondaryTag or "Unknown Zone"
        local materialType = (zone.materialType or "rocks"):upper()
        
        -- Show distance to each zone
        local playerVeh = be:getPlayerVehicle(0)
        local dist = 0
        if playerVeh and zone.loading and zone.loading.center then
          dist = (playerVeh:getPosition() - vec3(zone.loading.center)):length()
        end
        
        local hue = (i - 1) / math.max(1, #compatibleZones)
        local r = 0.3 + 0.7 * math.abs(math.sin(hue * 3.14159))
        local g = 0.8
        local b = 0.3 + 0.7 * math.abs(math.cos(hue * 3.14159))
        
        imgui.TextColored(imgui.ImVec4(r, g, b, uiAnim.opacity), 
          string.format("  [%d] %s (%s) - %.0fm", i, zoneName, materialType, dist))
      end
      
      imgui.Dummy(imgui.ImVec2(0, 15))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, uiAnim.opacity))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        compatibleZones = {}
        abandonContract()
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
        -- Show block progress for marble, tons for rocks
        if c.material == "marble" and c.requiredBlocks then
          local delivered = p.deliveredBlocks or { big = 0, small = 0 }
          imgui.Text(string.format("Large: %d / %d", delivered.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", delivered.small, c.requiredBlocks.small))
        else
          imgui.Text(string.format("Progress: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        end
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

      -- Marble block status indicator (show each block)
      if jobObjects.materialType == "marble" then
        imgui.Dummy(imgui.ImVec2(0, 8))
        imgui.Separator()
        imgui.Dummy(imgui.ImVec2(0, 4))
        
        local blocks = getMarbleBlocksStatus()
        local anyDamaged = jobObjects.anyMarbleDamaged or false
        
        if anyDamaged then
          imgui.TextColored(imgui.ImVec4(1, 0.6, 0.2, uiAnim.opacity * 0.8), "Damaged blocks won't count")
          imgui.Dummy(imgui.ImVec2(0, 2))
        end
        
        -- Show each block's status
        for _, block in ipairs(blocks) do
          local statusText, statusColor
          if block.isDamaged then
            local warningPulse = (math.sin(uiAnim.pulse * 2) * 0.3) + 0.7
            statusText = "DAMAGED"
            statusColor = imgui.ImVec4(1, 0.3, 0.2, warningPulse * uiAnim.opacity)
          else
            statusText = "OK"
            statusColor = imgui.ImVec4(0.3, 1, 0.3, uiAnim.opacity)
          end
          
          local loadedText = block.isLoaded and "Loaded" or "Not loaded"
          local loadedColor = block.isLoaded and imgui.ImVec4(0.3, 0.8, 1, uiAnim.opacity) or imgui.ImVec4(0.6, 0.6, 0.6, uiAnim.opacity)
          
          imgui.TextColored(imgui.ImVec4(1, 1, 1, uiAnim.opacity), string.format("Block %d: ", block.index))
          imgui.SameLine()
          imgui.TextColored(statusColor, statusText)
          imgui.SameLine()
          imgui.TextColored(imgui.ImVec4(0.5, 0.5, 0.5, uiAnim.opacity), " | ")
          imgui.SameLine()
          imgui.TextColored(loadedColor, loadedText)
        end
      end

      imgui.Dummy(imgui.ImVec2(0, 20))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.4, 0, uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.6, 0, uiAnim.opacity))
      if imgui.Button("SEND TRUCK", imgui.ImVec2(-1, 45)) then
        -- Use contract's destination (unlinked from loading zone)
        local destPos = nil
        if jobObjects.deliveryDestination and jobObjects.deliveryDestination.pos then
          destPos = vec3(jobObjects.deliveryDestination.pos)
        elseif jobObjects.activeGroup and jobObjects.activeGroup.destination then
          -- Fallback to legacy behavior
          destPos = vec3(jobObjects.activeGroup.destination.pos)
        end
        
        if jobObjects.truckID and destPos then
          -- Only count undamaged marble blocks for delivery weight
          if jobObjects.materialType == "marble" then
            jobObjects.lastDeliveredMass = calculateUndamagedTruckPayload()
            -- Store block status at time of sending for delivery display
            jobObjects.deliveryBlocksStatus = getMarbleBlocksStatus()
          else
            jobObjects.lastDeliveredMass = jobObjects.currentLoadMass or 0
            jobObjects.deliveryBlocksStatus = nil
          end
          jobObjects.deliveredPropIds = getLoadedPropIdsInTruck(0.1)
          core_groundMarkers.setPath(nil)
          -- Reset truck movement tracking
          truckStoppedTimer = 0
          truckLastPosition = nil
          truckResendCount = 0
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
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        -- Show block progress for marble, tons for rocks
        if c.material == "marble" and c.requiredBlocks then
          local delivered = p.deliveredBlocks or { big = 0, small = 0 }
          imgui.Text(string.format("Large: %d / %d", delivered.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", delivered.small, c.requiredBlocks.small))
        else
          imgui.Text(string.format("Progress: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        end
        imgui.Separator()
      end
      imgui.Text("Truck driving to destination...")
      
      -- Show marble blocks being delivered
      if jobObjects.materialType == "marble" and jobObjects.deliveryBlocksStatus then
        imgui.Dummy(imgui.ImVec2(0, 5))
        imgui.Text("Delivering:")
        for _, block in ipairs(jobObjects.deliveryBlocksStatus) do
          if block.isLoaded then
            local statusText = block.isDamaged and "DAMAGED" or "OK"
            local color
            if block.isDamaged then
              color = imgui.ImVec4(1, 0.4, 0.2, uiAnim.opacity * 0.7)
            else
              color = imgui.ImVec4(0.3, 1, 0.3, uiAnim.opacity)
            end
            imgui.TextColored(color, string.format("  Block %d (%s)", block.index, statusText))
          end
        end
      end
      
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_RETURN_TO_QUARRY then
      imgui.TextColored(imgui.ImVec4(1.0, 0.6, 0.2, pulseAlpha * uiAnim.opacity), ">> RETURN TO STARTER ZONE <<")
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        if checkContractCompletion() then
          imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "CONTRACT COMPLETE!")
        end
        -- Show block progress for marble, tons for rocks
        if c.material == "marble" and c.requiredBlocks then
          local delivered = p.deliveredBlocks or { big = 0, small = 0 }
          imgui.Text(string.format("Large: %d / %d", delivered.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", delivered.small, c.requiredBlocks.small))
        else
          imgui.Text(string.format("Delivered: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        end
        imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Payout: $%d (on completion)", c.totalPayout or 0))
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then
        abandonContract()
      end

    elseif currentState == STATE_AT_QUARRY_DECIDE then
      imgui.TextColored(imgui.ImVec4(0.2, 1.0, 0.4, pulseAlpha * uiAnim.opacity), ">> AT STARTER ZONE <<")
      if ContractSystem.activeContract then
        local c = ContractSystem.activeContract
        local p = ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        -- Show block progress for marble, tons for rocks
        if c.material == "marble" and c.requiredBlocks then
          local delivered = p.deliveredBlocks or { big = 0, small = 0 }
          imgui.Text(string.format("Large: %d / %d", delivered.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", delivered.small, c.requiredBlocks.small))
        else
          local pct = 0
          if (c.requiredTons or 0) > 0 then pct = (p.deliveredTons or 0) / (c.requiredTons or 1) end
          imgui.Text(string.format("Progress: %.1f / %.1f tons (%.0f%%)", p.deliveredTons or 0, c.requiredTons or 0, pct * 100))
        end
        imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Payout: $%d", c.totalPayout or 0))
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
-- Throttled zone checking functions
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
    if not targetPos then
      jobObjects.truckSpawnQueued = false
      return
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
      driveTruckToPoint(truckId, targetPos)
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

  -- Update zone stock regeneration
  updateZoneStocks(dt)

  drawWorkSiteMarker(dt)
  drawZoneChoiceMarkers(dt)  -- Draw markers on all compatible zones when choosing
  
  if currentState == STATE_LOADING then
    payloadUpdateTimer = payloadUpdateTimer + dt
    if payloadUpdateTimer >= 0.25 then
      jobObjects.currentLoadMass = calculateTruckPayload()
      calculateMarbleDamage()
      payloadUpdateTimer = 0
    end
    -- Draw debug visualization every frame for persistence
    drawDebugVisualization()
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
    local vehicleName = playerVeh:getJBeamFilename()
    local isWL40 = vehicleName == "wl40"
    if not jobOfferSuppressed and isWL40 then
      -- Only allow contract menu from STARTER zone
      local inStarterZone = isPlayerInStarterZone(playerPos)
      -- Debug: enabled to diagnose starter zone issues (can disable after fixing)
      print(string.format("[Quarry] STATE_IDLE check: vehicle=%s, inStarterZone=%s, sitesData=%s", 
        tostring(vehicleName), tostring(inStarterZone), tostring(sitesData ~= nil)))
      if inStarterZone then
        -- Generate initial contracts if needed
        if shouldRefreshContracts() or not ContractSystem.initialContractsGenerated then
          generateInitialContracts()
        end
        currentState = STATE_CONTRACT_SELECT
        Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      end
    end

  elseif currentState == STATE_CONTRACT_SELECT then
    -- Dynamic contract management
    contractUpdateTimer = contractUpdateTimer + dt
    if contractUpdateTimer >= CONTRACT_UPDATE_INTERVAL then
      contractUpdateTimer = 0
      
      -- Check for expired contracts
      checkContractExpiration()
      
      -- Try to spawn new contracts (gradual fill to max)
      trySpawnNewContract()
    end
    
    -- If all contracts expired/taken, generate new initial batch
    if #ContractSystem.availableContracts == 0 and #availableGroups > 0 then
      generateInitialContracts()
    end
    
    -- Exit contract menu if player leaves the starter zone
    local inStarterZone = isPlayerInStarterZone(playerPos)
    if not inStarterZone then
      currentState = STATE_IDLE
      jobObjects.materialType = nil
      jobObjects.activeGroup = nil
    end

  elseif currentState == STATE_CHOOSING_ZONE then
    -- Player is choosing which zone to load from
    -- Check if they entered any compatible zone
    local enteredZone = nil
    for _, zone in ipairs(compatibleZones) do
      if zone.loading and zone.loading.containsPoint2D and zone.loading:containsPoint2D(playerPos) then
        enteredZone = zone
        break
      end
    end
    
    if enteredZone then
      -- Player entered a compatible zone - bind it as the loading zone
      local contract = ContractSystem.activeContract
      if contract then
        contract.group = enteredZone
        contract.loadingZoneTag = enteredZone.secondaryTag
        
        jobObjects.activeGroup = enteredZone
        jobObjects.materialType = enteredZone.materialType or contract.material or "rocks"
        
        print(string.format("[Quarry] Player entered zone '%s' - binding as loading zone", 
          enteredZone.secondaryTag))
        
        -- Spawn materials in this zone
        if #rockPileQueue == 0 then
          spawnJobMaterials()
        end
        
        -- Spawn truck and transition to TRUCK_ARRIVING
        local targetPos = vec3(enteredZone.loading.center)
        jobObjects.deferredTruckTargetPos = targetPos
        jobObjects.loadingZoneTargetPos = targetPos
        
        local truckId = spawnTruckForGroup(enteredZone, jobObjects.materialType, targetPos)
        if truckId then
          jobObjects.truckID = truckId
          local truck = be:getObjectByID(truckId)
          if truck then
            truck:queueLuaCommand('if not driver then extensions.load("driver") end')
          end
          driveTruckToPoint(truckId, targetPos)
          
          currentState = STATE_TRUCK_ARRIVING
          markerCleared = false
          truckStoppedInLoading = false
          
          -- Clear zone markers
          compatibleZones = {}
          
          Engine.Audio.playOnce('AudioGui', 'event:>UI>Countdown>3_seconds')
          ui_message(string.format("Loading from %s. Truck arriving...", 
            enteredZone.secondaryTag), 5, "success")
        else
          ui_message("Failed to spawn truck!", 5, "error")
        end
      end
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
      local truckPos = truck:getPosition()
      if group.loading and group.loading.containsPoint2D and group.loading:containsPoint2D(truckPos) then
        local velocity = truck:getVelocity()
        local speed = velocity and velocity:length() or 999
        if speed < 2.0 then
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
    -- Get destination from contract (unlinked from loading zone)
    local destPos = nil
    if jobObjects.deliveryDestination and jobObjects.deliveryDestination.pos then
      destPos = vec3(jobObjects.deliveryDestination.pos)
    elseif jobObjects.activeGroup and jobObjects.activeGroup.destination then
      -- Fallback to legacy behavior
      destPos = vec3(jobObjects.activeGroup.destination.pos)
    end
    
    if jobObjects.truckID and destPos then
      local truck = be:getObjectByID(jobObjects.truckID)
      if truck then
        local truckPos = truck:getPosition()
        local dist = (truckPos - destPos):length()
        
        -- Check if truck reached destination
        if dist < 10 then
          -- Reset tracking when arriving
          truckStoppedTimer = 0
          truckLastPosition = nil
          truckResendCount = 0
          handleDeliveryArrived()
          return
        end
        
        -- Track truck movement to detect stops
        local velocity = truck:getVelocity()
        local speed = velocity and velocity:length() or 0
        local isMoving = speed > truckStopSpeedThreshold
        
        -- Check if AI is applying throttle (helps detect rolling on hills)
        local throttle = 0
        local electrics = truck.electrics
        if electrics and electrics.values then
          throttle = electrics.values.throttle or 0
        end
        local isAIdriving = throttle > 0.1
        
        -- Truck is considered "actively driving" only if AI has throttle AND moving
        -- OR if moving fast enough that throttle check doesn't matter
        local isActivelyDriving = (isAIdriving and isMoving) or (speed > 3.0)
        
        if isActivelyDriving then
          -- Truck is actively driving, reset stopped timer and update last position
          truckStoppedTimer = 0
          truckLastPosition = truckPos
          truckResendCount = 0  -- Reset resend count when actively driving
        else
          -- Truck appears stopped or rolling without AI control
          if truckLastPosition then
            -- Check if truck has moved at all (might be stuck but vibrating slightly)
            local movedDist = (truckPos - truckLastPosition):length()
            
            -- Consider stuck if: hasn't moved much OR is rolling but AI has no throttle
            local isStuck = movedDist < 0.5 or (not isAIdriving and speed < 2.0)
            
            if isStuck then
              -- Truck is stuck, increment stopped timer
              truckStoppedTimer = truckStoppedTimer + dt
              
              -- If stopped for too long and not at destination, re-send
              if truckStoppedTimer >= truckStoppedThreshold then
                if truckResendCount < truckMaxResends then
                  truckResendCount = truckResendCount + 1
                  local reason = isAIdriving and "no movement" or "no throttle"
                  print(string.format("[Quarry] Truck stuck (%s, speed=%.1f, throttle=%.2f), re-sending (attempt %d)", 
                    reason, speed, throttle, truckResendCount))
                  
                  -- Re-issue drive command with more aggressive settings
                  truck:queueLuaCommand('ai.setAggressionMode("rubberBand")')
                  truck:queueLuaCommand('ai.setAggression(0.9)')  -- Even more aggressive
                  driveTruckToPoint(jobObjects.truckID, destPos)
                  
                  -- Reset timer to give it time to start moving
                  truckStoppedTimer = 0
                  truckLastPosition = truckPos
                else
                  -- Too many resends, fail the contract
                  print("[Quarry] Truck failed to reach destination after " .. truckMaxResends .. " attempts")
                  failContract(Config.Contracts.CrashPenalty, "Truck stuck! Contract failed.", "warning")
                  return
                end
              end
            else
              -- Truck moved enough, reset tracking
              truckStoppedTimer = 0
              truckLastPosition = truckPos
            end
          else
            -- First frame tracking, just store position
            truckLastPosition = truckPos
          end
        end
      else
        failContract(Config.Contracts.CrashPenalty, "Truck destroyed! Contract failed.", "warning")
      end
    else
      abandonContract()
    end

  elseif currentState == STATE_RETURN_TO_QUARRY then
    -- Check if player arrived at the starter zone
    if isPlayerInStarterZone(playerPos) then
      currentState = STATE_AT_QUARRY_DECIDE
      core_groundMarkers.setPath(nil)
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      ui_message("At starter zone! Finalize your contract.", 5, "info")
    end

  elseif currentState == STATE_AT_QUARRY_DECIDE then
    -- Check if player left the starter zone
    if not isPlayerInStarterZone(playerPos) then
      currentState = STATE_RETURN_TO_QUARRY
      local starterZone = getStarterZoneFromSites()
      if starterZone and starterZone.center then
        core_groundMarkers.setPath(vec3(starterZone.center))
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
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}
  ContractSystem.lastContractSpawnTime = 0
  ContractSystem.contractsGeneratedToday = 0
  ContractSystem.initialContractsGenerated = false  -- Allow fresh generation on mission start
  jobOfferSuppressed = false
  anyZoneCheckTimer = 0
  cachedInAnyLoadingZone = false
  sitesLoadTimer = 0
  groupCachePrecomputeQueued = false
  marbleInitialState = {}
  uiHidden = false
  contractUpdateTimer = 0
  stockRegenTimer = 0  -- Reset stock regeneration timer
  compatibleZones = {}  -- Reset zone choice markers
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
  marbleInitialState = {}
  marbleDamageState = {}
end

-- ============================================================================
-- Phone UI API Functions
-- ============================================================================

local function getQuarryStateForUI()
  local contractsForUI = {}
  for i, c in ipairs(ContractSystem.availableContracts or {}) do
    table.insert(contractsForUI, {
      id = c.id,
      name = c.name,
      tier = c.tier,
      material = c.material,
      requiredTons = c.requiredTons,
      requiredBlocks = c.requiredBlocks,  -- NEW: Block counts for marble {big, small, total}
      isBulk = c.isBulk,
      totalPayout = c.totalPayout,
      paymentType = c.paymentType,
      modifiers = c.modifiers,
      groupTag = c.groupTag,
      estimatedTrips = c.estimatedTrips,
      isSpecial = c.isSpecial,
      -- Expiration and urgency fields
      isUrgent = c.isUrgent or false,
      expiresAt = c.expiresAt,
      hoursRemaining = getContractHoursRemaining(c),
      expirationHours = c.expirationHours,
      -- Unlinked contract destination info
      destinationName = c.destination and c.destination.name or nil,
      originZoneTag = c.destination and c.destination.originZoneTag or c.groupTag,
    })
  end

  local activeContractForUI = nil
  if ContractSystem.activeContract then
    local c = ContractSystem.activeContract
    activeContractForUI = {
      id = c.id,
      name = c.name,
      tier = c.tier,
      material = c.material,
      requiredTons = c.requiredTons,
      requiredBlocks = c.requiredBlocks,  -- NEW: Block counts for marble {big, small, total}
      totalPayout = c.totalPayout,
      paymentType = c.paymentType,
      modifiers = c.modifiers,
      groupTag = c.groupTag,
      estimatedTrips = c.estimatedTrips,
      -- Unlinked contract info
      loadingZoneTag = c.loadingZoneTag,  -- Where we're loading from
      destinationName = c.destination and c.destination.name or nil,  -- Where we're delivering to
    }
  end

  local blocksStatus = {}
  if jobObjects.materialType == "marble" then
    blocksStatus = getMarbleBlocksStatus()
  end

  -- Get stock info for active zone
  local zoneStockInfo = nil
  if jobObjects.activeGroup then
    zoneStockInfo = getZoneStockInfo(jobObjects.activeGroup)
  end

  return {
    state = currentState,
    playerLevel = PlayerData.level or 1,
    contractsCompleted = PlayerData.contractsCompleted or 0,
    availableContracts = contractsForUI,
    activeContract = activeContractForUI,
    contractProgress = {
      deliveredTons = ContractSystem.contractProgress and ContractSystem.contractProgress.deliveredTons or 0,
      totalPaidSoFar = ContractSystem.contractProgress and ContractSystem.contractProgress.totalPaidSoFar or 0,
      deliveredBlocks = ContractSystem.contractProgress and ContractSystem.contractProgress.deliveredBlocks or { big = 0, small = 0, total = 0 },
      deliveryCount = ContractSystem.contractProgress and ContractSystem.contractProgress.deliveryCount or 0
    },
    currentLoadMass = jobObjects.currentLoadMass or 0,
    targetLoad = Config.TargetLoad or 25000,
    materialType = jobObjects.materialType or "rocks",
    marbleBlocks = blocksStatus,
    anyMarbleDamaged = jobObjects.anyMarbleDamaged or false,
    deliveryBlocks = jobObjects.deliveryBlocksStatus or {},
    markerCleared = markerCleared,
    truckStopped = truckStoppedInLoading,
    -- Zone stock info
    zoneStock = zoneStockInfo
  }
end

local function requestQuarryState()
  local stateData = getQuarryStateForUI()
  guihooks.trigger('updateQuarryState', stateData)
end

local function acceptContractFromUI(contractIndex)
  print("[Quarry] acceptContractFromUI called with index: " .. tostring(contractIndex))
  print("[Quarry] Current state: " .. tostring(currentState) .. " (STATE_CONTRACT_SELECT = " .. tostring(STATE_CONTRACT_SELECT) .. ")")
  if currentState ~= STATE_CONTRACT_SELECT then 
    print("[Quarry] State check FAILED - not in CONTRACT_SELECT state, returning")
    return 
  end
  print("[Quarry] State check passed, accepting contract...")
  acceptContract(contractIndex)
  requestQuarryState()
end

local function declineAllContracts()
  if currentState ~= STATE_CONTRACT_SELECT then return end
  currentState = STATE_IDLE
  jobOfferSuppressed = true
  requestQuarryState()
end

local function abandonContractFromUI()
  abandonContract()
  requestQuarryState()
end

local function sendTruckFromUI()
  if currentState ~= STATE_LOADING then return end
  
  -- Get destination from contract (unlinked from loading zone)
  local destPos = nil
  if jobObjects.deliveryDestination and jobObjects.deliveryDestination.pos then
    destPos = vec3(jobObjects.deliveryDestination.pos)
  elseif jobObjects.activeGroup and jobObjects.activeGroup.destination then
    -- Fallback to legacy behavior
    destPos = vec3(jobObjects.activeGroup.destination.pos)
  end
  
  if not jobObjects.truckID or not destPos then
    abandonContract()
    requestQuarryState()
    return
  end

  -- Only count undamaged marble blocks for delivery weight
  if jobObjects.materialType == "marble" then
    jobObjects.lastDeliveredMass = calculateUndamagedTruckPayload()
    jobObjects.deliveryBlocksStatus = getMarbleBlocksStatus()
  else
    jobObjects.lastDeliveredMass = jobObjects.currentLoadMass or 0
    jobObjects.deliveryBlocksStatus = nil
  end
  jobObjects.deliveredPropIds = getLoadedPropIdsInTruck(0.1)
  core_groundMarkers.setPath(nil)
  -- Reset truck movement tracking
  truckStoppedTimer = 0
  truckLastPosition = nil
  truckResendCount = 0
  driveTruckToPoint(jobObjects.truckID, destPos)
  currentState = STATE_DELIVERING
  requestQuarryState()
end

local function finalizeContractFromUI()
  if currentState ~= STATE_AT_QUARRY_DECIDE then return end
  if not checkContractCompletion() then return end
  completeContract()
  requestQuarryState()
end

local function loadMoreFromUI()
  if currentState ~= STATE_AT_QUARRY_DECIDE then return end
  if checkContractCompletion() then return end
  beginActiveContractTrip()
  requestQuarryState()
end

-- Send state updates to UI periodically when in active states
local uiUpdateTimer = 0
local UI_UPDATE_INTERVAL = 0.5

local originalOnUpdate = onUpdate
local function onUpdateWithUI(dt)
  originalOnUpdate(dt)
  
  -- Periodically send state to UI when in active job states
  if currentState ~= STATE_IDLE then
    uiUpdateTimer = uiUpdateTimer + dt
    if uiUpdateTimer >= UI_UPDATE_INTERVAL then
      uiUpdateTimer = 0
      requestQuarryState()
    end
  end
end

M.onUpdate = onUpdateWithUI
M.onClientStartMission = onClientStartMission
M.onClientEndMission = onClientEndMission
M.onMarbleDamageCallback = onMarbleDamageCallback

-- Phone UI API exports
M.requestQuarryState = requestQuarryState
M.acceptContractFromUI = acceptContractFromUI
M.declineAllContracts = declineAllContracts
M.abandonContractFromUI = abandonContractFromUI
M.sendTruckFromUI = sendTruckFromUI
M.finalizeContractFromUI = finalizeContractFromUI
M.loadMoreFromUI = loadMoreFromUI

-- Console commands
M.resumeTruck = resumeTruck

return M
