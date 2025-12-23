local M = {}

local Config = gameplay_loading_config
M.uiAnim = { opacity = 0, yOffset = 50, pulse = 0, targetOpacity = 0 }
M.uiHidden = false
M.markerAnim = { time = 0, pulseScale = 1.0, rotationAngle = 0, beamHeight = 0, ringExpand = 0 }

local imgui = ui_imgui

local function lerp(a, b, t) return a + (b - a) * t end

function M.drawWorkSiteMarker(dt, currentState, stateDrivingToSite, markerCleared, activeGroup)
  if currentState ~= stateDrivingToSite or markerCleared or not activeGroup or not activeGroup.loading then return end

  M.markerAnim.time = M.markerAnim.time + dt
  M.markerAnim.pulseScale = 1.0 + math.sin(M.markerAnim.time * 2.5) * 0.1
  M.markerAnim.rotationAngle = M.markerAnim.rotationAngle + dt * 0.4
  M.markerAnim.beamHeight = math.min(12.0, M.markerAnim.beamHeight + dt * 30)
  M.markerAnim.ringExpand = (M.markerAnim.ringExpand + dt * 1.5) % 1.5

  local basePos = vec3(activeGroup.loading.center)
  local color = ColorF(0.2, 1.0, 0.4, 0.85)
  local colorFaded = ColorF(0.2, 1.0, 0.4, 0.3)
  local beamTop = basePos + vec3(0, 0, M.markerAnim.beamHeight)
  local beamRadius = 0.5 * M.markerAnim.pulseScale

  debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
  debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.2, colorFaded)

  local sphereRadius = 1.0 * M.markerAnim.pulseScale
  debugDrawer:drawSphere(beamTop, sphereRadius, color)
  debugDrawer:drawSphere(beamTop, sphereRadius + 0.3, ColorF(0.2, 1.0, 0.4, 0.15))
end

