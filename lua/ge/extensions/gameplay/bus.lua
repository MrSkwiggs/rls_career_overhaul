-- ================================
-- Bus Work 
-- ================================
local M = {}
M.dependencies = {'gameplay_sites_sitesManager', 'freeroam_facilities'}

local core_groundMarkers = require('core/groundMarkers')
local core_vehicles      = require('core/vehicles')

-- ================================
-- STATE
-- ================================
local currentStopIndex        = nil
local stopTriggers            = {}
local dwellTimer              = nil
local dwellDuration           = 10
local consecutiveStops        = 0
local currentRouteActive      = false
local accumulatedReward       = 0
local passengersOnboard       = 0
local activeBusID             = nil
local routeInitialized        = false
local totalStopsCompleted     = 0
local routeCooldown           = 0
local currentVehiclePartsTree = nil

-- Stop-settle state
local stopMonitorActive       = false
local stopSettleTimer         = 0
local stopSettleDelay         = 2.5

-- Trigger state (for radius check replacement)
local currentTriggerName      = nil
-- Rough ride / tips
local roughRide               = 0
local lastVelocity            = nil
local tipTotal                = 0

-- Boarding / deboarding tallies (per stop)
local trueBoarding            = 0
local trueDeboarding          = 0

-- Coroutine for realistic animation
local boardingCoroutine       = nil

-- Final stop name for current route
local currentFinalStopName    = nil

-- Current route info (to prevent route changes mid-route)
local currentRouteName        = nil
local currentRouteKey         = nil

-- Store display names by trigger name for reliable access
local stopDisplayNames        = {}

-- Bus stop perimeter markers
local stopMarkerObjects       = {}
local stopPerimeterTrigger    = nil

-- forward declaration 
local isBus

-- ================================
-- CAPACITY DETECTION
-- ================================
local function specificCapacityCases(partName)
  if partName:find("capsule") and partName:find("seats") then
    if partName:find("sd12m") then return 25
    elseif partName:find("sd18m") then return 41
    elseif partName:find("sd105") then return 21
    elseif partName:find("sd_seats") then return 33
    elseif partName:find("dd105") then return 29
    elseif partName:find("sd195") then return 43
    elseif partName:find("lhd_artic_seats_upper") then return 77
    elseif partName:find("lhd_artic_seats") then return 30
    elseif partName:find("lh_seats_upper") then return 53
    elseif partName:find("lh_seats") then return 17
    elseif partName:find("lhd_seats_upper") then return 53
    elseif partName:find("lhd_seats") then return 17
    elseif partName:find("rhd_artic_seats_upper") then return 77
    elseif partName:find("rhd_artic_seats") then return 30
    end
  end

  if partName:find("schoolbus_seats_R_c") then return 10 end
  if partName:find("schoolbus_seats_L_c") then return 10 end
  if partName:find("limo_seat") then return 8 end

  return nil
end

local function cyclePartsTree(partData, seatingCapacity)
  for _, part in pairs(partData) do
    local partName = part.chosenPartName or ""

    if partName:find("seat") and not partName:find("cargo") and not partName:find("captains") then
      local seatSize = 1
      if partName:find("seats") then
        seatSize = 3
      elseif partName:find("ext") then
        seatSize = 2
      elseif partName:find("skin") then
        seatSize = 0
      end

      seatSize = specificCapacityCases(partName) or seatSize
      seatingCapacity = seatingCapacity + seatSize
    end

    if part.children then
      seatingCapacity = cyclePartsTree(part.children, seatingCapacity)
    end

    if partName == "pickup" then
      seatingCapacity = math.max(seatingCapacity, 7)
    end
  end

  return seatingCapacity
end

local function calculateSeatingCapacity()
  if not currentVehiclePartsTree then return 20 end
  return math.max(1, cyclePartsTree({currentVehiclePartsTree}, 0))
end

local function retrievePartsTree()
  currentVehiclePartsTree = nil
  local vehicle = be:getPlayerVehicle(0)
  if vehicle then
    vehicle:queueLuaCommand([[
      local partsTree = v.config.partsTree
      obj:queueGameEngineLua('career_modules_bus.returnPartsTree(' .. serialize(partsTree) .. ')')
    ]])
  end
end

