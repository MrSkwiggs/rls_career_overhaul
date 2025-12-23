local M = {}

M.Config = {
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

M.STATE_IDLE             = 0
M.STATE_CONTRACT_SELECT  = 1
M.STATE_CHOOSING_ZONE    = 2
M.STATE_DRIVING_TO_SITE  = 3
M.STATE_TRUCK_ARRIVING   = 4
M.STATE_LOADING          = 5
M.STATE_DELIVERING       = 6
M.STATE_RETURN_TO_QUARRY = 7
M.STATE_AT_QUARRY_DECIDE = 8

M.ENABLE_DEBUG = true
M.MARBLE_MIN_DISPLAY_DAMAGE = 5
M.CONTRACT_UPDATE_INTERVAL = 5

return M
