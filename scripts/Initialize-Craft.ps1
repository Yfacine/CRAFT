[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$craftRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$nodePath = Join-Path $craftRoot '.tools/node/24.22.2/node.exe'
$reaPath = Join-Path $craftRoot '.tools/rea/6.8.0/node_modules/rea-agents/scripts/rea.mjs'
foreach ($tool in @($nodePath, $reaPath)) {
    if (!(Test-Path -LiteralPath $tool -PathType Leaf)) {
        throw "Required CRAFT bundle file is missing: $tool"
    }
}

function ConvertTo-TomlPath([string]$Path) {
    $Path.Replace('\', '/') | ConvertTo-Json -Compress
}

$configDir = Join-Path $craftRoot '.codex'
$configPath = Join-Path $configDir 'config.toml'
$begin = '# BEGIN CRAFT MANAGED REA'
$end = '# END CRAFT MANAGED REA'
$legacyBlock = @(
    '[mcp_servers.rea]'
    ('command = ' + (ConvertTo-TomlPath $nodePath))
    ('args = [' + (ConvertTo-TomlPath $reaPath) + ', "mcp"]')
    ('cwd = ' + (ConvertTo-TomlPath $craftRoot))
) -join "`n"
$managedBlock = "$begin`n$legacyBlock`n$end"
$exists = Test-Path -LiteralPath $configPath -PathType Leaf
$contents = if ($exists) { [IO.File]::ReadAllText($configPath) } else { '' }
$beginCount = [regex]::Matches($contents, '(?m)^' + [regex]::Escape($begin) + '\r?$').Count
$endCount = [regex]::Matches($contents, '(?m)^' + [regex]::Escape($end) + '\r?$').Count
$reaHeader = '(?m)^[\t ]*\[[\t ]*mcp_servers[\t ]*\.[\t ]*["'']?rea["'']?[\t ]*(?:\.|\])'

if ($beginCount -eq 1 -and $endCount -eq 1) {
    $start = [regex]::Match($contents, '(?m)^' + [regex]::Escape($begin) + '\r?$').Index
    $stop = [regex]::Match($contents, '(?m)^' + [regex]::Escape($end) + '\r?$').Index
    if ($stop -le $start) { throw "CRAFT markers are out of order in $configPath" }
    $prefix = $contents.Substring(0, $start)
    $suffix = $contents.Substring($stop + $end.Length)
    if (($prefix + $suffix) -match $reaHeader) { throw "Duplicate REA configuration in $configPath" }
    $updated = $prefix + $managedBlock + $suffix
} elseif ($beginCount -ne 0 -or $endCount -ne 0) {
    throw "Incomplete or duplicate CRAFT markers in $configPath"
} elseif (($contents -replace '\r?\n', "`n").Trim() -ceq $legacyBlock) {
    $updated = $managedBlock + "`n"
} elseif ($contents -match $reaHeader) {
    throw "A manually configured REA entry already exists in $configPath. Review that entry before initializing CRAFT."
} elseif ($contents.Length -eq 0) {
    $updated = $managedBlock + "`n"
} else {
    $updated = $contents.TrimEnd("`r", "`n") + "`n`n" + $managedBlock + "`n"
}

if ($contents -cne $updated) {
    $null = New-Item -ItemType Directory -Path $configDir -Force
    $temp = Join-Path $configDir ('.craft-rea-' + [guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [IO.File]::WriteAllText($temp, $updated, [Text.UTF8Encoding]::new($false))
        if ($exists) {
            $backup = $temp + '.backup'
            [IO.File]::Replace($temp, $configPath, $backup)
            Remove-Item -LiteralPath $backup
        } else {
            [IO.File]::Move($temp, $configPath)
        }
    } finally {
        if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp }
    }
}
Write-Output "CRAFT REA configuration ready: $configPath"