function M.returnPartsTree(partsTree)
  currentVehiclePartsTree = partsTree
  local seats = calculateSeatingCapacity()
  M.vehicleCapacity = math.max(1, seats)

  local capOverride = nil

  local function checkPartTreeForKeywords(tree)
    for k, v in pairs(tree) do
      if type(k) == "string" then
        local name = string.lower(k)
        -- MD & Prison variants
        if name:find("schoolbus_interior_b") then
          capOverride = 24
          print("[bus] MD60 short bus detected via partsTree → capacity 24")
          return
        elseif name:find("schoolbus_interior_c") then
          capOverride = 40
          print("[bus] MD70 long bus detected via partsTree → capacity 40")
          return
        elseif name:find("prisonbus") then
          capOverride = 20
          print("[bus] Prison bus variant detected via partsTree → capacity 20")
          return
        -- City bus
        elseif name:find("citybus_seats") or name:find("citybus") then
          capOverride = 44
          print("[bus] City bus detected via partsTree → capacity 44")
          return
        -- VanBus variants 
        elseif name:find("dm_vanbus") or name:find("vanbus") or name:find("van_bus") or name:find("vanbusframe") then
          capOverride = 24
          print("[bus] VanBus detected via partsTree → capacity 24")
          return
        end
      end
      if type(v) == "table" then checkPartTreeForKeywords(v) end
    end
  end

  checkPartTreeForKeywords(partsTree)

  if capOverride then
    M.vehicleCapacity = capOverride
  elseif M.vehicleCapacity <= 12 then
    M.vehicleCapacity = 12
    print("[bus] Generic or van-based transport detected → fallback capacity 12")
  end

  print(string.format("[bus] Vehicle seating capacity detected: %d seats", M.vehicleCapacity))
  ui_message(string.format("Vehicle seating capacity detected: %d passengers.", M.vehicleCapacity), 5, "info", "info")
end

-- ================================
-- BUS STOP PERIMETER MARKERS
-- ================================
-- Create a single corner marker
local function createCornerMarker(markerName)
  local marker = createObject('TSStatic')
  marker:setField('shapeName', 0, "art/shapes/interface/position_marker.dae")
  marker:setPosition(vec3(0, 0, 0))
  marker.scale = vec3(1, 1, 1)
  marker:setField('rotation', 0, '1 0 0 0')
  marker.useInstanceRenderData = true
  marker:setField('instanceColor', 0, '1 1 1 1')
  marker:setField('collisionType', 0, "Collision Mesh")
  marker:setField('decalType', 0, "Collision Mesh")
  marker:setField('playAmbient', 0, "1")
  marker:setField('allowPlayerStep', 0, "1")
  marker:setField('canSave', 0, "0")
  marker:setField('canSaveDynamicFields', 0, "1")
  marker:setField('renderNormals', 0, "0")
  marker:setField('meshCulling', 0, "0")
  marker:setField('originSort', 0, "0")
  marker:setField('forceDetail', 0, "-1")
  marker.canSave = false
  marker:registerObject(markerName)
  if scenetree and scenetree.MissionGroup then
    scenetree.MissionGroup:addObject(marker)
  end
  return marker
end

-- Clear all stop markers
local function clearStopMarkers()
  -- Delete all marker objects by name (more reliable than object references)
  for i, obj in ipairs(stopMarkerObjects) do
    if obj then
      local success, err = pcall(function()
        local objName = obj:getName()
        if objName then
          -- Always try to find by name and delete, regardless of isValid()
          local foundObj = scenetree.findObject(objName)
          if foundObj then
            if editor and editor.onRemoveSceneTreeObjects then
              editor.onRemoveSceneTreeObjects({foundObj:getId()})
            end
            foundObj:delete()
            print(string.format("[bus] Deleted marker: %s", objName))
          end
        end
        -- Also try direct deletion if object reference is still valid
        if obj:isValid() then
          if editor and editor.onRemoveSceneTreeObjects then
            editor.onRemoveSceneTreeObjects({obj:getId()})
          end
          obj:delete()
        end
      end)
      if not success then
        print(string.format("[bus] Error deleting marker %d: %s", i, tostring(err)))
      end
    end
  end
  table.clear(stopMarkerObjects)
  
  -- Delete perimeter trigger by name
  if stopPerimeterTrigger then
    local success, err = pcall(function()
      local triggerName = stopPerimeterTrigger:getName()
      if triggerName then
        -- Always try to find by name and delete
        local foundTrigger = scenetree.findObject(triggerName)
        if foundTrigger then
          if editor and editor.onRemoveSceneTreeObjects then
            editor.onRemoveSceneTreeObjects({foundTrigger:getId()})
          end
          foundTrigger:delete()
          print(string.format("[bus] Deleted perimeter trigger: %s", triggerName))
        end
      end
      -- Also try direct deletion if object reference is still valid
      if stopPerimeterTrigger:isValid() then
        if editor and editor.onRemoveSceneTreeObjects then
          editor.onRemoveSceneTreeObjects({stopPerimeterTrigger:getId()})
        end
        stopPerimeterTrigger:delete()
      end
    end)
    if not success then
      print(string.format("[bus] Error deleting perimeter trigger: %s", tostring(err)))
    end
    stopPerimeterTrigger = nil
  end
  
  print("[bus] Cleared all stop markers")
end

