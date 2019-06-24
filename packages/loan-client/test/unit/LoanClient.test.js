/* eslint-env mocha */

import LoanClient from '../../lib'

import Client from '@liquality/client'

const { expect } = require('chai').use(require('chai-as-promised'))

describe('Client methods without providers', () => {
  let client

  const btcClient = new Client()

  beforeEach(() => {
    client = new LoanClient(btcClient)
  })

  describe('createRefundableCollateralScript', () => {
    it('should throw NoProviderError', async () => {
      return expect(client.collateral.createRefundableScript(1)).to.be.rejectedWith(/No provider provided/)
    })
  })
})
