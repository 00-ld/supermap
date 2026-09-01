$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $repo 'backend')

Get-Content (Join-Path $repo '.env.local') | Where-Object { $_ -match '^\s*[^#=]+=' } | ForEach-Object {
  $pair = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($pair[0].Trim(), $pair[1], 'Process')
}

$env:SPRING_PROFILES_ACTIVE = 'local'
if ($env:DB_USERNAME) { $env:SPRING_DATASOURCE_USERNAME = $env:DB_USERNAME }
if ($env:DB_PASSWORD) { $env:SPRING_DATASOURCE_PASSWORD = $env:DB_PASSWORD }
if ($env:MYSQL_DATABASE) {
  $env:SPRING_DATASOURCE_URL = "jdbc:mysql://127.0.0.1:3306/$($env:MYSQL_DATABASE)?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
}

& mvn spring-boot:run -DskipTests
