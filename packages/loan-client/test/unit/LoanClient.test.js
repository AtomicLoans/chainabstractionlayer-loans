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

  describe('getCollateralOutput', () => {
    it('should throw NoProviderError', async () => {
      return expect(client.collateral.lock(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.lockRefundable(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.lockSeizable(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.getLockAddresses(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.refund(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.refundRefundable(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.refundSeizable(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.refundMany(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigSign(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigBuild(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigSend(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigSignMany(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigBuildMany(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.multisigSendMany(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.seize(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.reclaimOne(1)).to.be.rejectedWith(/No provider provided/)
    })

    it('should throw NoProviderError', async () => {
      return expect(client.collateral.reclaimAll(1)).to.be.rejectedWith(/No provider provided/)
    })
  })
})