-- Create perimeter markers and box trigger for a stop
local function createStopPerimeter(trigger)
  if not trigger then return end
  
  -- Clear any existing markers first
  clearStopMarkers()
  
  -- Get trigger position, rotation, and scale
  local triggerPos = trigger:getPosition()
  local triggerRot = trigger:getRotation()
  local triggerScale = trigger:getScale()
  
  -- Use trigger's scale if available, otherwise use reasonable defaults
  local stopLength = triggerScale and triggerScale.x or 15  -- Length along road
  local stopWidth = triggerScale and triggerScale.y or 8    -- Width perpendicular to road
  local stopHeight = triggerScale and triggerScale.z or 5   -- Height for raycasting
  
  -- Convert rotation to quaternion for calculations
  local rot = quat(triggerRot)
  local vecX = rot * vec3(1, 0, 0)  -- Right vector
  local vecY = rot * vec3(0, 1, 0)   -- Forward vector
  local vecZ = rot * vec3(0, 0, 1)   -- Up vector
  
  -- Calculate corner positions
  local halfLength = stopLength * 0.5
  local halfWidth = stopWidth * 0.5
  
  local corners = {
    {pos = triggerPos - vecX * halfLength + vecY * halfWidth, name = "TL"}, -- Top Left
    {pos = triggerPos + vecX * halfLength + vecY * halfWidth, name = "TR"}, -- Top Right
    {pos = triggerPos + vecX * halfLength - vecY * halfWidth, name = "BR"}, -- Bottom Right
    {pos = triggerPos - vecX * halfLength - vecY * halfWidth, name = "BL"}  -- Bottom Left
  }
  
  -- Create corner markers
  local qOff = quatFromEuler(0, 0, math.pi/2) * quatFromEuler(0, math.pi/2, math.pi/2)
  local rotations = {
    quatFromEuler(0, 0, math.rad(90)),   -- TL
    quatFromEuler(0, 0, math.rad(180)),  -- TR
    quatFromEuler(0, 0, math.rad(270)),   -- BR
    quatFromEuler(0, 0, 0)                -- BL
  }
  
  -- Use timestamp to ensure unique marker names and avoid collisions
  local uniqueId = os.time() * 1000 + (os.clock() * 1000 % 1000)  -- milliseconds precision
  for i, corner in ipairs(corners) do
    local markerName = string.format("busStopMarker_%s_%d_%d", trigger:getName() or "unknown", i, uniqueId)
    
    -- Raycast to ground
    local hit = Engine.castRay(corner.pos + vecZ * 2, corner.pos - vecZ * 10, true, false)
    local groundPos = hit and vec3(hit.pt) or (corner.pos + vecZ * 0.05)
    groundPos = groundPos + vecZ * 0.05
    
    -- Calculate rotation
    local hitNorm = hit and vec3(hit.norm) or vecZ
    local finalRot = rotations[i] * qOff * quatFromDir(hitNorm, vecY)
    
    -- Create and position marker
    local marker = createCornerMarker(markerName)
    marker:setPosRot(groundPos.x, groundPos.y, groundPos.z, finalRot.x, finalRot.y, finalRot.z, finalRot.w)
    marker:setField('instanceColor', 0, "0.6 0.9 0.23 1")  -- Green color for bus stops
    table.insert(stopMarkerObjects, marker)
  end
  
  -- Create box trigger for perimeter detection (optional - if you want to use it for validation)
  local perimeterName = string.format("busStopPerimeter_%s_%d", trigger:getName() or "unknown", uniqueId)
  local perimeterTrigger = createObject('BeamNGTrigger')
  perimeterTrigger.loadMode = 1
  perimeterTrigger:setField("triggerType", 0, "Box")
  perimeterTrigger:setPosition(triggerPos)
  perimeterTrigger:setScale(vec3(stopLength, stopWidth, stopHeight))
  local rotTorque = rot:toTorqueQuat()
  perimeterTrigger:setField('rotation', 0, rotTorque.x .. ' ' .. rotTorque.y .. ' ' .. rotTorque.z .. ' ' .. rotTorque.w)
  perimeterTrigger:registerObject(perimeterName)
  stopPerimeterTrigger = perimeterTrigger
  
  print(string.format("[bus] Created perimeter markers for stop: %s (scale: %.1f x %.1f x %.1f)", 
    trigger:getName() or "unknown", stopLength, stopWidth, stopHeight))
end

-- Show markers for current stop
local function showCurrentStopMarkers()
  if not currentStopIndex or not stopTriggers or not stopTriggers[currentStopIndex] then 
    print("[bus] showCurrentStopMarkers: Invalid stop index or triggers")
    return 
  end
  
  local currentTrigger = stopTriggers[currentStopIndex]
  local triggerName = currentTrigger:getName() or "unknown"
  print(string.format("[bus] Showing markers for stop %d: %s", currentStopIndex, triggerName))
  createStopPerimeter(currentTrigger)
end

-- Hide markers (cleanup)
local function hideStopMarkers()
  clearStopMarkers()
end

-- ================================
-- UTILITIES
-- ================================
isBus = function(vehicle)
  return vehicle and core_vehicles.getVehicleLicenseText(vehicle) == "BUS"
end

