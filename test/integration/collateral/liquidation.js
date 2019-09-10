/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { chains, getUnusedPubKey, getCollateralParams, importBitcoinAddresses, fundUnusedBitcoinAddress } from '../common'
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

  it('should lock collateral, liquidate by multisigsend to collateral swap and claim by liquidator', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'approveExpiration')

    const swapSecretHashes = {
      secretHashA1: colParams.secretHashes.secretHashA2,
      secretHashB1: colParams.secretHashes.secretHashB2,
      secretHashC1: colParams.secretHashes.secretHashC2,
      secretHashD1: colParams.secretHashes.secretHashD1
    }

    const curTimeExpiration = Math.floor((new Date()).getTime() / 1000) - 1000
    colParams.expirations.swapExpiration = curTimeExpiration

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

    const swapSecretHashes2 = {
      secretHashA1: colParams.secretHashes.secretHashA3,
      secretHashB1: colParams.secretHashes.secretHashB3,
      secretHashC1: colParams.secretHashes.secretHashC3,
      secretHashD1: colParams.secretHashes.secretHashD2
    }

    const swapParams2 = [colParams.pubKeys, swapSecretHashes2, colParams.expirations]
    const lockAddresses2 = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams2)

    const outputs2 = [{ address: lockAddresses2.refundableAddress }, { address: lockAddresses2.seizableAddress }]

    const multisigBorrowerParams2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'borrower', outputs2]
    const borrowerSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigBorrowerParams2)

    const multisigParamsLender2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'lender', outputs2]
    const lenderSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigParamsLender2)

    const sigs2 = {
      refundable: [Buffer.from(borrowerSigs2.refundableSig, 'hex'), Buffer.from(lenderSigs2.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs2.seizableSig, 'hex'), Buffer.from(lenderSigs2.seizableSig, 'hex')]
    }

    const multisigMoveTxHash = await chain.client.loan.collateralSwap.multisigMove(multisigSendTxHash, sigs2, colParams.pubKeys, swapSecretHashes, colParams.expirations, outputs2)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const secrets2 = [colParams.secrets.secretB3, colParams.secrets.secretC3, colParams.secrets.secretD2]
    const claimParams = [multisigMoveTxHash, colParams.pubKeys, secrets2, swapSecretHashes2, colParams.expirations]

    const claimTxHash2 = await chain.client.loan.collateralSwap.claim(...claimParams)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)
  })

  it('should lock collateral, attempt liquidation with multisig send, attempt liquidation twice more with multisigmove and finally claim', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'approveExpiration')

    const swapSecretHashes = {
      secretHashA1: colParams.secretHashes.secretHashA2,
      secretHashB1: colParams.secretHashes.secretHashB2,
      secretHashC1: colParams.secretHashes.secretHashC2,
      secretHashD1: colParams.secretHashes.secretHashD1
    }

    const curTimeExpiration = Math.floor((new Date()).getTime() / 1000) - 1000
    colParams.expirations.swapExpiration = curTimeExpiration

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

    const swapSecretHashes2 = {
      secretHashA1: colParams.secretHashes.secretHashA3,
      secretHashB1: colParams.secretHashes.secretHashB3,
      secretHashC1: colParams.secretHashes.secretHashC3,
      secretHashD1: colParams.secretHashes.secretHashD2
    }

    const swapParams2 = [colParams.pubKeys, swapSecretHashes2, colParams.expirations]
    const lockAddresses2 = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams2)

    const outputs2 = [{ address: lockAddresses2.refundableAddress }, { address: lockAddresses2.seizableAddress }]

    const multisigBorrowerParams2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'borrower', outputs2]
    const borrowerSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigBorrowerParams2)

    const multisigParamsLender2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'lender', outputs2]
    const lenderSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigParamsLender2)

    const sigs2 = {
      refundable: [Buffer.from(borrowerSigs2.refundableSig, 'hex'), Buffer.from(lenderSigs2.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs2.seizableSig, 'hex'), Buffer.from(lenderSigs2.seizableSig, 'hex')]
    }

    const multisigMoveTxHash = await chain.client.loan.collateralSwap.multisigMove(multisigSendTxHash, sigs2, colParams.pubKeys, swapSecretHashes, colParams.expirations, outputs2)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const swapSecretHashes3 = {
      secretHashA1: colParams.secretHashes.secretHashA4,
      secretHashB1: colParams.secretHashes.secretHashB4,
      secretHashC1: colParams.secretHashes.secretHashC4,
      secretHashD1: colParams.secretHashes.secretHashD3
    }

    const swapParams3 = [colParams.pubKeys, swapSecretHashes3, colParams.expirations]
    const lockAddresses3 = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams3)

    const outputs3 = [{ address: lockAddresses3.refundableAddress }, { address: lockAddresses3.seizableAddress }]

    const multisigBorrowerParams3 = [multisigMoveTxHash, colParams.pubKeys, swapSecretHashes2, colParams.expirations, 'borrower', outputs3]
    const borrowerSigs3 = await chain.client.loan.collateralSwap.multisigWrite(...multisigBorrowerParams3)

    const multisigParamsLender3 = [multisigMoveTxHash, colParams.pubKeys, swapSecretHashes2, colParams.expirations, 'lender', outputs3]
    const lenderSigs3 = await chain.client.loan.collateralSwap.multisigWrite(...multisigParamsLender3)

    const sigs3 = {
      refundable: [Buffer.from(borrowerSigs3.refundableSig, 'hex'), Buffer.from(lenderSigs3.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs3.seizableSig, 'hex'), Buffer.from(lenderSigs3.seizableSig, 'hex')]
    }

    const multisigMoveTxHash2 = await chain.client.loan.collateralSwap.multisigMove(multisigMoveTxHash, sigs3, colParams.pubKeys, swapSecretHashes2, colParams.expirations, outputs3)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const secrets2 = [colParams.secrets.secretB4, colParams.secrets.secretC4, colParams.secrets.secretD3]
    const claimParams = [multisigMoveTxHash2, colParams.pubKeys, secrets2, swapSecretHashes3, colParams.expirations]

    const claimTxHash2 = await chain.client.loan.collateralSwap.claim(...claimParams)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)
  })

  it('should lock collateral, attempt liquidation with multisig send, attempt liquidation twice more with multisigmove and finally snatch/regain', async () => {
    let colParams = await getCollateralParams(chain)
    const lockParams = [colParams.values, colParams.pubKeys, colParams.secretHashes, colParams.expirations]

    const curTimeExpiration = Math.floor((new Date()).getTime() / 1000) - 1000
    colParams.expirations.approveExpiration = curTimeExpiration
    colParams.expirations.liquidationExpiration = curTimeExpiration
    colParams.expirations.swapExpiration = curTimeExpiration

    const lockTxHash = await chain.client.loan.collateral.lock(...lockParams)
    await chains.bitcoinWithNode.client.chain.generateBlock(1)

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

    const swapSecretHashes2 = {
      secretHashA1: colParams.secretHashes.secretHashA3,
      secretHashB1: colParams.secretHashes.secretHashB3,
      secretHashC1: colParams.secretHashes.secretHashC3,
      secretHashD1: colParams.secretHashes.secretHashD2
    }

    const swapParams2 = [colParams.pubKeys, swapSecretHashes2, colParams.expirations]
    const lockAddresses2 = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams2)

    const outputs2 = [{ address: lockAddresses2.refundableAddress }, { address: lockAddresses2.seizableAddress }]

    const multisigBorrowerParams2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'borrower', outputs2]
    const borrowerSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigBorrowerParams2)

    const multisigParamsLender2 = [multisigSendTxHash, colParams.pubKeys, swapSecretHashes, colParams.expirations, 'lender', outputs2]
    const lenderSigs2 = await chain.client.loan.collateralSwap.multisigWrite(...multisigParamsLender2)

    const sigs2 = {
      refundable: [Buffer.from(borrowerSigs2.refundableSig, 'hex'), Buffer.from(lenderSigs2.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs2.seizableSig, 'hex'), Buffer.from(lenderSigs2.seizableSig, 'hex')]
    }

    const multisigMoveTxHash = await chain.client.loan.collateralSwap.multisigMove(multisigSendTxHash, sigs2, colParams.pubKeys, swapSecretHashes, colParams.expirations, outputs2)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const swapSecretHashes3 = {
      secretHashA1: colParams.secretHashes.secretHashA4,
      secretHashB1: colParams.secretHashes.secretHashB4,
      secretHashC1: colParams.secretHashes.secretHashC4,
      secretHashD1: colParams.secretHashes.secretHashD3
    }

    const swapParams3 = [colParams.pubKeys, swapSecretHashes3, colParams.expirations]
    const lockAddresses3 = await chain.client.loan.collateralSwap.getInitAddresses(...swapParams3)

    const outputs3 = [{ address: lockAddresses3.refundableAddress }, { address: lockAddresses3.seizableAddress }]

    const multisigBorrowerParams3 = [multisigMoveTxHash, colParams.pubKeys, swapSecretHashes2, colParams.expirations, 'borrower', outputs3]
    const borrowerSigs3 = await chain.client.loan.collateralSwap.multisigWrite(...multisigBorrowerParams3)

    const multisigParamsLender3 = [multisigMoveTxHash, colParams.pubKeys, swapSecretHashes2, colParams.expirations, 'lender', outputs3]
    const lenderSigs3 = await chain.client.loan.collateralSwap.multisigWrite(...multisigParamsLender3)

    const sigs3 = {
      refundable: [Buffer.from(borrowerSigs3.refundableSig, 'hex'), Buffer.from(lenderSigs3.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs3.seizableSig, 'hex'), Buffer.from(lenderSigs3.seizableSig, 'hex')]
    }

    const multisigMoveTxHash2 = await chain.client.loan.collateralSwap.multisigMove(multisigMoveTxHash, sigs3, colParams.pubKeys, swapSecretHashes2, colParams.expirations, outputs3)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const recoverParams = [multisigMoveTxHash2, colParams.pubKeys, swapSecretHashes3, colParams.expirations]

    const snatchTxHash = await chain.client.loan.collateralSwap.snatch(...recoverParams)

    const regainTxHash = await chain.client.loan.collateralSwap.regain(...recoverParams)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)
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

  describe('Bitcoin - Ledger', () => {
    before(async function () { await importBitcoinAddresses(chains.bitcoinWithLedger) })
    beforeEach(async function () { await fundUnusedBitcoinAddress(chains.bitcoinWithLedger) })
    testCollateral(chains.bitcoinWithLedger)
  })

  describe('Bitcoin - Node', () => {
    testCollateral(chains.bitcoinWithNode)
  })

  describe('Bitcoin - Js', () => {
    before(async function () { await importBitcoinAddresses(chains.bitcoinWithJs) })
    beforeEach(async function () { await fundUnusedBitcoinAddress(chains.bitcoinWithJs) })
    testCollateral(chains.bitcoinWithJs)
  })
})
