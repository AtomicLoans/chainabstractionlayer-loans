# Chain Abstraction Layer Loans

[![Build Status](https://travis-ci.org/AtomicLoans/chainabstractionlayer-loans.svg?branch=master)](https://travis-ci.org/AtomicLoans/chainabstractionlayer-loans)
[![Coverage Status](https://coveralls.io/repos/github/AtomicLoans/chainabstractionlayer-loans/badge.svg?branch=add-travis)](https://coveralls.io/github/AtomicLoans/chainabstractionlayer-loans?branch=add-travis)
[![Standard Code Style](https://img.shields.io/badge/codestyle-standard-brightgreen.svg)](https://github.com/standard/standard)
[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](./LICENSE.md)
[![Telegram](https://img.shields.io/badge/chat-on%20telegram-blue.svg)](https://t.me/Atomic_Loans)
[![Greenkeeper badge](https://badges.greenkeeper.io/AtomicLoans/chainabstractionlayer-loans.svg)](https://greenkeeper.io/)|

> :warning: This project is under heavy development. Expect bugs & breaking changes.

Query different blockchains with account management using a single and simple interface.

## Dependencies

This repository was built as an extension to the [ChainAbstractionLayer](https://github.com/liquality/chainabstractionlayer) maintained by the core contributors of [Liquality](https://liquality.io). It is necessary to include the `Client` and `providers` from the `@liquality` npm packages in order to use providers such as the `BitcoinCollateralProvider`. 

## Packages

|Package|Version|
|---|---|
|[@atomicloans/bitcoin-collateral-agent-provider](./packages/bitcoin-collateral-agent-provider)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/bitcoin-collateral-agent-provider.svg)](https://npmjs.com/package/@atomicloans/bitcoin-collateral-agent-provider)|
|[@atomicloans/bitcoin-collateral-provider](./packages/bitcoin-collateral-provider)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/bitcoin-collateral-provider.svg)](https://npmjs.com/package/@atomicloans/bitcoin-collateral-provider)|
|[@atomicloans/bitcoin-collateral-swap-provider](./packages/bitcoin-collateral-swap-provider)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/bitcoin-collateral-swap-provider.svg)](https://npmjs.com/package/@atomicloans/bitcoin-collateral-swap-provider)|
|[@atomicloans/loan-bundle](./packages/loan-bundle)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/loan-bundle.svg)](https://npmjs.com/package/@atomicloans/loan-bundle)|
|[@atomicloans/loan-client](./packages/loan-client)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/loan-client.svg)](https://npmjs.com/package/@atomicloans/loan-client)|
|[@atomicloans/provider](./packages/provider)|[![ChainAbstractionLayer-Loans](https://img.shields.io/npm/v/@atomicloans/provider.svg)](https://npmjs.com/package/@atomicloans/provider)

## Usage

```javascript

import { Client, Provider, providers, crypto } from '@liquality/bundle'
import { LoanClient, providers as lproviders } from '@atomicloans/bundle'

const bitcoinNetworks = providers.bitcoin.networks
const bitcoin = new Client()
const bitcoinLoanWithLedger = new LoanClient(bitcoin)
bitcoin.loan = bitcoinLoanWithLedger
bitcoin.addProvider(new providers.bitcoin.BitcoinBitcoreRpcProvider('https://liquality.io/bitcointestnetrpc/', 'bitcoin', 'local321'))
bitcoin.addProvider(new providers.bitcoin.BitcoinLedgerProvider({ network: bitcoinNetworks['bitcoin_testnet'], segwit: false }))
bitcoin.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralProvider({ network: bitcoinNetworks['bitcoin_testnet'] }))

bitcoin.loan.collateral.lock(
  refundableValue, seizableValue, borrowerPubKey, lenderPubKey, secretHashA1, secretHashA2, secretHashB1, secretHashB2, loanExpiration, biddingExpiration, seizureExpiration
  )
```


## Development

```bash
npm install
npm run bootstrap
npm run watch
```


## Production

```bash
npm run build
```


## License

[MIT](./LICENSE.md)
