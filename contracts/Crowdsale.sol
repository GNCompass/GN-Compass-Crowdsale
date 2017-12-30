pragma solidity ^0.4.17;

import './SmartToken.sol';
import "zeppelin-solidity/contracts/math/Math.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Crowdsale is Ownable {
  using SafeMath for uint256;

  // The token being sold
  //MintableToken public token;
  SmartToken public token;
  mapping(address => uint256) public contributions;
  address[] public investors;


  uint256 public startTime;
  uint256 public endTime;
  address public wallet;

  address public altcoinAddress;

  // how many token units a buyer gets per wei
  uint256 public rate;
  uint256 public minWei;

  // amount of raised money in wei
  uint256 public weiRaised;


  uint256 public cap;
  uint8 public MAX_TIERS = 3;

  struct Tier {
    uint256 discount;
    uint256 from; // from which token (raised to ^18)
    uint256 to;  // to which token (raised to ^18)
    uint256 remaining; // remaining tokens in the tier
  }

  Tier[3] public tiers;

  enum Stage { Preparing, Presale, Success, Finalized }

  bool public tiersInitialized = false;


  function Crowdsale(uint256 _startTime, uint8 _duration, uint256 _rate, address _wallet, address _SmartToken, uint256 _cap, uint256 _minWei) public {
    require(_startTime >= now);
    require(_rate > 0);
    require(_duration > 0);
    require(_wallet != address(0));
    require(_SmartToken != address(0));
    require(_cap > 0);
    token = SmartToken(_SmartToken);


    startTime = _startTime;
    endTime = _startTime + _duration * 1 days;
    rate = _rate;
    wallet = _wallet;
    cap = _cap;
    minWei = _minWei;
  }




  function buyTokensForAltCoins(address buyer, uint256 value) public {
    require(tiersInitialized);
    require(msg.sender == owner || msg.sender == altcoinAddress);
    buyTokens(buyer, value);
  }


  function setAltcoinAddress(address newAddress) public onlyOwner {
    require(newAddress != address(0));
    altcoinAddress = newAddress;

  }

  function initTiers(uint256[] discount, uint256[] from, uint256[] to, uint256[] max) public inStage(Stage.Preparing) onlyOwner {
    require(discount.length == MAX_TIERS && from.length == MAX_TIERS && to.length == MAX_TIERS && max.length == MAX_TIERS);

    for(uint8 i=0;i<MAX_TIERS; i++) {
      require(discount[i] > 0);
      require(to[i] > from[i]);
      require(max[i] > 0);
      require(from[i] > 0);
      if(i>0) {
        require(from[i] > to[i-1]);
      }

      tiers[i] = Tier({
        discount: discount[i],
        from: from[i],
        to: to[i],
        remaining: max[i]
      });


    }

    tiersInitialized = true;
  }

  // fallback function can be used to buy tokens
  function () public inStage(Stage.Presale) payable {
    buyTokens(msg.sender, msg.value);
  }

  function getStage() constant public returns(Stage) {
    if(!tiersInitialized || !hasStarted()) return Stage.Preparing;
    if(!hasEnded()) return Stage.Presale;
    if(hasEnded()) return Stage.Success;
  }

  modifier inStage(Stage stage) {
    require(getStage() == stage);
    _;
  }


  // low level token purchase function
  function buyTokens(address beneficiary, uint256 value) internal {
    require(beneficiary != address(0));
    require(validPurchase(value));
    uint256 weiAmount = value;

    if(weiRaised.add(weiAmount) >= cap) {
      weiAmount = cap.sub(weiRaised);
    }

    uint256 tokens = weiAmount.mul(rate);

    uint discountTokens = calculateDiscount(tokens);

    if(discountTokens > 0) {
      tokens = tokens.add(discountTokens);
    }

    weiRaised = weiRaised.add(weiAmount);

    if(contributions[beneficiary] == 0) {
      investors.push(beneficiary);
    }

    contributions[beneficiary] = contributions[beneficiary].add(weiRaised);
    token.transfer(beneficiary, tokens);

    if(msg.value > 0 && value.sub(weiAmount) > 0) {
      msg.sender.transfer(value.sub(weiAmount));
    }

    if(msg.value > 0) {
      forwardFunds(weiAmount);
    }
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds(uint256 value) internal {
    wallet.transfer(value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase(uint256 value) internal view returns (bool) {
    bool minimumPurchase = value >= minWei;
    bool withinCap = weiRaised < cap;
    return minimumPurchase && withinCap;
  }

  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    return now > endTime || weiRaised >= cap;
  }

  function hasStarted() public view returns (bool) {
    return now > startTime;
  }


  // reclaim unsold tokens after the crowdsale is over
  function reclaimTokens(address _token, address _to) onlyOwner public {
    require(hasEnded());
    SmartToken claimToken = SmartToken(_token);
    uint256 unSoldTokens = claimToken.balanceOf(this);
    claimToken.transfer(_to, unSoldTokens);
  }


  // review this function

  function calculateDiscount(uint256 tokens) internal returns(uint256) {
    if(tokens < tiers[0].from) {
      return 0;
    }
    uint256 extraTokens = 0;

    for(uint8 i=0;i<tiers.length;i++) {
      Tier _tier = tiers[i];
      if(tokens >= _tier.from && tokens <= _tier.to && _tier.remaining > 0) {
        extraTokens = tokens.mul(_tier.discount).div(100);
        if(extraTokens > _tier.remaining) {

          uint remaining = _tier.remaining;
          _tier.remaining = 0;
          tiers[i] = _tier;
          return remaining;

        } else {
          _tier.remaining = _tier.remaining.sub(extraTokens);
          tiers[i] = _tier;
          return extraTokens;
        }
      }
    }

    return extraTokens;
  }
}


/*
10% of 1 B is bonus = 100M
40 M to Tier 1 - 10%
30 M to tier 2 - 20%
30 M to tier 3 - 30%*/
