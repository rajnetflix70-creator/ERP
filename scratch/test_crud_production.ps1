$loginBody = @{ email = 'admin@sitetrack.ae'; password = 'Admin@1234' } | ConvertTo-Json
$res = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $res.token
$headers = @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "--- 1. Testing Create Project ---"
$newProject = @{
    name = "Downtown Skyscraper Project"
    code = "PRJ-TEST-001"
    description = "Flagship commercial tower"
    budget = 15000000
    currency = "AED"
    location = "Dubai Downtown"
    status = "planning"
} | ConvertTo-Json

$createdProj = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/projects' -Headers $headers -Method Post -Body $newProject
Write-Host "Created Project ID:" $createdProj.data.id "Code:" $createdProj.data.code

Write-Host "--- 2. Testing Create Site ---"
$newSite = @{
    name = "Tower A Construction Site"
    site_code = "SITE-TEST-001"
    project_id = $createdProj.data.id
    emirate = "Dubai"
    status = "active"
} | ConvertTo-Json

$createdSite = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/sites' -Headers $headers -Method Post -Body $newSite
Write-Host "Created Site ID:" $createdSite.data.id "Code:" $createdSite.data.site_code

Write-Host "--- 3. Testing Fetch Projects & Sites ---"
$projs = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/projects' -Headers $headers -Method Get
Write-Host "Fetched Projects Count:" $projs.data.data.Count

$sites = Invoke-RestMethod -Uri 'https://sitetrack-production-f0f5.up.railway.app/api/v1/sites' -Headers $headers -Method Get
Write-Host "Fetched Sites Count:" $sites.data.Count

Write-Host "--- 4. Cleanup Test Project and Site ---"
$delSite = Invoke-RestMethod -Uri ("https://sitetrack-production-f0f5.up.railway.app/api/v1/sites/" + $createdSite.data.id) -Headers $headers -Method Delete
Write-Host "Deleted Site Result:" $delSite.success

$delProj = Invoke-RestMethod -Uri ("https://sitetrack-production-f0f5.up.railway.app/api/v1/projects/" + $createdProj.data.id) -Headers $headers -Method Delete
Write-Host "Deleted Project Result:" $delProj.success

Write-Host "=== TEST COMPLETED SUCCESSFULLY ==="
