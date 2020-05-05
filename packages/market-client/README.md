## Installation

```bash
npm i @atomicloans/market-client
```

## Usage for calculating TLV in Atomic Loans

This script will output the following data:
```
Global Lending Metrics for DAI Market
Loans Originated: 38
Total DAI Supplied: 37763.88
Total DAI Borrowed: 29098
Total BTC Locked: 7.53815185
Total Value Locked (DAI + BTC): $105152.13


Global Lending Metrics for USDC Market
Loans Originated: 68
Total USDC Supplied: 100953.50
Total USDC Borrowed: 78308.56
Total BTC Locked: 25.28586695
Total Value Locked (USDC + BTC): $326149.43


Global Lending Metrics
Loans Originated: 106
Total Stablecoin Supplied: 138717.38 USD
Total Stablecoin Borrowed: 107406.56 USD
Total BTC Locked: 32.8240188
Total Value Locked: $431301.56 USD
```

```js
import MarketClient from '@atomicloans/market-client'
import { Client, providers } from '@liquality/bundle';
import Web3 from 'web3'
import { BigNumber as BN } from 'bignumber.js'
import axios from 'axios'

const btcClient = new Client()
btcClient.addProvider(new providers.bitcoin.BitcoinEsploraApiProvider('https://blockstream.info/api'))

const httpProvider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/7d0d81d0919f4f05b9ab6634be01ee73')
const web3 = new Web3(httpProvider)

const daiContracts = {
  funds: '0x7791cF9a85072698e9B805eb8156EC1e9c3fc724',
  loans: '0xa25Ad02862756680Ee8aE7aa9ccC37D3d3F75A4C',
  sales: '0x3171781bcfCd9E111225CDB42f33E856BA9F7A5a',
  collateral: '0x8be077228f4e8977a2366653a75c0eb3d68d86b3',
  p2wsh: '0x095925A67EDE4FE0D794f7797342528B98C7DA15'
}

const usdcContracts = {
  funds: '0x3528C164e3fCA20E2333Cf58Ab4B1c99DeF83347',
  loans: '0x20233a2095787DAC434F20f8954d3758986EF30E',
  sales: '0xf30Cb0Ae1879b18dEb48932A8a6F362e5789EE01',
  collateral: '0xacce090abee68402a2fb8e3acbc31b58a9341466',
  p2wsh: '0x1C6148Cb6EED725d8F2F01b4F24040a855B40191'
}

const daiMarket = new MarketClient(daiContracts, btcClient, web3, 'ether')
const usdcMarket = new MarketClient(usdcContracts, btcClient, web3, 'mwei')

const markets = [
  { client: daiMarket, currency: 'DAI' },
  { client: usdcMarket, currency: 'USDC' }
]

const { data: { data: { amount: btcPrice }} } = await axios(`https://api.coinbase.com/v2/prices/BTC-USD/spot`)

let totalLoansOriginated = 0
let totalStablecoinSupplied = BN(0)
let totalStablecoinBorrowed = BN(0)
let totalCollateralLocked = BN(0)
let totalValueLocked = BN(0)
for (const market of markets) {
  const { client, currency } = market

  const loanCount = await client.loanCount()

  const totalBorrowed = await client.totalBorrowed()
  const totalSupplied = await client.totalSupplied()

  const loanIds = [...Array(parseInt(loanCount)).keys()].map(x => x + 1)

  let totalCollateralValue = BN(0)

  const loans = [];
  (
    await Promise.all(
      loanIds.map(
        id =>
          new Promise(async (res, _) =>
            res(
              Object.assign(await client.loan(id), { id }),
            ),
          ),
      ),
    )
  ).forEach(obj => {
    loans[obj.id - 1] = obj;
  });

  for (const loan of loans) {
    totalCollateralValue = totalCollateralValue.plus(loan.collateralValue)
  }

  const { data: { data: { amount: currencyPrice }} } = await axios(`https://api.coinbase.com/v2/prices/${currency}-USD/spot`)

  const currencyValue = BN(totalSupplied).times(currencyPrice).toFixed()
  const btcValue = BN(totalCollateralValue).times(btcPrice).toFixed()

  const marketTotalValueLocked = BN(currencyValue).plus(btcValue).toFixed()

  console.log(`Global Lending Metrics for ${currency} Market`)
  console.log(`Loans Originated: ${loanCount}`)
  console.log(`Total ${currency} Supplied: ${BN(totalSupplied).toFixed(2)}`)
  console.log(`Total ${currency} Borrowed: ${totalBorrowed}`)
  console.log(`Total BTC Locked: ${totalCollateralValue.toFixed()}`)
  console.log(`Total Value Locked (${currency} + BTC): $${BN(marketTotalValueLocked).toFixed(2)}`)
  console.log('\n')

  totalLoansOriginated += parseInt(loanCount)
  totalStablecoinSupplied = totalStablecoinSupplied.plus(totalSupplied)
  totalStablecoinBorrowed = totalStablecoinBorrowed.plus(totalBorrowed)
  totalCollateralLocked = totalCollateralLocked.plus(totalCollateralValue)
  totalValueLocked = totalValueLocked.plus(marketTotalValueLocked)
}

console.log(`Global Lending Metrics`)
console.log(`Loans Originated: ${totalLoansOriginated}`)
console.log(`Total Stablecoin Supplied: ${BN(totalStablecoinSupplied).toFixed(2)} USD`)
console.log(`Total Stablecoin Borrowed: ${BN(totalStablecoinBorrowed).toFixed(2)} USD`)
console.log(`Total BTC Locked: ${totalCollateralLocked.toFixed()}`)
console.log(`Total Value Locked: $${BN(totalValueLocked).toFixed(2)} USD`)
```


## License

[MIT](../../LICENSE.md)
