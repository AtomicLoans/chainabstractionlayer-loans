import Provider from '@atomicloans/provider'
import networks from '@liquality/bitcoin-networks'

import {
  calculateFee,
  addressToPubKeyHash,
  pubKeyToAddress,
  pubKeyHashToAddress,
  reverseBuffer,
  scriptNumEncode
} from '@liquality/bitcoin-utils'
import {
  hash160,
  sha256,
  padHexStart
} from '@liquality/crypto'
import { sleep } from '@liquality/utils'

import { version } from '../package.json'

export default class BitcoinCollateralSwapProvider extends Provider {
  constructor (chain = { network: networks.bitcoin }) {
    super()
    this._network = chain.network
  }

  createRefundableScript (borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashD1, loanExpiration, biddingExpiration) {
    let loanExpirationHex = scriptNumEncode(loanExpiration)
    let biddingExpirationHex = scriptNumEncode(biddingExpiration)

    const borrowerPubKeyHash = hash160(borrowerPubKey)
    const borrowerPubKeyPushDataOpcode = padHexStart((borrowerPubKey.length / 2).toString(16))

    const lenderPubKeyPushDataOpcode = padHexStart((lenderPubKey.length / 2).toString(16))

    const agentPubKeyPushDataOpcode = padHexStart((agentPubKey.length / 2).toString(16))

    const loanExpirationPushDataOpcode = padHexStart(loanExpirationHex.length.toString(16))
    const loanExpirationHexEncoded = loanExpirationHex.toString('hex')
    const biddingExpirationPushDataOpcode = padHexStart(biddingExpirationHex.length.toString(16))
    const biddingExpirationHexEncoded = biddingExpirationHex.toString('hex')

    return [
      '63', // OP_IF
        '82', // OP_SIZE
        '01', // OP_PUSHDATA(1)
        '20', // Hex 32
        '88', // OP_EQUALVERIFY
        'a8', // OP_SHA256
        '20', secretHashD1, // OP_PUSHDATA(20) {secretHash}
        '88', // OP_EQUALVERIFY
        '76', // OP_DUP
        'a9', // OP_HASH160
        '14', bidderPubKeyHash, // OP_PUSHDATA(20) {recipientPubKeyHash}
        '88', 'ac', // OP_EQUALVERIFY OP_CHECKSIG
      '67', // OP_ELSE
        '63', // OP_IF
          loanExpirationPushDataOpcode, // OP_PUSHDATA({loanExpirationHexLength})
          loanExpirationHexEncoded, // {loanExpirationHexEncoded}
          'b1', // OP_CHECKLOCKTIMEVERIFY
          '75', // OP_DROP
          '52', // PUSH #2
          borrowerPubKeyPushDataOpcode, borrowerPubKey, // OP_PUSHDATA({alicePubKeyLength}) {alicePubKey}
          lenderPubKeyPushDataOpcode, lenderPubKey, // OP_PUSHDATA({bobPubKeyLength}) {bobPubKey}
          agentPubKeyPushDataOpcode, agentPubKey, // OP_PUSHDATA({agentPubKeyLength}) {agentPubKey}
          '53', // PUSH #3
          'ae', // CHECKMULTISIG
        '67', // OP_ELSE
          biddingExpirationPushDataOpcode, // OP_PUSHDATA({biddingExpirationHexLength})
          biddingExpirationHexEncoded, // {biddingExpirationHexEncoded}
          'b1', // OP_CHECKLOCKTIMEVERIFY
          '75', // OP_DROP
          '76', 'a9', // OP_DUP OP_HASH160
          '14', borrowerPubKeyHash, // OP_PUSHDATA(20) {alicePubKeyHash}
          '88', 'ac', // OP_EQUALVERIFY OP_CHECKSIG
        '68', // OP_ENDIF
      '68' // OP_ENDIF
    ].join('')
  }

