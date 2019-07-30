import * as bitcoin from 'bitcoinjs-lib'
import BigNumber from 'bignumber.js'
import Provider from '@atomicloans/provider'
import { addressToString, sleep } from '@liquality/utils'
import networks from '@liquality/bitcoin-networks'
import {
  calculateFee
} from '@liquality/bitcoin-utils'
import {
  hash160,
  sha256
} from '@liquality/crypto'

import { version } from '../package.json'

const OPS = bitcoin.script.OPS

export default class BitcoinCollateralProvider extends Provider {
  constructor (chain = { network: networks.bitcoin }, mode = { script: 'p2sh_p2wsh', address: 'p2sh_p2wpkh' }) {
    super()
    this._network = chain.network
    if (!['p2wsh', 'p2sh_p2wsh', 'p2sh'].includes(mode.script)) {
      throw new Error('Mode must be one of p2wsh, p2sh_p2wsh, p2sh')
    }
    if (!['p2wpkh', 'p2sh_p2wpkh', 'p2pkh'].includes(mode.address)) {
      throw new Error('Mode must be one of p2wpkh, p2sh_p2wpkh, p2pkh')
    }
    this._mode = mode
    if (this._network.name === networks.bitcoin.name) {
      this._bitcoinJsNetwork = bitcoin.networks.mainnet
    } else if (this._network.name === networks.bitcoin_testnet.name) {
      this._bitcoinJsNetwork = bitcoin.networks.testnet
    } else if (this._network.name === networks.bitcoin_regtest.name) {
      this._bitcoinJsNetwork = bitcoin.networks.regtest
    }
  }

  getPubKeyHash (address) {
    // TODO: wrapped segwit addresses not supported. Not possible to derive pubkeyHash from address
    try {
      const bech32 = bitcoin.address.fromBech32(address)
      return bech32.data
    } catch (e) {
      const base58 = bitcoin.address.fromBase58Check(address)
      return base58.hash
    }
  }

