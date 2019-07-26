export default class Collateral {
  constructor (client) {
    this.client = client
  }

  async createRefundableScript(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration) {
    return this.client.getMethod('createRefundableScript')(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration)
  }

  async createSeizableScript (borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('createSeizableScript')(borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async lock (refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('lock')(refundableValue, seizableValue, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refund (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretParamB1, secretHashB2, secretParamC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration, isLender) {
    return this.client.getMethod('refund')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretParamB1, secretHashB2, secretParamC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration, isLender)
  }

  async seize (seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('seize')(seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refundRefundable (refundableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('refundRefundable')(refundableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async refundSeizable (seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration) {
    return this.client.getMethod('refundSeizable')(seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration)
  }

  async multisigSign (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration, isBorrower, to) {
    return this.client.getMethod('multisigSign')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, secretHashC1, secretHashC2, loanExpiration, biddingExpiration, seizureExpiration, isBorrower, to)
  }

  async multisigSend (refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretParamA2, secretHashB1, secretParamB2, secretHashC1, secretParamC2, loanExpiration, biddingExpiration, seizureExpiration, signatureOne, signatureTwo, to, isNotPos) {
    return this.client.getMethod('multisigSend')(refundableTxHash, seizableTxHash, borrowerPubKey, lenderPubKey, agentPubKey, secretHashA1, secretParamA2, secretHashB1, secretParamB2, secretHashC1, secretParamC2, loanExpiration, biddingExpiration, seizureExpiration, signatureOne, signatureTwo, to, isNotPos)
  }
}
