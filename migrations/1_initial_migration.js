var Migrations = artifacts.require("./Migrations.sol");
var utils = require('./../deployment_utils');
var Promise = require('bluebird');

module.exports = async (deployer) => {
  var args = [];
  console.log(args);
  var params = [web3, Migrations.bytecode, Migrations.abi].concat(args);
  var gas = await utils.getSuggestedGasForContract.apply(utils, params);
  var deployArgs = [Migrations].concat(args);
  deployArgs.push({ gas: gas });
  return deployer.deploy.apply(deployer, deployArgs);
};
