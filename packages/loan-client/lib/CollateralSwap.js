export default class CollateralSwap {
  constructor (client) {
    this.client = client
  }

  async init (values, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('init')(values, pubKeys, secretHashes, expirations)
  }

  async getInitAddresses (pubKeys, secretHashes, expirations) {
    return this.client.getMethod('getInitAddresses')(pubKeys, secretHashes, expirations)
  }

  async claim (txHashes, pubKeys, secret, secretHashes, expirations) {
    return this.client.getMethod('claim')(txHashes, pubKeys, secret, secretHashes, expirations)
  }

  async multisigWrite (txHash, pubKeys, secretHashes, expirations, party, to) {
    return this.client.getMethod('multisigWrite')(txHash, pubKeys, secretHashes, expirations, party, to)
  }

  async multisigMake (txHash, sigs, pubKeys, secrets, secretHashes, expirations, to) {
    return this.client.getMethod('multisigMake')(txHash, sigs, pubKeys, secrets, secretHashes, expirations, to)
  }

  async multisigMove (txHash, sigs, pubKeys, secrets, secretHashes, expirations, to) {
    return this.client.getMethod('multisigMove')(txHash, sigs, pubKeys, secrets, secretHashes, expirations, to)
  }

  async snatch (txHash, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('snatch')(txHash, pubKeys, secretHashes, expirations)
  }

  async regain (txHash, pubKeys, secretHashes, expirations) {
    return this.client.getMethod('regain')(txHash, pubKeys, secretHashes, expirations)
  }
}
