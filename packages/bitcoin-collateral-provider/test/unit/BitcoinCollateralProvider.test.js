/* eslint-env mocha */

import BitcoinCollateralProvider from '../../lib'

const { expect } = require('chai').use(require('chai-as-promised'))

describe('Client methods without providers', () => {
  let btcCollateralProvider

  beforeEach(() => {
    btcCollateralProvider = new BitcoinCollateralProvider()
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
})
