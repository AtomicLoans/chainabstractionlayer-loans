/* eslint-env mocha */

import BitcoinCollateralProvider from '../../lib'

import * as bitcoin from 'bitcoinjs-lib'
import { providers } from '@liquality/bundle'
import { BigNumber } from 'bignumber.js'

const { expect } = require('chai').use(require('chai-as-promised'))

const bitcoinNetworks = providers.bitcoin.networks
const bitcoinNetwork = bitcoinNetworks['bitcoin_regtest']

describe('Client methods without providers', () => {
  let btcCollateralProvider

  beforeEach(() => {
    btcCollateralProvider = new BitcoinCollateralProvider({ network: bitcoinNetwork })
  })

  describe('constructor', () => {
    it('should throw error if constructed with incorrect script', async () => {
      expect(function() { new BitcoinCollateralProvider({ network: bitcoinNetwork},{ script: 'incorrect' }) }).to.throw(Error)
    })

    it('should throw error if constructed with incorrect address', async () => {
      expect(function() { new BitcoinCollateralProvider({ network: bitcoinNetwork},{ address: 'incorrect' }) }).to.throw(Error)
    })
  })

  describe('setPaymentVariants', () => {
    it('should throw if colVout undefined', async () => {
      const initiationTx = {
        _raw: {
          data: {
            vout: []
          }
        }
      }
      const col = {}

      expect(function() { btcCollateralProvider.setPaymentVariants(initiationTx, col) }).to.throw(Error)
    })
  })

  describe('buildFullColTx', () => {
    it('should create tx with default fee value if estimateFees is false', async () => {
      const currentTime = Math.floor(new Date().getTime() / 1000)

      let period = 'liquidationPeriod'
      let ref = {
        colVout: {
          value: 0.005,
          n: 0,
          txid: 'e76641fb8659f2633bf6ac8448934d96c267c845f8155643749cfcb24131e694'
        },
        paymentVariant: {
          output: Buffer.from('0020e66de259eec27e41ba442095670956da14e69c8161886a61086b70ce4f5cc0d0', 'hex')
        },
        paymentVariantName: 'p2wsh'
      }
      let sei = {
        colVout: {
          value: 0.01,
          n: 1,
          txid: 'e76641fb8659f2633bf6ac8448934d96c267c845f8155643749cfcb24131e694'
        },
        paymentVariant: {
          output: Buffer.from('00208f10f15e2eef5954b089d4bb2702bea924e66f6d69ba37513e79fec1ba05f7e2', 'hex')
        },
        paymentVariantName: 'p2wsh'
      }
      let expirations = { approveExpiration: 1581302782, swapExpiration: 1581848973, liquidationExpiration: 1581993054, seizureExpiration: 1581992417 }
      let outputs = 'bcrt1qgn9qdjtl9v8ytny77lpwnd6j7um73dugylmcwf'
      let estimateFees = false

      const defaultFeeValue = 15708

      const expectedInputValue = BigNumber(BigNumber(ref.colVout.value).times(1e8)).plus(BigNumber(sei.colVout.value).times(1e8)).toNumber()
      const expectedOutputValue = BigNumber(expectedInputValue).minus(defaultFeeValue).toNumber()

      const txb = await btcCollateralProvider.buildFullColTx(period, ref, sei, expirations, outputs, estimateFees)

      const { outs } = txb

      const output = outs[0]
      expect(output.value).to.equal(expectedOutputValue)
    })
  })
})