local function getNextTrigger()
  if not currentStopIndex then return nil end
  return stopTriggers[currentStopIndex]
end

local function showNextStopMarker()
  local trigger = getNextTrigger()
  if not trigger then return end
  core_groundMarkers.resetAll()
  
  -- Use route planner with setupPathMulti for better routing (like base game bus)
  local vehicle = be:getPlayerVehicle(0)
  if vehicle then
    local routePlanner = require('gameplay/route/route')()
    local currentPos = vehicle:getPosition()
    local targetPos = trigger:getPosition()
    routePlanner:setupPathMulti({currentPos, targetPos})
    -- Apply the route to ground markers
    if routePlanner.path and #routePlanner.path > 0 then
      core_groundMarkers.setPath(targetPos)
    else
      -- Fallback to direct path if route planner fails
      core_groundMarkers.setPath(targetPos)
    end
  else
    core_groundMarkers.setPath(trigger:getPosition())
  end
  
  -- Show perimeter markers for next stop
  showCurrentStopMarkers()
end

-- ================================
-- ROUTE END 
-- ================================
local function endRoute(reason, payout)
  currentRouteActive = false
  dwellTimer = nil
  routeInitialized = false
  currentFinalStopName = nil
  currentRouteName = nil
  currentRouteKey = nil
  core_groundMarkers.resetAll()
  -- Clear any markers
  hideStopMarkers()

  local msg = "Shift ended."
  if reason then msg = msg .. " (" .. reason .. ")" end

  local reputationGain = 0

  if payout and payout > 0 then
    local basePay = accumulatedReward
    local tipsEarned = tipTotal
    local bonusPay = math.max(0, payout - (basePay + tipsEarned))

    reputationGain = math.floor(payout / 500)

    msg = msg .. string.format(
      "\nStops completed: %d" ..
      "\nBase pay:   $%d" ..
      "\nTips:       $%d" ..
      "\nBonus:      $%d" ..
      "\n--------------------" ..
      "\nTotal payout: $%d" ..
      "\nReputation gained: +%d",
      totalStopsCompleted, basePay, tipsEarned, bonusPay, payout,
      reputationGain
    )
  else
    msg = msg .. "\nNo payout earned."
  end

  ui_message(msg, 8, "info", "info")
  print("[bus] " .. msg:gsub("\n", " "))

  -- Reset displays
  local vehicle = be:getPlayerVehicle(0)
  if vehicle then
    vehicle:queueLuaCommand([[
      if controller and controller.onGameplayEvent then
        controller.onGameplayEvent("bus_onRouteChange", {
          routeId="00", routeID="00", direction="Not in Service", tasklist={}
        })
      end
    ]])
  end

  -- Rewards
  if payout and payout > 0 and career_career and career_career.isActive()
     and career_modules_payment and career_modules_payment.reward then
    career_modules_payment.reward({
      money={amount=payout},
      beamXP={amount=math.floor(payout/10)},  -- XP unchanged
      busWorkReputation={amount=reputationGain}
    },{
      label=string.format("Bus Route Earnings: $%d", payout),
      tags={"transport","bus","gameplay"}
    },true)
  end

  accumulatedReward, passengersOnboard, totalStopsCompleted, tipTotal = 0,0,0,0
  roughRide, lastVelocity, activeBusID = 0,nil,nil
end

-- ================================
-- ROUTE INITIALIZATION
-- ================================
local function loadRoutesFromJSON()
  local currentMap = getCurrentLevelIdentifier()
  print(string.format("[bus] Current map identifier: %s", tostring(currentMap)))
  if not currentMap then 
    print("[bus] No current map identifier found")
    return nil 
  end

  -- Map-specific route file paths (with leading slash for jsonReadFile)
  local routeFiles = {
    ["west_coast_usa"] = "/levels/west_coast_usa/wcuBusRoutes.json",
    ["jungle_rock_island"] = "/levels/jungle_rock_island/jriBusRoutes.json"
  }

  local routeFile = routeFiles[currentMap]
  if not routeFile then 
    print(string.format("[bus] No route file configured for map: %s", currentMap))
    local availableMaps = {}
    for k, _ in pairs(routeFiles) do
      table.insert(availableMaps, k)
    end
    print(string.format("[bus] Available maps in routeFiles: %s", table.concat(availableMaps, ", ")))
    return nil 
  end

  print(string.format("[bus] Loading route file: %s", routeFile))
  local routeData = jsonReadFile(routeFile)
  if not routeData then
    print(string.format("[bus] Failed to read route file: %s", routeFile))
    return nil
  end
  if not routeData.routes then
    print(string.format("[bus] Route file %s does not contain 'routes' key", routeFile))
    return nil
  end

  print(string.format("[bus] Successfully loaded routes from %s", routeFile))
  return routeData.routes
end

