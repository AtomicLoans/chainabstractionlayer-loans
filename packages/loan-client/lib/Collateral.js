export default class Collateral {
  constructor (client) {
    this.client = client
  }

  async createRefundableScript(borrowerPubKey, lenderPubKey, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration) {
    return this.client.getMethod('createRefundableScript')(borrowerPubKey, lenderPubKey, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration)
  }

  async createSeizableScript (borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('createSeizableScript')(borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async lock (refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('lock')(refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refund (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('refund')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async seize (seizableTxHash, borrowerPubKey, lenderPubKey, secretA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('seize')(seizableTxHash, borrowerPubKey, lenderPubKey, secretA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refundRefundable (refundableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('refundRefundable')(refundableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refundSeizable (seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('refundSeizable')(seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async multisigSign (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration, isBorrower, to) {
    return this.client.getMethod('multisigSign')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration, isBorrower, to)
  }

  async multisigSend (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretA2, secretHashB1, secretB2, loanExpiration, biddingExpiration, seizureExpiration, borrowerSignatures, lenderSignatures, to) {
    return this.client.getMethod('multisigSend')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, secretHashA1, secretA2, secretHashB1, secretB2, loanExpiration, biddingExpiration, seizureExpiration, borrowerSignatures, lenderSignatures, to)
  }
}
