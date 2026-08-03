$targets = @(13096, 2948, 9080)
foreach ($t in $targets) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$t" -ErrorAction SilentlyContinue
    if ($p) {
        $mem = [math]::Round((Get-Process -Id $t).WorkingSet64/1MB,0)
        $cmdLen = [math]::Min(200, $p.CommandLine.Length)
        Write-Host ("PID " + $t + " [" + $mem + "MB]: " + $p.CommandLine.Substring(0, $cmdLen))
    } else {
        Write-Host ("PID " + $t + ": 已退出")
    }
}
