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
  it('should lock collateral, liquidate by multisigsend to collateral swap and claim by liquidator', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'approveExpiration')

    const swapSecretHashes = {
      secretHashA1: colParams.secretHashes.secretHashA2,
      secretHashB1: colParams.secretHashes.secretHashB2,
      secretHashC1: colParams.secretHashes.secretHashC2,
      secretHashD1: colParams.secretHashes.secretHashD1
    }

    const swapParams = [colParams.pubKeys, swapSecretHashes, colParams.expirations]
    const lockAddresses = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams)

    const outputs = [{ address: lockAddresses.refundableAddress }, { address: lockAddresses.seizableAddress }]

    const multisigBorrowerParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'borrower', outputs]
    const borrowerSigs = await chain.client.loan.collateral.multisigSign(...multisigBorrowerParams)

    const multisigParamsLender = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'lender', outputs]
    const lenderSigs = await chain.client.loan.collateral.multisigSign(...multisigParamsLender)

    const sigs = {
      refundable: [Buffer.from(borrowerSigs.refundableSig, 'hex'), Buffer.from(lenderSigs.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs.seizableSig, 'hex'), Buffer.from(lenderSigs.seizableSig, 'hex')]
    }

    const multisigSendTxHash = await chain.client.loan.collateral.multisigSend(lockTxHash, sigs, colParams.pubKeys, colParams.secretHashes, colParams.expirations, outputs)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const secrets = [colParams.secrets.secretB2, colParams.secrets.secretC2, colParams.secrets.secretD1]
    const claimParams = [multisigSendTxHash, colParams.pubKeys, secrets, swapSecretHashes, colParams.expirations]

    const claimTxHash = await chain.client.loan.collateralSwap.claim(...claimParams)
  })
}

async function lockCollateral (chain, customExpiration) {
  let colParams = await getCollateralParams(chain)
  const lockParams = [colParams.values, colParams.pubKeys, colParams.secretHashes, colParams.expirations]

  if (customExpiration) {
    const curTimeExpiration = Math.floor((new Date()).getTime() / 1000) - 1000
    colParams.expirations[customExpiration] = curTimeExpiration
  }

  const lockTxHash = await chain.client.loan.collateral.lock(...lockParams)
  await chains.bitcoinWithNode.client.chain.generateBlock(1)

  return { lockTxHash, colParams }
}

function getVinRedeemScript (vin) {
  if (vin.txinwitness == undefined) {
    return vin.scriptSig.hex
  } else {
    return vin.txinwitness
  }
}

describe('Collateral Liquidation Flow', function () {
  this.timeout(config.timeout)

  describe('Bitcoin - Node', () => {
    testCollateral(chains.bitcoinWithNode)
  })
})