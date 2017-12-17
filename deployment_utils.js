var Promise = require('bluebird');
var ethers = require('ethers');

async function estimateGas(web3, txData) {
  var eg = Promise.promisify(web3.eth.estimateGas);
  return await eg(txData);
}

async function getGasPrice(web3) {
  var gp = Promise.promisify(web3.eth.getGasPrice);
  return await gp();
}

async function getGasLimit(web3) {
  var gb = Promise.promisify(web3.eth.getBlock);
  var block = await gb('latest');
  return block.gasLimit;
}

async function getSuggestedGas(web3, options) {
  if (!options.increasePercentage) {
    options.increasePercentage = 10;
  }

  var eGas = await this.estimateGas(web3, options.data);
  var gasLimit = await this.getGasLimit(web3);
  var gas = eGas + options.increasePercentage * (eGas - eGas % 100) / 100;
  return Math.min(gas, gasLimit);
}

async function getSuggestedGasForContract(web3, bytecode, abi) {

  var args = Array.prototype.slice.call(arguments);
  var deployArgs = args.slice(1);
  var txData = ethers.Contract.getDeployTransaction.apply(ethers.Contract, deployArgs);
  var gas = await this.getSuggestedGas(web3, { data: txData });
  // var gas = await this.getGasLimit(web3) - 50000
  return gas;
}

module.exports = {
  estimateGas: estimateGas,
  getGasLimit: getGasLimit,
  getGasPrice: getGasPrice,
  getSuggestedGas: getSuggestedGas,
  getSuggestedGasForContract: getSuggestedGasForContract,
};
