var HDWalletProvider = require('truffle-hdwallet-provider');
var mnemonic = '';
require('babel-register');
require('babel-polyfill');
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: '8545',
      network_id: '*',
    },
    ropsten: {
     provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'),
     network_id: 3
    },
    live: {
       provider: new HDWalletProvider(mnemonic, "https://mainnet.infura.io/"),
       network_id: 1
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    }
 },
};
