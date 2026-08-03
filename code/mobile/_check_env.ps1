$os = Get-CimInstance Win32_OperatingSystem
$c = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$g = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='G:'"
Write-Host ("可用内存: " + [math]::Round($os.FreePhysicalMemory/1MB,2) + " GB / " + [math]::Round($os.TotalVisibleMemorySize/1MB,2) + " GB")
Write-Host ("C盘可用: " + [math]::Round($c.FreeSpace/1GB,2) + " GB / " + [math]::Round($c.Size/1GB,2) + " GB")
Write-Host ("G盘可用: " + [math]::Round($g.FreeSpace/1GB,2) + " GB / " + [math]::Round($g.Size/1GB,2) + " GB")
