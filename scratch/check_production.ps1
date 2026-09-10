$loginBody = @{ email = 'admin@sitetrack.ae'; password = 'Admin@1234' } | ConvertTo-Json
$res = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = if ($res.token) { $res.token } else { $res.data.tokens.accessToken }
$headers = @{ Authorization = "Bearer $token" }

Write-Host "=== PRODUCTION DATABASE STATUS ==="

$projects = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/projects' -Headers $headers -Method Get
Write-Host ("Projects Total: " + $projects.data.total + " (count in page: " + $projects.data.data.Count + ")")

$sites = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/sites' -Headers $headers -Method Get
Write-Host ("Sites Total: " + $sites.data.Count)

$employees = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/employees' -Headers $headers -Method Get
Write-Host ("Employees/Users Total: " + $employees.data.total + " (records: " + $employees.data.data.Count + ")")
foreach ($u in $employees.data.data) {
    Write-Host (" - " + $u.full_name + " (" + $u.email + ")")
}

$materials = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/materials' -Headers $headers -Method Get
Write-Host ("Materials Total: " + $materials.data.materials.Count)

$audit = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/audit-logs' -Headers $headers -Method Get
Write-Host ("Audit Logs Total: " + $audit.data.total)
