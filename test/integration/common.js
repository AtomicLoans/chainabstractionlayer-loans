/* eslint-env mocha */
import * as bitcoin from 'bitcoinjs-lib'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import MetaMaskConnector from 'node-metamask'
import { Client, Provider, providers, crypto } from '@liquality/bundle'
import { LoanClient, providers as lproviders } from '../../packages/loan-bundle/lib'
import MarketClient from '../../packages/market-client/lib'
import HDWalletProvider from '@truffle/hdwallet-provider'
import { sleep } from '@liquality/utils'
import { sha256, hash160 } from '@liquality/crypto'
import { findLast } from 'lodash'
import { generateMnemonic } from 'bip39'
import Web3 from 'web3'
import config from './config'

chai.use(chaiAsPromised)

const metaMaskConnector = new MetaMaskConnector({ port: config.ethereum.metaMaskConnector.port })

const bitcoinNetworks = providers.bitcoin.networks
const bitcoinNetwork = bitcoinNetworks[config.bitcoin.network]

const bitcoinWithLedger = new Client()
const bitcoinLoanWithLedger = new LoanClient(bitcoinWithLedger)
bitcoinWithLedger.loan = bitcoinLoanWithLedger
bitcoinWithLedger.addProvider(new providers.bitcoin.BitcoinRpcProvider(config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password))
bitcoinWithLedger.addProvider(new providers.bitcoin.BitcoinLedgerProvider({ network: bitcoinNetworks[config.bitcoin.network], segwit: false }))
bitcoinWithLedger.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))
bitcoinWithLedger.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralSwapProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))

const bitcoinWithNode = new Client()
const bitcoinLoanWithNode = new LoanClient(bitcoinWithNode)
bitcoinWithNode.loan = bitcoinLoanWithNode
bitcoinWithNode.addProvider(new providers.bitcoin.BitcoinRpcProvider(config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password))
bitcoinWithNode.addProvider(new providers.bitcoin.BitcoinNodeWalletProvider(bitcoinNetworks[config.bitcoin.network], config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password, 'bech32'))
bitcoinWithNode.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))
bitcoinWithNode.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralSwapProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))

const bitcoinWithJs = new Client()
const bitcoinLoanWithJs = new LoanClient(bitcoinWithJs)
bitcoinWithJs.loan = bitcoinLoanWithJs
bitcoinWithJs.addProvider(new providers.bitcoin.BitcoinRpcProvider(config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password))
bitcoinWithJs.addProvider(new providers.bitcoin.BitcoinJsWalletProvider(bitcoinNetworks[config.bitcoin.network], generateMnemonic(256), 'bech32'))
bitcoinWithJs.addProvider(new providers.bitcoin.BitcoinSwapProvider({ network: bitcoinNetworks[config.bitcoin.network] }, 'p2wsh'))
bitcoinWithJs.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))
bitcoinWithJs.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralSwapProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2wsh', address: 'p2wpkh'}))

const bitcoinNodeCollateralSwap = new Client()
const bitcoinLoanNodeCollateralSwap = new LoanClient(bitcoinNodeCollateralSwap)
bitcoinNodeCollateralSwap.loan = bitcoinLoanNodeCollateralSwap
bitcoinNodeCollateralSwap.addProvider(new providers.bitcoin.BitcoinRpcProvider(config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password))
bitcoinNodeCollateralSwap.loan.addProvider(new lproviders.bitcoin.BitcoinCollateralSwapProvider({ network: bitcoinNetworks[config.bitcoin.network] }, { script: 'p2sh', address: 'p2wpkh'}))

const bitcoinWithEsplora = new Client()
bitcoinWithEsplora.addProvider(new providers.bitcoin.BitcoinEsploraApiProvider('https://blockstream.info/api'))
bitcoinWithEsplora.addProvider(new providers.bitcoin.BitcoinJsWalletProvider(bitcoinNetworks.bitcoin, generateMnemonic(256), 'bech32'))

const ethereumNetworks = providers.ethereum.networks
const ethereumWithMetaMask = new Client()
ethereumWithMetaMask.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
ethereumWithMetaMask.addProvider(new providers.ethereum.EthereumMetaMaskProvider(metaMaskConnector.getProvider(), ethereumNetworks[config.ethereum.network]))
ethereumWithMetaMask.addProvider(new providers.ethereum.EthereumSwapProvider())

const ethereumWithNode = new Client()
ethereumWithNode.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
ethereumWithNode.addProvider(new providers.ethereum.EthereumSwapProvider())

