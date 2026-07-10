
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "publish-config.json"

function Load-Config {
    if (Test-Path $ConfigPath) {
        try { return Get-Content $ConfigPath -Raw | ConvertFrom-Json } catch { return $null }
    }
    return $null
}

function Save-Config($cms, $github, $backup) {
    $config = [PSCustomObject]@{
        cmsFolder = $cms
        githubFolder = $github
        backupFolder = $backup
        repository = "SIRILAND-ChiangMai/siriland-realestate"
        branch = "main"
        savedAt = (Get-Date).ToString("s")
    }
    $config | ConvertTo-Json -Depth 5 | Set-Content -Path $ConfigPath -Encoding UTF8
}

function Browse-Folder([string]$description, [string]$currentPath) {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $description
    $dialog.ShowNewFolderButton = $true
    if ($currentPath -and (Test-Path $currentPath)) { $dialog.SelectedPath = $currentPath }
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $null
}

function Validate-Paths($cms, $github, $backup) {
    $result = New-Object System.Collections.Generic.List[string]
    if (-not (Test-Path $cms)) { $result.Add("CMS klasoru bulunamadi.") }
    if (-not (Test-Path $github)) { $result.Add("GitHub klasoru bulunamadi.") }
    if (-not (Test-Path $backup)) { $result.Add("Backup klasoru bulunamadi.") }

    if (Test-Path $cms) {
        foreach ($file in @("index.html","script.js","style.css","properties.js")) {
            if (-not (Test-Path (Join-Path $cms $file))) {
                $result.Add("CMS icinde eksik: $file")
            }
        }
    }

    if (Test-Path $github) {
        if (-not (Test-Path (Join-Path $github ".git"))) {
            $result.Add("Secilen GitHub klasoru bir repository gibi gorunmuyor (.git yok).")
        }
    }
    return $result
}

function New-Backup($cms, $github, $backupRoot) {
    $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $day = Get-Date -Format "yyyy-MM-dd"
    $target = Join-Path (Join-Path (Join-Path $backupRoot "Daily") $day) ("Publish_" + $stamp)
    New-Item -ItemType Directory -Path $target -Force | Out-Null

    $important = @(
        "properties.js","admin.html","admin.js","admin.css",
        "index.html","script.js","style.css","sitemap.xml","robots.txt"
    )

    foreach ($file in $important) {
        $src = Join-Path $github $file
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $target $file) -Force
        }
    }

    $images = Join-Path $github "images"
    if (Test-Path $images) {
        Copy-Item $images (Join-Path $target "images") -Recurse -Force
    }

    return $target
}

