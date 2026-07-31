$pairs = @{}
npx supabase status -o env 2>$null | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    $pairs[$matches[1]] = $matches[2].Trim('"')
  }
}
$env:SUPABASE_URL = $pairs['API_URL']
$env:SUPABASE_PUBLISHABLE_KEY = $pairs['PUBLISHABLE_KEY']
$env:SUPABASE_SECRET_KEY = $pairs['SECRET_KEY']

$serverProcess = Start-Process `
  -FilePath node `
  -ArgumentList 'apps/game-server/dist/index.js' `
  -WorkingDirectory 'C:\Users\Admin\Downloads\OodHeroes' `
  -WindowStyle Hidden `
  -PassThru

try {
  $healthy = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri 'http://127.0.0.1:2567/health' -TimeoutSec 2
      $healthy = $true
      break
    } catch {
      Start-Sleep -Milliseconds 250
    }
  }
  if (-not $healthy) {
    throw 'Compiled server did not become healthy.'
  }
  $readiness = Invoke-RestMethod -Uri 'http://127.0.0.1:2567/ready' -TimeoutSec 10
  $persistenceHealth = Invoke-RestMethod `
    -Uri 'http://127.0.0.1:2567/api/persistence/health' `
    -TimeoutSec 10
  [pscustomobject]@{
    health = $health.status
    service = $health.service
    ready = $readiness.status
    persistence = $persistenceHealth.status
    queueDepth = $persistenceHealth.queueDepth
  } | ConvertTo-Json
} finally {
  if (-not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id
  }
  Wait-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
}
