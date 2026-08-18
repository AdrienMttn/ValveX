$global:GithubRelease = "https://api.github.com/repos/AdrienMttn/ValveX/releases/latest"


function Write-Title {
    param (
      [string]$Color = "Cyan"
    )
    Write-Host "  +================================================================+" -ForegroundColor $Color
    Write-Host "  |                      VALVeX Downloader                         |" -ForegroundColor $Color
    Write-Host "  |                                                                |" -ForegroundColor $Color
    Write-Host "  |                by https://github.com/AdrienMttn                |" -ForegroundColor $Color
    Write-Host "  +================================================================+" -ForegroundColor $Color
}

function Write-Menu {
    Write-Host ""
    Write-Host "  [1] Download VALVeX" -ForegroundColor "Green"
    Write-Host "  [2] Exit" -ForegroundColor "Red"
    Write-Host ""
}

function Get-SteamPath {
  $registryPaths = @(
    "HKLM:\SOFTWARE\WOW6432Node\Valve\Steam",
    "HKLM:\SOFTWARE\Valve\Steam",
    "HKCU:\SOFTWARE\Valve\Steam"
  )

  foreach ($path in $registryPaths) {
      try {
          $steamPath = (Get-ItemProperty -Path $path -ErrorAction SilentlyContinue).InstallPath
          if ($steamPath -and (Test-Path $steamPath)) {
              return $steamPath
          }
      } catch {}
  }

  return $null
}

function stop-steam {
    Write-Host "  Stopping Steam..." -ForegroundColor "Yellow"
    $steamProcess = Get-Process -Name "Steam" -ErrorAction SilentlyContinue
    if ($steamProcess) {
        Stop-Process -Id $steamProcess.Id -Force
        Write-Host "  Steam stopped." -ForegroundColor "Yellow"
        start-sleep -Seconds 2
    } else {
        Write-Host "  Steam is not running." -ForegroundColor "Yellow"
    }
}

function start-steam {
    Write-Host "  Starting Steam..." -ForegroundColor "Yellow"
    Start-Process -FilePath "steam://open/main" -ErrorAction SilentlyContinue
    Write-Host "  Steam started." -ForegroundColor "Yellow"
}

function Download-VALVeX {
    stop-steam
    Write-Host "  Downloading VALVeX..." -ForegroundColor "Green"
    $steamPath = Get-SteamPath
    if (-not $steamPath) {
        Write-Host "  Steam installation not found. Please ensure Steam is installed." -ForegroundColor "Red"
        return
    }
    $releaseInfo = Invoke-RestMethod -Uri $global:GithubRelease
    $downloadUrl = $releaseInfo.assets[0].browser_download_url
    $downloadPath = Join-Path -Path $steamPath -ChildPath "VALVeX.zip"
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $downloadPath)
    $sourcePath = Unzip-VALVeX($downloadPath)
    Moove-Files -sourcePath $sourcePath
    Remove-TempFiles -zipFilePath $downloadPath -extractPath $sourcePath
    Write-Host "  Download complete!" -ForegroundColor "Green"
    start-steam
}

function Unzip-VALVeX {
  param (
    [string]$zipFilePath,
    [string]$steamPath = (Get-SteamPath)
  )
    Write-Host "  Unzipping VALVeX..." -ForegroundColor "Green"
    $extractPath = Join-Path -Path $steamPath -ChildPath "VALVeX"
    Expand-Archive -Path $zipFilePath -DestinationPath $extractPath -Force
    Write-Host "  Unzip complete!" -ForegroundColor "Green"
    return $extractPath
}

function Moove-Files {
    param (
        [string]$sourcePath = (Join-Path -Path $PSScriptRoot -ChildPath "VALVeX")
    )
    Write-Host "  Moving files..." -ForegroundColor "Green"
    Copy-Item -Path $sourcePath\* -Destination "$(Get-SteamPath)\" -Recurse -Force
    Write-Host "  Move complete!" -ForegroundColor "Green"
}

function Remove-TempFiles {
    param (
        [string]$zipFilePath,
        [string]$extractPath
    )
    Write-Host "  Cleaning up temporary files..." -ForegroundColor "Green"
    Remove-Item -Path $zipFilePath -Force
    Remove-Item -Path $extractPath -Recurse -Force
    Write-Host "  Cleanup complete!" -ForegroundColor "Green"
}

Clear-Host
Write-Title
Write-Menu

$choice = Read-Host "  Please select an option (1 or 2)"
switch ($choice) {
    '1' {
      Download-VALVeX
    }
    '2' {
        Write-Host "  Exiting..." -ForegroundColor "Red"
        break
    }
    default {
        Write-Host "  Invalid option. Please try again." -ForegroundColor "Red"
    }
}




