local M = {}

local Config = gameplay_loading_config

local ContractSystem = {
  availableContracts = {},
  activeContract = nil,
  lastRefreshDay = -999,
  contractProgress = {
    deliveredTons = 0,
    totalPaidSoFar = 0,
    startTime = 0,
    deliveryCount = 0,
    deliveredItems = 0
  },
  lastContractSpawnTime = 0,
  contractsGeneratedToday = 0,
  expiredContractsTotal = 0,
  initialContractsGenerated = false,
}

local PlayerData = {
  contractsCompleted = 0,
  contractsFailed = 0
}

local function pickTier()
  local tierWeights = Config.contracts.tierWeights
  if not tierWeights or #tierWeights == 0 then
    return 1
  end
  
  local totalWeight = 0
  for _, weight in ipairs(tierWeights) do
    totalWeight = totalWeight + weight
  end
  
  if totalWeight <= 0 then return 1 end
  
  local roll = math.random() * totalWeight
  local current = 0
  for i, weight in ipairs(tierWeights) do
    current = current + weight
    if roll <= current then
      return i
    end
  end
  return #tierWeights
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
  return Config.contracts.defaultGameHour or 12
end

local function getFacilityPayMultiplier(zoneTag)
  if not zoneTag then return 1.0 end
  local facilities = Config.facilities
  if not facilities then return 1.0 end
  
  for _, facility in pairs(facilities) do
    if facility.sites and facility.sites[zoneTag] then
      return facility.payMultiplier or 1.0
    end
  end
  
  return 1.0
end

local function getMaterialsByTypeName(typeName)
  local materials = {}
  if not Config.materials then return materials end
  for matKey, matConfig in pairs(Config.materials) do
    if matConfig.typeName == typeName then
      table.insert(materials, matKey)
    end
  end
  return materials
end

local function getTypeNameFromMaterial(materialType)
  if not materialType then return nil end
  local matConfig = Config.materials and Config.materials[materialType]
  return matConfig and matConfig.typeName or nil
end

