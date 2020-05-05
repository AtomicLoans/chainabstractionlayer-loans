import * as bitcoin from 'bitcoinjs-lib'
import Web3 from 'web3'
import { remove0x } from '@liquality/ethereum-utils'
import { BigNumber as BN } from 'bignumber.js'

const { fromWei, numberToHex, padLeft } = Web3.utils

import fundsSchema from './abi/funds'
import loansSchema from './abi/loans'
import salesSchema from './abi/sales'
import collateralSchema from './abi/collateral'
import p2wshSchema from './abi/p2wsh'

import { version } from '../package.json'

export default class MarketClient {
  constructor (contracts, btcClient, web3, unit) {
    const { funds, loans, sales, collateral, p2wsh } = contracts

    if (!(funds && loans && sales && collateral && p2wsh)) {
      throw new Error('Must include contract addresses for funds, loans, sales, collateral, p2wsh')
    }

    this._funds = new web3.eth.Contract(fundsSchema.abi, funds)
    this._loans = new web3.eth.Contract(loansSchema.abi, loans)
    this._sales = new web3.eth.Contract(salesSchema.abi, sales)
    this._collateral = new web3.eth.Contract(collateralSchema.abi, collateral)
    this._p2wsh = new web3.eth.Contract(p2wshSchema.abi, p2wsh)

    if (!btcClient) {
      throw new Error('btcClient must be set')
    }

    this._btcClient = btcClient

    if (!web3) {
      throw new Error('web3 must be set')
    }

    this._web3 = web3

    this._unit = unit
  }

  async loanCount () {
    const loans = this._loans

    return loans.methods.loanIndex().call()
  }

  async loan (loanId) {
    const btcClient = this._btcClient
    const p2wsh = this._p2wsh

    const refundablePubkh = remove0x((await p2wsh.methods.getP2WSH(this.numToBytes32(loanId), false).call())[1])
    const collateralRefundableP2SHAddress = bitcoin.payments.p2wsh({ hash: Buffer.from(refundablePubkh, 'hex'), network: bitcoin.networks.bitcoin }).address

    const seizablePubkh = remove0x((await p2wsh.methods.getP2WSH(this.numToBytes32(loanId), true).call())[1])
    const collateralSeizableP2SHAddress = bitcoin.payments.p2wsh({ hash: Buffer.from(seizablePubkh, 'hex'), network: bitcoin.networks.bitcoin }).address

    const refundableCollateralValue = BN(await btcClient.chain.getBalance([collateralRefundableP2SHAddress])).dividedBy(1e8).toFixed(8)
    const seizableCollateralValue = BN(await btcClient.chain.getBalance([collateralSeizableP2SHAddress])).dividedBy(1e8).toFixed(8)
    const collateralValue = BN(refundableCollateralValue).plus(seizableCollateralValue).toFixed(8)

    return {
      refundableCollateralValue,
      seizableCollateralValue,
      collateralValue,
      loanId,
      collateralRefundableP2SHAddress,
      collateralSeizableP2SHAddress
    }
  }

  async marketLiquidity () {
    const marketLiquidityInUnits = await this._funds.methods.marketLiquidity().call()

    return fromWei(marketLiquidityInUnits, this._unit)
  }

  async totalBorrowed () {
    const totalBorrowInUnits = await this._funds.methods.totalBorrow().call()

    return fromWei(totalBorrowInUnits, this._unit)
  }

  async totalSupplied () {
    const marketLiquidity = await this.marketLiquidity()
    const totalBorrowed = await this.totalBorrowed()

    return BN(marketLiquidity).plus(totalBorrowed).toFixed()
  }

  numToBytes32 (num) {
    return padLeft(numberToHex(num), 64)
  }
}

MarketClient.version = version
