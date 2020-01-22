export default class Collateral {
  constructor (client) {
    this.client = client
  }

  getCollateralOutput (pubKeys, secretHashes, expirations, seizable) {
    return this.client.getMethod('getCollateralOutput')(pubKeys, secretHashes, expirations, seizable)
  }

  async lock (values, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('lock')(values, pubKeys, secretHashes, expirations)
  }

  async lockRefundable (value, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('lockRefundable')(value, pubKeys, secretHashes, expirations)
  }

  async lockSeizable (value, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('lockSeizable')(value, pubKeys, secretHashes, expirations)
  }

  async getLockAddresses (pubKeys, secretHashes, expirations) {
    return this.client.getMethod('getLockAddresses')(pubKeys, secretHashes, expirations)
  }

  async refund (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('refund')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async refundRefundable (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('refundRefundable')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async refundSeizable (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('refundSeizable')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async refundMany (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('refundMany')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async multisigSign (txHash, pubKeys, secretHashes, expirations, party, to) {
    return this.client.getMethod('multisigSign')(txHash, pubKeys, secretHashes, expirations, party, to)
  }

  async multisigBuild (txHash, sigs, pubKeys, secrets, secretHashes, expirations, to) {
    return this.client.getMethod('multisigBuild')(txHash, sigs, pubKeys, secrets, secretHashes, expirations, to)
  }

  async multisigSend (txHash, sigs, pubKeys, secrets, secretHashes, expirations, to) {
    return this.client.getMethod('multisigSend')(txHash, sigs, pubKeys, secrets, secretHashes, expirations, to)
  }

  async seize (txHash, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('seize')(txHash, pubKeys, secret, secretHashes, expirations)
  }

  async reclaimOne (txHash, pubKeys, secretHashes, expirations, seizable) {
    return this.client.getMethod('reclaimOne')(txHash, pubKeys, secretHashes, expirations, seizable)
  }

  async reclaimAll (txHash, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('reclaimAll')(txHash, pubKeys, secretHashes, expirations)
  }
}
