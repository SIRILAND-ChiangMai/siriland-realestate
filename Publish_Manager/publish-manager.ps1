
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "publish-config.json"

function Select-Folder([string]$Description) {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $Description
    $dialog.ShowNewFolderButton = $true
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $null
}

function Save-Config($config) {
    $config | ConvertTo-Json -Depth 5 | Set-Content -Path $ConfigPath -Encoding UTF8
}

function Load-Config {
    if (Test-Path $ConfigPath) {
        try {
            return Get-Content $ConfigPath -Raw | ConvertFrom-Json
        } catch {
            Remove-Item $ConfigPath -Force -ErrorAction SilentlyContinue
        }
    }
    return $null
}

function Ensure-Config {
    $config = Load-Config
    if ($config -and (Test-Path $config.cmsFolder) -and (Test-Path $config.githubFolder) -and (Test-Path $config.backupFolder)) {
        return $config
    }

    [System.Windows.Forms.MessageBox]::Show(
        "Ilk kurulum yapilacak.`n`n1. 01_CMS klasorunu sec.`n2. GitHub siriland-realestate klasorunu sec.`n3. 02_Backup klasorunu sec.",
        "SIRILAND Publish Manager PRO v2"
    ) | Out-Null

    $cms = Select-Folder "01_CMS klasorunu sec"
    if (-not $cms) { throw "CMS klasoru secilmedi." }

    $github = Select-Folder "GitHub repository klasorunu sec (siriland-realestate)"
    if (-not $github) { throw "GitHub klasoru secilmedi." }

    $backup = Select-Folder "02_Backup klasorunu sec"
    if (-not $backup) { throw "Backup klasoru secilmedi." }

    $config = [PSCustomObject]@{
        cmsFolder = $cms
        githubFolder = $github
        backupFolder = $backup
        repository = "SIRILAND-ChiangMai/siriland-realestate"
        branch = "main"
        createdAt = (Get-Date).ToString("s")
    }

    Save-Config $config
    return $config
}

function New-Backup($config) {
    $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $day = Get-Date -Format "yyyy-MM-dd"
    $dailyRoot = Join-Path $config.backupFolder "Daily"
    $dayRoot = Join-Path $dailyRoot $day
    $target = Join-Path $dayRoot ("Publish_" + $stamp)

    New-Item -ItemType Directory -Path $target -Force | Out-Null

    $important = @(
        "properties.js","admin.html","admin.js","admin.css",
        "index.html","script.js","style.css","sitemap.xml","robots.txt"
    )

    foreach ($file in $important) {
        $src = Join-Path $config.githubFolder $file
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $target $file) -Force
        }
    }

    $images = Join-Path $config.githubFolder "images"
    if (Test-Path $images) {
        Copy-Item $images (Join-Path $target "images") -Recurse -Force
    }

    return $target
}

function Compare-And-Copy($config) {
    $excludeDirs = @(".git","02_Backup","08_Exports","09_GitHub","node_modules")
    $excludeExt = @(".zip",".tmp",".bak")
    $changed = New-Object System.Collections.Generic.List[string]
    $new = New-Object System.Collections.Generic.List[string]

    $files = Get-ChildItem -Path $config.cmsFolder -Recurse -File
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($config.cmsFolder.Length).TrimStart("\")
        $parts = $relative.Split("\")
        if ($parts | Where-Object { $excludeDirs -contains $_ }) { continue }
        if ($excludeExt -contains $file.Extension.ToLower()) { continue }

        $dest = Join-Path $config.githubFolder $relative
        $destDir = Split-Path -Parent $dest
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        if (-not (Test-Path $dest)) {
            Copy-Item $file.FullName $dest -Force
            $new.Add($relative)
        } else {
            $srcHash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash
            $dstHash = (Get-FileHash $dest -Algorithm SHA256).Hash
            if ($srcHash -ne $dstHash) {
                Copy-Item $file.FullName $dest -Force
                $changed.Add($relative)
            }
        }
    }

    return [PSCustomObject]@{
        newFiles = $new
        changedFiles = $changed
    }
}

function Validate-CriticalFiles($config) {
    $critical = @("index.html","script.js","style.css","properties.js")
    $missing = @()
    foreach ($f in $critical) {
        if (-not (Test-Path (Join-Path $config.cmsFolder $f))) {
            $missing += $f
        }
    }
    return $missing
}

function Count-Properties($config) {
    $path = Join-Path $config.cmsFolder "properties.js"
    if (-not (Test-Path $path)) { return 0 }
    $content = Get-Content $path -Raw
    return ([regex]::Matches($content, '"id"\s*:\s*"[^"]+"')).Count
}

function Build-CommitMessage($result, $propertyCount) {
    $newCount = $result.newFiles.Count
    $changedCount = $result.changedFiles.Count
    if ($newCount -eq 0 -and $changedCount -eq 0) {
        return "No file changes"
    }
    return "Publish SIRILAND - $propertyCount listings, $newCount new files, $changedCount updated files"
}

try {
    $config = Ensure-Config

    $missingCritical = Validate-CriticalFiles $config
    if ($missingCritical.Count -gt 0) {
        $answer = [System.Windows.Forms.MessageBox]::Show(
            "CMS klasorunde kritik dosyalar eksik:`n`n$($missingCritical -join "`n")`n`nYine de devam edilsin mi?",
            "Eksik Dosya Uyarisi",
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
            exit
        }
    }

    $backupPath = New-Backup $config
    $result = Compare-And-Copy $config
    $propertyCount = Count-Properties $config
    $commit = Build-CommitMessage $result $propertyCount
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $reportDir = Join-Path $config.backupFolder "PublishReports"
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    $reportPath = Join-Path $reportDir ("Publish_" + (Get-Date -Format "yyyy-MM-dd_HH-mm-ss") + ".txt")

    $report = @"
SIRILAND PUBLISH REPORT
=======================
Date: $stamp
CMS Folder: $($config.cmsFolder)
GitHub Folder: $($config.githubFolder)
Backup: $backupPath
Properties: $propertyCount

NEW FILES ($($result.newFiles.Count))
$($result.newFiles -join "`r`n")

UPDATED FILES ($($result.changedFiles.Count))
$($result.changedFiles -join "`r`n")

COMMIT MESSAGE
$commit

STATUS
READY FOR GITHUB DESKTOP
"@

    $report | Set-Content -Path $reportPath -Encoding UTF8
    Set-Clipboard -Value $commit

    $message = @"
Publish hazir.

Backup alindi:
$backupPath

Yeni dosya: $($result.newFiles.Count)
Guncellenen dosya: $($result.changedFiles.Count)
Ilan sayisi: $propertyCount

Commit mesaji panoya kopyalandi:
$commit

Simdi GitHub Desktop'u ac:
1. Summary alanina Ctrl+V
2. Commit to main
3. Push origin
"@

    [System.Windows.Forms.MessageBox]::Show(
        $message,
        "SIRILAND Publish Manager PRO v2",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null

    Start-Process explorer.exe $config.githubFolder
    Start-Process notepad.exe $reportPath

} catch {
    [System.Windows.Forms.MessageBox]::Show(
        $_.Exception.Message,
        "Publish Manager Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
}