  pubKeyToAddress (pubkey) {
    const network = this._bitcoinJsNetwork
    if (this._mode.address === 'p2pkh') {
      return (bitcoin.payments.p2pkh({ pubkey, network })).address
    } else if (this._mode.address === 'p2sh_p2wpkh') {
      return (bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey, network }), network })).address
    } else if (this._mode.address === 'p2wpkh') {
      console.log('test')
      return (bitcoin.payments.p2wpkh({ pubkey, network })).address
    }
  }

  getCollateralOutput (pubKeys, secretHashes, expirations, seizable) {
    const { borrowerPubKey, lenderPubKey, agentPubKey }            = pubKeys
    const { secretHashA1, secretHashA2 }                           = secretHashes
    const { secretHashB1, secretHashB2 }                           = secretHashes
    const { secretHashC1, secretHashC2 }                           = secretHashes
    const { loanExpiration, biddingExpiration, seizureExpiration } = expirations

    const borrowerPubKeyHash = hash160(borrowerPubKey)
    const lenderPubKeyHash = hash160(lenderPubKey)

    return bitcoin.script.compile([
      OPS.OP_IF,
        OPS.OP_SIZE,
        bitcoin.script.number.encode(32),
        OPS.OP_EQUAL,
        OPS.OP_SWAP,
        OPS.OP_SHA256,
        Buffer.from(secretHashB1, 'hex'),
        OPS.OP_EQUAL,
        OPS.OP_ADD,
        OPS.OP_2,
        OPS.OP_EQUAL,
        OPS.OP_SWAP,
        OPS.OP_SIZE,
        bitcoin.script.number.encode(32),
        OPS.OP_EQUAL,
        OPS.OP_SWAP,
        OPS.OP_SHA256,
        Buffer.from(secretHashC1, 'hex'),
        OPS.OP_EQUAL,
        OPS.OP_ADD,
        OPS.OP_2,
        OPS.OP_EQUAL,
        OPS.OP_ADD,
        OPS.OP_1,
        OPS.OP_GREATERTHANOREQUAL,
        OPS.OP_VERIFY,
        OPS.OP_DUP,
        OPS.OP_HASH160,
        Buffer.from(borrowerPubKeyHash, 'hex'),
        OPS.OP_EQUALVERIFY,
        OPS.OP_CHECKSIG,
      OPS.OP_ELSE,
        OPS.OP_IF,
          OPS.OP_SIZE,
          bitcoin.script.number.encode(32),
          OPS.OP_LESSTHANOREQUAL,
          OPS.OP_VERIFY,
          OPS.OP_SHA256,
          Buffer.from(secretHashA2, 'hex'),
          OPS.OP_EQUAL,
          OPS.OP_SWAP,
          OPS.OP_SIZE,
          bitcoin.script.number.encode(32),
          OPS.OP_LESSTHANOREQUAL,
          OPS.OP_VERIFY,
          OPS.OP_SHA256,
          Buffer.from(secretHashB2, 'hex'),
          OPS.OP_EQUAL,
          OPS.OP_ADD,
          OPS.OP_SWAP,
          OPS.OP_SIZE,
          bitcoin.script.number.encode(32),
          OPS.OP_LESSTHANOREQUAL,
          OPS.OP_VERIFY,
          OPS.OP_SHA256,
          Buffer.from(secretHashC2, 'hex'),
          OPS.OP_EQUAL,
          OPS.OP_ADD,
          OPS.OP_2,
          OPS.OP_GREATERTHANOREQUAL,
          OPS.OP_VERIFY,
          bitcoin.script.number.encode(loanExpiration),
          OPS.OP_CHECKLOCKTIMEVERIFY,
          OPS.OP_DROP,
          OPS.OP_2,
          Buffer.from(borrowerPubKey, 'hex'),
          Buffer.from(lenderPubKey, 'hex'),
          Buffer.from(agentPubKey, 'hex'),
          OPS.OP_3,
          OPS.OP_CHECKMULTISIG,
        OPS.OP_ELSE,
          OPS.OP_IF,
            OPS.OP_SIZE,
            bitcoin.script.number.encode(32),
            OPS.OP_EQUALVERIFY,
            OPS.OP_SHA256,
            Buffer.from(secretHashA1, 'hex'),
            OPS.OP_EQUALVERIFY,
            bitcoin.script.number.encode(biddingExpiration),
            OPS.OP_CHECKLOCKTIMEVERIFY,
            OPS.OP_DROP,
            OPS.OP_DUP,
            OPS.OP_HASH160,
            Buffer.from(lenderPubKeyHash, 'hex'),
            OPS.OP_EQUALVERIFY,
            OPS.OP_CHECKSIG,
          OPS.OP_ELSE,
            bitcoin.script.number.encode(seizureExpiration),
            OPS.OP_CHECKLOCKTIMEVERIFY,
            OPS.OP_DROP,
            OPS.OP_DUP,
            OPS.OP_HASH160,
            Buffer.from(borrowerPubKeyHash, 'hex'),
            OPS.OP_EQUALVERIFY,
            OPS.OP_CHECKSIG,
          OPS.OP_ENDIF,
        OPS.OP_ENDIF,
      OPS.OP_ENDIF
    ])
  }

  getCollateralInput (sig, pubKey, secrets, period) {
    let ifBranch
    if (period === 'loanPeriod') {
      ifBranch = [ OPS.OP_TRUE ]
    } else if (period === 'biddingPeriod') {
      ifBranch = [ OPS.OP_TRUE, OPS.OP_FALSE ]
    } else if (period === 'seizurePeriod' && requiresSecret) {
      ifBranch = [ OPS.OP_TRUE, OPS.OP_FALSE, OPS.OP_FALSE ]
    } else if (period === 'seizurePeriod' && !requiresSecret) {
      ifBranch = [ OPS.OP_FALSE, OPS.OP_FALSE ]
    } else if (period === 'refundPeriod') {
      ifBranch = [ OPS.OP_FALSE, OPS.OP_FALSE, OPS.OP_FALSE ]
    }

    let secretParams = []
    for (let secret of secrets) {
      secretParams.unshift(secret === null ? Buffer.from('00', 'hex') : Buffer.from(secret, 'hex'))
    }

    return bitcoin.script.compile([
      sig,
      pubKey,
      ...secretParams,
      ...ifBranch
    ])
  }

  getCollateralPaymentVariants (collateralOutput) {
    const p2wsh = bitcoin.payments.p2wsh({
      redeem: { output: collateralOutput, network: this._bitcoinJsNetwork },
      network: this._bitcoinJsNetwork
    })
    const p2sh_p2wsh = bitcoin.payments.p2sh({
      redeem: p2wsh, network: this._bitcoinJsNetwork
    })
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: collateralOutput, network: this._bitcoinJsNetwork },
      network: this._bitcoinJsNetwork
    })

    return { p2wsh, p2sh_p2wsh, p2sh }
  }

  async lock (values, pubKeys, secretHashes, expirations) {
    const { refundableValue, seizableValue } = values

    const refundableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)
    const seizableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)

    const refundableAddress = this.getCollateralPaymentVariants(refundableOutput)[this._mode.script].address
    const seizableAddress = this.getCollateralPaymentVariants(seizableOutput)[this._mode.script].address

    const refundableTxHash = await this.getMethod('sendTransaction')(refundableAddress, refundableValue)
    const seizableTxHash = await this.getMethod('sendTransaction')(seizableAddress, seizableValue)

    return { refundableTxHash, seizableTxHash }
  }

  async refund(txHashes, pubKeys, secret, secretHashes, expirations) {
    const { refundableTxHash, seizableTxHash } = txHashes
    const { secretHashB1, secretHashC1 } = secretHashes

    let secrets
    if      (sha256(secret) === secretHashB1) { secrets = [secret, null] }
    else if (sha256(secret) === secretHashC1) { secrets = [null, secret]}
    else                                      { throw new Error('Secret must match one of secretHashB1 or secretHashC1') }

    const refundableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)
    const seizableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)

    const refundableResult = await this._refund(refundableTxHash, refundableOutput, pubKeys, secrets, secretHashes, expirations, 'loanPeriod')
    const seizableResult = await this._refund(refundableTxHash, seizableOutput, pubKeys, secrets, secretHashes, expirations, 'loanPeriod')

    return { refundableResult, seizableResult }
  }

  async _refund (initiationTxHash, output, pubKeys, secrets, secretHashes, expirations, period) {
    const { borrowerPubKey, lenderPubKey, agentPubKey } = pubKeys
    const { loanExpiration, biddingExpiration, seizureExpiration } = expirations

    const network = this._bitcoinJsNetwork

    const pubKey = (period === 'seizurePeriod') ? lenderPubKey : borrowerPubKey
    const address = this.pubKeyToAddress(Buffer.from(pubKey, 'hex'))

    const wif = await this.getMethod('dumpPrivKey')(address)
    const wallet = bitcoin.ECPair.fromWIF(wif, network)

    const collateralPaymentVariants = this.getCollateralPaymentVariants(output)

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('decodeRawTransaction')(initiationTxRaw)

    let collateralVout
    let paymentVariantName
    let paymentVariant
    for (const voutIndex in initiationTx._raw.data.vout) {
      const vout = initiationTx._raw.data.vout[voutIndex]
      const paymentVariantEntry = Object.entries(collateralPaymentVariants).find(([, payment]) => payment.output.toString('hex') === vout.scriptPubKey.hex)
      if (paymentVariantEntry) {
        paymentVariantName = paymentVariantEntry[0]
        paymentVariant = paymentVariantEntry[1]
        collateralVout = vout
      }
    }

    // TODO: Implement proper fee calculation that counts bytes in inputs and outputs
    // TODO: use node's feePerByte
    const txfee = calculateFee(2, 2, 10)

    collateralVout.txid = initiationTxHash
    collateralVout.vSat = collateralVout.value * 1e8

    const txb = new bitcoin.TransactionBuilder(network)

    if (period === 'biddingPeriod') {
      txb.setLockTime(loanExpiration + 100)
    } else if (period === 'seizurePeriod') {
      txb.setLockTime(biddingExpiration + 100)
    } else if (period === 'refundPeriod') {
      txb.setLockTime(seizureExpiration + 100)
    }

    const prevOutScript = paymentVariant.output

    const needsWitness = paymentVariantName === 'p2wsh' || paymentVariantName === 'p2sh_p2wsh'

    txb.addInput(collateralVout.txid, collateralVout.n, 0, prevOutScript)
    txb.addOutput(addressToString(address), collateralVout.vSat - txfee)

    const tx = txb.buildIncomplete()

    let sigHash
    if (needsWitness) {
      sigHash = tx.hashForWitnessV0(0, collateralPaymentVariants.p2wsh.redeem.output, collateralVout.vSat, bitcoin.Transaction.SIGHASH_ALL) // AMOUNT NEEDS TO BE PREVOUT AMOUNT
    } else {
      sigHash = tx.hashForSignature(0, paymentVariant.redeem.output, bitcoin.Transaction.SIGHASH_ALL)
    }

    const sig = bitcoin.script.signature.encode(wallet.sign(sigHash), bitcoin.Transaction.SIGHASH_ALL)
    const collateralInput = this.getCollateralInput(sig, pubKey, secrets, period)
    const paymentParams = { redeem: { output: output, input: collateralInput, network }, network }
    const paymentWithInput = needsWitness
      ? bitcoin.payments.p2wsh(paymentParams)
      : bitcoin.payments.p2sh(paymentParams)

    if (needsWitness) {
      tx.setWitness(0, paymentWithInput.witness)
    }

    if (paymentVariantName === 'p2sh_p2wsh') {
      // Adds the necessary push OP (PUSH34 (00 + witness script hash))
      const inputScript = bitcoin.script.compile([collateralPaymentVariants.p2sh_p2wsh.redeem.output])
      tx.setInputScript(0, inputScript)
    } else if (paymentVariantName === 'p2sh') {
      tx.setInputScript(0, paymentWithInput.input)
    }

    return this.getMethod('sendRawTransaction')(tx.toHex())
  }
}

BitcoinCollateralProvider.version = version