const ethereumWithLedger = new Client()
ethereumWithLedger.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
ethereumWithLedger.addProvider(new providers.ethereum.EthereumLedgerProvider())
ethereumWithLedger.addProvider(new providers.ethereum.EthereumSwapProvider())

const erc20WithMetaMask = new Client()
erc20WithMetaMask.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
erc20WithMetaMask.addProvider(new providers.ethereum.EthereumMetaMaskProvider(metaMaskConnector.getProvider(), ethereumNetworks[config.ethereum.network]))
erc20WithMetaMask.addProvider(new providers.ethereum.EthereumErc20Provider('We dont have an addres yet'))
erc20WithMetaMask.addProvider(new providers.ethereum.EthereumErc20SwapProvider())

const erc20WithNode = new Client()
erc20WithNode.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
erc20WithNode.addProvider(new providers.ethereum.EthereumErc20Provider('We dont have an addres yet'))
erc20WithNode.addProvider(new providers.ethereum.EthereumErc20SwapProvider())

const erc20WithLedger = new Client()
erc20WithLedger.addProvider(new providers.ethereum.EthereumRpcProvider(config.ethereum.rpc.host))
erc20WithLedger.addProvider(new providers.ethereum.EthereumLedgerProvider())
erc20WithLedger.addProvider(new providers.ethereum.EthereumErc20Provider('We dont have an addres yet'))
erc20WithLedger.addProvider(new providers.ethereum.EthereumErc20SwapProvider())

const httpProvider = new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/7d0d81d0919f4f05b9ab6634be01ee73')
const provider = new HDWalletProvider(generateMnemonic(256), httpProvider, 0, 1, false)
const web3 = new Web3(provider)

const daiMarket = new MarketClient(config.ethereum.contracts.dai, bitcoinWithEsplora, web3, 'ether')
const usdcMarket = new MarketClient(config.ethereum.contracts.usdc, bitcoinWithEsplora, web3, 'mwei')

const markets = [
  { client: daiMarket, currency: 'DAI' },
  { client: usdcMarket, currency: 'USDC' }
]

const chains = {
  bitcoinWithLedger: { id: 'Bitcoin Ledger', name: 'bitcoin', client: bitcoinWithLedger },
  bitcoinWithNode: { id: 'Bitcoin Node', name: 'bitcoin', client: bitcoinWithNode },
  bitcoinWithJs: { id: 'Bitcoin Js', name: 'bitcoin', client: bitcoinWithJs, network: bitcoinNetwork },
  bitcoinNodeCollateralSwap: { id: 'Bitcoin Node Collateral Swap', name: 'bitcoin', client: bitcoinNodeCollateralSwap },
  ethereumWithMetaMask: { id: 'Ethereum MetaMask', name: 'ethereum', client: ethereumWithMetaMask },
  ethereumWithNode: { id: 'Ethereum Node', name: 'ethereum', client: ethereumWithNode },
  ethereumWithLedger: { id: 'Ethereum Ledger', name: 'ethereum', client: ethereumWithLedger },
  erc20WithMetaMask: { id: 'ERC20 MetaMask', name: 'ethereum', client: erc20WithMetaMask },
  erc20WithNode: { id: 'ERC20 Node', name: 'ethereum', client: erc20WithNode },
  erc20WithLedger: { id: 'Erc20 Ledger', name: 'ethereum', client: erc20WithLedger }
}

