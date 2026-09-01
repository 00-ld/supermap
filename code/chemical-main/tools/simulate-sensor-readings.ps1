param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [string]$BaseUrl = "http://127.0.0.1:8081/api",
    [string[]]$SensorIds = @("TK-01L", "TK-02L", "TK-03L"),
    [string]$GasCode = "CH4",
    [int]$Count = 30,
    [int]$IntervalMilliseconds = 1000
)

$ErrorActionPreference = "Stop"
$headers = @{ token = $Token }

for ($index = 0; $index -lt $Count; $index++) {
    $sensorId = $SensorIds[$index % $SensorIds.Count]
    $body = @{
        eventId = "simulator-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())-$index"
        sensorId = $sensorId
        gasCode = $GasCode
        concentration = [Math]::Round(8 + 35 * [Math]::Abs([Math]::Sin($index / 5)), 3)
        unit = "ppm"
        sampledAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        sequenceNo = $index
        source = "simulator"
        qualityStatus = "SIMULATED"
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Method Post `
        -Uri "$($BaseUrl.TrimEnd('/'))/sensor-readings" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $body | Out-Null
    Write-Host "[SIMULATED] $sensorId $GasCode sequence=$index"
    Start-Sleep -Milliseconds ([Math]::Max(100, $IntervalMilliseconds))
}