-- Helper function to update bus controller display
local function updateBusControllerDisplay()
  if not currentRouteActive or not currentStopIndex or not stopTriggers or #stopTriggers == 0 then return end
  
  -- Build route data for the bus controller 
  local routeData = {routeId = "RLS", routeID = "RLS", direction = "", tasklist = {}}

  -- Get current stop's display name for the direction field
  local currentStop = stopTriggers[currentStopIndex]
  local currentTriggerName = currentStop:getName() or ""
  local currentStopName = stopDisplayNames[currentTriggerName] or currentTriggerName or string.format("Stop %02d", currentStopIndex)
  routeData.direction = currentStopName

  -- Build tasklist starting from the current stop (include it so controller shows correct progression)
  for i = currentStopIndex, #stopTriggers do
    local t = stopTriggers[i]
    local triggerName = t:getName() or ""
    local label
    -- Use display name from our stored table if available, otherwise use "Stop 01", "Stop 02", etc.
    label = stopDisplayNames[triggerName] or string.format("Stop %02d", i)
    table.insert(routeData.tasklist, {triggerName, label})
  end
  -- If we're not at the end, add remaining stops from the beginning (for loop routes)
  if currentStopIndex > 1 then
    for i = 1, currentStopIndex - 1 do
      local t = stopTriggers[i]
      local triggerName = t:getName() or ""
      local label
      label = stopDisplayNames[triggerName] or string.format("Stop %02d", i)
      table.insert(routeData.tasklist, {triggerName, label})
    end
  end

  -- Send to vehicle controller (for bus_setLineInfo)
  local vehicle = be:getPlayerVehicle(0)
  if vehicle then
    vehicle:queueLuaCommand(string.format([[
      if controller and controller.onGameplayEvent then
        controller.onGameplayEvent("bus_setLineInfo", %s)
      end
    ]], dumps(routeData)))
  end

  -- Also send BusDisplayUpdate for the UI
  guihooks.trigger('BusDisplayUpdate', routeData)
end

