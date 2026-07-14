Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "publish-config.json"
$HistoryPath = Join-Path $ScriptDir "publish-history.json"

function Load-JsonFile([string]$Path, $Fallback) {
    if (-not (Test-Path $Path)) { return $Fallback }
    try { return Get-Content $Path -Raw -Encoding UTF8 | ConvertFrom-Json }
    catch { return $Fallback }
}

function Save-JsonFile([string]$Path, $Value) {
    $Value | ConvertTo-Json -Depth 20 | Set-Content -Path $Path -Encoding UTF8
}

function Select-Folder([string]$Description, [string]$CurrentPath) {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $Description
    $dialog.ShowNewFolderButton = $true
    if ($CurrentPath -and (Test-Path $CurrentPath)) { $dialog.SelectedPath = $CurrentPath }
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    return $null
}

function Get-RelativePath([string]$Base, [string]$FullPath) {
    $baseUri = New-Object System.Uri(($Base.TrimEnd('\') + '\'))
    $fileUri = New-Object System.Uri($FullPath)
    return [System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($fileUri).ToString()).Replace('/', '\')
}

function Should-Exclude([string]$RelativePath) {
    $parts = $RelativePath.Split('\')
    $excludedDirectories = @(
        ".git", "node_modules", "02_Backup", "08_Exports", "09_GitHub",
        "Publish_Manager", "Publish_Manager_v2.1", "Publish_Manager_v3",
        ".vscode", ".idea"
    )
    foreach ($part in $parts) {
        if ($excludedDirectories -contains $part) { return $true }
    }

    $extension = [System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant()
    if (@(".zip", ".tmp", ".bak", ".log") -contains $extension) { return $true }

    return $false
}

function Get-SyncPlan([string]$CmsFolder, [string]$GithubFolder) {
    $newFiles = New-Object System.Collections.Generic.List[object]
    $updatedFiles = New-Object System.Collections.Generic.List[object]
    $unchangedFiles = New-Object System.Collections.Generic.List[object]

    $sourceFiles = Get-ChildItem -LiteralPath $CmsFolder -Recurse -File -Force
    foreach ($file in $sourceFiles) {
        $relative = Get-RelativePath $CmsFolder $file.FullName
        if (Should-Exclude $relative) { continue }

        $destination = Join-Path $GithubFolder $relative
        if (-not (Test-Path $destination)) {
            $newFiles.Add([PSCustomObject]@{
                RelativePath = $relative
                SourcePath = $file.FullName
                DestinationPath = $destination
                SizeBytes = $file.Length
            })
            continue
        }

        if ($file.Length -ne (Get-Item $destination).Length) {
            $updatedFiles.Add([PSCustomObject]@{
                RelativePath = $relative
                SourcePath = $file.FullName
                DestinationPath = $destination
                SizeBytes = $file.Length
            })
            continue
        }

        $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
        $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash

        if ($sourceHash -ne $destinationHash) {
            $updatedFiles.Add([PSCustomObject]@{
                RelativePath = $relative
                SourcePath = $file.FullName
                DestinationPath = $destination
                SizeBytes = $file.Length
            })
        } else {
            $unchangedFiles.Add([PSCustomObject]@{
                RelativePath = $relative
                SourcePath = $file.FullName
                DestinationPath = $destination
                SizeBytes = $file.Length
            })
        }
    }

    $orphanFiles = New-Object System.Collections.Generic.List[object]
    $destinationFiles = Get-ChildItem -LiteralPath $GithubFolder -Recurse -File -Force
    foreach ($file in $destinationFiles) {
        $relative = Get-RelativePath $GithubFolder $file.FullName
        if (Should-Exclude $relative) { continue }
        $source = Join-Path $CmsFolder $relative
        if (-not (Test-Path $source)) {
            $orphanFiles.Add([PSCustomObject]@{
                RelativePath = $relative
                DestinationPath = $file.FullName
                SizeBytes = $file.Length
            })
        }
    }

    return [PSCustomObject]@{
        NewFiles = $newFiles
        UpdatedFiles = $updatedFiles
        UnchangedFiles = $unchangedFiles
        OrphanFiles = $orphanFiles
    }
}

function Extract-PropertiesJson([string]$Text) {
    $start = $Text.IndexOf('[')
    $end = $Text.LastIndexOf(']')
    if ($start -lt 0 -or $end -le $start) { throw "properties.js içinde JSON listesi bulunamadı." }
    return $Text.Substring($start, $end - $start + 1)
}

function Get-PropertyArray([string]$CmsFolder) {
    $path = Join-Path $CmsFolder "properties.js"
    if (-not (Test-Path $path)) { throw "properties.js bulunamadı." }
    $text = Get-Content $path -Raw -Encoding UTF8
    $json = Extract-PropertiesJson $text
    $properties = $json | ConvertFrom-Json
    if ($null -eq $properties) { return @() }
    return @($properties)
}

function Get-PropertyTitle($Property) {
    if ($Property.title -is [string]) { return [string]$Property.title }
    if ($Property.title) {
        foreach ($key in @("th", "en", "tr", "zh")) {
            $value = $Property.title.$key
            if ($value) { return [string]$value }
        }
    }
    return ""
}

function Get-PropertyPrice($Property) {
    foreach ($field in @("price", "salePrice", "rentPrice")) {
        $value = $Property.$field
        if ($value -and ([string]$value).Trim()) { return ([string]$value).Trim() }
    }
    return ""
}

function Get-ExpectedCityCode([string]$City) {
    switch ($City) {
        "Chiang Mai" { return "CM" }
        "Bangkok" { return "BKK" }
        "Phichit" { return "PCT" }
        "Phitsanulok" { return "PLK" }
        "Nakhon Sawan" { return "NKS" }
        default { return "" }
    }
}

function Test-Properties([string]$CmsFolder) {
    $errors = New-Object System.Collections.Generic.List[string]
    $warnings = New-Object System.Collections.Generic.List[string]
    $properties = Get-PropertyArray $CmsFolder

    $idCounts = @{}
    foreach ($property in $properties) {
        $id = ([string]$property.id).Trim()
        if (-not $id) {
            $errors.Add("Eksik ID bulunan ilan var.")
            continue
        }

        if (-not $idCounts.ContainsKey($id)) { $idCounts[$id] = 0 }
        $idCounts[$id]++

        if (-not (Get-PropertyTitle $property)) {
            $errors.Add("$id — başlık eksik.")
        }

        if (-not (Get-PropertyPrice $property)) {
            $errors.Add("$id — fiyat eksik.")
        }

        if (-not ([string]$property.city).Trim()) {
            $errors.Add("$id — şehir eksik.")
        } else {
            $expected = Get-ExpectedCityCode ([string]$property.city)
            if ($expected -and -not $id.StartsWith($expected + "-", [System.StringComparison]::OrdinalIgnoreCase)) {
                $errors.Add("$id — şehir kodu $expected ile uyumsuz.")
            }
        }

        if (-not ([string]$property.map).Trim()) {
            $warnings.Add("$id — Google Maps linki eksik.")
        }

        $images = @($property.images)
        if ($images.Count -eq 0 -or -not $images[0]) {
            $warnings.Add("$id — kapak fotoğrafı eksik.")
        } else {
            foreach ($image in $images) {
                if (-not $image) { continue }
                $normalized = ([string]$image).Replace('/', '\').TrimStart('\')
                $imagePath = Join-Path $CmsFolder $normalized
                if (-not (Test-Path $imagePath)) {
                    $warnings.Add("$id — görsel dosyası bulunamadı: $image")
                }
            }
        }
    }

    foreach ($key in $idCounts.Keys) {
        if ($idCounts[$key] -gt 1) {
            $errors.Add("$key — duplicate ID ($($idCounts[$key]) kayıt).")
        }
    }

    return [PSCustomObject]@{
        Properties = $properties
        Errors = $errors
        Warnings = $warnings
    }
}

function New-IncrementalBackup($Config, $Plan) {
    $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $target = Join-Path $Config.backupFolder ("Incremental\Publish_" + $stamp)
    New-Item -ItemType Directory -Path $target -Force | Out-Null

    $backedUp = New-Object System.Collections.Generic.List[string]
    foreach ($item in @($Plan.UpdatedFiles)) {
        if (-not (Test-Path $item.DestinationPath)) { continue }
        $backupPath = Join-Path $target $item.RelativePath
        $backupDirectory = Split-Path -Parent $backupPath
        New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
        Copy-Item -LiteralPath $item.DestinationPath -Destination $backupPath -Force
        $backedUp.Add($item.RelativePath)
    }

    $meta = [PSCustomObject]@{
        CreatedAt = (Get-Date).ToString("s")
        CmsFolder = $Config.cmsFolder
        GithubFolder = $Config.githubFolder
        NewFiles = @($Plan.NewFiles | ForEach-Object { $_.RelativePath })
        UpdatedFiles = @($Plan.UpdatedFiles | ForEach-Object { $_.RelativePath })
        OrphanFiles = @($Plan.OrphanFiles | ForEach-Object { $_.RelativePath })
        BackedUpExistingFiles = @($backedUp)
    }
    Save-JsonFile (Join-Path $target "backup-manifest.json") $meta

    return $target
}

function Invoke-SmartSync($Plan) {
    foreach ($item in @($Plan.NewFiles) + @($Plan.UpdatedFiles)) {
        $destinationDirectory = Split-Path -Parent $item.DestinationPath
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        Copy-Item -LiteralPath $item.SourcePath -Destination $item.DestinationPath -Force
    }
}

function Get-ChangedPropertyIds($Plan) {
    $ids = New-Object System.Collections.Generic.HashSet[string]
    foreach ($item in @($Plan.NewFiles) + @($Plan.UpdatedFiles)) {
        if ($item.RelativePath -match '^(?:properties\\)?([A-Z]+-\d+)\.json$') {
            [void]$ids.Add($Matches[1])
        }
    }

    if (($Plan.NewFiles.RelativePath -contains "properties.js") -or ($Plan.UpdatedFiles.RelativePath -contains "properties.js")) {
        [void]$ids.Add("properties.js")
    }
    return @($ids)
}

function Build-CommitMessage($Plan, [int]$PropertyCount) {
    $newCount = @($Plan.NewFiles).Count
    $updatedCount = @($Plan.UpdatedFiles).Count
    $ids = Get-ChangedPropertyIds $Plan

    if ($newCount -eq 0 -and $updatedCount -eq 0) { return "No file changes" }

    if ($ids.Count -gt 0 -and $ids.Count -le 5) {
        return "Update SIRILAND: " + ($ids -join ", ")
    }

    return "Publish SIRILAND - $PropertyCount listings, $newCount new, $updatedCount updated"
}

function Add-PublishHistory($Record) {
    $history = @(Load-JsonFile $HistoryPath @())
    $history = @($Record) + $history
    if ($history.Count -gt 100) { $history = $history[0..99] }
    Save-JsonFile $HistoryPath $history
}

function Open-GitHubDesktop([string]$RepositoryPath) {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "GitHubDesktop\GitHubDesktop.exe"),
        (Join-Path $env:LOCALAPPDATA "GitHubDesktop\app-*\GitHubDesktop.exe")
    )

    foreach ($candidate in $candidates) {
        $matches = Get-Item $candidate -ErrorAction SilentlyContinue
        foreach ($match in @($matches)) {
            try {
                Start-Process -FilePath $match.FullName -ArgumentList "`"$RepositoryPath`""
                return $true
            } catch {}
        }
    }

    try {
        Start-Process "github" -ArgumentList "`"$RepositoryPath`""
        return $true
    } catch {
        Start-Process explorer.exe $RepositoryPath
        return $false
    }
}

function Show-HistoryWindow {
    $history = @(Load-JsonFile $HistoryPath @())
    $window = New-Object System.Windows.Forms.Form
    $window.Text = "SIRILAND Publish History"
    $window.Size = New-Object System.Drawing.Size(900, 560)
    $window.StartPosition = "CenterParent"

    $grid = New-Object System.Windows.Forms.DataGridView
    $grid.Dock = "Fill"
    $grid.ReadOnly = $true
    $grid.AllowUserToAddRows = $false
    $grid.AutoSizeColumnsMode = "Fill"
    $grid.DataSource = @($history | Select-Object Date, PropertyCount, NewFiles, UpdatedFiles, Warnings, CommitMessage, ReportPath)
    $window.Controls.Add($grid)
    [void]$window.ShowDialog()
}

$config = Load-JsonFile $ConfigPath $null
if ($null -eq $config) {
    $config = [PSCustomObject]@{
        cmsFolder = ""
        githubFolder = ""
        backupFolder = ""
        repository = "SIRILAND-ChiangMai/siriland-realestate"
        branch = "main"
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "SIRILAND Publish Manager PRO v3"
$form.Size = New-Object System.Drawing.Size(980, 760)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(246,248,252)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = "SIRILAND Publish Manager PRO v3"
$title.Font = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(7,26,61)
$title.Location = New-Object System.Drawing.Point(24,18)
$title.AutoSize = $true
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Validator + incremental backup + smart sync + image sync + publish history"
$subtitle.Location = New-Object System.Drawing.Point(28,58)
$subtitle.AutoSize = $true
$form.Controls.Add($subtitle)

function Add-PathRow($LabelText, $Y, $Initial, $Description) {
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $LabelText
    $label.Location = New-Object System.Drawing.Point(28,$Y)
    $label.Size = New-Object System.Drawing.Size(155,26)
    $label.Font = New-Object System.Drawing.Font("Segoe UI",10,[System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($label)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(188,$Y)
    $box.Size = New-Object System.Drawing.Size(650,28)
    $box.Text = $Initial
    $form.Controls.Add($box)

    $button = New-Object System.Windows.Forms.Button
    $button.Text = "Browse"
    $button.Location = New-Object System.Drawing.Point(848,$Y-1)
    $button.Size = New-Object System.Drawing.Size(90,30)
    $form.Controls.Add($button)

    $button.Add_Click({
        $selected = Select-Folder $Description $box.Text
        if ($selected) { $box.Text = $selected }
    }.GetNewClosure())

    return $box
}

$cmsBox = Add-PathRow "CMS Source" 100 $config.cmsFolder "01_CMS klasörünü seç"
$githubBox = Add-PathRow "GitHub Repo" 150 $config.githubFolder "siriland-realestate repository klasörünü seç"
$backupBox = Add-PathRow "Backup Folder" 200 $config.backupFolder "02_Backup klasörünü seç"

$strictCheck = New-Object System.Windows.Forms.CheckBox
$strictCheck.Text = "Uyarılarda da publish'i durdur"
$strictCheck.Location = New-Object System.Drawing.Point(28,245)
$strictCheck.AutoSize = $true
$form.Controls.Add($strictCheck)

$analyzeButton = New-Object System.Windows.Forms.Button
$analyzeButton.Text = "1. Analiz Et"
$analyzeButton.Location = New-Object System.Drawing.Point(28,280)
$analyzeButton.Size = New-Object System.Drawing.Size(130,40)
$form.Controls.Add($analyzeButton)

$publishButton = New-Object System.Windows.Forms.Button
$publishButton.Text = "2. Publish"
$publishButton.Location = New-Object System.Drawing.Point(168,280)
$publishButton.Size = New-Object System.Drawing.Size(155,40)
$publishButton.BackColor = [System.Drawing.Color]::FromArgb(15,123,63)
$publishButton.ForeColor = [System.Drawing.Color]::White
$publishButton.FlatStyle = "Flat"
$form.Controls.Add($publishButton)

$historyButton = New-Object System.Windows.Forms.Button
$historyButton.Text = "Publish History"
$historyButton.Location = New-Object System.Drawing.Point(333,280)
$historyButton.Size = New-Object System.Drawing.Size(145,40)
$form.Controls.Add($historyButton)

$openRepoButton = New-Object System.Windows.Forms.Button
$openRepoButton.Text = "GitHub Repo Aç"
$openRepoButton.Location = New-Object System.Drawing.Point(488,280)
$openRepoButton.Size = New-Object System.Drawing.Size(145,40)
$form.Controls.Add($openRepoButton)

$savePathsButton = New-Object System.Windows.Forms.Button
$savePathsButton.Text = "Yolları Kaydet"
$savePathsButton.Location = New-Object System.Drawing.Point(643,280)
$savePathsButton.Size = New-Object System.Drawing.Size(135,40)
$form.Controls.Add($savePathsButton)

$resetButton = New-Object System.Windows.Forms.Button
$resetButton.Text = "Sıfırla"
$resetButton.Location = New-Object System.Drawing.Point(788,280)
$resetButton.Size = New-Object System.Drawing.Size(100,40)
$form.Controls.Add($resetButton)

$summaryGroup = New-Object System.Windows.Forms.GroupBox
$summaryGroup.Text = "Analiz Özeti"
$summaryGroup.Location = New-Object System.Drawing.Point(28,335)
$summaryGroup.Size = New-Object System.Drawing.Size(910,105)
$form.Controls.Add($summaryGroup)

$summaryLabel = New-Object System.Windows.Forms.Label
$summaryLabel.Text = "Henüz analiz yapılmadı."
$summaryLabel.Location = New-Object System.Drawing.Point(15,28)
$summaryLabel.Size = New-Object System.Drawing.Size(880,65)
$summaryLabel.Font = New-Object System.Drawing.Font("Segoe UI",11,[System.Drawing.FontStyle]::Bold)
$summaryGroup.Controls.Add($summaryLabel)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(28,455)
$logBox.Size = New-Object System.Drawing.Size(910,225)
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.ReadOnly = $true
$logBox.BackColor = [System.Drawing.Color]::FromArgb(12,22,39)
$logBox.ForeColor = [System.Drawing.Color]::FromArgb(219,234,254)
$logBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($logBox)

function Write-Log([string]$Message) {
    $logBox.AppendText("$(Get-Date -Format 'HH:mm:ss')  $Message`r`n")
    $logBox.SelectionStart = $logBox.Text.Length
    $logBox.ScrollToCaret()
    $form.Refresh()
}

$script:LastPlan = $null
$script:LastValidation = $null

function Get-CurrentConfig {
    return [PSCustomObject]@{
        cmsFolder = $cmsBox.Text.Trim()
        githubFolder = $githubBox.Text.Trim()
        backupFolder = $backupBox.Text.Trim()
        repository = $config.repository
        branch = $config.branch
        updatedAt = (Get-Date).ToString("s")
    }
}

function Assert-Paths($CurrentConfig) {
    if (-not (Test-Path $CurrentConfig.cmsFolder)) { throw "CMS Source klasörü bulunamadı." }
    if (-not (Test-Path $CurrentConfig.githubFolder)) { throw "GitHub repository bulunamadı." }
    if (-not (Test-Path (Join-Path $CurrentConfig.githubFolder ".git"))) { throw "GitHub klasöründe .git bulunamadı." }
    if (-not (Test-Path $CurrentConfig.backupFolder)) {
        New-Item -ItemType Directory -Path $CurrentConfig.backupFolder -Force | Out-Null
    }
}

function Invoke-Analysis {
    $current = Get-CurrentConfig
    Assert-Paths $current

    Write-Log "Validator çalışıyor..."
    $validation = Test-Properties $current.cmsFolder
    Write-Log "Smart Sync karşılaştırması yapılıyor..."
    $plan = Get-SyncPlan $current.cmsFolder $current.githubFolder

    $script:LastValidation = $validation
    $script:LastPlan = $plan

    $summaryLabel.Text = "İlan: $(@($validation.Properties).Count)    Yeni: $(@($plan.NewFiles).Count)    Güncellenen: $(@($plan.UpdatedFiles).Count)    Değişmeyen: $(@($plan.UnchangedFiles).Count)    Orphan: $(@($plan.OrphanFiles).Count)`r`nHata: $(@($validation.Errors).Count)    Uyarı: $(@($validation.Warnings).Count)"

    foreach ($error in @($validation.Errors)) { Write-Log "HATA: $error" }
    foreach ($warning in @($validation.Warnings)) { Write-Log "UYARI: $warning" }
    foreach ($item in @($plan.NewFiles)) { Write-Log "YENİ: $($item.RelativePath)" }
    foreach ($item in @($plan.UpdatedFiles)) { Write-Log "GÜNCEL: $($item.RelativePath)" }
    foreach ($item in @($plan.OrphanFiles)) { Write-Log "ORPHAN (silinmedi): $($item.RelativePath)" }

    return [PSCustomObject]@{ Config = $current; Validation = $validation; Plan = $plan }
}

$analyzeButton.Add_Click({
    try {
        $logBox.Clear()
        [void](Invoke-Analysis)
        Write-Log "Analiz tamamlandı."
    } catch {
        Write-Log "HATA: $($_.Exception.Message)"
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Analiz Hatası") | Out-Null
    }
})

$publishButton.Add_Click({
    try {
        $logBox.Clear()
        $analysis = Invoke-Analysis

        if (@($analysis.Validation.Errors).Count -gt 0) {
            throw "Validator hataları var. Publish durduruldu."
        }

        if ($strictCheck.Checked -and @($analysis.Validation.Warnings).Count -gt 0) {
            throw "Uyarılar var ve strict mode açık. Publish durduruldu."
        }

        if (@($analysis.Plan.NewFiles).Count -eq 0 -and @($analysis.Plan.UpdatedFiles).Count -eq 0) {
            [System.Windows.Forms.MessageBox]::Show("Değişen dosya yok.", "Publish") | Out-Null
            return
        }

        Write-Log "Incremental backup alınıyor..."
        $backupPath = New-IncrementalBackup $analysis.Config $analysis.Plan
        Write-Log "Backup tamamlandı: $backupPath"

        Write-Log "Smart Sync başlıyor..."
        Invoke-SmartSync $analysis.Plan
        Write-Log "Smart Sync tamamlandı."

        $propertyCount = @($analysis.Validation.Properties).Count
        $commit = Build-CommitMessage $analysis.Plan $propertyCount
        Set-Clipboard -Value $commit

        $reportDir = Join-Path $analysis.Config.backupFolder "PublishReports"
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
        $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $reportPath = Join-Path $reportDir ("Publish_" + $stamp + ".txt")

        $report = @"
SIRILAND PUBLISH MANAGER PRO v3
================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
CMS: $($analysis.Config.cmsFolder)
GitHub: $($analysis.Config.githubFolder)
Backup: $backupPath
Properties: $propertyCount

VALIDATOR ERRORS ($(@($analysis.Validation.Errors).Count))
$(@($analysis.Validation.Errors) -join "`r`n")

VALIDATOR WARNINGS ($(@($analysis.Validation.Warnings).Count))
$(@($analysis.Validation.Warnings) -join "`r`n")

NEW FILES ($(@($analysis.Plan.NewFiles).Count))
$(@($analysis.Plan.NewFiles | ForEach-Object { $_.RelativePath }) -join "`r`n")

UPDATED FILES ($(@($analysis.Plan.UpdatedFiles).Count))
$(@($analysis.Plan.UpdatedFiles | ForEach-Object { $_.RelativePath }) -join "`r`n")

ORPHAN FILES — NOT DELETED ($(@($analysis.Plan.OrphanFiles).Count))
$(@($analysis.Plan.OrphanFiles | ForEach-Object { $_.RelativePath }) -join "`r`n")

COMMIT MESSAGE
$commit

STATUS
READY FOR GITHUB DESKTOP
"@
        $report | Set-Content -Path $reportPath -Encoding UTF8

        $historyRecord = [PSCustomObject]@{
            Date = (Get-Date).ToString("s")
            PropertyCount = $propertyCount
            NewFiles = @($analysis.Plan.NewFiles).Count
            UpdatedFiles = @($analysis.Plan.UpdatedFiles).Count
            Warnings = @($analysis.Validation.Warnings).Count
            CommitMessage = $commit
            ReportPath = $reportPath
            BackupPath = $backupPath
        }
        Add-PublishHistory $historyRecord

        $opened = Open-GitHubDesktop $analysis.Config.githubFolder
        if ($opened) { Write-Log "GitHub Desktop açıldı." }
        else { Write-Log "GitHub Desktop bulunamadı; repository klasörü açıldı." }

        Write-Log "Commit mesajı panoya kopyalandı: $commit"

        [System.Windows.Forms.MessageBox]::Show(
            "Publish hazır.`n`nYeni: $(@($analysis.Plan.NewFiles).Count)`nGüncellenen: $(@($analysis.Plan.UpdatedFiles).Count)`nUyarı: $(@($analysis.Validation.Warnings).Count)`n`nCommit mesajı panoya kopyalandı.`nGitHub Desktop'ta Commit + Push yap.",
            "SIRILAND Publish Manager PRO v3",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Information
        ) | Out-Null

        Start-Process notepad.exe $reportPath
    } catch {
        Write-Log "PUBLISH HATASI: $($_.Exception.Message)"
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Publish Hatası") | Out-Null
    }
})

$historyButton.Add_Click({ Show-HistoryWindow })

$openRepoButton.Add_Click({
    if (Test-Path $githubBox.Text) { [void](Open-GitHubDesktop $githubBox.Text) }
})

$savePathsButton.Add_Click({
    try {
        $current = Get-CurrentConfig
        Assert-Paths $current
        Save-JsonFile $ConfigPath $current
        $config = $current
        [System.Windows.Forms.MessageBox]::Show("Yollar kaydedildi.", "Publish Manager") | Out-Null
    } catch {
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Yol Hatası") | Out-Null
    }
})

$resetButton.Add_Click({
    $cmsBox.Text = ""
    $githubBox.Text = ""
    $backupBox.Text = ""
    $script:LastPlan = $null
    $script:LastValidation = $null
    $summaryLabel.Text = "Yollar sıfırlandı."
})

[void]$form.ShowDialog()
