local M = {}

local Config = gameplay_loading_config

M.ContractSystem = {
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

M.PlayerData = {
  level = 1,
  contractsCompleted = 0,
  contractsFailed = 0
}

local function pickTierForPlayer()
  local level = M.PlayerData.level or 1
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

local function getCurrentGameHour()
  if core_environment and core_environment.getTimeOfDay then
    local tod = core_environment.getTimeOfDay()
    if tod and type(tod) == "table" and tod.time then
      return tod.time * 24
    elseif tod and type(tod) == "number" then
      return tod * 24
    end
  end
  return 12
end

function M.generateContract(availableGroups)
  if not availableGroups or #availableGroups == 0 then return nil end
  local tier = pickTierForPlayer()
  local tierData = Config.Config.Contracts.Tiers[tier] or Config.Config.Contracts.Tiers[1]

  local isSpecial = math.random() < (tierData.specialChance or 0)
  local isBulk = math.random() < 0.4

  local group = availableGroups[math.random(#availableGroups)]
  if not group then return nil end
  
  local material = group.materialType or "rocks"
  local payRate = math.random(tierData.basePayRate.min, tierData.basePayRate.max)

  local modifiers = {}
  local bonusMultiplier = 1.0
  if math.random() < (tierData.modifierChance or 0) then
    local timeMod = weightedRandomChoice(Config.Config.Contracts.Modifiers.time)
    if timeMod then
      table.insert(modifiers, timeMod)
      bonusMultiplier = bonusMultiplier + (timeMod.bonus or 0)
    end
  end
  if math.random() < (tierData.modifierChance or 0) * 0.6 then
    local challengeMod = weightedRandomChoice(Config.Config.Contracts.Modifiers.challenge)
    if challengeMod then
      table.insert(modifiers, challengeMod)
      bonusMultiplier = bonusMultiplier + (challengeMod.bonus or 0)
    end
  end
  if isSpecial then
    bonusMultiplier = bonusMultiplier + math.random(50, 150) / 100
  end

  local isUrgent = math.random() < (Config.Config.Contracts.UrgentContractChance or 0.15)
  if isUrgent then
    bonusMultiplier = bonusMultiplier + (Config.Config.Contracts.UrgentPayBonus or 0.25)
  end

  local requiredTons = 0
  local requiredBlocks = nil
  local estimatedTrips = 1
  
  if material == "marble" then
    local blockRanges = Config.Config.MarbleBlockRanges[tier] or Config.Config.MarbleBlockRanges[1]
    local bigBlocks = math.random(blockRanges.big[1], blockRanges.big[2])
    local smallBlocks = math.random(blockRanges.small[1], blockRanges.small[2])
    
    if bigBlocks == 0 and smallBlocks == 0 then smallBlocks = 1 end
    
    if isSpecial then
      bigBlocks = bigBlocks + math.random(1, 2)
      smallBlocks = smallBlocks + math.random(1, 2)
    end
    
    requiredBlocks = {
      big = bigBlocks,
      small = smallBlocks,
      total = bigBlocks + smallBlocks
    }
    
    requiredTons = (bigBlocks * 38) + (smallBlocks * 19)
    
    if bigBlocks >= smallBlocks then
      estimatedTrips = bigBlocks
    else
      local remainingSmall = smallBlocks - bigBlocks
      estimatedTrips = bigBlocks + math.ceil(remainingSmall / 2)
    end
    estimatedTrips = math.max(1, estimatedTrips)
  else
    local tonnageRange = (isBulk and tierData.tonnageRange and tierData.tonnageRange.bulk) or (tierData.tonnageRange and tierData.tonnageRange.single) or {15, 25}
    requiredTons = math.random(tonnageRange[1], tonnageRange[2])

    if isSpecial then
      if math.random() < 0.5 then
        requiredTons = math.random(10, 20)
      else
        requiredTons = math.random(300, 500)
      end
    end
    
    estimatedTrips = math.ceil(requiredTons / (Config.Config.TargetLoad / 1000))
  end

  local totalPayout = math.floor(requiredTons * payRate * bonusMultiplier)

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

  local currentHour = getCurrentGameHour()
  local baseExpiration = Config.Config.Contracts.ContractExpirationTime[tier] or 6
  if isUrgent then
    baseExpiration = baseExpiration * (Config.Config.Contracts.UrgentExpirationMult or 0.5)
  end
  local expiresAt = currentHour + baseExpiration

  return {
    id = os.time() + math.random(1000, 9999),
    name = name,
    tier = tier,
    material = material,
    requiredTons = requiredTons,
    requiredBlocks = requiredBlocks,
    isBulk = isBulk,
    payRate = payRate,
    totalPayout = totalPayout,
    modifiers = modifiers,
    bonusMultiplier = bonusMultiplier,
    isSpecial = isSpecial,
    destination = {
      pos = group.destination and group.destination.pos and vec3(group.destination.pos) or nil,
      name = group.destination and group.destination.name or "Destination",
      originZoneTag = group.secondaryTag,
    },
    group = nil,
    groupTag = group.secondaryTag,
    estimatedTrips = estimatedTrips,
    isUrgent = isUrgent,
    createdAt = currentHour,
    expiresAt = expiresAt,
    expirationHours = baseExpiration,
  }
end

function M.sortContracts()
  table.sort(M.ContractSystem.availableContracts, function(a, b)
    if a.isUrgent ~= b.isUrgent then return a.isUrgent end
    if a.tier == b.tier then return a.totalPayout < b.totalPayout end
    return a.tier < b.tier
  end)
end

function M.generateInitialContracts(availableGroups)
  M.ContractSystem.availableContracts = {}
  if not availableGroups or #availableGroups == 0 then return end

  local initialCount = Config.Config.Contracts.InitialContracts or 4
  local tierDistribution = { pickTierForPlayer(), pickTierForPlayer(), math.random(1, 2), math.random(2, 3) }

  for i = 1, initialCount do
    local contract = M.generateContract(availableGroups)
    if contract then
      table.insert(M.ContractSystem.availableContracts, contract)
    end
  end

  M.sortContracts()
  M.ContractSystem.lastContractSpawnTime = getCurrentGameHour()
  M.ContractSystem.contractsGeneratedToday = initialCount
  M.ContractSystem.initialContractsGenerated = true
  print("[Loading] Generated " .. #M.ContractSystem.availableContracts .. " initial contracts")
end

function M.trySpawnNewContract(availableGroups)
  if #M.ContractSystem.availableContracts >= (Config.Config.Contracts.MaxActiveContracts or 6) then
    return false
  end
  
  local currentHour = getCurrentGameHour()
  local lastSpawn = M.ContractSystem.lastContractSpawnTime or 0
  local interval = Config.Config.Contracts.ContractSpawnInterval or 2
  
  local hoursSinceSpawn = currentHour - lastSpawn
  if hoursSinceSpawn < 0 then hoursSinceSpawn = hoursSinceSpawn + 24 end
  
  if hoursSinceSpawn >= interval then
    local contract = M.generateContract(availableGroups)
    if contract then
      table.insert(M.ContractSystem.availableContracts, contract)
      M.sortContracts()
      M.ContractSystem.lastContractSpawnTime = currentHour
      M.ContractSystem.contractsGeneratedToday = (M.ContractSystem.contractsGeneratedToday or 0) + 1
      
      local urgentText = contract.isUrgent and " (URGENT!)" or ""
      ui_message("New contract available: " .. contract.name .. urgentText, 4, "info")
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      
      print("[Loading] Spawned new contract: " .. contract.name .. " (Tier " .. contract.tier .. ")")
      return true
    end
  end
  return false
end

function M.checkContractExpiration()
  local currentHour = getCurrentGameHour()
  local expiredCount = 0
  local remainingContracts = {}
  
  for _, contract in ipairs(M.ContractSystem.availableContracts) do
    local expiresAt = contract.expiresAt or math.huge
    local hoursUntilExpire = expiresAt - currentHour
    if expiresAt > 24 and currentHour < 12 then
      hoursUntilExpire = expiresAt - 24 - currentHour
    end
    
    if hoursUntilExpire > 0 then
      table.insert(remainingContracts, contract)
    else
      expiredCount = expiredCount + 1
      M.ContractSystem.expiredContractsTotal = (M.ContractSystem.expiredContractsTotal or 0) + 1
      print("[Loading] Contract expired: " .. (contract.name or "Unknown"))
    end
  end
  
  if expiredCount > 0 then
    M.ContractSystem.availableContracts = remainingContracts
    ui_message(expiredCount .. " contract" .. (expiredCount > 1 and "s" or "") .. " expired", 3, "warning")
  end
  return expiredCount
end

function M.getContractHoursRemaining(contract)
  if not contract or not contract.expiresAt then return 99 end
  local currentHour = getCurrentGameHour()
  local hoursLeft = contract.expiresAt - currentHour
  
  if contract.expiresAt > 24 and currentHour < 12 then
    hoursLeft = contract.expiresAt - 24 - currentHour
  end
  if hoursLeft < 0 then hoursLeft = hoursLeft + 24 end
  
  return hoursLeft
end

function M.shouldRefreshContracts()
  local currentDay = math.floor(os.time() / 86400)
  if currentDay - (M.ContractSystem.lastRefreshDay or -999) >= (Config.Config.Contracts.RefreshDays or 3) then
    M.ContractSystem.lastRefreshDay = currentDay
    M.ContractSystem.initialContractsGenerated = false
    return true
  end
  return false
end

function M.checkContractCompletion()
  if not M.ContractSystem.activeContract then return false end
  local contract = M.ContractSystem.activeContract
  local p = M.ContractSystem.contractProgress
  
  if contract.material == "marble" and contract.requiredBlocks then
    local delivered = p.deliveredBlocks or { big = 0, small = 0 }
    local required = contract.requiredBlocks
    return (delivered.big >= required.big) and (delivered.small >= required.small)
  end
  
  return (p and p.deliveredTons or 0) >= (contract.requiredTons or math.huge)
end

function M.acceptContract(contractIndex, getZonesByMaterial)
  local contract = M.ContractSystem.availableContracts[contractIndex]
  if not contract then return end

  local contractMaterial = contract.material or "rocks"
  local compatibleZones = getZonesByMaterial(contractMaterial)
  
  if #compatibleZones == 0 then
    ui_message(string.format("No zones available for %s!", contractMaterial:upper()), 5, "error")
    return nil
  end
  
  table.remove(M.ContractSystem.availableContracts, contractIndex)
  
  contract.group = nil
  contract.loadingZoneTag = nil
  
  M.ContractSystem.activeContract = contract
  M.ContractSystem.contractProgress = {
    deliveredTons = 0,
    totalPaidSoFar = 0,
    startTime = os.clock(),
    deliveryCount = 0,
    deliveredBlocks = { big = 0, small = 0, total = 0 }
  }
  
  Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
  
  local zoneNames = {}
  for _, z in ipairs(compatibleZones) do
    table.insert(zoneNames, z.secondaryTag or "Unknown")
  end
  
  ui_message(string.format("Contract accepted! Drive to any %s zone to load: %s", 
    contractMaterial:upper(), table.concat(zoneNames, ", ")), 8, "info")
  
  print(string.format("[Loading] Contract accepted. Material: %s. Compatible zones: %s", 
    contractMaterial, table.concat(zoneNames, ", ")))
  
  return contract, compatibleZones
end

function M.abandonContract(onCleanup)
  if not M.ContractSystem.activeContract then return end
  ui_message(string.format("Contract abandoned! Penalty: $%d", Config.Config.Contracts.AbandonPenalty or 0), 6, "warning")

  local success, err = pcall(function()
    local career = career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = career_modules_payment
      if paymentModule and type(paymentModule.pay) == "function" then
        paymentModule.pay(-(Config.Config.Contracts.AbandonPenalty or 0), {label = "Contract Abandonment"})
      end
    end
  end)
  if not success then
    print("[Loading] Warning: Could not apply abandonment penalty: " .. tostring(err))
  end

  M.PlayerData.contractsFailed = (M.PlayerData.contractsFailed or 0) + 1
  M.ContractSystem.activeContract = nil
  M.ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

  if onCleanup then onCleanup(true) end
end

function M.failContract(penalty, message, msgType, onCleanup)
  if not M.ContractSystem.activeContract then
    if onCleanup then onCleanup(true) end
    return
  end

  penalty = penalty or 0
  msgType = msgType or "warning"
  if message then ui_message(message, 5, msgType) end

  local success, err = pcall(function()
    local career = career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = career_modules_payment
      if paymentModule and type(paymentModule.pay) == "function" and penalty ~= 0 then
        paymentModule.pay(-math.abs(penalty), {label = "Contract Failure"})
      end
    end
  end)
  if not success then
    print("[Loading] Warning: Could not apply failure penalty: " .. tostring(err))
  end

  M.PlayerData.contractsFailed = (M.PlayerData.contractsFailed or 0) + 1
  M.ContractSystem.activeContract = nil
  M.ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

  if onCleanup then onCleanup(true) end
end

function M.completeContract(onCleanup, onClearProps)
  if not M.ContractSystem.activeContract then return end
  local contract = M.ContractSystem.activeContract

  local totalPay = contract.totalPayout or 0

  local careerPaid = false
  local success, err = pcall(function()
    local career = career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = career_modules_payment
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
    print("[Loading] Warning: Could not apply contract reward: " .. tostring(err))
  end
  
  if not careerPaid then
    Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_End_Success')
    ui_message(string.format("SANDBOX: Contract payout: $%d", totalPay), 6, "success")
  end

  M.PlayerData.contractsCompleted = (M.PlayerData.contractsCompleted or 0) + 1
  M.PlayerData.level = (M.PlayerData.level or 1) + 1

  M.ContractSystem.activeContract = nil
  M.ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredBlocks = { big = 0, small = 0, total = 0 }}

  if onClearProps then onClearProps() end
  if onCleanup then onCleanup(true) end
end

M.getCurrentGameHour = getCurrentGameHour

return M
