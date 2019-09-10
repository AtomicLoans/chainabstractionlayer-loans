import { sha256 } from '@liquality/crypto'

export default class Collateral {
  constructor (client) {
    this.client = client
  }

  /**
   * Generate secrets.
   * @param {!string} message - Message to be used for generating secret.
   * @param {!string} address - can pass address for async claim and refunds to get deterministic secrets
   * @return {Promise<string>} Resolves with a 32 byte secret
   */
  async generateSecrets (message, num = 1) {
    const address = (await this.client.getMethod('getAddresses')())[0].address
    let secretMessage = sha256(await this.client.getMethod('signMessage')(message, address))
    let secrets = []

     for (let i = 0; i < num; i++) {
      secretMessage = sha256(Buffer.from(secretMessage, 'hex').reverse().toString('hex'))
      secrets.push(sha256(secretMessage))
    }

     return secrets
  }
}




  