# Hwal devnet deploy + setup
# Run from hwal/ project root after `anchor build` and `npm install`.
# Prerequisite: wallet at C:\Users\baayo\.config\solana\id.json with >= 5 SOL on devnet.

$ErrorActionPreference = "Stop"

Write-Host "==> verifying wallet" -ForegroundColor Cyan
$wallet = solana address
$balance = solana balance --output json | ConvertFrom-Json
Write-Host "wallet  : $wallet"
Write-Host "balance : $($balance.value) SOL"

if ($balance.value -lt 4.5) {
    Write-Host "balance below 4.5 SOL. fund with one of:" -ForegroundColor Yellow
    Write-Host "  solana airdrop 2"
    Write-Host "  https://faucet.solana.com   (paste $wallet)"
    Write-Host "  https://solfaucet.com       (paste $wallet)"
    exit 1
}

Write-Host "==> deploying program" -ForegroundColor Cyan
anchor deploy --provider.cluster devnet

Write-Host "==> running setup-devnet" -ForegroundColor Cyan
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "C:\Users\baayo\.config\solana\id.json"
npx ts-node scripts/setup-devnet.ts

Write-Host "==> done." -ForegroundColor Green
Write-Host "next: yarn ts-node scripts/push-price.ts SOL 152000000"
Write-Host "      yarn ts-node scripts/keeper-bot.ts 500"
