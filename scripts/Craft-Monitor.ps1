[CmdletBinding(DefaultParameterSetName = 'Start')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Start')]
    [ValidateNotNullOrEmpty()]
    [string]$Target,
    [Parameter(ParameterSetName = 'Start')]
    [switch]$NoWindow,
    [Parameter(Mandatory, ParameterSetName = 'Update')]
    [string]$StatePath,
    [Parameter(Mandatory, ParameterSetName = 'Update')]
    [hashtable]$Patch
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$node = Join-Path $root '.tools/node/24.22.2/node.exe'
$writer = Join-Path $PSScriptRoot 'craft-monitor-state.cjs'
$viewer = Join-Path $PSScriptRoot 'craft-progress-monitor.cjs'
foreach ($file in @($node, $writer, $viewer)) {
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing CRAFT monitor file: $file" }
}

$operation = $PSCmdlet.ParameterSetName
if ($operation -eq 'Start') {
    $runId = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
    $runDirectory = Join-Path (Join-Path $root '.craft-monitor') $runId
    $null = New-Item -ItemType Directory -Path $runDirectory -Force
    $StatePath = Join-Path $runDirectory 'state.json'
    $payload = @{ target = $Target }
} else {
    $StatePath = (Resolve-Path -LiteralPath $StatePath).Path
    $payload = $Patch
}

# PowerShell 5.1 and PowerShell 7 use different default native pipe encodings.
$oldEncoding = $OutputEncoding
try {
    $OutputEncoding = [Text.UTF8Encoding]::new($false)
    $payload | ConvertTo-Json -Depth 12 -Compress | & $node $writer $operation $StatePath
    if ($LASTEXITCODE -ne 0) { throw "CRAFT monitor $operation failed: exit $LASTEXITCODE" }
} finally {
    $OutputEncoding = $oldEncoding
}

if ($operation -eq 'Start') {
    $windowPid = $null
    if (!$NoWindow) {
        try {
            $arguments = '"' + $viewer + '" --state "' + $StatePath + '"'
            $window = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory $root -WindowStyle Normal -PassThru
            $windowPid = $window.Id
        } catch {
            Write-Warning "Monitor state is available, but the terminal window did not open: $($_.Exception.Message)"
        }
    }
    [pscustomobject]@{ RunId = $runId; StatePath = $StatePath; WindowPid = $windowPid }
}
