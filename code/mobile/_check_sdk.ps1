$procs = Get-Process -Name 'java' -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "=== Java 进程（sdkmanager 是 java 跑的）==="
    $procs | Select-Object Id, @{N='MemMB'; E={[math]::Round($_.WorkingSet64/1MB,0)}}, StartTime | Format-Table -AutoSize
} else {
    Write-Host "无 Java 进程（sdkmanager 可能已结束或未真正启动）"
}
Write-Host "--- SDK 目录大小 ---"
$size = (Get-ChildItem 'C:\Users\colorful\AppData\Local\Android\Sdk' -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
Write-Host ("SDK 总大小: " + [math]::Round($size/1GB,2) + " GB")
Write-Host "--- system-images 目录 ---"
if (Test-Path 'C:\Users\colorful\AppData\Local\Android\Sdk\system-images\android-34\google_apis\arm64-v8a') {
    $s = (Get-ChildItem 'C:\Users\colorful\AppData\Local\Android\Sdk\system-images\android-34\google_apis\arm64-v8a' -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Write-Host ("arm64-v8a 镜像已下载: " + [math]::Round($s/1GB,2) + " GB")
} else {
    Write-Host "arm64-v8a 镜像目录尚未创建"
}