local function generateContract(availableGroups)
  if not availableGroups or #availableGroups == 0 then return nil end
  if not Config.materials or next(Config.materials) == nil then
    print("[Loading] No materials configured in JSON; cannot generate contract.")
    return nil
  end

  local tier = pickTier()
  local tierData = Config.contracts.tiers[tier]
  if not tierData then
    print("[Loading] Invalid tier " .. tostring(tier) .. ", using tier 1")
    tier = 1
    tierData = Config.contracts.tiers[1]
  end

  local bulkChance = Config.contracts.bulkChance or 0.4
  local isBulk = math.random() < bulkChance

  local availableTypeNames = {}
  local typeNameSet = {}
  for _, g in ipairs(availableGroups) do
    if g.materials then
      for _, matKey in ipairs(g.materials) do
        local matConfig = Config.materials[matKey]
        local typeName = matConfig and matConfig.typeName
        if typeName and not typeNameSet[typeName] then
          typeNameSet[typeName] = true
          table.insert(availableTypeNames, typeName)
        end
      end
    elseif g.materialType then
      local matConfig = Config.materials[g.materialType]
      local typeName = matConfig and matConfig.typeName
      if typeName and not typeNameSet[typeName] then
        typeNameSet[typeName] = true
        table.insert(availableTypeNames, typeName)
      end
    end
  end
  
  if #availableTypeNames == 0 then
    print("[Loading] No material type names available in zones; cannot generate contract.")
    return nil
  end
  
  local selectedTypeName = availableTypeNames[math.random(#availableTypeNames)]
  local materialsOfType = getMaterialsByTypeName(selectedTypeName)
  
  if #materialsOfType == 0 then
    print(string.format("[Loading] No materials found for typeName '%s'; cannot generate contract.", selectedTypeName))
    return nil
  end
  
  local materialType = materialsOfType[math.random(#materialsOfType)]
  local matConfig = Config.materials[materialType]
  if not matConfig then
    print(string.format("[Loading] Material '%s' not found in Config.materials", materialType))
    return nil
  end
  
  local compatibleGroups = {}
  for _, g in ipairs(availableGroups) do
    if g.materials then
      for _, matKey in ipairs(g.materials) do
        local gMatConfig = Config.materials[matKey]
        if gMatConfig and gMatConfig.typeName == selectedTypeName then
          table.insert(compatibleGroups, g)
          break
        end
      end
    elseif g.materialType then
      local gMatConfig = Config.materials[g.materialType]
      if gMatConfig and gMatConfig.typeName == selectedTypeName then
        table.insert(compatibleGroups, g)
      end
    end
  end
  
  if #compatibleGroups == 0 then
    print(string.format("[Loading] No groups available for typeName '%s'; cannot generate contract.", selectedTypeName))
    return nil
  end
  
  local group = compatibleGroups[math.random(#compatibleGroups)]
  if not group then return nil end

  local payMultiplier = tierData.payMultiplier and math.random(tierData.payMultiplier.min * 100, tierData.payMultiplier.max * 100) / 100 or 1.0
  local basePay = tierData.basePay or 0

  local requiredTons = 0
  local requiredItems = 0
  local estimatedTrips = 1
  
  if matConfig.unitType == "item" then
    local tierStr = tostring(tier)
    local defaultRanges = Config.contracts.defaultContractRanges and Config.contracts.defaultContractRanges.item
    local ranges = matConfig.contractRanges and matConfig.contractRanges[tierStr] or defaultRanges
    if not ranges then
      print("[Loading] Warning: No contract ranges for item material " .. materialType .. " tier " .. tierStr)
      return nil
    end
    
    requiredItems = math.random(ranges.min, ranges.max)
    estimatedTrips = 1
    requiredTons = 0
  else
    local tierStr = tostring(tier)
    local defaultRanges = Config.contracts.defaultContractRanges and Config.contracts.defaultContractRanges.mass
    local ranges = matConfig.contractRanges and matConfig.contractRanges[tierStr]
    
    if ranges then
      local tonnageRange = (isBulk and ranges.bulk) or ranges.single
      if tonnageRange then
        requiredTons = math.random(tonnageRange[1], tonnageRange[2])
      else
        print("[Loading] Warning: No tonnage range for mass material " .. materialType .. " tier " .. tierStr)
        return nil
      end
    elseif defaultRanges then
      requiredTons = math.random(defaultRanges[1], defaultRanges[2])
    else
      print("[Loading] Warning: No contract ranges for mass material " .. materialType .. " tier " .. tierStr)
      return nil
    end
    
    estimatedTrips = math.ceil(requiredTons / (Config.settings.targetLoad / 1000))
  end

  local unitPay = 0
  if matConfig.unitType == "item" then
    unitPay = requiredItems * (matConfig.payPerUnit or 0)
  else
    unitPay = requiredTons * (matConfig.payPerUnit or 0)
  end
  
  local totalPayout = math.floor((basePay + unitPay) * payMultiplier)

  local name = selectedTypeName or matConfig.name or "Delivery"
  if isBulk then name = "Bulk " .. name end

  local currentHour = getCurrentGameHour()
  local expirationTime = Config.contracts.contractExpirationTime[tostring(tier)]
  local baseExpiration = expirationTime or (Config.contracts.defaultExpirationHours or 6)
  local expiresAt = currentHour + baseExpiration

  return {
    id = os.time() + math.random(1000, 9999),
    name = name,
    tier = tier,
    material = materialType,
    materialTypeName = selectedTypeName,
    requiredTons = requiredTons,
    requiredItems = requiredItems,
    unitType = matConfig.unitType,
    units = matConfig.units,
    isBulk = isBulk,
    basePay = basePay,
    unitPay = unitPay,
    payMultiplier = payMultiplier,
    totalPayout = totalPayout,
    destination = {
      pos = group.destination and group.destination.pos and vec3(group.destination.pos) or nil,
      name = group.destination and group.destination.name or "Destination",
      originZoneTag = group.secondaryTag,
    },
    group = nil,
    groupTag = group.secondaryTag,
    estimatedTrips = estimatedTrips,
    createdAt = currentHour,
    expiresAt = expiresAt,
    expirationHours = baseExpiration,
  }
end

local function sortContracts()
  table.sort(ContractSystem.availableContracts, function(a, b)
    if a.tier == b.tier then return a.totalPayout < b.totalPayout end
    return a.tier < b.tier
  end)
end

local function generateInitialContracts(availableGroups)
  ContractSystem.availableContracts = {}
  if not availableGroups or #availableGroups == 0 then return end

  local initialCount = Config.contracts.initialContracts or 4
  for i = 1, initialCount do
    local contract = generateContract(availableGroups)
    if contract then
      table.insert(ContractSystem.availableContracts, contract)
    end
  end

  sortContracts()
  ContractSystem.lastContractSpawnTime = getCurrentGameHour()
  ContractSystem.contractsGeneratedToday = initialCount
  ContractSystem.initialContractsGenerated = true
  print("[Loading] Generated " .. #ContractSystem.availableContracts .. " initial contracts")
end

local function trySpawnNewContract(availableGroups)
  if #ContractSystem.availableContracts >= (Config.contracts.maxActiveContracts or 6) then
    return false
  end
  
  local currentHour = getCurrentGameHour()
  local lastSpawn = ContractSystem.lastContractSpawnTime or 0
  local interval = Config.contracts.contractSpawnInterval or 2
  
  local hoursSinceSpawn = currentHour - lastSpawn
  if hoursSinceSpawn < 0 then hoursSinceSpawn = hoursSinceSpawn + 24 end
  
  if hoursSinceSpawn >= interval then
    local contract = generateContract(availableGroups)
    if contract then
      table.insert(ContractSystem.availableContracts, contract)
      sortContracts()
      ContractSystem.lastContractSpawnTime = currentHour
      ContractSystem.contractsGeneratedToday = (ContractSystem.contractsGeneratedToday or 0) + 1
      
      ui_message("New contract available: " .. contract.name, 4, "info")
      Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Unlock_01')
      
      print("[Loading] Spawned new contract: " .. contract.name .. " (Tier " .. contract.tier .. ")")
      return true
    end
  end
  return false
end

local function checkContractExpiration()
  local currentHour = getCurrentGameHour()
  local expiredCount = 0
  local remainingContracts = {}
  
  for _, contract in ipairs(ContractSystem.availableContracts) do
    local expiresAt = contract.expiresAt or math.huge
    local hoursUntilExpire = expiresAt - currentHour
    if expiresAt > 24 and currentHour < 12 then
      hoursUntilExpire = expiresAt - 24 - currentHour
    end
    
    if hoursUntilExpire > 0 then
      table.insert(remainingContracts, contract)
    else
      expiredCount = expiredCount + 1
      ContractSystem.expiredContractsTotal = (ContractSystem.expiredContractsTotal or 0) + 1
      print("[Loading] Contract expired: " .. (contract.name or "Unknown"))
    end
  end
  
  if expiredCount > 0 then
    ContractSystem.availableContracts = remainingContracts
    ui_message(expiredCount .. " contract" .. (expiredCount > 1 and "s" or "") .. " expired", 3, "warning")
  end
  return expiredCount
end

local function getContractHoursRemaining(contract)
  if not contract or not contract.expiresAt then return 99 end
  local currentHour = getCurrentGameHour()
  local hoursLeft = contract.expiresAt - currentHour
  
  if contract.expiresAt > 24 and currentHour < 12 then
    hoursLeft = contract.expiresAt - 24 - currentHour
  end
  if hoursLeft < 0 then hoursLeft = hoursLeft + 24 end
  
  return hoursLeft
end

local function shouldRefreshContracts()
  local currentDay = math.floor(os.time() / 86400)
  if currentDay - (ContractSystem.lastRefreshDay or -999) >= (Config.contracts.refreshDays or 3) then
    ContractSystem.lastRefreshDay = currentDay
    ContractSystem.initialContractsGenerated = false
    return true
  end
  return false
end

local function checkContractCompletion()
  if not ContractSystem.activeContract then return false end
  local contract = ContractSystem.activeContract
  local p = ContractSystem.contractProgress
  
  if contract.unitType == "item" then
    local delivered = p.deliveredItems or 0
    return delivered >= (contract.requiredItems or 0)
  end
  
  return (p and p.deliveredTons or 0) >= (contract.requiredTons or math.huge)
end

local function acceptContract(contractIndex, getZonesByTypeName)
  local contract = ContractSystem.availableContracts[contractIndex]
  if not contract then return end

  local contractTypeName = contract.materialTypeName
  if not contractTypeName then
    print("[Loading] Error: Contract missing materialTypeName field")
    return nil
  end
  local compatibleZones = getZonesByTypeName(contractTypeName)
  
  if #compatibleZones == 0 then
    ui_message(string.format("No zones available for %s!", contractTypeName:upper()), 5, "error")
    return nil
  end
  
  table.remove(ContractSystem.availableContracts, contractIndex)
  
  contract.group = nil
  contract.loadingZoneTag = nil
  
  ContractSystem.activeContract = contract
  ContractSystem.contractProgress = {
    deliveredTons = 0,
    totalPaidSoFar = 0,
    startTime = os.clock(),
    deliveryCount = 0,
    deliveredItems = 0
  }
  
  Engine.Audio.playOnce('AudioGui', 'event:>UI>Missions>Mission_Start_01')
  
  local zoneNames = {}
  for _, z in ipairs(compatibleZones) do
    table.insert(zoneNames, z.secondaryTag or "Unknown")
  end
  
  ui_message(string.format("Contract accepted! Drive to any %s zone to load: %s", 
    contractTypeName:upper(), table.concat(zoneNames, ", ")), 8, "info")
  
  print(string.format("[Loading] Contract accepted. TypeName: %s. Compatible zones: %s", 
    contractTypeName, table.concat(zoneNames, ", ")))
  
  return contract, compatibleZones
end

local function abandonContract(onCleanup)
  if not ContractSystem.activeContract then return end
  ui_message(string.format("Contract abandoned! Penalty: $%d", Config.contracts.abandonPenalty or 0), 6, "warning")

  local success, err = pcall(function()
    local career = career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = career_modules_payment
      if paymentModule and type(paymentModule.pay) == "function" then
        paymentModule.pay(-(Config.contracts.abandonPenalty or 0), {label = "Contract Abandonment"})
      end
    end
  end)
  if not success then
    print("[Loading] Warning: Could not apply abandonment penalty: " .. tostring(err))
  end

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredItems = 0}

  if onCleanup then onCleanup(true) end
end

local function failContract(penalty, message, msgType, onCleanup)
  if not ContractSystem.activeContract then
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

  PlayerData.contractsFailed = (PlayerData.contractsFailed or 0) + 1
  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredItems = 0}

  if onCleanup then onCleanup(true) end
end

local function completeContract(onCleanup, onClearProps)
  if not ContractSystem.activeContract then return end
  local contract = ContractSystem.activeContract

  local zoneTag = contract.loadingZoneTag or contract.groupTag
  local facilityPayMultiplier = getFacilityPayMultiplier(zoneTag)
  local totalPay = math.floor((contract.totalPayout or 0) * facilityPayMultiplier)

  local careerPaid = false
  local success, err = pcall(function()
    local career = career_career
    if career and type(career.isActive) == "function" and career.isActive() then
      local paymentModule = career_modules_payment
      if paymentModule and type(paymentModule.reward) == "function" then
        local xpMultiplier = 10
        local xpReward = 0
        if contract.unitType == "item" then
          xpReward = math.floor((contract.requiredItems or 0) * xpMultiplier)
        else
          xpReward = math.floor((contract.requiredTons or 0) * xpMultiplier)
        end
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

  PlayerData.contractsCompleted = (PlayerData.contractsCompleted or 0) + 1

  ContractSystem.activeContract = nil
  ContractSystem.contractProgress = {deliveredTons = 0, totalPaidSoFar = 0, deliveryCount = 0, deliveredItems = 0}

  if onClearProps then onClearProps() end
  if onCleanup then onCleanup(true) end
end

M.ContractSystem = ContractSystem
M.PlayerData = PlayerData

M.getCurrentGameHour = getCurrentGameHour
M.generateContract = generateContract
M.sortContracts = sortContracts
M.generateInitialContracts = generateInitialContracts
M.trySpawnNewContract = trySpawnNewContract
M.checkContractExpiration = checkContractExpiration
M.getContractHoursRemaining = getContractHoursRemaining
M.shouldRefreshContracts = shouldRefreshContracts
M.checkContractCompletion = checkContractCompletion
M.acceptContract = acceptContract
M.abandonContract = abandonContract
M.failContract = failContract
M.completeContract = completeContract
M.getMaterialsByTypeName = getMaterialsByTypeName
M.getTypeNameFromMaterial = getTypeNameFromMaterial
M.getFacilityPayMultiplier = getFacilityPayMultiplier

return M


