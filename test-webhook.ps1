$webhookUrl = "http://localhost:3000/api/webhooks/subscription"

$body = "merchant_id=1234567&order_id=TEST-SUB-01&payhere_amount=10000.00&payhere_currency=LKR&status_code=2&md5sig=FAKE_SIG&custom_1=password123&custom_2=TestCompany&customer_email=admin@testcompany.com"

Write-Host "Triggering webhook to create account..."
Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
Write-Host ""
Write-Host "Webhook triggered! If successful, you can now log in with:" -ForegroundColor Green
Write-Host "Email: admin@testcompany.com" -ForegroundColor Green
Write-Host "Password: password123" -ForegroundColor Green
