# setup_android.ps1
# This script installs OpenJDK 17, Android Settings, and compiles the React Native Expo app.

Write-Host "Installing OpenJDK 17 via winget..."
winget install -e --id Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements

Write-Host "Setting up Android command line tools..."
$androidDir = "C:\Android"
if (-not (Test-Path "$androidDir\cmdline-tools\latest\bin\sdkmanager.bat")) {
    New-Item -ItemType Directory -Force -Path "$androidDir\cmdline-tools"
    Write-Host "Downloading cmdline-tools..."
    Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile "$androidDir\cmdline-tools.zip"
    Write-Host "Extracting cmdline-tools..."
    Expand-Archive -Path "$androidDir\cmdline-tools.zip" -DestinationPath "$androidDir\cmdline-tools" -Force
    Rename-Item -Path "$androidDir\cmdline-tools\cmdline-tools" -NewName "latest"
    Remove-Item -Path "$androidDir\cmdline-tools.zip"
}

Write-Host "Setting ANDROID_HOME environment variable..."
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidDir, [System.EnvironmentVariableTarget]::User)
$env:ANDROID_HOME = $androidDir

Write-Host "Accepting licenses and installing SDK packages..."
$sdkManager = "$androidDir\cmdline-tools\latest\bin\sdkmanager.bat"
cmd.exe /c "echo y| ""$sdkManager"" --licenses"
cmd.exe /c """$sdkManager"" ""platform-tools"" ""platforms;android-34"" ""build-tools;34.0.0"""

Write-Host "Updating PATH variable..."
$userPath = [System.Environment]::GetEnvironmentVariable('PATH', [System.EnvironmentVariableTarget]::User)
if ($userPath -notlike "*$androidDir\platform-tools*") {
    [System.Environment]::SetEnvironmentVariable('PATH', "$userPath;$androidDir\platform-tools", [System.EnvironmentVariableTarget]::User)
    $env:PATH += ";$androidDir\platform-tools"
}

Write-Host "Generating Android Native Code (npx expo prebuild)..."
cd "d:\Neonbudget app"
npx expo prebuild --platform android --clean

Write-Host "Building APK Release (Gradle)..."
cd android
# Setting JAVA_HOME explicitly for the build to use JDK 17
$java17Path = "C:\Program Files\Microsoft\jdk-17\*"
$installedJava = Get-ChildItem -Path "C:\Program Files\Microsoft" -Filter "jdk-17*" | Select-Object -First 1
if ($installedJava) {
    $env:JAVA_HOME = $installedJava.FullName
}

.\gradlew assembleRelease

Write-Host "Build complete! APK should be located in android/app/build/outputs/apk/release/"
