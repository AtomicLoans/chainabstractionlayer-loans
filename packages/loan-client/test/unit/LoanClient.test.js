/* eslint-env mocha */

import LoanClient from '../../lib'

const { expect } = require('chai').use(require('chai-as-promised'))

describe('Client methods without providers', () => {
  let client

  beforeEach(() => {
    client = new LoanClient()
  })

  describe('createRefundableCollateralScript', () => {
    it('should throw NoProviderError', async () => {
      return expect(client.collateral.createRefundableScript(1)).to.be.rejectedWith(/No provider provided/)
    })
  })
})
