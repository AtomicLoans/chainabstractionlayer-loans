import Collateral from './Collateral'

import { version } from '../package.json'

export default class LoanClient {

  /**
   * Client
   */
  constructor () {
    /**
     * @type {Array}
     */
    this._providers = []

    /**
     * @type {string}
     */
    this.version = version

    this._collateral = new Collateral(this)
  }

  get collateral () {
    return this._collateral
  }
}

LoanClient.version = version