local function initRoute()
  -- Don't reinitialize if a route is already active
  if currentRouteActive and routeInitialized then
    print("[bus] Route already active, skipping reinitialization")
    return
  end

  -- Check if bus multiplier is 0 (if economy adjuster supports it)
  if career_economyAdjuster then
    local busMultiplier = career_economyAdjuster.getSectionMultiplier("bus") or 1.0
    if busMultiplier == 0 then
      ui_message("Bus routes are currently disabled.", 5, "error", "error")
      print("[bus] Bus multiplier is set to 0, route initialization cancelled")
      return
    end
  end

  stopTriggers = {}
  
  -- Load routes from JSON
  local routes = loadRoutesFromJSON()
  if not routes then
    ui_message("No route configuration found for this map.", 5, "error", "error")
    return
  end

  -- Collect all bus stop triggers on the map
  local allTriggers = {}
  local triggerObjects = scenetree.findClassObjects("BeamNGTrigger") or {}
  for _, obj in ipairs(triggerObjects) do
    local trigger = obj
    if type(obj) == "string" then trigger = scenetree.findObject(obj) end
    if trigger then
      local name = trigger:getName() or ""
      if name:match("_bs_%d+$") or name:match("_bs_%d+_b$") then
        allTriggers[name] = trigger
      end
    end
  end

  if not next(allTriggers) then
    ui_message("No bus stops found on this map.", 5, "error", "error")
    return
  end

  -- Select a random route
  local routeKeys = {}
  for k, _ in pairs(routes) do
    table.insert(routeKeys, k)
  end
  if #routeKeys == 0 then
    ui_message("No routes available in configuration.", 5, "error", "error")
    return
  end

  local selectedRouteKey = routeKeys[math.random(#routeKeys)]
  local selectedRoute = routes[selectedRouteKey]
  local routeName = selectedRoute.name or selectedRouteKey
  
  -- Store the selected route to prevent changes
  currentRouteName = routeName
  currentRouteKey = selectedRouteKey
  
  print(string.format("[bus] Selected route: %s (%s) with %d stops", routeName, selectedRouteKey, #selectedRoute.stops))

  -- Build route from JSON stop names
  stopTriggers = {}
  stopDisplayNames = {}  -- Clear and rebuild display names table
  local missingStops = {}
  for _, stopData in ipairs(selectedRoute.stops) do
    local stopName, displayName
    if type(stopData) == "table" then
    -- New format: ["triggerName", "Display Name"]
    stopName = stopData[1]
    displayName = stopData[2]
    else
      -- Old format: just "triggerName" (backward compatibility)
    stopName = stopData
    displayName = nil
    end
    local trigger = allTriggers[stopName]
    if trigger then
      table.insert(stopTriggers, trigger)
      -- Store display name by trigger name for reliable access
      if displayName then
        stopDisplayNames[stopName] = displayName
      end
    else
      table.insert(missingStops, stopName)
    end
  end

  if #stopTriggers == 0 then
    ui_message("No valid stops found for selected route.", 5, "error", "error")
    return
  end

  if #missingStops > 0 then
    print(string.format("[bus] Warning: %d stops not found: %s", #missingStops, table.concat(missingStops, ", ")))
  end

  -- The final stop is the last stop in the route
  local finalStopTrigger = stopTriggers[#stopTriggers]
  currentFinalStopName = finalStopTrigger:getName() or ""

  local vehicle = be:getPlayerVehicle(0)
  if not vehicle then return end

  -- Always start from the first stop of the route
  currentStopIndex = 1
  consecutiveStops, dwellTimer, accumulatedReward, totalStopsCompleted = 0, nil, 0, 0
  currentRouteActive, routeInitialized, passengersOnboard, routeCooldown = true, true, 0, 0
  tipTotal, roughRide, lastVelocity = 0, 0, nil

  local startStopName = stopTriggers[currentStopIndex]:getName() or "Unknown"
  
  -- Use route planner with setupPathMulti for better routing (like base game bus)
  local vehicle = be:getPlayerVehicle(0)
  if vehicle then
    local routePlanner = require('gameplay/route/route')()
    local currentPos = vehicle:getPosition()
    local targetPos = stopTriggers[currentStopIndex]:getPosition()
    routePlanner:setupPathMulti({currentPos, targetPos})
    -- Apply the route to ground markers
    if routePlanner.path and #routePlanner.path > 0 then
      core_groundMarkers.setPath(targetPos)
    else
      -- Fallback to direct path if route planner fails
      core_groundMarkers.setPath(targetPos)
    end
  else
    core_groundMarkers.setPath(stopTriggers[currentStopIndex]:getPosition())
  end
  
  ui_message(
      string.format("Bus route '%s' started. Proceed to %s. Route has %d stops.", routeName, startStopName, #stopTriggers),
      6, "info", "info")

  -- Update bus controller display
  updateBusControllerDisplay()
  
  -- Show markers for first stop
  showCurrentStopMarkers()
end
-- ================================
-- PROCESS STOP 
-- ================================
local function processStop(vehicle, dtSim)
  if not currentRouteActive or not currentStopIndex then return end
  if routeCooldown > 0 then return end
  if not stopTriggers or #stopTriggers == 0 then return end
  if currentStopIndex < 1 or currentStopIndex > #stopTriggers then return end

  local trigger = getNextTrigger()
  if not trigger then return end

  -- Verify this is actually the correct stop by checking the trigger name matches what we expect
  local expectedStopName = nil
  if stopTriggers[currentStopIndex] then
      expectedStopName = stopTriggers[currentStopIndex]:getName()
  end
  local actualTriggerName = trigger:getName()
  if expectedStopName and actualTriggerName ~= expectedStopName then
      -- Wrong trigger, don't process
      return
  end

  ------------------------------------------------------------
  -- MUST BE IN STOP TRIGGER (replaced distance check)
  ------------------------------------------------------------
  if currentTriggerName == expectedStopName then
      local velocity = vehicle:getVelocity():length()

      -- Must be fully stopped
      if velocity > 0.5 then
          ui_message("Come to a complete stop before passengers can board.", 2, "info", "info")
          dwellTimer = nil
          stopMonitorActive = false
          stopSettleTimer = 0
          return
      end

      -- Stop monitoring and settle
      if not stopMonitorActive then
          stopMonitorActive = true
          stopSettleTimer = 0
          ui_message("Please open doors to begin boarding", 2.5, "info", "bus")
      else
          stopSettleTimer = stopSettleTimer + (dtSim or 0.033)
      end

      -- Must remain still for settle delay
      if stopSettleTimer < stopSettleDelay then
          dwellTimer = nil
          return
      end
        ------------------------------------------------------------
        -- START DWELL (Initialize boarding + deboarding)
        ------------------------------------------------------------
        if not dwellTimer then
            dwellTimer = 0
            consecutiveStops = consecutiveStops + 1
            totalStopsCompleted = totalStopsCompleted + 1

            -- Final stop? (Map-specific)
            local triggerName = trigger:getName() or ""
            local isFinalStop = (triggerName == currentFinalStopName)

            if isFinalStop then
                trueBoarding = 0
                trueDeboarding = passengersOnboard
                dwellDuration = math.max(6, trueDeboarding * 0.6)
            else
                local capacity = M.vehicleCapacity or 20
                local availableSpace = math.max(0, capacity - passengersOnboard)
                trueBoarding = math.random(3, math.min(12, availableSpace))
                trueDeboarding = (passengersOnboard > 0)
                    and math.random(1, math.min(passengersOnboard, 6))
                    or 0

                dwellDuration =
                    math.random(8, 12)
                    + (trueBoarding * 0.8)
                    + (trueDeboarding * 0.5)
            end

            ------------------------------------------------------------
            -- Initialize animation coroutine (REALISTIC TIMING)
            ------------------------------------------------------------
            boardingCoroutine = coroutine.create(function()

                --------------------------------------------------------
                -- PHASE 1 — DEBOARDING 
                --------------------------------------------------------
                if trueDeboarding > 0 then
                    for i = trueDeboarding, 1, -1 do
                        ui_message(string.format(
                            "Stop %d\nDeboarding: %d\nBoarding: 0",
                            currentStopIndex, i
                        ), 2, "bus", "bus_anim")

                        local t = 0
                        while t < 2 do
                            coroutine.yield()
                            t = t + (dtSim or 0.033)
                        end
                    end
                else
                    ui_message(string.format(
                        "Stop %d\nDeboarding: 0\nBoarding: 0",
                        currentStopIndex
                    ), 1, "bus", "bus_anim")
                end

                --------------------------------------------------------
                -- PHASE 2 — BOARDING 
                --------------------------------------------------------
                if trueBoarding > 0 then
                    for i = 1, trueBoarding do
                        ui_message(string.format(
                            "Stop %d\nDeboarding: 0\nBoarding: %d",
                            currentStopIndex, i
                        ), 2, "bus", "bus_anim")

                        local t = 0
                        while t < 2 do
                            coroutine.yield()
                            t = t + (dtSim or 0.033)
                        end
                    end
                else
                    ui_message(string.format(
                        "Stop %d\nDeboarding: 0\nBoarding: 0",
                        currentStopIndex
                    ), 1, "bus", "bus_anim")
                end

			--------------------------------------------------------
			-- FINAL POST-BOARDING MESSAGE
			--------------------------------------------------------
				local newCount = math.min(
					math.max(0, passengersOnboard + trueBoarding - trueDeboarding),
					M.vehicleCapacity or 20
				)

				ui_message(string.format(
					"Stop %d complete!\nPassengers onboard: %d",
					currentStopIndex, newCount
				), 4, "bus", "bus_done")

				--------------------------------------------------------
				-- SHOW EARNINGS / TIPS / REPUTATION 
				--------------------------------------------------------
				local base = 400
				local bonusMultiplier = 1 + (consecutiveStops / #stopTriggers) * 3
				local payout = math.floor(base * bonusMultiplier)

				local reputationGain = math.floor(payout / 500)

				ui_message(string.format(
					"Earnings this stop:\n" ..
					"Base pay: $%d\n" ..
					"Tips this stop: $%d\n" ..
					"Reputation gained: +%d\n" ..
					"Total tips so far: $%d",
					payout, tipsEarned or 0, reputationGain, tipTotal
				), 10, "info", "bus_payout")

            end)

        end -- dwell init

        ------------------------------------------------------------
        -- DWELL TIMER (controls WHEN boarding finishes)
        ------------------------------------------------------------
        dwellTimer = dwellTimer + (dtSim or 0.033)

        if dwellTimer >= dwellDuration and (not boardingCoroutine or coroutine.status(boardingCoroutine) == "dead") then
            print(string.format("[bus] Dwell complete at stop %d", currentStopIndex))

            --------------------------------------------------------
            -- FINALIZE passenger count
            --------------------------------------------------------
            passengersOnboard = math.min(
                math.max(0, passengersOnboard + trueBoarding - trueDeboarding),
                M.vehicleCapacity or 20
            )

            --------------------------------------------------------
            -- PAYOUT CALCULATION
            --------------------------------------------------------
            local base = 400
            local bonusMultiplier = 1 + (consecutiveStops / #stopTriggers) * 3
            local payout = math.floor(base * bonusMultiplier)
            
            -- Apply economy adjuster multiplier if available
            if career_economyAdjuster then
                local multiplier = career_economyAdjuster.getSectionMultiplier("bus") or 1.0
                payout = math.floor(payout * multiplier + 0.5)
            end
            
            accumulatedReward = accumulatedReward + payout

            --------------------------------------------------------
            -- TIP CALCULATION (ONLY if deboarders)
            --------------------------------------------------------
            local tipsEarned = 0
            if trueDeboarding > 0 then
                local avgRough = roughRide / math.max(1, dwellDuration)
                if avgRough < 0 then avgRough = 0 end

                local tipPerPassenger = math.max(0, 8 - avgRough) * 2
                tipsEarned = math.floor(tipPerPassenger * trueDeboarding * 40)
                tipTotal = tipTotal + tipsEarned
            end

            print(string.format(
                "[bus] Tips: +%d   TotalTips=%d",
                tipsEarned, tipTotal
            ))

            roughRide = 0

            --------------------------------------------------------
            -- RESET STOP STATE
            --------------------------------------------------------
            dwellTimer = nil
            stopMonitorActive = false
            stopSettleTimer = 0

            --------------------------------------------------------
            -- MOVE TO NEXT STOP
            --------------------------------------------------------
            local triggerName = trigger:getName() or ""
            if triggerName == currentFinalStopName then
                -- Loop bonus
                local loopBonus = math.floor(accumulatedReward * 0.5)
                accumulatedReward = accumulatedReward + loopBonus
                local totalPotential = accumulatedReward + tipTotal

                ui_message(string.format(
                    "All passengers unloaded.\nLoop complete! Bonus +$%d (+50%%)\nRoute earnings so far: $%d\nTips: $%d\nTotal potential payout: $%d",
                    loopBonus, accumulatedReward, tipTotal, totalPotential
                ), 6, "info", "info")

                passengersOnboard = 0
                trueBoarding = 0
                trueDeboarding = 0

                routeCooldown = 10
                currentStopIndex = 1
                showNextStopMarker()
                -- Update controller display after loop completion
                updateBusControllerDisplay()

            else
                currentStopIndex = currentStopIndex + 1
                if currentStopIndex > #stopTriggers then
                    print(string.format("[bus] ERROR: currentStopIndex %d exceeds route length %d", currentStopIndex, #stopTriggers))
                    currentStopIndex = #stopTriggers
                end
                local nextStopName = stopTriggers[currentStopIndex] and stopTriggers[currentStopIndex]:getName() or "Unknown"
                print(string.format("[bus] Moving to next stop: index %d, name %s", currentStopIndex, nextStopName))
                showNextStopMarker()
                ui_message(string.format("Proceed to Stop %02d.", currentStopIndex), 4, "info", "bus_next")
                -- Update controller display with new current stop
                updateBusControllerDisplay()
            end
        end

    ------------------------------------------------------------
    -- PLAYER MOVED AWAY FROM STOP → CANCEL DWELL
    ------------------------------------------------------------
    else
        dwellTimer = nil
        stopMonitorActive = false
        stopSettleTimer = 0
    end
end
-- ================================
-- VEHICLE SWITCH 
-- ================================
function M.onVehicleSwitched(oldId, newId)
    local newVeh = be:getObjectByID(newId)
    local oldVeh = be:getObjectByID(oldId)

    -- Leaving the active bus ends the route
    if currentRouteActive and activeBusID and oldId == activeBusID then
        local payout = accumulatedReward + tipTotal
        if payout > 100000 then payout = 100000 end
        endRoute("player exited the bus", payout)
    end

    if newVeh and isBus(newVeh) then
        -- Only initialize route if we're not already in an active route
        if not currentRouteActive or not routeInitialized then
            activeBusID = newId
            ui_message("Shift started. Welcome in! Drive careful out there.", 10, "info", "info")
            retrievePartsTree()
            initRoute()
        else
            -- Route already active, just update the active bus ID
            activeBusID = newId
            print("[bus] Route already active, not reinitializing")
        end
    end
end

-- ================================
-- EXTENSION LOADED
-- ================================
local function onExtensionLoaded()
    ui_message("Bus module loaded. Enter a BUS vehicle to begin your route.", 3, "info", "info")
    print("[bus] Extension loaded.")
    extensions.load("career_modules_bus")
end

-- ================================
-- UPDATE LOOP
-- ================================
function M.onUpdate(dtReal, dtSim, dtRaw)
    -- Route cooldown between loops
    if routeCooldown > 0 then
        routeCooldown = math.max(0, routeCooldown - (dtSim or 0))
        return
    end

    local vehicle = be:getPlayerVehicle(0)
    if not vehicle or not isBus(vehicle) or not routeInitialized then return end

    ------------------------------------------------------------
    -- Advance the REALISTIC BOARDING ANIMATION coroutine
    ------------------------------------------------------------
    if boardingCoroutine
       and coroutine.status(boardingCoroutine) ~= "dead" then

        local ok, err = coroutine.resume(boardingCoroutine)
        if not ok then
            print("[bus] Boarding animation coroutine error: " .. tostring(err))
            boardingCoroutine = nil
        end
    end

    ------------------------------------------------------------
    -- Rough ride tracking
    ------------------------------------------------------------
    local velocity = vehicle:getVelocity()

    if lastVelocity then
        local deltaVel = velocity - lastVelocity
        local safeDt = (dtSim and dtSim > 0) and dtSim or 0.01
        local accel = deltaVel:length() / safeDt
        local accelThreshold = 3.5

        if accel > accelThreshold then
            roughRide = roughRide + (accel - accelThreshold) * safeDt * 10
        end
    end

    lastVelocity = velocity

    ------------------------------------------------------------
    -- Core stop logic
    ------------------------------------------------------------
    processStop(vehicle, dtSim)
end

local function onBeamNGTrigger(data)
  if be:getPlayerVehicleID(0) ~= data.subjectID then
    return
  end
  if gameplay_walk.isWalking() then return end
  if not data.triggerName:find("_bs_") then
    return
  end
  
  if data.event == "enter" then
    currentTriggerName = data.triggerName
  elseif data.event == "exit" then
    if currentTriggerName == data.triggerName then
      currentTriggerName = nil
      -- Cancel dwell if player exits the stop
      dwellTimer = nil
      stopMonitorActive = false
      stopSettleTimer = 0
    end
  end
end
M.onBeamNGTrigger = onBeamNGTrigger
M.onExtensionLoaded = onExtensionLoaded
return M
