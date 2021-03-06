var Crowdsale = artifacts.require("./Crowdsale.sol");
var Token = artifacts.require("./SmartToken.sol")
import {advanceBlock} from './helpers/advanceToBlock'
import ether  from './helpers/ether';
const EVMRevert = require('./helpers/EVMRevert.js')
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import BigNumber  from 'bignumber.js'



require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('Crowdsale', function(accounts) {


  describe('Crowdsale Initialization', async () => {

    let START_TIME;
    let DURATION = 14;
    let RATE = 10;
    let TOKEN = accounts[9];
    let CAP = 10;
    let WALLET = accounts[8];
    let MIN_WEI = ether(0.01);

    let STAGE = {
      Preparing: 0,
      Presale: 1,
      Success: 2,
      Finalized: 3
    }

    before(async function() {
      await advanceBlock()
    })

    beforeEach(async () => {
      START_TIME = latestTime() + duration.weeks(1);
    })

    it('should throw startTime is less than the current time', async () => {
      let BAD_START_TIME = latestTime() - 10;
      await Crowdsale.new(BAD_START_TIME, DURATION, RATE, WALLET, TOKEN, CAP, MIN_WEI)
      .should.be.rejectedWith(EVMRevert);

    })
    // it('should throw rate is less than 1 is less than the current time', async () => {
    //   let BAD_RATE = 0;
    //   await Crowdsale.new(START_TIME, DURATION, BAD_RATE, WALLET, TOKEN, CAP, MIN_WEI)
    //   .should.be.rejectedWith(EVMRevert);
    // })

    it('should throw if duration is less than 0', async () => {
      let BAD_DURATION = 0;
      await Crowdsale.new(START_TIME, BAD_DURATION, RATE, WALLET, TOKEN, CAP, MIN_WEI)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if WALLET is zero', async () => {
      let BAD_WALLET = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, BAD_WALLET, TOKEN, CAP, MIN_WEI)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if TOKEN address zero', async () => {
      let BAD_TOKEN = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, BAD_TOKEN, CAP, MIN_WEI)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if CAP is zero', async () => {
      let BAD_CAP = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, BAD_CAP, MIN_WEI)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should initalize all the variables with correct values', async() => {

      let crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, CAP, MIN_WEI)
      let startTime = await crowdsale.startTime();
      assert(startTime.toString() == START_TIME.toString());
      const expectedEndTime = START_TIME + duration.days(DURATION);
      let endTime = await crowdsale.endTime()
      assert(endTime.toString() == expectedEndTime.toString());

      let token = await crowdsale.token()
      assert(token == TOKEN);
      let rate = await crowdsale.rate();
      assert(rate == RATE);
      let wallet = await crowdsale.wallet();
      assert(wallet == WALLET);
      let weiRaised = await crowdsale.weiRaised();
      assert(weiRaised == 0)
      let cap = await crowdsale.cap();
      assert(cap == CAP);

      let tiersInitialized = await crowdsale.tiersInitialized();
      assert(tiersInitialized == false);

      var stage = await crowdsale.getStage();
      assert(stage == STAGE.Preparing);


    })
  })

  describe('Crowdsale tiers', async () => {
    let START_TIME;
    let DURATION = 14;
    let RATE = 10;
    let TOKEN = accounts[9];
    let CAP = 10;
    let WALLET = accounts[8];
    let OWNER = accounts[0]
    let NON_OWNER = accounts[1]
    let MIN_WEI = ether(0.01)
    let crowdsale;
    before(async function() {
      await advanceBlock()
    })

    beforeEach(async () => {
      START_TIME = latestTime() + duration.weeks(1);

      crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, CAP, MIN_WEI)
    })
    it('only owner can call initTiers', async() => {
        let discounts = [10, 20, 30];
        let from = [ether(100000), ether(200000), ether(300000)]
        let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
        let max = [ether(40000000), ether(30000000), ether(30000000)]
        crowdsale.initTiers(discounts, from, to, max, { from : NON_OWNER})
        .should.be.rejectedWith(EVMRevert);
        await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
        .should.not.be.rejectedWith(EVMRevert)
    })

    it('should throw if discount is 0', async () => {

      let discounts = [0, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

    it('should throw if max is 0', async () => {

      let discounts = [30, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), 0, ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

    it('should throw if to is smaller than from', async () => {

      let discounts = [30, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(199999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })


    it('should throw if from of second one is smaller than from', async () => {
      let discounts = [30, 20, 30];
      let from = [ether(100000), ether(199999), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

    it('should throw if from tier 1 is 0', async () => {

      let discounts = [10, 20, 30];
      let from = [ether(0), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

      it('should throw with same tier initialization', async () => {

      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(100000), ether(300000)]
      let to = [ether(199999), ether(199999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

      it('should throw if max total more than 10000000', async () => {

      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(100000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(40000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })


      it('should throw if max from is bigger than to in tier 2', async () => {

      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(299999), ether(300000)]
      let to = [ether(199999), ether(299998), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(40000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.be.rejectedWith(EVMRevert)
    })

    it('should initialize the tiers correctly', async () => {
      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      .should.not.be.rejectedWith(EVMRevert)

      for(var i=0;i<discounts.length;i++) {
        let t = await crowdsale.tiers(i)
        t[0].should.be.bignumber.equal(discounts[i]);
        t[1].should.be.bignumber.equal(from[i]);
        t[2].should.be.bignumber.equal(to[i]);
        t[3].should.be.bignumber.equal(max[i]);
      }

      let tiersInitialized = await crowdsale.tiersInitialized();
      assert(tiersInitialized == true);

    })
  })

  describe('Token sale', async () => {
    let STAGE = {
      Preparing: 0,
      Presale: 1,
      Success: 2,
      Finalized: 3
    }

    let START_TIME;
    let DURATION = 14;
    let RATE = 20000;
    let token;
    let CAP = ether(30);
    let WALLET = accounts[8];
    let OWNER = accounts[0]
    let NON_OWNER = accounts[1]
    let MIN_WEI = ether(0.01);
    let crowdsale;
    before(async function() {
      await advanceBlock()
    })

    beforeEach(async () => {
      START_TIME = latestTime() + duration.weeks(1);
      token = await Token.new("T", "T", 18, 1000000);
      crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, token.address, CAP, MIN_WEI)
      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      await token.transfer(crowdsale.address, ether(1000000));
      await increaseTimeTo(START_TIME + duration.days(1));
      let stage = await crowdsale.getStage();
      assert(stage == STAGE.Presale);
    })

    it('it should send 20000 tokens for 1 ETH', async() => {
      await crowdsale.sendTransaction({ value : ether(1), from : NON_OWNER })
      let balance = await token.balanceOf(NON_OWNER)
      balance.should.be.bignumber.equal(ether(RATE));
    })


    it('it should throw if anything less than the total tokens is sent', async () => {
      await crowdsale.sendTransaction({ value: ether(0.001), from : accounts[6] })
      .should.be.rejectedWith(EVMRevert);
    })

    it('it should send 80000 tokens for 4 ETH', async () => {
      await crowdsale.sendTransaction({ value : ether(4), from : accounts[4] })
      let balance = await token.balanceOf(accounts[4])
      balance.should.be.bignumber.equal(ether(80000));
    })



    it('it should send 110,000 tokens for 5 ETH', async () => {
      let currentTier = await crowdsale.tiers(0);
      let tokensRemaining = currentTier[3];
      await crowdsale.sendTransaction({ value : ether(5), from : accounts[4] })
      let balance = await token.balanceOf(accounts[4])
      balance.should.be.bignumber.equal(ether(110000));
      currentTier = await crowdsale.tiers(0);
      let remainingAfter = currentTier[3]
      let diff = tokensRemaining.sub(remainingAfter)
      diff.should.be.bignumber.equal(ether(10000));


    })


    it('it should send 110220 tokens for 5.01 ETH', async () => {
      // 5.01 * 20000 = 100200
      // 100200 + 100200*10/100
      let currentTier = await crowdsale.tiers(0);
      let tokensRemaining = currentTier[3];
      await crowdsale.sendTransaction({ value : ether(5.01), from : accounts[6] })
      let balance = await token.balanceOf(accounts[6])
      balance.should.be.bignumber.equal(ether(110220));
      currentTier = await crowdsale.tiers(0);
      let remainingAfter = currentTier[3];
      let diff = tokensRemaining.sub(remainingAfter);
      diff.should.be.bignumber.equal(ether(10020));
    })

    it('it should send 240,000 tokens for 10 ETH', async () => {
      await crowdsale.sendTransaction({ value : ether(10), from : accounts[5] })
      let balance = await token.balanceOf(accounts[5])
      balance.should.be.bignumber.equal(ether(240000));
    })

    it('return the correct contribution', async () => {
      await crowdsale.sendTransaction({ value : ether(0.2), from : accounts[5] })
      let contribution = await crowdsale.contributions(accounts[5])
      contribution.should.be.bignumber.equal(ether(0.2));
    })

    it('return the investor contribution', async () => {
      await crowdsale.sendTransaction({ value : ether(0.02), from : accounts[5] })
      let investor = await crowdsale.investors(0)
      assert (investor == accounts[5]);
    })

    it('return the total wei raised so far', async () => {
      await crowdsale.sendTransaction({ value : ether(0.02), from : accounts[5] })
      let weiRaised = await crowdsale.weiRaised()
      weiRaised.should.be.bignumber.equal(ether(0.02));
    })

    it('should forward the funds to the wallet', async () => {
      let currentBalance = web3.eth.getBalance(WALLET);
      await crowdsale.sendTransaction({ value : ether(0.02), from : accounts[5] })
      let expectedBalance = currentBalance.add(ether(0.02));
      let newBalance = web3.eth.getBalance(WALLET)
      newBalance.should.be.bignumber.equal(expectedBalance);
    })

    it('should be in Success when the crowdsale is over', async () => {
      await increaseTimeTo(START_TIME + duration.days(15));
      let stage = await crowdsale.getStage()
      assert(stage == STAGE.Success);
    })

  })

  describe('altcoin functions', async () => {

    let STAGE = {
      Preparing: 0,
      Presale: 1,
      Success: 2,
      Finalized: 3
    }

    let START_TIME;
    let DURATION = 14;
    let RATE = 20000;
    let token;
    let CAP = ether(30);
    let WALLET = accounts[8];
    let OWNER = accounts[0]
    let NON_OWNER = accounts[1]
    let MIN_WEI = ether(0.01);
    let crowdsale;

    before(async function() {
      await advanceBlock()
    })

    beforeEach(async () => {
      START_TIME = latestTime() + duration.weeks(1);
      token = await Token.new("T", "T", 18, 1000000);
      crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, token.address, CAP, MIN_WEI)
      let discounts = [10, 20, 30];
      let from = [ether(100000), ether(200000), ether(300000)]
      let to = [ether(199999), ether(299999), new BigNumber(2).pow(256).sub(1)]
      let max = [ether(40000000), ether(30000000), ether(30000000)]
      await crowdsale.initTiers(discounts, from, to, max, { from : OWNER })
      await token.transfer(crowdsale.address, ether(1000000));
      let stage = await crowdsale.getStage()
      assert(stage == STAGE.Preparing);
    })

    it('buyTokensForAltCoins can be called by the owner or altcoin address', async () => {

      await crowdsale.buyTokensForAltCoins(accounts[1], ether(1), { from : NON_OWNER })
      .should.be.rejectedWith(EVMRevert)

      await crowdsale.buyTokensForAltCoins(accounts[1], ether(1), { from : OWNER })
      .should.not.be.rejectedWith(EVMRevert)

      let altcoinAddress = accounts[2];
      await crowdsale.setAltcoinAddress(altcoinAddress, { from : OWNER })

      let setAltcoinAddress = await crowdsale.altcoinAddress()
      assert(setAltcoinAddress == altcoinAddress)
      await crowdsale.buyTokensForAltCoins(accounts[1], ether(1), { from : altcoinAddress })
      .should.not.be.rejectedWith(EVMRevert)

    })

    it('it should send 20000 tokens for 1 ETH', async() => {

      await crowdsale.buyTokensForAltCoins(NON_OWNER, ether(1), { from : OWNER })
      let balance = await token.balanceOf(NON_OWNER)
      balance.should.be.bignumber.equal(ether(RATE));
      let contribution = await crowdsale.contributions(NON_OWNER)
      contribution.should.be.bignumber.equal(ether(1))

    })

  })


});
