/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { chains, getUnusedPubKey, getCollateralParams } from '../common'
import config from '../config'
import { hash160 } from '@liquality/crypto'
import { pubKeyToAddress } from '@liquality/bitcoin-utils'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

chai.use(chaiAsPromised)
chai.use(require('chai-bignumber')())

function testCollateral (chain) {
  it('Sent value to 1 address', async () => {
    const colParams = await getCollateralParams(chain)
    const lockParams = [colParams.values, colParams.pubKeys, colParams.secretHashes, colParams.expirations]

    const txId = await chain.client.loan.collateral.lock(...lockParams)

    const { refundableTxHash, seizableTxHash } = txId

    console.log('txId', txId)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const refundParams = [txId, colParams.pubKeys, colParams.secrets.secretB1, colParams.secretHashes, colParams.expirations]

    const txId2 = await chain.client.loan.collateral.refund(...refundParams)

    console.log('txId2', txId2)

    expect(true).to.equal(true)
  })
}

describe('Collateral Flow', function () {
  this.timeout(config.timeout)

  describe('Bitcoin - Node', () => {
    testCollateral(chains.bitcoinWithNode)
  })
})