/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { chains } from '../common'
import config from '../config'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

chai.use(chaiAsPromised)
chai.use(require('chai-bignumber')())

function testTransaction (chain) {
  it('Sent value to 1 address', async () => {
    const addr = (await chain.client.wallet.getUnusedAddress()).address
    console.log(addr)
    const value = config[chain.name].value

    const balBefore = await chain.client.chain.getBalance(addr)
    await chain.client.chain.sendTransaction(addr, value)
    await chains.bitcoinWithNode.client.chain.generateBlock(1)
    const balAfter = await chain.client.chain.getBalance(addr)

    expect(balBefore.plus(value).toString()).to.equal(balAfter.toString())
  })
}

describe('Send Transactions', function () {
  this.timeout(config.timeout)

  describe('Bitcoin - Ledger', () => {
    testTransaction(chains.bitcoinWithLedger)
  })
})
