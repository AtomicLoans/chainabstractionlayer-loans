import * as bitcoin from 'bitcoinjs-lib'
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

console.warn = () => {} // Silence the Deprecation Warning

export default class BitcoinCollateralProvider extends Provider {
  constructor (chain = { network: networks.bitcoin }, mode = { script: 'p2wsh', address: 'p2wpkh' }) {
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
      return (bitcoin.payments.p2wpkh({ pubkey, network })).address
    }
  }

  getCollateralOutput (pubKeys, secretHashes, expirations, seizable) {
    const { borrowerPubKey, lenderPubKey, arbiterPubKey }            = pubKeys
    const { secretHashA1 }                                         = secretHashes
    const { secretHashB1 }                                         = secretHashes
    const { secretHashC1 }                                         = secretHashes
    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations

    const borrowerPubKeyHash = hash160(borrowerPubKey)
    const lenderPubKeyHash = hash160(lenderPubKey)

    const seizablePubKeyHash = seizable ? lenderPubKeyHash : borrowerPubKeyHash

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
          bitcoin.script.number.encode(approveExpiration),
          OPS.OP_CHECKLOCKTIMEVERIFY,
          OPS.OP_DROP,
          OPS.OP_2,
          Buffer.from(borrowerPubKey, 'hex'),
          Buffer.from(lenderPubKey, 'hex'),
          Buffer.from(arbiterPubKey, 'hex'),
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
            bitcoin.script.number.encode(liquidationExpiration),
            OPS.OP_CHECKLOCKTIMEVERIFY,
            OPS.OP_DROP,
            OPS.OP_DUP,
            OPS.OP_HASH160,
            Buffer.from(seizablePubKeyHash, 'hex'),
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

  getCollateralInput (sigs, period, secrets, pubKey) {
    if (!Array.isArray(sigs)) { sigs = [sigs]}

    let ifBranch
    if (period === 'loanPeriod') {
      ifBranch = [ OPS.OP_TRUE ]
    } else if (period === 'liquidationPeriod') {
      ifBranch = [ OPS.OP_TRUE, OPS.OP_FALSE ]
    } else if (period === 'seizurePeriod') {
      ifBranch = [ OPS.OP_TRUE, OPS.OP_FALSE, OPS.OP_FALSE ]
    } else if (period === 'refundPeriod') {
      ifBranch = [ OPS.OP_FALSE, OPS.OP_FALSE, OPS.OP_FALSE ]
    }

    let secretParams = []
    for (let secret of secrets) {
      secretParams.unshift(secret === null ? OPS.OP_FALSE : Buffer.from(secret, 'hex'))
    }

    const pubKeyParam = pubKey === null ? [] : [Buffer.from(pubKey, 'hex')]
    const multisigParams = period === 'liquidationPeriod' ? [OPS.OP_0] : []

    return bitcoin.script.compile([
      ...multisigParams,
      ...sigs,
      ...pubKeyParam,
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

    const refundableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)
    const seizableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)

    const refundableAddress = this.getCollateralPaymentVariants(refundableOutput)[this._mode.script].address
    const seizableAddress = this.getCollateralPaymentVariants(seizableOutput)[this._mode.script].address

    return this.getMethod('sendBatchTransaction')([
      { to: refundableAddress, value: refundableValue },
      { to: seizableAddress, value: seizableValue }
    ])
  }

  async getLockAddresses (pubKeys, secretHashes, expirations) {
    const refundableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)
    const seizableOutput = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)

    const refundableAddress = this.getCollateralPaymentVariants(refundableOutput)[this._mode.script].address
    const seizableAddress = this.getCollateralPaymentVariants(seizableOutput)[this._mode.script].address

    return { refundableAddress, seizableAddress }
  }

  async refund(txHash, pubKeys, secret, secretHashes, expirations) {
    const { secretHashB1, secretHashC1 } = secretHashes

    let secrets
    if      (sha256(secret) === secretHashB1) { secrets = [secret, null] }
    else if (sha256(secret) === secretHashC1) { secrets = [null, secret]}
    else                                      { throw new Error('Secret must match one of secretHashB1 or secretHashC1') }

    return this._refundAll(txHash, pubKeys, secrets, secretHashes, expirations, 'loanPeriod')
  }

  async multisigSign (txHash, pubKeys, secretHashes, expirations, party, outputs) {
    return this._multisigSign(txHash, pubKeys, secretHashes, expirations, party, outputs)
  }

  async multisigSend (txHash, sigs, pubKeys, secretHashes, expirations, outputs) {
    return this._multisigSend(txHash, sigs, pubKeys, secretHashes, expirations, outputs)
  }

  async seize (txHash, pubKeys, secret, secretHashes, expirations) {
    const secrets = [secret]
    return this._refundOne(txHash, pubKeys, secrets, secretHashes, expirations, 'seizurePeriod', true)
  }

  async reclaimOne (txHash, pubKeys, secretHashes, expirations, seizable) {
    const secrets = []
    return this._refundOne(txHash, pubKeys, secrets, secretHashes, expirations, 'refundPeriod', seizable)
  }

  async reclaimAll (txHash, pubKeys, secretHashes, expirations) {
    const secrets = []
    return this._refundAll(txHash, pubKeys, secrets, secretHashes, expirations, 'refundPeriod')
  }

  async _refundOne (initiationTxHash, pubKeys, secrets, secretHashes, expirations, period, seizable) {
    const { borrowerPubKey, lenderPubKey, arbiterPubKey } = pubKeys
    const network = this._bitcoinJsNetwork
    const pubKey = (period === 'seizurePeriod') ? lenderPubKey : borrowerPubKey
    const address = this.pubKeyToAddress(Buffer.from(pubKey, 'hex'))

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('decodeRawTransaction')(initiationTxRaw)

    let col = {} // Collateral Object

    col.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, seizable)
    col.colPaymentVariants = this.getCollateralPaymentVariants(col.output)
    this.setPaymentVariants(initiationTx, col)
    col.colVout.txid = initiationTxHash

    const tx = this.buildColTx(period, col, expirations, address)

    const index = seizable ? 1 : 0
    const colSig = await this.createSig(initiationTxRaw, tx, address, col, expirations, period, index)

    col.colInput = this.getCollateralInput(colSig, period, secrets, pubKey)

    this.setHashForSigOrWit(tx, col, 0)
    this.finalizeTx(tx, col, 0)

    return this.getMethod('sendRawTransaction')(tx.toHex())
  }

  async _refundAll (initiationTxHash, pubKeys, secrets, secretHashes, expirations, period) {
    const { borrowerPubKey, lenderPubKey, arbiterPubKey } = pubKeys
    const network = this._bitcoinJsNetwork
    const pubKey = (period === 'seizurePeriod') ? lenderPubKey : borrowerPubKey
    const address = this.pubKeyToAddress(Buffer.from(pubKey, 'hex'))

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('decodeRawTransaction')(initiationTxRaw)

    let ref = {} // Refundable Object
    let sei = {} // Seizable Object

    ref.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)
    sei.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)

    ref.colPaymentVariants = this.getCollateralPaymentVariants(ref.output)
    sei.colPaymentVariants = this.getCollateralPaymentVariants(sei.output)

    this.setPaymentVariants(initiationTx, ref)
    this.setPaymentVariants(initiationTx, sei)

    ref.colVout.txid = initiationTxHash
    sei.colVout.txid = initiationTxHash

    const tx = this.buildFullColTx(period, ref, sei, expirations, address)

    const { refundableSig, seizableSig } = await this.createSigs(initiationTxRaw, tx, address, ref, sei, expirations, period)

    ref.colInput = this.getCollateralInput(refundableSig, period, secrets, pubKey)
    sei.colInput = this.getCollateralInput(seizableSig, period, secrets, pubKey)

    this.setHashForSigOrWit(tx, ref, 0)
    this.setHashForSigOrWit(tx, sei, 1)

    this.finalizeTx(tx, ref, 0)
    this.finalizeTx(tx, sei, 1)

    return this.getMethod('sendRawTransaction')(tx.toHex())
  }

  async _multisigSign (initiationTxHash, pubKeys, secretHashes, expirations, party, outputs) {
    const { borrowerPubKey, lenderPubKey, arbiterPubKey } = pubKeys
    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations
    const period = 'liquidationPeriod'
    const network = this._bitcoinJsNetwork

    const pubKey = party === 'lender' ? lenderPubKey : party === 'borrower' ? borrowerPubKey : arbiterPubKey
    const address = this.pubKeyToAddress(Buffer.from(pubKey, 'hex'))

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('decodeRawTransaction')(initiationTxRaw)

    let ref = {} // Refundable Object
    let sei = {} // Seizable Object

    ref.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)
    sei.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)

    ref.colPaymentVariants = this.getCollateralPaymentVariants(ref.output)
    sei.colPaymentVariants = this.getCollateralPaymentVariants(sei.output)

    this.setPaymentVariants(initiationTx, ref)
    this.setPaymentVariants(initiationTx, sei)

    ref.colVout.txid = initiationTxHash
    sei.colVout.txid = initiationTxHash

    const tx = this.buildFullColTx(period, ref, sei, expirations, outputs)

    this.setHashForSigOrWit(tx, ref, 0)
    this.setHashForSigOrWit(tx, sei, 1)

    return this.createSigs(initiationTxRaw, tx, address, ref, sei, expirations, period)
  }

  async _multisigSend (initiationTxHash, sigs, pubKeys, secretHashes, expirations, outputs) {
    const { borrowerPubKey, lenderPubKey, arbiterPubKey } = pubKeys
    const period = 'liquidationPeriod'
    const network = this._bitcoinJsNetwork

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('decodeRawTransaction')(initiationTxRaw)

    let ref = {} // Refundable Object
    let sei = {} // Seizable Object

    ref.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, false)
    sei.output = this.getCollateralOutput(pubKeys, secretHashes, expirations, true)

    ref.colPaymentVariants = this.getCollateralPaymentVariants(ref.output)
    sei.colPaymentVariants = this.getCollateralPaymentVariants(sei.output)

    this.setPaymentVariants(initiationTx, ref)
    this.setPaymentVariants(initiationTx, sei)

    ref.colVout.txid = initiationTxHash
    sei.colVout.txid = initiationTxHash

    const tx = this.buildFullColTx(period, ref, sei, expirations, outputs)

    this.setHashForSigOrWit(tx, ref, 0)
    this.setHashForSigOrWit(tx, sei, 1)

    ref.colInput = this.getCollateralInput(sigs.refundable, period, [], null)
    sei.colInput = this.getCollateralInput(sigs.seizable, period, [], null)

    this.finalizeTx(tx, ref, 0)
    this.finalizeTx(tx, sei, 1)

    return this.getMethod('sendRawTransaction')(tx.toHex())
  }

  setPaymentVariants (initiationTx, col) {
    for (const voutIndex in initiationTx._raw.data.vout) {
      const vout = initiationTx._raw.data.vout[voutIndex]
      const paymentVariantEntry = Object.entries(col.colPaymentVariants).find(([, payment]) => payment.output.toString('hex') === vout.scriptPubKey.hex)
      if (paymentVariantEntry) {
        col.paymentVariantName = paymentVariantEntry[0]
        col.paymentVariant = paymentVariantEntry[1]
        col.colVout = vout
      }
    }
  }

  buildColTx (period, col, expirations, to) {
    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations
    const network = this._bitcoinJsNetwork

    col.colVout.vSat = Math.floor(col.colVout.value * 1e8)

    const txb = new bitcoin.TransactionBuilder(network)

    if (period === 'liquidationPeriod') {
      txb.setLockTime(approveExpiration)
    } else if (period === 'seizurePeriod') {
      txb.setLockTime(liquidationExpiration)
    } else if (period === 'refundPeriod') {
      txb.setLockTime(seizureExpiration)
    }

    col.prevOutScript = col.paymentVariant.output

    // TODO: Implement proper fee calculation that counts bytes in inputs and outputs
    // TODO: use node's feePerByte
    const txfee = calculateFee(6, 6, 14)

    txb.addInput(col.colVout.txid, col.colVout.n, 0, col.prevOutScript)
    txb.addOutput(addressToString(to), col.colVout.vSat - txfee)

    return txb.buildIncomplete()
  }

  buildFullColTx (period, ref, sei, expirations, outputs) {
    if (!Array.isArray(outputs)) { outputs = [{ address: outputs }] }

    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations
    const network = this._bitcoinJsNetwork

    ref.colVout.vSat = Math.floor(ref.colVout.value * 1e8)
    sei.colVout.vSat = Math.floor(sei.colVout.value * 1e8)

    const txb = new bitcoin.TransactionBuilder(network)

    if (period === 'liquidationPeriod') {
      txb.setLockTime(parseInt(approveExpiration))
    } else if (period === 'seizurePeriod') {
      txb.setLockTime(parseInt(liquidationExpiration))
    } else if (period === 'refundPeriod') {
      txb.setLockTime(parseInt(seizureExpiration))
    }

    ref.prevOutScript = ref.paymentVariant.output
    sei.prevOutScript = sei.paymentVariant.output

    // TODO: Implement proper fee calculation that counts bytes in inputs and outputs
    // TODO: use node's feePerByte
    const txfee = calculateFee(6, 6, 14)

    txb.addInput(ref.colVout.txid, ref.colVout.n, 0, ref.prevOutScript)
    txb.addInput(sei.colVout.txid, sei.colVout.n, 0, sei.prevOutScript)

    if (outputs.length === 1) {
      txb.addOutput(addressToString(outputs[0].address), ref.colVout.vSat + sei.colVout.vSat - txfee)
    } else if (outputs.length === 2) {
      txb.addOutput(addressToString(outputs[0].address), outputs[0].value === undefined ? ref.colVout.vSat - (txfee / 2) : outputs[0].value)
      txb.addOutput(addressToString(outputs[1].address), outputs[1].value === undefined ? sei.colVout.vSat - (txfee / 2) : outputs[1].value)
    }

    return txb.buildIncomplete()
  }

  setHashForSigOrWit (tx, col, i) {
    const network = this._bitcoinJsNetwork
    const needsWitness = col.paymentVariantName === 'p2wsh' || col.paymentVariantName === 'p2sh_p2wsh'

    if (needsWitness) {
      col.sigHash = tx.hashForWitnessV0(i, col.colPaymentVariants.p2wsh.redeem.output, col.colVout.vSat, bitcoin.Transaction.SIGHASH_ALL) // AMOUNT NEEDS TO BE PREVOUT AMOUNT
    } else {
      col.sigHash = tx.hashForSignature(i, col.paymentVariant.redeem.output, bitcoin.Transaction.SIGHASH_ALL)
    }
  }

  async createSig (initiationTxRaw, tx, address, col, expirations, period, index = 0) {
    const isSegwit = col.paymentVariantName === 'p2wsh' || col.paymentVariantName === 'p2sh_p2wsh'

    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations

    let lockTime = 0
    if (period === 'liquidationPeriod') {
      lockTime = approveExpiration
    } else if (period === 'seizurePeriod') {
      lockTime = liquidationExpiration
    } else if (period === 'refundPeriod') {
      lockTime = seizureExpiration
    }

    return this.getMethod('signP2SHTransaction')(
      initiationTxRaw, // TODO: Why raw? can't it be a bitcoinjs-lib TX like the next one?
      tx,
      address,
      col.colVout,
      isSegwit ? col.colPaymentVariants.p2wsh.redeem.output : col.colPaymentVariants.p2sh.redeem.output,
      lockTime,
      isSegwit,
      index
    )
  }

  async createSigs (initiationTxRaw, tx, address, ref, sei, expirations, period) {
    const isSegwit = ref.paymentVariantName === 'p2wsh' || ref.paymentVariantName === 'p2sh_p2wsh'

    const { approveExpiration, liquidationExpiration, seizureExpiration } = expirations

    let lockTime = 0
    if (period === 'liquidationPeriod') {
      lockTime = approveExpiration
    } else if (period === 'seizurePeriod') {
      lockTime = liquidationExpiration
    } else if (period === 'refundPeriod') {
      lockTime = seizureExpiration
    }

    const refOutputScript = isSegwit ? ref.colPaymentVariants.p2wsh.redeem.output : ref.colPaymentVariants.p2sh.redeem.output
    const seiOutputScript = isSegwit ? sei.colPaymentVariants.p2wsh.redeem.output : sei.colPaymentVariants.p2sh.redeem.output

    // inputs consists of [{ inputTxHex, index, vout, outputScript }]
    const signatures = await this.getMethod('signBatchP2SHTransaction')(
      [
        { inputTxHex: initiationTxRaw, index: 0, vout: ref.colVout, outputScript: refOutputScript },
        { inputTxHex: initiationTxRaw, index: 1, vout: sei.colVout, outputScript: seiOutputScript }
      ],
      [ address, address ],
      tx,
      lockTime,
      isSegwit
    )

    const refundableSig = signatures[0]
    const seizableSig = signatures[1]

    return { refundableSig, seizableSig }
  }

  finalizeTx (tx, col, i) {
    const network = this._bitcoinJsNetwork
    const needsWitness = col.paymentVariantName === 'p2wsh' || col.paymentVariantName === 'p2sh_p2wsh'

    col.paymentParams = { redeem: { output: col.output, input: col.colInput, network }, network }

    col.paymentWithInput = needsWitness
      ? bitcoin.payments.p2wsh(col.paymentParams)
      : bitcoin.payments.p2sh(col.paymentParams)

    if (needsWitness) {
      tx.setWitness(i, col.paymentWithInput.witness)
    }

    if (col.paymentVariantName === 'p2sh_p2wsh') {
      // Adds the necessary push OP (PUSH34 (00 + witness script hash))
      col.inputScript = bitcoin.script.compile([col.colPaymentVariants.p2sh_p2wsh.redeem.output])
      tx.setInputScript(i, col.inputScript)
    } else if (col.paymentVariantName === 'p2sh') {
      tx.setInputScript(i, col.paymentWithInput.input)
    }
  }
}

BitcoinCollateralProvider.version = version
