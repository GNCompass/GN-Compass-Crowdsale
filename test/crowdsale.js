var Crowdsale = artifacts.require("./Crowdsale.sol");
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
      await Crowdsale.new(BAD_START_TIME, DURATION, RATE, WALLET, TOKEN, CAP)
      .should.be.rejectedWith(EVMRevert);

    })
    it('should throw rate is less than 1 is less than the current time', async () => {
      let BAD_RATE = 0;
      await Crowdsale.new(START_TIME, DURATION, BAD_RATE, WALLET, TOKEN, CAP)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if duration is less than 0', async () => {
      let BAD_DURATION = 0;
      await Crowdsale.new(START_TIME, BAD_DURATION, RATE, WALLET, TOKEN, CAP)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if WALLET is zero', async () => {
      let BAD_WALLET = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, BAD_WALLET, TOKEN, CAP)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if TOKEN address zero', async () => {
      let BAD_TOKEN = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, BAD_TOKEN, CAP)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should throw if CAP is zero', async () => {
      let BAD_CAP = '0x0000000000000000000000000000000000000000';
      await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, BAD_CAP)
      .should.be.rejectedWith(EVMRevert);
    })

    it('should initalize all the variables with correct values', async() => {

      let crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, CAP)
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
    let crowdsale;
    before(async function() {
      await advanceBlock()
    })

    beforeEach(async () => {
      START_TIME = latestTime() + duration.weeks(1);

      crowdsale = await Crowdsale.new(START_TIME, DURATION, RATE, WALLET, TOKEN, CAP)
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

});
