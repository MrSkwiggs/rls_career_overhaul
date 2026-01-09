@echo off
setlocal

:: Set paths relative to the script location
set "ROOT_DIR=%~dp0"
set "BASE_UI=%ROOT_DIR%baseUI"
set "VUE_SRC=%ROOT_DIR%ui-vue-src"
set "BUILD_DIR=%ROOT_DIR%ui-build-temp"
set "DIST_TARGET=%ROOT_DIR%ui\vue-dist"

echo.
echo ========================================
echo   BeamNG UI Build Script
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

:: 1. Cleanup old build dir
if exist "%BUILD_DIR%" (
    echo [1/5] Cleaning up old build directory...
    rmdir /s /q "%BUILD_DIR%"
)

:: 2. Create and prepare build directory
echo [2/5] Preparing build directory...
mkdir "%BUILD_DIR%"
:: Copy baseUI to temp build directory
robocopy "%BASE_UI%" "%BUILD_DIR%" /E /MT /NFL /NDL /NJH /NJS /nc /ns /np

:: 3. Overwrite with custom source
echo [3/5] Merging ui-vue-src into build directory...
robocopy "%VUE_SRC%" "%BUILD_DIR%\src" /E /MT /NFL /NDL /NJH /NJS /nc /ns /np

:: 4. Build
echo [4/5] Building UI...
pushd "%BUILD_DIR%"

:: Copy existing node_modules from baseUI to speed up if they exist
if exist "%BASE_UI%\node_modules" (
    echo   Copying existing node_modules from baseUI...
    robocopy "%BASE_UI%\node_modules" "node_modules" /E /MT /NFL /NDL /NJH /NJS /nc /ns /np >nul
)

:: Check if npm install is needed
if not exist "node_modules" (
    echo   node_modules not found, running npm install...
    call npm install
) else (
    echo   node_modules already present, skipping npm install...
)

if %ERRORLEVEL% neq 0 (
    echo Error: npm install failed.
    popd
    pause
    exit /b 1
)

echo   Running npm run build...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: npm build failed.
    popd
    pause
    exit /b 1
)
popd

:: 5. Copy to final location
echo [5/5] Copying build results to %DIST_TARGET%...
if not exist "%DIST_TARGET%" mkdir "%DIST_TARGET%"
:: Clean target first to avoid stale files
del /q /s "%DIST_TARGET%\*" 2>nul
robocopy "%BUILD_DIR%\dist" "%DIST_TARGET%" /E /MT /NFL /NDL /NJH /NJS /nc /ns /np >nul

echo.
echo ========================================
echo   Build Successful!
echo ========================================
echo.
