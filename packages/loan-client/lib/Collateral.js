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

  async refund (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('refund')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async multisigSign (txHash, pubKeys, secretHashes, expirations, party, to) {
    return this.client.getMethod('multisigSign')(txHash, pubKeys, secretHashes, expirations, party, to)
  }

  async multisigSend (txHash, sigs, pubKeys, secrets, secretHashes, expirations, to) {
    return this.client.getMethod('multisigSend')(txHash, sigs, pubKeys, secrets, secretHashes, expirations, to)
  }
}
