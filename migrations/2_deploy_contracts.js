var SmartToken = artifacts.require("./SmartToken.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");
var utils = require('./../deployment_utils');
var Promise = require('bluebird');
function ether(n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'))
}

function latestTime() {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock('latest', (err, block) => {
      console.log(err);
      if(err) reject(err);
      else resolve(block.timestamp);
    })
  })
}

const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};


module.exports = async function(deployer, n, accounts) {

  // var name = "GN Compass";
  // var symbol = "GNCT";
  // var decimal = 18;
  // var totalSupply = 1000000000 //1 billion
  // var args = [name, symbol, decimal, totalSupply];
  // var params = [web3, SmartToken.bytecode, SmartToken.abi].concat(args);
  // var gas = await utils.getSuggestedGasForContract.apply(utils, params);
  // var deployArgs = [SmartToken].concat(args);
  // deployArgs.push({ gas: gas });
  // deployer.deploy.apply(deployer, deployArgs).then(async () => {
  //   var minWei = ether(0.5)
  //   var startTime = (await latestTime()) + duration.minutes(5);
  //   var noOfDays = 14;
  //   var rate = '0x' + (20000).toString(16);
  //   var token = SmartToken.address;
  //   var wallet = '0x6581d57F6ecCD2f8f027e47812Ca3c49E52938a1';
  //   var cap = '0x' + ether(30).toString(16);
  //   var args = [
  //     startTime,
  //     noOfDays,
  //     rate,
  //     wallet,
  //     token,
  //     cap,
  //     minWei.toString(16)
  //   ];
  //   console.log(args);
  //   var params = [web3, Crowdsale.bytecode, Crowdsale.abi].concat(args);
  //   var gas = await utils.getSuggestedGasForContract.apply(utils, params);
  //   var deployArgs = [Crowdsale].concat(args);
  //   deployArgs.push({ gas: gas });
  //   return deployer.deploy.apply(deployer, deployArgs);
  //
  // });
};
