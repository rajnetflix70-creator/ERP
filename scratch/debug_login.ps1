$loginBody = @{ email = 'admin@sitetrack.ae'; password = 'Admin@1234' } | ConvertTo-Json
$res = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Login response:" ($res | ConvertTo-Json -Depth 5)