  createSeizableScript (borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration) {
    let loanExpirationHex = scriptNumEncode(loanExpiration)
    let biddingExpirationHex = scriptNumEncode(biddingExpiration)
    let seizureExpirationHex = scriptNumEncode(seizureExpiration)

    const borrowerPubKeyHash = hash160(borrowerPubKey)
    const borrowerPubKeyPushDataOpcode = padHexStart((borrowerPubKey.length / 2).toString(16))

    const lenderPubKeyHash = hash160(lenderPubKey)
    const lenderPubKeyPushDataOpcode = padHexStart((lenderPubKey.length / 2).toString(16))

    const agentPubKeyPushDataOpcode = padHexStart((agentPubKey.length / 2).toString(16))

    const loanExpirationPushDataOpcode = padHexStart(loanExpirationHex.length.toString(16))
    const loanExpirationHexEncoded = loanExpirationHex.toString('hex')
    const biddingExpirationPushDataOpcode = padHexStart(biddingExpirationHex.length.toString(16))
    const biddingExpirationHexEncoded = biddingExpirationHex.toString('hex')
    const seizureExpirationPushDataOpcode = padHexStart(seizureExpirationHex.length.toString(16))
    const seizureExpirationHexEncoded = seizureExpirationHex.toString('hex')

    return [
      '63', // OP_IF
        '82', // OP_SIZE
        '01', // OP_PUSHDATA(1)
        '20', // Hex 32
        '88', // OP_EQUALVERIFY
        'a8', // OP_SHA256
        '20', secretHashD1, // OP_PUSHDATA(20) {secretHash}
        '88', // OP_EQUALVERIFY
        '76', // OP_DUP
        'a9', // OP_HASH160
        '14', bidderPubKeyHash, // OP_PUSHDATA(20) {recipientPubKeyHash}
        '88', 'ac', // OP_EQUALVERIFY OP_CHECKSIG
      '67', // OP_ELSE
        '63', // OP_IF
          loanExpirationPushDataOpcode, // OP_PUSHDATA({loanExpirationHexLength})
          loanExpirationHexEncoded, // {loanExpirationHexEncoded}
          'b1', // OP_CHECKLOCKTIMEVERIFY
          '75', // OP_DROP
          '52', // PUSH #2
          borrowerPubKeyPushDataOpcode, borrowerPubKey, // OP_PUSHDATA({alicePubKeyLength}) {alicePubKey}
          lenderPubKeyPushDataOpcode, lenderPubKey, // OP_PUSHDATA({bobPubKeyLength}) {bobPubKey}
          agentPubKeyPushDataOpcode, agentPubKey, // OP_PUSHDATA({agentPubKeyLength}) {agentPubKey}
          '53', // PUSH #3
          'ae', // CHECKMULTISIG
        '67', // OP_ELSE
          '63', // OP_IF
            biddingExpirationPushDataOpcode, // OP_PUSHDATA({expirationHexLength})
            biddingExpirationHexEncoded, // {expirationHexEncoded}
            'b1', // OP_CHECKLOCKTIMEVERIFY
            '75', // OP_DROP
            '82', // OP_SIZE
            '01', // OP_PUSHDATA(1)
            '20', // Hex 32
            '88', // OP_EQUALVERIFY
            'a8', // OP_SHA256
            '20', secretHashA1, // OP_PUSHDATA(32) {secretHashA1}
            '88', // OP_EQUALVERIFY
            '76', 'a9', // OP_DUP OP_HASH160
            '14', lenderPubKeyHash, // OP_PUSHDATA(20) {bobPubKeyHash}
            '88', 'ac', // OP_EQUALVERIFY OP_CHECKSIG
            '67', // OP_ELSE
            seizureExpirationPushDataOpcode, // OP_PUSHDATA({seizureExpirationHexLength})
            seizureExpirationHexEncoded, // {seizureExpirationHexEncoded}
            'b1', // OP_CHECKLOCKTIMEVERIFY
            '75', // OP_DROP
            '76', 'a9', // OP_DUP OP_HASH160
            '14', borrowerPubKeyHash, // OP_PUSHDATA(20) {alicePubKeyHash}
            '88', 'ac', // OP_EQUALVERIFY OP_CHECKSIG
          '68', // OP_ENDIF
        '68', // OP_ENDIF
      '68' // OP_ENDIF
    ].join('')
  }

