import { find, findLast, findLastIndex, isFunction } from 'lodash'
import debug from 'debug'

import Collateral from './Collateral'
import CollateralSwap from './CollateralSwap'

import {
  DuplicateProviderError,
  InvalidProviderError,
  NoProviderError,
  UnimplementedMethodError,
  UnsupportedMethodError
} from '@liquality/errors'

import { version } from '../package.json'

export default class LoanClient {

  /**
   * Client
   */
  constructor (client) {
    this.client = client
    /**
     * @type {Array}
     */
    this._providers = []

    /**
     * @type {string}
     */
    this.version = version

    this._collateral = new Collateral(this)
    this._collateralSwap = new CollateralSwap(this)
  }

  /**
   * Add a provider
   * @param {!Provider} provider - The provider instance or RPC connection string
   * @return {Client} Returns instance of Client
   * @throws {InvalidProviderError} When invalid provider is provider
   * @throws {DuplicateProviderError} When same provider is added again
   */
  addProvider (provider) {
    if (!isFunction(provider.setClient)) {
      throw new InvalidProviderError('Provider should have "setClient" method')
    }

    const duplicate = find(
      this._providers,
      _provider => provider.constructor === _provider.constructor
    )

    if (duplicate) {
      throw new DuplicateProviderError('Duplicate provider')
    }

    provider.setClient(this)
    this._providers.push(provider)

    return this
  }

  /**
   * Check the availability of a method.
   * @param {!string} method - Name of the method to look for in the provider stack
   * @param {boolean|object} [requestor=false] - If provided, it returns providers only
   *  above the requestor in the stack.
   * @return {Provider} Returns a provider instance associated with the requested method
   * @throws {NoProviderError} When no provider is available in the stack.
   * @throws {UnimplementedMethodError} When the requested method is not provided
   *  by any provider above requestor in the provider stack
   * @throws {UnsupportedMethodError} When requested method is not supported by
   *  version specified
   */
  getProviderForMethod (method, requestor = false) {
    if (this._providers.concat(this.client._providers).length === 0) {
      throw new NoProviderError('No provider provided. Add a provider to the client')
    }

    let indexOfRequestor = requestor
      ? findLastIndex(
        this._providers.concat(this.client._providers),
        provider => requestor.constructor === provider.constructor
      ) : this._providers.concat(this.client._providers).length

    if (indexOfRequestor === -1) indexOfRequestor = 0

    let provider = findLast(
      this._providers.concat(this.client._providers),
      provider => isFunction(provider[method]), indexOfRequestor - 1
    )

    if (provider == null) {
      throw new UnimplementedMethodError(`Unimplemented method "${method}"`)
    }

    if (isFunction(provider._checkMethodVersionSupport)) {
      if (!provider._checkMethodVersionSupport(method, this.version)) {
        throw new UnsupportedMethodError(`Method "${method}" is not supported by version "${this.version}"`)
      }
    }

    return provider
  }

  /**
   * Helper method that returns method from a provider.
   * @param {!string} method - Name of the method to look for in the provider stack
   * @param {object} [requestor] - If provided, it returns method from providers only
   *  above the requestor in the stack.
   * @return {function} Returns method from provider instance associated with the requested method
   */
  getMethod (method, requestor) {
    try {
      const provider = this.getProviderForMethod(method, requestor)
      return provider[method].bind(provider)
    } catch(e) {
      return this.client.getMethod(method)
    }
  }

  get collateral () {
    return this._collateral
  }

  get collateralSwap () {
    return this._collateralSwap
  }
}

LoanClient.version = version
