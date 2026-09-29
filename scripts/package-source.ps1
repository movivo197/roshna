$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseDir = Join-Path ([IO.Directory]::GetParent($projectRoot).FullName) 'outputs'
[IO.Directory]::CreateDirectory($releaseDir) | Out-Null
$releaseVersion = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
if ($releaseVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid release version' }
$zipPath = Join-Path $releaseDir "roshna-plus33-v$releaseVersion-source.zip"
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Open($zipPath, [IO.FileMode]::Create)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
$count = 0
try {
    Get-ChildItem -LiteralPath $projectRoot -Recurse -File | ForEach-Object {
        $relative = [IO.Path]::GetRelativePath($projectRoot, $_.FullName).Replace('\', '/')
        $excludedDirectory = @($relative.Split('/') | Where-Object { $_ -in @('node_modules', '.next', '.git', 'data', 'backups', 'test-results', 'outputs', 'dist') }).Count -gt 0
        $excludedFile = ($_.Name -like '.env*' -and $_.Name -ne '.env.example') -or $_.Name -like '*.tsbuildinfo' -or $_.Name -in @('next-env.d.ts','CLAUDE.md')
        if (-not $excludedDirectory -and -not $excludedFile) {
            $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Optimal)
            $target = $entry.Open()
            try {
                if ($_.Extension -eq '.sh') {
                    $bytes = [Text.Encoding]::UTF8.GetBytes([IO.File]::ReadAllText($_.FullName).Replace("`r`n", "`n"))
                } else { $bytes = [IO.File]::ReadAllBytes($_.FullName) }
                $target.Write($bytes, 0, $bytes.Length)
                $count++
            } finally { $target.Dispose() }
        }
    }
} finally { $archive.Dispose(); $stream.Dispose() }
$digest = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText("$zipPath.sha256", "$digest  $([IO.Path]::GetFileName($zipPath))`n", [Text.Encoding]::ASCII)
[PSCustomObject]@{ File=$zipPath; Entries=$count; Bytes=(Get-Item -LiteralPath $zipPath).Length; SHA256=$digest }
