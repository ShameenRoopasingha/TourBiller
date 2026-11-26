$Url = if ($env:VIGIL_SYNC_URL) { $env:VIGIL_SYNC_URL } else { "http://localhost:3000/api/bitgard/subscription-sync" }
$SyncSecret = $env:BITGARD_SYNC_SECRET
if (-not $SyncSecret) {
    Write-Error "Set BITGARD_SYNC_SECRET before running test-webhook.ps1 (Bitgard -> Vigil sync secret)."
    exit 1
}

$DeliveryId = "dlv_test_" + [guid]::NewGuid().ToString("N").Substring(0, 12)
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()

$PayloadObj = @{
    deliveryId = $DeliveryId
    eventType = "admin.lifetime_granted"
    email = "owner@testcompany.com"
    companyName = "Test Company Tours"
    tier = "ENTERPRISE"
    billingCycle = "LIFETIME"
    status = "LIFETIME"
    source = "MANUAL_ADMIN"
    isLifetime = $true
    licenseKey = "VGL-TEST-1234-5678-ABCD"
    bitgardSubscriptionId = "bg_test_001"
    note = "Local PowerShell signed sync test"
    initialAdminPassword = "password123"
}
$RawBody = ($PayloadObj | ConvertTo-Json -Depth 6 -Compress)

$SignedContent = "$Timestamp.$DeliveryId.$RawBody"
$Hmac = New-Object System.Security.Cryptography.HMACSHA256
$Hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($SyncSecret)
$SigBase64 = [Convert]::ToBase64String($Hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($SignedContent)))

$Headers = @{
    "x-bitgard-delivery-id" = $DeliveryId
    "x-bitgard-timestamp"   = $Timestamp
    "x-bitgard-signature"   = "v1,$SigBase64"
}

try {
    $res = Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Headers $Headers -Body $RawBody
    Write-Output "Success:"
    $res | ConvertTo-Json -Depth 6
} catch {
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output $reader.ReadToEnd()
    }
}
