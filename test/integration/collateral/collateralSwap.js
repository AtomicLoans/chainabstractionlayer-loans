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
  it('should allow locking and claiming', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain)

    const secrets = [colParams.secrets.secretB1, colParams.secrets.secretC1, colParams.secrets.secretD1]
    const refundParams = [lockTxHash, colParams.pubKeys, secrets, colParams.secretHashes, colParams.expirations]

    const refundTxHash = await chain.client.loan.collateralSwap.refund(...refundParams)
    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const refundTxRaw = await chain.client.getMethod('getRawTransactionByHash')(refundTxHash)
    const refundTx = await chain.client.getMethod('decodeRawTransaction')(refundTxRaw)

    const refundVouts = refundTx._raw.data.vout
    const refundVins = refundTx._raw.data.vin

    expect(refundVins.length).to.equal(2)
    expect(refundVouts.length).to.equal(1)

    expect(getVinRedeemScript(refundVins[0]).includes(colParams.secrets.secretB1)).to.equal(true)
    expect(getVinRedeemScript(refundVins[1]).includes(colParams.secrets.secretB1)).to.equal(true)
  })

  it('should allow multisig signing', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'swapExpiration')

    const to = await chain.client.getMethod('getNewAddress')('p2sh-segwit')
    const multisigParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'borrower', to]
    const { refundableSig, seizableSig } = await chain.client.loan.collateralSwap.multisigSign(...multisigParams)

    expect(refundableSig.startsWith('30')).to.equal(true)
    expect(seizableSig.startsWith('30')).to.equal(true)

    expect(71 <= Buffer.from(refundableSig, 'hex').length <= 72).to.equal(true)
    expect(71 <= Buffer.from(seizableSig, 'hex').length <= 72).to.equal(true)
  })

  it('should allow multisig signing and sending', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'swapExpiration')

    const to = await chain.client.getMethod('getNewAddress')('p2sh-segwit')

    const balBefore = await chain.client.getMethod('getBalance')(to)
    console.log('balBefore')

    const multisigBorrowerParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'borrower', to]
    const borrowerSigs = await chain.client.loan.collateralSwap.multisigSign(...multisigBorrowerParams)

    const multisigParamsLender = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'lender', to]
    const lenderSigs = await chain.client.loan.collateralSwap.multisigSign(...multisigParamsLender)

    const sigs = {
      refundable: [Buffer.from(borrowerSigs.refundableSig, 'hex'), Buffer.from(lenderSigs.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs.seizableSig, 'hex'), Buffer.from(lenderSigs.seizableSig, 'hex')]
    }

    const multisigSendTxHash = await chain.client.loan.collateralSwap.multisigSend(lockTxHash, sigs, colParams.pubKeys, colParams.secretHashes, colParams.expirations, to)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const multisigSendTxRaw = await chain.client.getMethod('getRawTransactionByHash')(multisigSendTxHash)
    const multisigSendTx = await chain.client.getMethod('decodeRawTransaction')(multisigSendTxRaw)

    const multisigSendVouts = multisigSendTx._raw.data.vout
    const multisigSendVins = multisigSendTx._raw.data.vin

    expect(multisigSendVins.length).to.equal(2)
    expect(multisigSendVouts.length).to.equal(1)
  })

  it('should allow multisig signing and sending', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'swapExpiration')

    const to = await chain.client.getMethod('getNewAddress')('p2sh-segwit')

    const multisigBorrowerParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'borrower', to]
    const borrowerSigs = await chain.client.loan.collateralSwap.multisigSign(...multisigBorrowerParams)

    const multisigParamsLender = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations, 'lender', to]
    const lenderSigs = await chain.client.loan.collateralSwap.multisigSign(...multisigParamsLender)

    const sigs = {
      refundable: [Buffer.from(borrowerSigs.refundableSig, 'hex'), Buffer.from(lenderSigs.refundableSig, 'hex')],
      seizable: [Buffer.from(borrowerSigs.seizableSig, 'hex'), Buffer.from(lenderSigs.seizableSig, 'hex')]
    }

    const multisigSendTxHash = await chain.client.loan.collateralSwap.multisigSend(lockTxHash, sigs, colParams.pubKeys, colParams.secretHashes, colParams.expirations, to)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const multisigSendTxRaw = await chain.client.getMethod('getRawTransactionByHash')(multisigSendTxHash)
    const multisigSendTx = await chain.client.getMethod('decodeRawTransaction')(multisigSendTxRaw)

    const multisigSendVouts = multisigSendTx._raw.data.vout
    const multisigSendVins = multisigSendTx._raw.data.vin

    expect(multisigSendVins.length).to.equal(2)
    expect(multisigSendVouts.length).to.equal(1)
  })

  it('should allow seizure', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'biddingExpiration')

    const seizeParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations]
    const seizeTxHash = await chain.client.loan.collateralSwap.seize(...seizeParams)

    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const seizeTxRaw = await chain.client.getMethod('getRawTransactionByHash')(seizeTxHash)
    const seizeTx = await chain.client.getMethod('decodeRawTransaction')(seizeTxRaw)

    const seizeVouts = seizeTx._raw.data.vout
    const seizeVins = seizeTx._raw.data.vin

    expect(seizeVins.length).to.equal(1)
    expect(seizeVouts.length).to.equal(1)
  })

  it('should allow reclaiming of refundable collateral', async () => {
    const { lockTxHash, colParams } = await lockCollateral(chain, 'biddingExpiration')

    const reclaimOneParams = [lockTxHash, colParams.pubKeys, colParams.secretHashes, colParams.expirations]
    const reclaimTx = await chain.client.loan.collateralSwap.reclaimOne(...reclaimOneParams)
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

  const lockTxHash = await chain.client.loan.collateralSwap.lock(...lockParams)
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

describe('Collateral Flow', function () {
  this.timeout(config.timeout)

  describe('Bitcoin - Node', () => {
    testCollateral(chains.bitcoinNodeCollateralSwap)
  })
})