async function getCollateralSecretParams (chain) {
  const secretA1 = await chains.bitcoinWithNode.client.swap.generateSecret('secretA1')
  const secretA2 = await chains.bitcoinWithNode.client.swap.generateSecret('secretA2')
  const secretA3 = await chains.bitcoinWithNode.client.swap.generateSecret('secretA3')
  const secretA4 = await chains.bitcoinWithNode.client.swap.generateSecret('secretA4')
  const secretB1 = await chains.bitcoinWithNode.client.swap.generateSecret('secretB1')
  const secretB2 = await chains.bitcoinWithNode.client.swap.generateSecret('secretB2')
  const secretB3 = await chains.bitcoinWithNode.client.swap.generateSecret('secretB3')
  const secretB4 = await chains.bitcoinWithNode.client.swap.generateSecret('secretB4')
  const secretC1 = await chains.bitcoinWithNode.client.swap.generateSecret('secretC1')
  const secretC2 = await chains.bitcoinWithNode.client.swap.generateSecret('secretC2')
  const secretC3 = await chains.bitcoinWithNode.client.swap.generateSecret('secretC3')
  const secretC4 = await chains.bitcoinWithNode.client.swap.generateSecret('secretC4')
  const secretD1 = await chains.bitcoinWithNode.client.swap.generateSecret('secretD1')
  const secretD2 = await chains.bitcoinWithNode.client.swap.generateSecret('secretD2')
  const secretD3 = await chains.bitcoinWithNode.client.swap.generateSecret('secretD3')

  const secretHashA1 = sha256(secretA1)
  const secretHashA2 = sha256(secretA2)
  const secretHashA3 = sha256(secretA3)
  const secretHashA4 = sha256(secretA4)
  const secretHashB1 = sha256(secretB1)
  const secretHashB2 = sha256(secretB2)
  const secretHashB3 = sha256(secretB3)
  const secretHashB4 = sha256(secretB4)
  const secretHashC1 = sha256(secretC1)
  const secretHashC2 = sha256(secretC2)
  const secretHashC3 = sha256(secretC3)
  const secretHashC4 = sha256(secretC4)
  const secretHashD1 = sha256(secretD1)
  const secretHashD2 = sha256(secretD2)
  const secretHashD3 = sha256(secretD3)

  const secrets = {
    secretA1, secretA2, secretA3, secretA4,
    secretB1, secretB2, secretB3, secretB4,
    secretC1, secretC2, secretC3, secretC4,
    secretD1, secretD2, secretD3
  }
  const secretHashes = {
    secretHashA1, secretHashA2, secretHashA3, secretHashA4,
    secretHashB1, secretHashB2, secretHashB3, secretHashB4,
    secretHashC1, secretHashC2, secretHashC3, secretHashC4,
    secretHashD1, secretHashD2, secretHashD3
  }

  return {
    secrets,
    secretHashes
  }
}

async function getCollateralParams (chain) {
  const refundableValue = config[chain.name].value / 2
  const seizableValue = config[chain.name].value
  const values = { refundableValue, seizableValue }

  const borrowerPubKeyAndAddress = await getUnusedPubKeyAndAddress(chain)
  const borrowerAddress = borrowerPubKeyAndAddress.address
  const borrowerPubKey = borrowerPubKeyAndAddress.pubKey

  const lenderPubKeyAndAddress = await getUnusedPubKeyAndAddress(chain)
  const lenderAddress = lenderPubKeyAndAddress.address
  const lenderPubKey = lenderPubKeyAndAddress.pubKey

  const arbiterPubKeyAndAddress = await getUnusedPubKeyAndAddress(chain)
  const agentAddress = arbiterPubKeyAndAddress.address
  const arbiterPubKey = arbiterPubKeyAndAddress.pubKey

  const liquidatorPubKeyAndAddress = await getUnusedPubKeyAndAddress(chain)
  const liquidatorAddress = liquidatorPubKeyAndAddress.address
  const liquidatorPubKey = liquidatorPubKeyAndAddress.pubKey
  const liquidatorPubKeyHash = hash160(liquidatorPubKey)

  const addresses = { borrowerAddress, lenderAddress, agentAddress, liquidatorAddress }
  const pubKeys = { borrowerPubKey, lenderPubKey, arbiterPubKey, liquidatorPubKeyHash, liquidatorPubKey }

  const { secrets, secretHashes } = await getCollateralSecretParams(chain)

  const approveExpiration     = parseInt(Date.now() / 1000) + parseInt(Math.random() * 1000000)
  const swapExpiration     = parseInt(Date.now() / 1000) + parseInt(Math.random() * 1500000)
  const liquidationExpiration  = parseInt(Date.now() / 1000) + parseInt(Math.random() * 2000000)
  const seizureExpiration = parseInt(Date.now() / 1000) + parseInt(Math.random() * 3000000)

  const expirations = { approveExpiration, swapExpiration, liquidationExpiration, seizureExpiration }

  return {
    values,
    addresses,
    pubKeys,
    secrets,
    secretHashes,
    expirations
  }
}

async function importBitcoinAddresses (chain) {
  const nonChangeAddresses = await chain.client.getMethod('getAddresses')(0, 99)
  const changeAddresses = await chain.client.getMethod('getAddresses')(0, 99, true)

  const addresses = [ ...nonChangeAddresses, ...changeAddresses ]

  let addressesToImport = []
  for (const address of addresses) {
    addressesToImport.push({ 'scriptPubKey': { 'address': address.address }, 'timestamp': 'now' })
  }

  await chain.client.getMethod('jsonrpc')('importmulti', addressesToImport, { rescan: false })
}

