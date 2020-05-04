export default {
  bitcoin: {
    rpc: {
      host: 'http://localhost:18443',
      username: 'bitcoin',
      password: 'local321'
    },
    network: 'bitcoin_regtest',
    value: 1000000,
    mineBlocks: true
  },
  ethereum: {
    rpc: {
      host: 'http://localhost:8545'
    },
    value: 10000000000000000,
    metaMaskConnector: {
      port: 3333
    },
    contracts: {
      dai: {
        funds: '0x7791cF9a85072698e9B805eb8156EC1e9c3fc724',
        loans: '0xa25Ad02862756680Ee8aE7aa9ccC37D3d3F75A4C',
        sales: '0x3171781bcfCd9E111225CDB42f33E856BA9F7A5a',
        collateral: '0x8be077228f4e8977a2366653a75c0eb3d68d86b3',
        p2wsh: '0x095925A67EDE4FE0D794f7797342528B98C7DA15'
      },
      usdc: {
        funds: '0x3528C164e3fCA20E2333Cf58Ab4B1c99DeF83347',
        loans: '0x20233a2095787DAC434F20f8954d3758986EF30E',
        sales: '0xf30Cb0Ae1879b18dEb48932A8a6F362e5789EE01',
        collateral: '0xacce090abee68402a2fb8e3acbc31b58a9341466',
        p2wsh: '0x1C6148Cb6EED725d8F2F01b4F24040a855B40191'
      }
    }
  },
  timeout: 120000 // No timeout
}
