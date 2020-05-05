/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber as BN } from 'bignumber.js'
import { markets } from '../common'
import axios from 'axios'
import config from '../config'

chai.use(chaiAsPromised)
chai.use(require('chai-bignumber')())

function testMarket (markets) {
  it('should output correct market stats', async () => {
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
  })
}

describe('Market Client', function () {
  // this.timeout(config.timeout)

  describe('Total Value Locked', () => {
    testMarket(markets)
  })
})