function M.drawZoneChoiceMarkers(dt, currentState, stateChoosingZone, compatibleZones)
  if currentState ~= stateChoosingZone or #compatibleZones == 0 then return end

  M.markerAnim.time = M.markerAnim.time + dt
  M.markerAnim.pulseScale = 1.0 + math.sin(M.markerAnim.time * 2.5) * 0.15
  M.markerAnim.beamHeight = math.min(15.0, M.markerAnim.beamHeight + dt * 30)

  for i, zone in ipairs(compatibleZones) do
    if zone.loading and zone.loading.center then
      local basePos = vec3(zone.loading.center)
      local hue = (i - 1) / math.max(1, #compatibleZones)
      local r = 0.3 + 0.7 * math.abs(math.sin(hue * 3.14159))
      local g = 0.8 + 0.2 * math.sin(M.markerAnim.time * 2)
      local b = 0.3 + 0.7 * math.abs(math.cos(hue * 3.14159))
      
      local color = ColorF(r, g, b, 0.85)
      local colorFaded = ColorF(r, g, b, 0.3)
      local beamTop = basePos + vec3(0, 0, M.markerAnim.beamHeight)
      local beamRadius = 0.6 * M.markerAnim.pulseScale

      debugDrawer:drawCylinder(basePos, beamTop, beamRadius, color)
      debugDrawer:drawCylinder(basePos, beamTop, beamRadius + 0.25, colorFaded)

      local sphereRadius = 1.2 * M.markerAnim.pulseScale
      debugDrawer:drawSphere(beamTop, sphereRadius, color)
      debugDrawer:drawSphere(beamTop, sphereRadius + 0.4, ColorF(r, g, b, 0.15))
      
      local textPos = beamTop + vec3(0, 0, 2)
      local materialType = zone.materialType or "rocks"
      local text = string.format("%s (%s)", zone.secondaryTag or "Zone", materialType:upper())
      debugDrawer:drawTextAdvanced(textPos, text, ColorF(1, 1, 1, 1), true, false, ColorI(0, 0, 0, 200))
    end
  end
end

function M.getQuarryStateForUI(currentState, playerMod, contractsMod, managerMod, zonesMod)
  local contractsForUI = {}
  for i, c in ipairs(contractsMod.ContractSystem.availableContracts or {}) do
    table.insert(contractsForUI, {
      id = c.id, name = c.name, tier = c.tier, material = c.material,
      requiredTons = c.requiredTons, requiredBlocks = c.requiredBlocks,
      isBulk = c.isBulk, totalPayout = c.totalPayout, paymentType = c.paymentType,
      modifiers = c.modifiers, groupTag = c.groupTag, estimatedTrips = c.estimatedTrips,
      isSpecial = c.isSpecial, isUrgent = c.isUrgent or false, expiresAt = c.expiresAt,
      hoursRemaining = contractsMod.getContractHoursRemaining(c), expirationHours = c.expirationHours,
      destinationName = c.destination and c.destination.name or nil,
      originZoneTag = c.destination and c.destination.originZoneTag or c.groupTag,
    })
  end

  local activeContractForUI = nil
  if contractsMod.ContractSystem.activeContract then
    local c = contractsMod.ContractSystem.activeContract
    activeContractForUI = {
      id = c.id, name = c.name, tier = c.tier, material = c.material,
      requiredTons = c.requiredTons, requiredBlocks = c.requiredBlocks,
      totalPayout = c.totalPayout, paymentType = c.paymentType,
      modifiers = c.modifiers, groupTag = c.groupTag, estimatedTrips = c.estimatedTrips,
      loadingZoneTag = c.loadingZoneTag,
      destinationName = c.destination and c.destination.name or nil,
    }
  end

  return {
    state = currentState,
    playerLevel = contractsMod.PlayerData.level or 1,
    contractsCompleted = contractsMod.PlayerData.contractsCompleted or 0,
    availableContracts = contractsForUI,
    activeContract = activeContractForUI,
    contractProgress = {
      deliveredTons = contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.deliveredTons or 0,
      totalPaidSoFar = contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.totalPaidSoFar or 0,
      deliveredBlocks = contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.deliveredBlocks or { big = 0, small = 0, total = 0 },
      deliveryCount = contractsMod.ContractSystem.contractProgress and contractsMod.ContractSystem.contractProgress.deliveryCount or 0
    },
    currentLoadMass = managerMod.jobObjects.currentLoadMass or 0,
    targetLoad = Config.Config.TargetLoad or 25000,
    materialType = managerMod.jobObjects.materialType or "rocks",
    marbleBlocks = managerMod.jobObjects.materialType == "marble" and managerMod.getMarbleBlocksStatus() or {},
    anyMarbleDamaged = managerMod.jobObjects.anyMarbleDamaged or false,
    deliveryBlocks = managerMod.jobObjects.deliveryBlocksStatus or {},
    markerCleared = managerMod.markerCleared,
    truckStopped = managerMod.truckStoppedInLoading,
    zoneStock = managerMod.jobObjects.activeGroup and zonesMod.getZoneStockInfo(managerMod.jobObjects.activeGroup, contractsMod.getCurrentGameHour) or nil
  }
end

function M.requestQuarryState(currentState, playerMod, contractsMod, managerMod, zonesMod)
  guihooks.trigger('updateQuarryState', M.getQuarryStateForUI(currentState, playerMod, contractsMod, managerMod, zonesMod))
end

function M.drawUI(dt, currentState, configStates, playerMod, contractsMod, managerMod, zonesMod, callbacks)
  if not imgui then return end

  if M.uiHidden and currentState ~= configStates.STATE_IDLE then
    imgui.SetNextWindowPos(imgui.ImVec2(10, 200), imgui.Cond_FirstUseEver)
    imgui.PushStyleVar1(imgui.StyleVar_WindowRounding, 8)
    imgui.PushStyleColor2(imgui.Col_WindowBg, imgui.ImVec4(0.1, 0.1, 0.12, 0.9))
    if imgui.Begin("##WL40Show", nil, imgui.WindowFlags_NoTitleBar + imgui.WindowFlags_AlwaysAutoResize + imgui.WindowFlags_NoCollapse) then
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.2, 0.4, 0.2, 0.9))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.3, 0.6, 0.3, 1))
      if imgui.Button("Show Job UI", imgui.ImVec2(100, 30)) then M.uiHidden = false end
      imgui.PopStyleColor(2)
    end
    imgui.End()
    imgui.PopStyleColor(1)
    imgui.PopStyleVar(1)
    return
  end

  M.uiAnim.targetOpacity = (currentState ~= configStates.STATE_IDLE) and 1.0 or 0.0
  M.uiAnim.opacity = lerp(M.uiAnim.opacity, M.uiAnim.targetOpacity, dt * 8.0)
  M.uiAnim.yOffset = lerp(M.uiAnim.yOffset, (1.0 - M.uiAnim.opacity) * 50, dt * 8.0)
  if M.uiAnim.opacity < 0.01 then return end

  M.uiAnim.pulse = M.uiAnim.pulse + dt * 5
  local pulseAlpha = (math.sin(M.uiAnim.pulse) * 0.3) + 0.7

  imgui.PushStyleVar2(imgui.StyleVar_WindowPadding, imgui.ImVec2(20, 20))
  imgui.PushStyleVar1(imgui.StyleVar_WindowRounding, 12)
  imgui.PushStyleColor2(imgui.Col_WindowBg, imgui.ImVec4(0.1, 0.1, 0.12, 0.95 * M.uiAnim.opacity))
  imgui.PushStyleColor2(imgui.Col_Border, imgui.ImVec4(1.0, 0.7, 0.0, 0.8 * M.uiAnim.opacity))
  imgui.PushStyleVar1(imgui.StyleVar_WindowBorderSize, 2)
  imgui.SetNextWindowBgAlpha(0.95 * M.uiAnim.opacity)
  imgui.SetNextWindowSizeConstraints(imgui.ImVec2(280, 100), imgui.ImVec2(350, 800))

  if imgui.Begin("##WL40System", nil, imgui.WindowFlags_NoTitleBar + imgui.WindowFlags_AlwaysAutoResize + imgui.WindowFlags_NoCollapse) then
    local windowWidth = imgui.GetWindowWidth()
    imgui.SetCursorPosX(windowWidth - 30)
    imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.2, 0.2, 0.8 * M.uiAnim.opacity))
    imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.2, 0.2, 1))
    if imgui.Button("X", imgui.ImVec2(20, 20)) then M.uiHidden = true end
    imgui.PopStyleColor(2)
    imgui.SetCursorPosX(0)
    
    imgui.SetWindowFontScale(1.5)
    imgui.TextColored(imgui.ImVec4(1, 0.75, 0, M.uiAnim.opacity), "LOGISTICS JOB SYSTEM")
    imgui.SetWindowFontScale(1.0)
    imgui.Separator()
    imgui.Dummy(imgui.ImVec2(0, 10))

    local contentWidth = imgui.GetContentRegionAvailWidth()

    if currentState == configStates.STATE_CONTRACT_SELECT then
      imgui.TextColored(imgui.ImVec4(1, 1, 1, M.uiAnim.opacity), "Available Contracts")
      imgui.TextColored(imgui.ImVec4(0.7, 0.7, 0.7, M.uiAnim.opacity), string.format("Player Level: %d | Completed: %d", contractsMod.PlayerData.level or 1, contractsMod.PlayerData.contractsCompleted or 0))
      imgui.Dummy(imgui.ImVec2(0, 10))

      if #contractsMod.ContractSystem.availableContracts == 0 then
        imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, M.uiAnim.opacity), "No contracts available")
      else
        local tierColors = { imgui.ImVec4(0.5, 0.8, 0.5, 1), imgui.ImVec4(0.5, 0.7, 1.0, 1), imgui.ImVec4(1.0, 0.7, 0.4, 1), imgui.ImVec4(1.0, 0.4, 0.4, 1) }
        for i, c in ipairs(contractsMod.ContractSystem.availableContracts) do
          if c.isUrgent then
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.3, 0.15, 0.1, 0.9))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.45, 0.25, 0.15, 1))
            imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.5, 0.3, 0.2, 1))
          else
            imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.15, 0.15, 0.2, 0.9))
            imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.25, 0.25, 0.35, 1))
            imgui.PushStyleColor2(imgui.Col_ButtonActive, imgui.ImVec4(0.3, 0.3, 0.4, 1))
          end
          if imgui.Button(string.format("[%d] %s##contract%d", i, c.name or "Contract", i), imgui.ImVec2(contentWidth, 0)) then callbacks.onAcceptContract(i) end
          imgui.PopStyleColor(3)

          imgui.Indent(20)
          imgui.TextColored(tierColors[c.tier or 1] or imgui.ImVec4(1, 1, 1, 1), string.format("Tier %d | %s", c.tier or 1, tostring((c.material or "rocks"):upper())))
          imgui.SameLine()
          imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("  $%d", c.totalPayout or 0))
          if c.isUrgent then imgui.SameLine(); imgui.TextColored(imgui.ImVec4(1, 0.6, 0, 1), " [+25% URGENT]") end
          
          if c.material == "marble" and c.requiredBlocks then
            local b = c.requiredBlocks
            imgui.TextColored(imgui.ImVec4(0.8, 0.9, 1.0, 1), (b.big > 0 and b.small > 0) and string.format("* %d Large + %d Small blocks", b.big, b.small) or (b.big > 0 and string.format("* %d Large block%s", b.big, b.big > 1 and "s" or "") or string.format("* %d Small block%s", b.small, b.small > 1 and "s" or "")))
          else
            imgui.Text(string.format("* %d tons total", c.requiredTons or 0))
          end
          imgui.Text(string.format("* Payment: %s", (c.paymentType == "progressive") and "Progressive" or "On completion"))
          
          local hoursLeft = contractsMod.getContractHoursRemaining(c)
          if hoursLeft <= 1 then imgui.TextColored(imgui.ImVec4(1, 0.3, 0.3, 1), string.format("* EXPIRES SOON: %d min", math.floor(hoursLeft * 60)))
          elseif hoursLeft <= 2 then imgui.TextColored(imgui.ImVec4(1, 0.7, 0.3, 1), string.format("* Expires in: %.1f hrs", hoursLeft))
          else imgui.TextColored(imgui.ImVec4(0.6, 0.6, 0.6, 1), string.format("* Expires in: %.0f hrs", hoursLeft)) end
          
          if c.modifiers and #c.modifiers > 0 then
            local mt = "* Modifiers: "
            for j, m in ipairs(c.modifiers) do mt = mt .. tostring(m.name or "?") .. (j < #c.modifiers and ", " or "") end
            imgui.TextColored(imgui.ImVec4(1, 1, 0.5, 1), mt)
          end
          imgui.Unindent(20); imgui.Dummy(imgui.ImVec2(0, 8))
          if i < #contractsMod.ContractSystem.availableContracts then imgui.Separator(); imgui.Dummy(imgui.ImVec2(0, 5)) end
        end
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, M.uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, M.uiAnim.opacity))
      if imgui.Button("DECLINE ALL", imgui.ImVec2(-1, 35)) then callbacks.onDeclineAll() end
      imgui.PopStyleColor(2)

    elseif currentState == configStates.STATE_CHOOSING_ZONE then
      imgui.TextColored(imgui.ImVec4(1, 0.8, 0.2, pulseAlpha * M.uiAnim.opacity), ">> CHOOSE LOADING ZONE <<")
      imgui.Dummy(imgui.ImVec2(0, 5))
      if contractsMod.ContractSystem.activeContract then
        local c = contractsMod.ContractSystem.activeContract
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        imgui.Text(string.format("Material needed: %s", (c.material or "rocks"):upper()))
        imgui.Dummy(imgui.ImVec2(0, 8))
      end
      imgui.TextColored(imgui.ImVec4(0.7, 1, 0.7, M.uiAnim.opacity), "Drive to any highlighted zone:")
      imgui.Dummy(imgui.ImVec2(0, 5))
      for i, zone in ipairs(callbacks.getCompatibleZones()) do
        local dist = be:getPlayerVehicle(0) and (be:getPlayerVehicle(0):getPosition() - vec3(zone.loading.center)):length() or 0
        local hue = (i - 1) / math.max(1, #callbacks.getCompatibleZones())
        imgui.TextColored(imgui.ImVec4(0.3 + 0.7 * math.abs(math.sin(hue * 3.14159)), 0.8, 0.3 + 0.7 * math.abs(math.cos(hue * 3.14159)), M.uiAnim.opacity), string.format("  [%d] %s (%s) - %.0fm", i, zone.secondaryTag or "Zone", (zone.materialType or "rocks"):upper(), dist))
      end
      imgui.Dummy(imgui.ImVec2(0, 15))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0.5, 0.1, 0.1, M.uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0.7, 0.1, 0.1, M.uiAnim.opacity))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end
      imgui.PopStyleColor(2)

    elseif currentState == configStates.STATE_DRIVING_TO_SITE then
      if managerMod.jobObjects.activeGroup and managerMod.jobObjects.activeGroup.loading then
        if not managerMod.markerCleared then
          imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * M.uiAnim.opacity), ">> TRAVEL TO MARKER <<")
          local dist = be:getPlayerVehicle(0) and (be:getPlayerVehicle(0):getPosition() - vec3(managerMod.jobObjects.activeGroup.loading.center)):length() or 99999
          imgui.ProgressBar(1.0 - math.min(1, dist / 200), imgui.ImVec2(-1, 20), string.format("%.0fm", dist))
        else
          imgui.TextColored(imgui.ImVec4(1, 1, 0, pulseAlpha * M.uiAnim.opacity), ">> IN LOADING ZONE <<")
          imgui.Text(not managerMod.truckStoppedInLoading and "Waiting for truck to arrive..." or "Truck arrived. Ready to load.")
        end
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end

    elseif currentState == configStates.STATE_TRUCK_ARRIVING then
      imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * M.uiAnim.opacity), ">> TRUCK ARRIVING <<")
      imgui.Text("Waiting for truck to arrive..."); imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end

    elseif currentState == configStates.STATE_LOADING then
      imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha * M.uiAnim.opacity), ">> LOADING <<")
      if contractsMod.ContractSystem.activeContract then
        local c, p = contractsMod.ContractSystem.activeContract, contractsMod.ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        if c.material == "marble" and c.requiredBlocks then
          imgui.Text(string.format("Large: %d / %d", p.deliveredBlocks.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", p.deliveredBlocks.small, c.requiredBlocks.small))
        else
          imgui.Text(string.format("Progress: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0))
        end
        imgui.Separator()
      end
      local percent = math.min(1.0, managerMod.jobObjects.currentLoadMass / Config.Config.TargetLoad)
      imgui.Text(string.format("Payload: %.0f / %.0f kg", managerMod.jobObjects.currentLoadMass, Config.Config.TargetLoad))
      imgui.PushStyleColor2(imgui.Col_PlotHistogram, percent > 0.8 and imgui.ImVec4(0, 1, 0, 1) or imgui.ImVec4(1, 1, 0, 1))
      imgui.ProgressBar(percent, imgui.ImVec2(-1, 30), string.format("%.0f%%", percent * 100))
      imgui.PopStyleColor(1)

      if managerMod.jobObjects.materialType == "marble" then
        imgui.Dummy(imgui.ImVec2(0, 8)); imgui.Separator(); imgui.Dummy(imgui.ImVec2(0, 4))
        if managerMod.jobObjects.anyMarbleDamaged then imgui.TextColored(imgui.ImVec4(1, 0.6, 0.2, M.uiAnim.opacity * 0.8), "Damaged blocks won't count"); imgui.Dummy(imgui.ImVec2(0, 2)) end
        for _, block in ipairs(managerMod.getMarbleBlocksStatus()) do
          imgui.TextColored(imgui.ImVec4(1, 1, 1, M.uiAnim.opacity), string.format("Block %d: ", block.index))
          imgui.SameLine(); imgui.TextColored(block.isDamaged and imgui.ImVec4(1, 0.3, 0.2, ((math.sin(M.uiAnim.pulse * 2) * 0.3) + 0.7) * M.uiAnim.opacity) or imgui.ImVec4(0.3, 1, 0.3, M.uiAnim.opacity), block.isDamaged and "DAMAGED" or "OK")
          imgui.SameLine(); imgui.TextColored(imgui.ImVec4(0.5, 0.5, 0.5, M.uiAnim.opacity), " | ")
          imgui.SameLine(); imgui.TextColored(block.isLoaded and imgui.ImVec4(0.3, 0.8, 1, M.uiAnim.opacity) or imgui.ImVec4(0.6, 0.6, 0.6, M.uiAnim.opacity), block.isLoaded and "Loaded" or "Not loaded")
        end
      end
      imgui.Dummy(imgui.ImVec2(0, 20))
      imgui.PushStyleColor2(imgui.Col_Button, imgui.ImVec4(0, 0.4, 0, M.uiAnim.opacity))
      imgui.PushStyleColor2(imgui.Col_ButtonHovered, imgui.ImVec4(0, 0.6, 0, M.uiAnim.opacity))
      if imgui.Button("SEND TRUCK", imgui.ImVec2(-1, 45)) then callbacks.onSendTruck() end
      imgui.PopStyleColor(2); imgui.Dummy(imgui.ImVec2(0, 5))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end

    elseif currentState == configStates.STATE_DELIVERING then
      imgui.TextColored(imgui.ImVec4(0, 1, 1, pulseAlpha * M.uiAnim.opacity), ">> DELIVERING <<")
      if contractsMod.ContractSystem.activeContract then
        local c, p = contractsMod.ContractSystem.activeContract, contractsMod.ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        if c.material == "marble" and c.requiredBlocks then
          imgui.Text(string.format("Large: %d / %d", p.deliveredBlocks.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", p.deliveredBlocks.small, c.requiredBlocks.small))
        else imgui.Text(string.format("Progress: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0)) end
        imgui.Separator()
      end
      imgui.Text("Truck driving to destination...")
      if managerMod.jobObjects.materialType == "marble" and managerMod.jobObjects.deliveryBlocksStatus then
        imgui.Dummy(imgui.ImVec2(0, 5)); imgui.Text("Delivering:")
        for _, b in ipairs(managerMod.jobObjects.deliveryBlocksStatus) do
          if b.isLoaded then imgui.TextColored(b.isDamaged and imgui.ImVec4(1, 0.4, 0.2, M.uiAnim.opacity * 0.7) or imgui.ImVec4(0.3, 1, 0.3, M.uiAnim.opacity), string.format("  Block %d (%s)", b.index, b.isDamaged and "DAMAGED" or "OK")) end
        end
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end

    elseif currentState == configStates.STATE_RETURN_TO_QUARRY then
      imgui.TextColored(imgui.ImVec4(1.0, 0.6, 0.2, pulseAlpha * M.uiAnim.opacity), ">> RETURN TO STARTER ZONE <<")
      if contractsMod.ContractSystem.activeContract then
        local c, p = contractsMod.ContractSystem.activeContract, contractsMod.ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        if contractsMod.checkContractCompletion() then imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "CONTRACT COMPLETE!") end
        if c.material == "marble" and c.requiredBlocks then
          imgui.Text(string.format("Large: %d / %d", p.deliveredBlocks.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", p.deliveredBlocks.small, c.requiredBlocks.small))
        else imgui.Text(string.format("Delivered: %.1f / %.1f tons", p.deliveredTons or 0, c.requiredTons or 0)) end
        imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Payout: $%d (on completion)", c.totalPayout or 0))
      end
      imgui.Dummy(imgui.ImVec2(0, 10))
      if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end

    elseif currentState == configStates.STATE_AT_QUARRY_DECIDE then
      imgui.TextColored(imgui.ImVec4(0.2, 1.0, 0.4, pulseAlpha * M.uiAnim.opacity), ">> AT STARTER ZONE <<")
      if contractsMod.ContractSystem.activeContract then
        local c, p = contractsMod.ContractSystem.activeContract, contractsMod.ContractSystem.contractProgress
        imgui.Text(string.format("Contract: %s", c.name or "Contract"))
        if c.material == "marble" and c.requiredBlocks then
          imgui.Text(string.format("Large: %d / %d", p.deliveredBlocks.big, c.requiredBlocks.big))
          imgui.Text(string.format("Small: %d / %d", p.deliveredBlocks.small, c.requiredBlocks.small))
        else
          local pct = (c.requiredTons or 0) > 0 and (p.deliveredTons or 0) / (c.requiredTons or 1) or 0
          imgui.Text(string.format("Progress: %.1f / %.1f tons (%.0f%%)", p.deliveredTons or 0, c.requiredTons or 0, pct * 100))
        end
        imgui.TextColored(imgui.ImVec4(0.5, 1, 0.5, 1), string.format("Payout: $%d", c.totalPayout or 0))
        imgui.Dummy(imgui.ImVec2(0, 10))
        if contractsMod.checkContractCompletion() then
          imgui.TextColored(imgui.ImVec4(0, 1, 0, pulseAlpha), "CONTRACT COMPLETE!"); imgui.Dummy(imgui.ImVec2(0, 10))
          if imgui.Button("FINALIZE CONTRACT", imgui.ImVec2(-1, 45)) then callbacks.onFinalizeContract() end
        else
          if imgui.Button("LOAD MORE", imgui.ImVec2(-1, 45)) then callbacks.onLoadMore() end
          imgui.Dummy(imgui.ImVec2(0, 8))
          if imgui.Button("ABANDON CONTRACT", imgui.ImVec2(-1, 30)) then callbacks.onAbandonContract() end
        end
      end
    end
  end
  imgui.End(); imgui.PopStyleColor(2); imgui.PopStyleVar(3)
end

return M