async function fundUnusedBitcoinAddress (chain) {
  const unusedAddress = await chain.client.wallet.getUnusedAddress()
  await chains.bitcoinWithNode.client.chain.sendTransaction(unusedAddress, 100000000)
  await chains.bitcoinWithNode.client.chain.generateBlock(1)
}

async function getUnusedPubKeyAndAddress (chain) {
  if (chain === chains.bitcoinWithNode) {
    const address = (await chain.client.getMethod('getNewAddress')('p2sh-segwit')).address
    let wif = await chain.client.getMethod('dumpPrivKey')(address)
    const wallet = bitcoin.ECPair.fromWIF(wif, bitcoin.networks.regtest)
    return { address, pubKey: wallet.publicKey }
  } else if (chain === chains.bitcoinWithLedger) {
    const { address: sendtoaddress } = await chain.client.getMethod('getUnusedAddress')()

    await chain.client.getMethod('jsonrpc')('sendtoaddress', sendtoaddress, 1)
    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const { address, publicKey } = await chain.client.getMethod('getUnusedAddress')()

    console.log('\x1b[33m', `Initiating ${address}: Watch prompt on wallet`, '\x1b[0m')
    return { address, pubKey: publicKey }
  } else if (chain === chains.bitcoinWithJs) {
    const { address: sendtoaddress } = await chain.client.getMethod('getUnusedAddress')()

    await chain.client.getMethod('jsonrpc')('sendtoaddress', sendtoaddress, 1)
    await chains.bitcoinWithNode.client.chain.generateBlock(1)

    const { address, publicKey } = await chain.client.getMethod('getUnusedAddress')()

    return { address, pubKey: publicKey }
  }
}

async function getSwapParams (chain) {
  const recipientAddress = (await chain.client.wallet.getUnusedAddress()).address
  const refundAddress = (await chain.client.wallet.getUnusedAddress()).address
  const expiration = parseInt(Date.now() / 1000) + parseInt(Math.random() * 1000000)
  const value = config[chain.name].value

  console.log('\x1b[2m', `Swap Params for ${chain.id}`, '\x1b[0m')
  console.log('\x1b[2m', 'Recipient Address:', recipientAddress, '\x1b[0m')
  console.log('\x1b[2m', 'Refund Address:', refundAddress, '\x1b[0m')
  console.log('\x1b[2m', 'Expiry:', expiration, '\x1b[0m')
  console.log('\x1b[2m', 'Value:', value, '\x1b[0m')

  return {
    recipientAddress,
    refundAddress,
    expiration,
    value
  }
}

async function initiateAndVerify (chain, secretHash, swapParams) {
  console.log('\x1b[33m', `Initiating ${chain.id}: Watch prompt on wallet`, '\x1b[0m')
  const initiationParams = [swapParams.value, swapParams.recipientAddress, swapParams.refundAddress, secretHash, swapParams.expiration]
  const [initiationTx, initiationTxId] = await Promise.all([
    chain.client.swap.findInitiateSwapTransaction(...initiationParams),
    chain.client.swap.initiateSwap(...initiationParams)
  ])
  expect(initiationTx.hash).to.equal(initiationTxId)
  const isVerified = await chain.client.swap.verifyInitiateSwapTransaction(initiationTxId, ...initiationParams)
  expect(isVerified).to.equal(true)
  console.log(`${chain.id} Initiated ${initiationTxId}`)
  return initiationTxId
}

async function claimAndVerify (chain, initiationTxId, secret, swapParams) {
  console.log('\x1b[33m', `Claiming ${chain.id}: Watch prompt on wallet`, '\x1b[0m')
  const secretHash = crypto.sha256(secret)
  const [claimTx, claimTxId] = await Promise.all([
    chain.client.swap.findClaimSwapTransaction(initiationTxId, swapParams.recipientAddress, swapParams.refundAddress, secretHash, swapParams.expiration),
    chain.client.swap.claimSwap(initiationTxId, swapParams.recipientAddress, swapParams.refundAddress, secret, swapParams.expiration)
  ])
  console.log(`${chain.id} Claimed ${claimTxId}`)
  return claimTx
}

async function refund (chain, initiationTxId, secretHash, swapParams) {
  console.log('\x1b[33m', `Refunding ${chain.id}: Watch prompt on wallet`, '\x1b[0m')
  const refundTxId = await chain.client.swap.refundSwap(initiationTxId, swapParams.recipientAddress, swapParams.refundAddress, secretHash, swapParams.expiration)
  console.log(`${chain.id} Refunded ${refundTxId}`)
  return refundTxId
}