  async lock (refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration) {    
    const refundableScript = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashD1, loanExpiration, biddingExpiration)
    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration)

    const refundableScriptPubKey = padHexStart(refundableScript)
    const seizableScriptPubKey = padHexStart(seizableScript)

    const refundableP2shAddress = pubKeyToAddress(refundableScriptPubKey, this._network.name, 'scriptHash')
    const seizableP2shAddress = pubKeyToAddress(seizableScriptPubKey, this._network.name, 'scriptHash')

    const refundableResult = await this.getMethod('sendTransaction')(refundableP2shAddress, refundableValue, refundableScript)
    const seizableResult = await this.getMethod('sendTransaction')(seizableP2shAddress, seizableValue, seizableScript)

    return { refundableResult, seizableResult }
  }

  async refund (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, secretHashA1, secretD1, loanExpiration, biddingExpiration, seizureExpiration) {
    const secretHashD1 = sha256(secretD1)
    const bidderPubKeyHash = hash160(bidderPubKey)

    const refundableScript = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashD1, loanExpiration, biddingExpiration)
    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration)

    const refundableResult = await this._refund(refundableTxHash, refundableScript, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, secretHashA1, secretD1, loanExpiration, biddingExpiration, seizureExpiration, false, 'loanPeriod')
    const seizableResult = await this._refund(seizableTxHash, seizableScript, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, secretHashA1, secretD1, loanExpiration, biddingExpiration, seizureExpiration, true, 'loanPeriod')

    return { refundableResult, seizableResult }
  }

  async seize (seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const secretHashA1 = sha256(secretA1)

    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)

    return this._refund(seizableTxHash, seizableScript, borrowerPubKey, lenderPubKey, secretA1, secretHashB1, secretHashC1, loanExpiration, biddingExpiration, seizureExpiration, true, 'seizurePeriod')
  }

  async refundRefundable (refundableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const refundableScript = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration)

    return this._refund(refundableTxHash, refundableScript, borrowerPubKey, lenderPubKey, secretHashA1, secretHashB1, secretHashC1, loanExpiration, biddingExpiration, seizureExpiration, false, 'seizurePeriod')
  }

  async refundSeizable (seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)

    return this._refund(seizableTxHash, seizableScript, borrowerPubKey, lenderPubKey, secretHashA1, secretHashB1, loanExpiration, biddingExpiration, seizureExpiration, true, 'refundPeriod')
  }

  async multisigSign (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration, isBorrower, to) {
    const bidderPubKeyHash = hash160(bidderPubKey)

    const refundableScript = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashD1, loanExpiration, biddingExpiration)
    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration)

    const from = isBorrower ? pubKeyToAddress(borrowerPubKey, this._network.name, 'pubKeyHash') : pubKeyToAddress(lenderPubKey, this._network.name, 'pubKeyHash')

    const refundableSignature = await this._multisigSign(refundableTxHash, refundableScript, loanExpiration, to, from)
    const seizableSignature = await this._multisigSign(seizableTxHash, seizableScript, loanExpiration, to, from)

    return { refundableSignature, seizableSignature }
  }

  async multisigSend (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration, signatureOne, signatureTwo, to) {
    const bidderPubKeyHash = hash160(bidderPubKey)

    const refundableScript = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashD1, loanExpiration, biddingExpiration)
    const seizableScript = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKeyHash, secretHashA1, secretHashD1, loanExpiration, biddingExpiration, seizureExpiration)

    debugger
    const refundableResult = await this._multisigSend(refundableTxHash, refundableScript, loanExpiration, signatureOne.refundableSignature, signatureTwo.refundableSignature, to)
    const seizableResult = await this._multisigSend(seizableTxHash, seizableScript, loanExpiration, signatureOne.seizableSignature, signatureTwo.seizableSignature, to)

    return { refundableResult, seizableResult }
  }

  doesTransactionMatchRefundableParams (transaction, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const data = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration)
    const scriptPubKey = padHexStart(data)
    const receivingAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    const sendScript = this.getMethod('createScript')(receivingAddress)
    return Boolean(transaction._raw.vout.find(vout => vout.scriptPubKey.hex === sendScript && vout.valueSat === refundableValue))
  }

  doesTransactionMatchSeizableParams (transaction, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const data = this.createSeizableScript(borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
    const scriptPubKey = padHexStart(data)
    const receivingAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    const sendScript = this.getMethod('createScript')(receivingAddress)
    return Boolean(transaction._raw.vout.find(vout => vout.scriptPubKey.hex === sendScript && vout.valueSat === seizableValue))
  }

  async verifyLockRefundableTransaction (initiationTxHash, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const initiationTransaction = await this.getMethod('getTransactionByHash')(initiationTxHash)
    return this.doesTransactionMatchRefundableParams(transaction, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async verifyLockSeizableTransaction (initiationTxHash, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const initiationTransaction = await this.getMethod('getTransactionByHash')(initiationTxHash)
    return this.doesTransactionMatchSeizableParams(transaction, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async findRefundableTransaction (borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration, predicate) {
    const script = this.createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration)
    const scriptPubKey = padHexStart(script)
    const p2shAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    let refundableTransaction = null
    while (!refundableTransaction) {
      let p2shTransactions = await this.getMethod('getAddressDeltas')([p2shAddress])
      const p2shMempoolTransactions = await this.getMethod('getAddressMempool')([p2shAddress])
      p2shTransactions = p2shTransactions.concat(p2shMempoolTransactions)
      const transactionIds = p2shTransactions.map(tx => tx.txid)
      const transactions = await Promise.all(transactionIds.map(this.getMethod('getTransactionByHash')))
      refundableTransaction = transactions.find(predicate)
      await sleep(5000)
    }
    return refundableTransaction
  }

  async findSeizableTransaction (borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration, predicate) {
    const script = this.createSeizableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secrethashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
    const scriptPubKey = padHexStart(script)
    const p2shAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    let seizableTransaction = null
    while (!seizableTransaction) {
      let p2shTransactions = await this.getMethod('getAddressDeltas')([p2shAddress])
      const p2shMempoolTransactions = await this.getMethod('getAddressMempool')([p2shAddress])
      p2shTransactions = p2shTransactions.concat(p2shMempoolTransactions)
      const transactionIds = p2shTransactions.map(tx => tx.txid)
      const transactions = await Promise.all(transactionIds.map(this.getMethod('getTransactionByHash')))
      seizableTransaction = transactions.find(predicate)
      await sleep(5000)
    }
    return seizableTransaction
  }

  async findLockRefundableTransaction (refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    const lockRefundableTransaction = await this.findRefundableTransaction(borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration,
      tx => this.doesTransactionMatchRefundableParams(tx, refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
    )

    return lockRefundableTransaction
  }

  async findLockSeizableTransaction (refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    const lockSeizableTransaction = await this.findSeizableTransaction(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration,
      tx => this.doesTransactionMatchSeizableParams(tx, refundableValue, seizableValue, borrowerPubKey, agentPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
    )

    return lockSeizableTransaction
  }

  async _refund (initiationTxHash, script, borrowerPubKey, lenderPubKey, agentPubKey, bidderPubKey, borrowerSecretParam, bidderSecretParam, loanExpiration, biddingExpiration, seizureExpiration, seizable, period) {
    let secret, lockTime
    let requiresSecret = false
    if (period === 'loanPeriod') {
      secret = bidderSecretParam
      requiresSecret = true
    } else if (period === 'seizurePeriod' && seizable === true) {
      secret = borrowerSecretParam
      requiresSecret = true
    }

    if (period === 'loanPeriod') {
      lockTime = 0
    } else if (period === 'biddingPeriod') {
      lockTime = loanExpiration + 100
    } else if (period === 'seizurePeriod') {
      lockTime = biddingExpiration + 100
    } else {
      lockTime = seizureExpiration + 100
    }

    const lockTimeHex = padHexStart(scriptNumEncode(lockTime).toString('hex'), 8)

    const pubKey = (period === 'seizurePeriod' && requiresSecret) ? lenderPubKey : bidderPubKey
    const to = pubKeyToAddress(pubKey, this._network.name, 'pubKeyHash')

    const scriptPubKey = padHexStart(script)
    const p2shAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    const sendScript = this.getMethod('createScript')(p2shAddress)

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('splitTransaction')(initiationTxRaw, true)
    const voutIndex = initiationTx.outputs.findIndex((output) => output.script.toString('hex') === sendScript)

    const txHashLE = Buffer.from(initiationTxHash, 'hex').reverse().toString('hex') // TX HASH IN LITTLE ENDIAN
    const newTxInput = this.generateSigTxInput(txHashLE, voutIndex, script)
    const newTx = this.generateRawTx(initiationTx, voutIndex, to, newTxInput, lockTimeHex)
    const splitNewTx = await this.getMethod('splitTransaction')(newTx, true)
    const outputScriptObj = await this.getMethod('serializeTransactionOutputs')(splitNewTx)
    const outputScript = outputScriptObj.toString('hex')

    const walletAddress = await this.getMethod('getWalletAddress')(to)

    const signature = await this.getMethod('signP2SHTransaction')(
      [[initiationTx, voutIndex, script, 0]],
      [walletAddress.derivationPath],
      outputScript,
      lockTime
    )

    const spend = this._spend(signature[0], pubKey, secret, requiresSecret, period)
    const spendInput = this._spendInput(spend, script)
    const rawClaimTxInput = this.generateRawTxInput(txHashLE, spendInput, voutIndex)
    const rawClaimTx = this.generateRawTx(initiationTx, voutIndex, to, rawClaimTxInput, lockTimeHex)

    debugger

    return this.getMethod('sendRawTransaction')(rawClaimTx)
  }

  async _multisigSign (initiationTxHash, script, loanExpiration, to, from) {
    const lockTime = loanExpiration + 100
    const lockTimeHex = padHexStart(scriptNumEncode(lockTime).toString('hex'), 8)

    const scriptPubKey = padHexStart(script)
    const p2shAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    const sendScript = this.getMethod('createScript')(p2shAddress)

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('splitTransaction')(initiationTxRaw, true)
    const voutIndex = initiationTx.outputs.findIndex((output) => output.script.toString('hex') === sendScript)

    const txHashLE = Buffer.from(initiationTxHash, 'hex').reverse().toString('hex') // TX HASH IN LITTLE ENDIAN
    const newTxInput = this.generateSigTxInput(txHashLE, voutIndex, script)
    const newTx = this.generateRawTx(initiationTx, voutIndex, to, newTxInput, lockTimeHex)
    const splitNewTx = await this.getMethod('splitTransaction')(newTx, true)
    const outputScriptObj = await this.getMethod('serializeTransactionOutputs')(splitNewTx)
    const outputScript = outputScriptObj.toString('hex')

    const walletAddress = await this.getMethod('getWalletAddress')(from)

    const signature = await this.getMethod('signP2SHTransaction')(
      [[initiationTx, 0, script, 0]],
      [walletAddress.derivationPath],
      outputScript,
      lockTime
    )

    return signature[0]
  }

  async _multisigSend (initiationTxHash, script, loanExpiration, signatureOne, signatureTwo, to) {
    const lockTime = loanExpiration + 100
    const lockTimeHex = padHexStart(scriptNumEncode(lockTime).toString('hex'), 8)

    const scriptPubKey = padHexStart(script)
    const p2shAddress = pubKeyToAddress(scriptPubKey, this._network.name, 'scriptHash')
    const sendScript = this.getMethod('createScript')(p2shAddress)

    const initiationTxRaw = await this.getMethod('getRawTransactionByHash')(initiationTxHash)
    const initiationTx = await this.getMethod('splitTransaction')(initiationTxRaw, true)
    const voutIndex = initiationTx.outputs.findIndex((output) => output.script.toString('hex') === sendScript)

    const txHashLE = Buffer.from(initiationTxHash, 'hex').reverse().toString('hex') // TX HASH IN LITTLE ENDIAN

    const spend = this._spendMultisig(signatureOne, signatureTwo)
    const spendInput = this._spendInput(spend, script)

    debugger
    const rawClaimTxInput = this.generateRawTxInput(txHashLE, spendInput, voutIndex)
    debugger
    const rawClaimTx = this.generateRawTx(initiationTx, voutIndex, to, rawClaimTxInput, lockTimeHex)
    debugger

    return this.getMethod('sendRawTransaction')(rawClaimTx)
  }

  _spendMultisig (signatureOne, signatureTwo) {
    const ifBranch = ['51', '00']

    const signatureOneSignatureEncoded = signatureOne + '01'
    const signatureOneSignaturePushDataOpcode = padHexStart((signatureOneSignatureEncoded.length / 2).toString(16))
    const signatureTwoSignatureEncoded = signatureTwo + '01'
    const signatureTwoSignaturePushDataOpcode = padHexStart((signatureTwoSignatureEncoded.length / 2).toString(16))

    const bytecode = [
      '00',
      signatureOneSignaturePushDataOpcode,
      signatureOneSignatureEncoded,
      signatureTwoSignaturePushDataOpcode,
      signatureTwoSignatureEncoded,
      ...ifBranch
    ]

    return bytecode.join('')
  }

  _spend (signature, pubKey, secret, requiresSecret, period) {
    var ifBranch
    if (period === 'loanPeriod') {
      ifBranch = ['51']
    } else if (period === 'biddingPeriod') {
      ifBranch = ['51', '00']
    } else if (period === 'seizurePeriod' && requiresSecret) {
      ifBranch = ['51', '00', '00']
    } else if (period === 'seizurePeriod' && !requiresSecret) {
      ifBranch = ['00', '00']
    } else if (period === 'refundPeriod') {
      ifBranch = ['00', '00', '00']
    }

    const encodedSecret = requiresSecret
      ? [
        padHexStart((secret.length / 2).toString(16)), // OP_PUSHDATA({secretLength})
        secret
      ]
      : [] // OP_0

    const signatureEncoded = signature + '01'
    const signaturePushDataOpcode = padHexStart((signatureEncoded.length / 2).toString(16))
    const pubKeyPushDataOpcode = padHexStart((pubKey.length / 2).toString(16))

    const bytecode = [
      signaturePushDataOpcode,
      signatureEncoded,
      pubKeyPushDataOpcode,
      pubKey,
      ...encodedSecret,
      ...ifBranch
    ]

    return bytecode.join('')
  }

  _spendInput (spendBytecode, voutScript) {
    const voutScriptLength = Buffer.from(padHexStart((voutScript.length / 2).toString(16)), 'hex').reverse().toString('hex')

    const bytecode = [
      spendBytecode,
      (voutScript.length / 2) < 256 ? '4c' : '4d',
      voutScriptLength,
      voutScript
    ]

    return bytecode.join('')
  }

  generateSigTxInput (txHashLE, voutIndex, script) {
    const inputTxOutput = Buffer.from(padHexStart(voutIndex.toString(16), 8), 'hex').reverse().toString('hex')
    const scriptLength = Buffer.from(padHexStart((script.length / 2).toString(16)), 'hex').reverse().toString('hex')

    return [
      '01', // NUM INPUTS
      txHashLE,
      inputTxOutput, // INPUT TRANSACTION OUTPUT
      (script.length / 2) < 253 ? '' : 'fd',
      scriptLength,
      (script.length / 2) >= 253 && (script.length / 2) < 256 ? '00' : '',
      script,
      '00000000' // SEQUENCE
    ].join('')
  }

  generateRawTxInput (txHashLE, script, voutIndex) {
    const inputTxOutput = Buffer.from(padHexStart(voutIndex.toString(16), 8), 'hex').reverse().toString('hex')
    const scriptLength = Buffer.from(padHexStart((script.length / 2).toString(16)), 'hex').reverse().toString('hex')

    return [
      '01', // NUM INPUTS
      txHashLE,
      inputTxOutput,
      (script.length / 2) < 253 ? '' : 'fd',
      scriptLength,
      (script.length / 2) >= 253 && (script.length / 2) < 256 ? '00' : '',
      script,
      '00000000' // SEQUENCE
    ].join('')
  }

  generateRawTx (initiationTx, voutIndex, address, input, locktime) {
    debugger
    const output = initiationTx.outputs[voutIndex]
    debugger
    const value = parseInt(reverseBuffer(output.amount).toString('hex'), 16)
    debugger
    const fee = calculateFee(2, 2, 7)
    const amount = value - fee
    const amountLE = Buffer.from(padHexStart(amount.toString(16), 16), 'hex').reverse().toString('hex') // amount in little endian
    const pubKeyHash = addressToPubKeyHash(address)

    return [
      '01000000', // VERSION
      input,
      '01', // NUM OUTPUTS
      amountLE,
      '19', // data size to be pushed
      '76', // OP_DUP
      'a9', // OP_HASH160
      '14', // data size to be pushed
      pubKeyHash, // <PUB_KEY_HASH>
      '88', // OP_EQUALVERIFY
      'ac', // OP_CHECKSIG
      locktime // LOCKTIME
    ].join('')
  }
}

BitcoinCollateralSwapProvider.version = version