function Compare-And-Copy($cms, $github) {
    $excludeDirs = @(".git","node_modules","Publish_Manager")
    $excludeExt = @(".zip",".tmp",".bak")
    $newFiles = New-Object System.Collections.Generic.List[string]
    $updatedFiles = New-Object System.Collections.Generic.List[string]

    $files = Get-ChildItem -Path $cms -Recurse -File
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($cms.Length).TrimStart("\")
        $parts = $relative.Split("\")
        if ($parts | Where-Object { $excludeDirs -contains $_ }) { continue }
        if ($excludeExt -contains $file.Extension.ToLower()) { continue }

        $dest = Join-Path $github $relative
        $destDir = Split-Path -Parent $dest
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

        if (-not (Test-Path $dest)) {
            Copy-Item $file.FullName $dest -Force
            $newFiles.Add($relative)
        } else {
            $srcHash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash
            $dstHash = (Get-FileHash $dest -Algorithm SHA256).Hash
            if ($srcHash -ne $dstHash) {
                Copy-Item $file.FullName $dest -Force
                $updatedFiles.Add($relative)
            }
        }
    }

    return [PSCustomObject]@{
        newFiles = $newFiles
        updatedFiles = $updatedFiles
    }
}

function Count-Properties($cms) {
    $path = Join-Path $cms "properties.js"
    if (-not (Test-Path $path)) { return 0 }
    $content = Get-Content $path -Raw
    return ([regex]::Matches($content, '"id"\s*:\s*"[^"]+"')).Count
}

function Build-CommitMessage($result, $count) {
    if ($result.newFiles.Count -eq 0 -and $result.updatedFiles.Count -eq 0) {
        return "No file changes"
    }
    return "Publish SIRILAND - $count listings, $($result.newFiles.Count) new, $($result.updatedFiles.Count) updated"
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "SIRILAND Publish Manager PRO v2.1"
$form.Size = New-Object System.Drawing.Size(760, 590)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(245,247,251)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "SIRILAND Publish Manager PRO v2.1"
$title.Font = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(7,26,61)
$title.Location = New-Object System.Drawing.Point(24,20)
$title.AutoSize = $true
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Klasorleri sec, test et, kaydet ve tek tikla publish hazirla."
$subtitle.Location = New-Object System.Drawing.Point(28,60)
$subtitle.AutoSize = $true
$form.Controls.Add($subtitle)

function Add-PathRow($labelText, $y, $initial, $browseText) {
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $labelText
    $label.Location = New-Object System.Drawing.Point(28,$y)
    $label.Size = New-Object System.Drawing.Size(180,26)
    $label.Font = New-Object System.Drawing.Font("Segoe UI",10,[System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($label)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(210,$y)
    $box.Size = New-Object System.Drawing.Size(430,28)
    $box.Text = $initial
    $form.Controls.Add($box)

    $button = New-Object System.Windows.Forms.Button
    $button.Text = "Browse"
    $button.Location = New-Object System.Drawing.Point(650,$y-1)
    $button.Size = New-Object System.Drawing.Size(78,30)
    $form.Controls.Add($button)

    $button.Add_Click({
        $selected = Browse-Folder $browseText $box.Text
        if ($selected) { $box.Text = $selected }
    }.GetNewClosure())

    return $box
}

$config = Load-Config
$cmsInitial = if ($config) { $config.cmsFolder } else { "" }
$gitInitial = if ($config) { $config.githubFolder } else { "" }
$bakInitial = if ($config) { $config.backupFolder } else { "" }

$cmsBox = Add-PathRow "CMS Folder" 110 $cmsInitial "01_CMS klasorunu sec"
$gitBox = Add-PathRow "GitHub Folder" 160 $gitInitial "siriland-realestate repository klasorunu sec"
$bakBox = Add-PathRow "Backup Folder" 210 $bakInitial "02_Backup klasorunu sec"

$status = New-Object System.Windows.Forms.TextBox
$status.Location = New-Object System.Drawing.Point(28,310)
$status.Size = New-Object System.Drawing.Size(700,180)
$status.Multiline = $true
$status.ScrollBars = "Vertical"
$status.ReadOnly = $true
$status.BackColor = [System.Drawing.Color]::White
$status.Text = "Hazir."
$form.Controls.Add($status)

$testBtn = New-Object System.Windows.Forms.Button
$testBtn.Text = "Test Paths"
$testBtn.Location = New-Object System.Drawing.Point(28,260)
$testBtn.Size = New-Object System.Drawing.Size(120,36)
$form.Controls.Add($testBtn)

$saveBtn = New-Object System.Windows.Forms.Button
$saveBtn.Text = "Save"
$saveBtn.Location = New-Object System.Drawing.Point(158,260)
$saveBtn.Size = New-Object System.Drawing.Size(120,36)
$form.Controls.Add($saveBtn)

$publishBtn = New-Object System.Windows.Forms.Button
$publishBtn.Text = "Publish"
$publishBtn.Location = New-Object System.Drawing.Point(288,260)
$publishBtn.Size = New-Object System.Drawing.Size(150,36)
$publishBtn.BackColor = [System.Drawing.Color]::FromArgb(15,123,63)
$publishBtn.ForeColor = [System.Drawing.Color]::White
$publishBtn.FlatStyle = "Flat"
$form.Controls.Add($publishBtn)

$resetBtn = New-Object System.Windows.Forms.Button
$resetBtn.Text = "Reset"
$resetBtn.Location = New-Object System.Drawing.Point(448,260)
$resetBtn.Size = New-Object System.Drawing.Size(100,36)
$form.Controls.Add($resetBtn)

$openGitBtn = New-Object System.Windows.Forms.Button
$openGitBtn.Text = "Open GitHub Folder"
$openGitBtn.Location = New-Object System.Drawing.Point(558,260)
$openGitBtn.Size = New-Object System.Drawing.Size(170,36)
$form.Controls.Add($openGitBtn)

$testBtn.Add_Click({
    $errors = Validate-Paths $cmsBox.Text $gitBox.Text $bakBox.Text
    if ($errors.Count -eq 0) {
        $status.Text = "OK`r`n`r`nTum yollar dogru.`r`nCMS: $($cmsBox.Text)`r`nGitHub: $($gitBox.Text)`r`nBackup: $($bakBox.Text)"
    } else {
        $status.Text = "HATA`r`n`r`n" + ($errors -join "`r`n")
    }
})

$saveBtn.Add_Click({
    $errors = Validate-Paths $cmsBox.Text $gitBox.Text $bakBox.Text
    if ($errors.Count -gt 0) {
        $status.Text = "Kaydedilemedi.`r`n`r`n" + ($errors -join "`r`n")
        return
    }
    Save-Config $cmsBox.Text $gitBox.Text $bakBox.Text
    $status.Text = "Yollar kaydedildi."
})

$resetBtn.Add_Click({
    if (Test-Path $ConfigPath) { Remove-Item $ConfigPath -Force }
    $cmsBox.Text = ""
    $gitBox.Text = ""
    $bakBox.Text = ""
    $status.Text = "Ayarlar sifirlandi."
})

$openGitBtn.Add_Click({
    if (Test-Path $gitBox.Text) { Start-Process explorer.exe $gitBox.Text }
})

$publishBtn.Add_Click({
    try {
        $errors = Validate-Paths $cmsBox.Text $gitBox.Text $bakBox.Text
        if ($errors.Count -gt 0) {
            $status.Text = "Publish baslatilamadi.`r`n`r`n" + ($errors -join "`r`n")
            return
        }

        Save-Config $cmsBox.Text $gitBox.Text $bakBox.Text
        $status.Text = "Backup aliniyor..."
        $form.Refresh()

        $backupPath = New-Backup $cmsBox.Text $gitBox.Text $bakBox.Text
        $status.Text = "Dosyalar karsilastiriliyor ve kopyalaniyor..."
        $form.Refresh()

        $result = Compare-And-Copy $cmsBox.Text $gitBox.Text
        $count = Count-Properties $cmsBox.Text
        $commit = Build-CommitMessage $result $count
        Set-Clipboard -Value $commit

        $reportDir = Join-Path $bakBox.Text "PublishReports"
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        $reportPath = Join-Path $reportDir ("Publish_" + (Get-Date -Format "yyyy-MM-dd_HH-mm-ss") + ".txt")

        $report = @"
SIRILAND PUBLISH REPORT
=======================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
CMS: $($cmsBox.Text)
GitHub: $($gitBox.Text)
Backup: $backupPath
Properties: $count

NEW FILES ($($result.newFiles.Count))
$($result.newFiles -join "`r`n")

UPDATED FILES ($($result.updatedFiles.Count))
$($result.updatedFiles -join "`r`n")

COMMIT MESSAGE
$commit

STATUS
READY FOR GITHUB DESKTOP
"@
        $report | Set-Content -Path $reportPath -Encoding UTF8

        $status.Text = "PUBLISH HAZIR`r`n`r`nBackup: $backupPath`r`nYeni dosya: $($result.newFiles.Count)`r`nGuncellenen: $($result.updatedFiles.Count)`r`nIlan sayisi: $count`r`n`r`nCommit mesaji panoya kopyalandi:`r`n$commit`r`n`r`nGitHub Desktop: Ctrl+V > Commit to main > Push origin"

        Start-Process explorer.exe $gitBox.Text
        Start-Process notepad.exe $reportPath
    } catch {
        $status.Text = "PUBLISH ERROR`r`n`r`n$($_.Exception.Message)"
    }
})

[void]$form.ShowDialog()
