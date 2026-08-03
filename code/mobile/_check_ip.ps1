$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' -and $_.IPAddress -notlike '192.168.56.*' }
foreach ($ip in $ips) {
    Write-Host ($ip.IPAddress + "  (" + $ip.InterfaceAlias + ")")
}