async function expectBalance (chain, address, func, comparison) {
  const balanceBefore = await chain.client.chain.getBalance([address])
  await func()
  await sleep(5000) // Await block time
  const balanceAfter = await chain.client.chain.getBalance([address])
  comparison(balanceBefore, balanceAfter)
}

function mineBitcoinBlocks () {
  if (config.bitcoin.mineBlocks) {
    let interval
    before(async () => {
      interval = setInterval(() => {
        chains.bitcoinWithNode.client.chain.generateBlock(1)
      }, 1000)
    })
    after(() => clearInterval(interval))
  }
}

function connectMetaMask () {
  before(async () => {
    console.log('\x1b[36m', 'Starting MetaMask connector on http://localhost:3333 - Open in browser to continue', '\x1b[0m')
    await metaMaskConnector.start()
  })
  after(async () => metaMaskConnector.stop())
}

function deployERC20Token (client) {
  before(async () => {
    console.log('\x1b[36m', 'Deploying the ERC20 token contract', '\x1b[0m')
    const bytecode = '608060405234801561001057600080fd5b5060408051678ac7230489e800008152905133916000917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9181900360200190a3336000908152602081905260409020678ac7230489e80000905561055b8061007a6000396000f3fe608060405260043610610087577c0100000000000000000000000000000000000000000000000000000000600035046306fdde03811461008c578063095ea7b31461011657806323b872dd14610163578063313ce567146101a657806370a08231146101d157806395d89b4114610216578063a9059cbb1461022b578063dd62ed3e14610264575b600080fd5b34801561009857600080fd5b506100a161029f565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100db5781810151838201526020016100c3565b50505050905090810190601f1680156101085780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561012257600080fd5b5061014f6004803603604081101561013957600080fd5b50600160a060020a0381351690602001356102d6565b604080519115158252519081900360200190f35b34801561016f57600080fd5b5061014f6004803603606081101561018657600080fd5b50600160a060020a0381358116916020810135909116906040013561033c565b3480156101b257600080fd5b506101bb6103ab565b6040805160ff9092168252519081900360200190f35b3480156101dd57600080fd5b50610204600480360360208110156101f457600080fd5b5035600160a060020a03166103b0565b60408051918252519081900360200190f35b34801561022257600080fd5b506100a16103c2565b34801561023757600080fd5b5061014f6004803603604081101561024e57600080fd5b50600160a060020a0381351690602001356103f9565b34801561027057600080fd5b506102046004803603604081101561028757600080fd5b50600160a060020a038135811691602001351661040f565b60408051808201909152600a81527f546f6b656e205465737400000000000000000000000000000000000000000000602082015281565b336000818152600160209081526040808320600160a060020a038716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a350600192915050565b600160a060020a038316600090815260016020908152604080832033845290915281205482111561036c57600080fd5b600160a060020a03841660009081526001602090815260408083203384529091529020805483900390556103a184848461042c565b5060019392505050565b601281565b60006020819052908152604090205481565b60408051808201909152600481527f5357415000000000000000000000000000000000000000000000000000000000602082015281565b600061040633848461042c565b50600192915050565b600160209081526000928352604080842090915290825290205481565b600160a060020a038216151561044157600080fd5b600160a060020a03831660009081526020819052604090205481111561046657600080fd5b600160a060020a038216600090815260208190526040902054818101101561048d57600080fd5b600160a060020a03808316600081815260208181526040808320805495891680855282852080548981039091559486905281548801909155815187815291519390950194927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a3600160a060020a0380841660009081526020819052604080822054928716825290205401811461052957fe5b5050505056fea165627a7a72305820db460d87e53e94fdd939b99d2a07ceb235e8a2ce62f7d320cd34a12c1c613a860029'
    let txHash = await client.getMethod('sendTransaction')(null, 0, bytecode)
    let initiationTransactionReceipt = null
    while (initiationTransactionReceipt === null) {
      initiationTransactionReceipt = await client.getMethod('getTransactionReceipt')(txHash)
    }
    const erc20Provider = findLast(
      client._providers,
      provider => provider instanceof providers.ethereum.EthereumErc20Provider, client._providers.length
    )
    erc20Provider._contractAddress = initiationTransactionReceipt.contractAddress
  })
}

export {
  chains,
  metaMaskConnector,
  initiateAndVerify,
  claimAndVerify,
  refund,
  getSwapParams,
  expectBalance,
  sleep,
  mineBitcoinBlocks,
  deployERC20Token,
  connectMetaMask,
  getUnusedPubKeyAndAddress,
  getCollateralParams,
  importBitcoinAddresses,
  fundUnusedBitcoinAddress,
  markets
}
