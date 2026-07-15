Add-Type -AssemblyName System.Web

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "auto-publish-config.json"

$config = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cms = [string]$config.cmsFolder
$repo = [string]$config.githubFolder
$branch = [string]$config.branch
$port = [int]$config.port

function Write-JsonResponse($context, [int]$status, $value) {
    $json = $value | ConvertTo-Json -Depth 20
    $bytes = [Text.Encoding]::UTF8.GetBytes($json)
    $context.Response.StatusCode = $status
    $context.Response.ContentType = "application/json; charset=utf-8"
    $context.Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes,0,$bytes.Length)
    $context.Response.OutputStream.Close()
}

function Sync-CmsToRepo {
    $excluded = @(".git","node_modules","Publish_Manager","Auto_Publish","02_Backup","08_Exports","09_GitHub")
    $changed = New-Object System.Collections.Generic.List[string]

    $files = Get-ChildItem -LiteralPath $cms -Recurse -File -Force
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($cms.Length).TrimStart('\')
        $parts = $relative.Split('\')
        if ($parts | Where-Object { $excluded -contains $_ }) { continue }
        if ([IO.Path]::GetExtension($relative).ToLowerInvariant() -in @(".zip",".tmp",".bak",".log")) { continue }

        $target = Join-Path $repo $relative
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }

        $copy = $false
        if (-not (Test-Path $target)) {
            $copy = $true
        } elseif ($file.Length -ne (Get-Item $target).Length) {
            $copy = $true
        } else {
            $a = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $b = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
            $copy = $a -ne $b
        }

        if ($copy) {
            Copy-Item -LiteralPath $file.FullName -Destination $target -Force
            $changed.Add($relative)
        }
    }
    return @($changed)
}

function Invoke-Git([string[]]$Arguments) {
    $output = & git -C $repo @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output -join "`n")
    }
    return ($output -join "`n")
}

if (-not (Test-Path $cms)) { throw "CMS klasörü bulunamadı: $cms" }
if (-not (Test-Path (Join-Path $repo ".git"))) { throw "Git repository bulunamadı: $repo" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()

Write-Host ""
Write-Host "SIRILAND AUTO PUBLISH PRO" -ForegroundColor Yellow
Write-Host "========================="
Write-Host "Service: http://127.0.0.1:$port" -ForegroundColor Green
Write-Host "CMS: $cms"
Write-Host "Repo: $repo"
Write-Host "Branch: $branch"
Write-Host ""
Write-Host "Bu pencereyi admin kullanirken acik birak." -ForegroundColor Cyan

while ($listener.IsListening) {
    $context = $listener.GetContext()

    if ($context.Request.HttpMethod -eq "OPTIONS") {
        Write-JsonResponse $context 200 @{ ok = $true }
        continue
    }

    try {
        $path = $context.Request.Url.AbsolutePath

        if ($path -eq "/health") {
            Write-JsonResponse $context 200 @{
                ok = $true
                cmsFolder = $cms
                githubFolder = $repo
                branch = $branch
            }
            continue
        }

        if ($path -eq "/publish" -and $context.Request.HttpMethod -eq "POST") {
            $reader = New-Object IO.StreamReader($context.Request.InputStream, $context.Request.ContentEncoding)
            $bodyText = $reader.ReadToEnd()
            $body = if ($bodyText) { $bodyText | ConvertFrom-Json } else { [PSCustomObject]@{} }
            $message = if ($body.commitMessage) { [string]$body.commitMessage } else { "Publish SIRILAND update" }

            $changed = Sync-CmsToRepo

            $status = Invoke-Git @("status","--porcelain")
            if (-not $status.Trim()) {
                Write-JsonResponse $context 200 @{
                    ok = $true
                    changedFiles = 0
                    commit = "No changes"
                    push = "Not required"
                }
                continue
            }

            [void](Invoke-Git @("add","-A"))
            $commitOutput = Invoke-Git @("commit","-m",$message)
            $pushOutput = Invoke-Git @("push","origin",$branch)

            Write-JsonResponse $context 200 @{
                ok = $true
                changedFiles = $changed.Count
                changed = $changed
                commit = $message
                commitOutput = $commitOutput
                push = "Success"
                pushOutput = $pushOutput
            }
            continue
        }

        Write-JsonResponse $context 404 @{ error = "Not found" }
    } catch {
        Write-JsonResponse $context 500 @{ error = $_.Exception.Message }
    }
}
