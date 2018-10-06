const Maker = require('@makerdao/dai');
const { MKR, DAI, ETH, WETH, PETH, USD_ETH, USD_MKR, USD_DAI } = Maker;
const makerContracts = require('@makerdao/dai/contracts/contracts').default;
const MatchingMarketInterface = require('../build/contracts/MatchingMarketInterface.json').abi;
const SaiTub = require('../build/contracts/SaiTub.json').abi;
const Web3 = require('web3');


// const truffle = require('truffle');

// TODO: Initialize the class in App.js, then pass that class instance to components
// TODO: Check all the units and make sure units of each function call are well documented
// TODO: add checks against _dust values
// TODO: add set exchange rates functions
// TODO: should provide functions that give user option to enter address for the tokens he wants to buy/sell
// TODO: make into a dai.js service
// TODO: display contract info on front-end (number of offers, etc.)
// TODO: make an option to use on kovan with metamask account
// TODO: error catching

class DaiTestchainService {

  // TODO: deploy OasisDirect contract from this script and log the address, then there is no need for user to do it
  //        return it in some way, then put it in the tutorial contract constructor, so user just has to run:
  //        truffle console
  //        const DaiTestchainService = require("file")
  //        foo = new DaiTestchainService()
  //        truffle compile
  //        truffle migrate tutorialContract foo.OasisDirectAddress

  // TODO: take account argument to determine which account tx's come from
  constructor() {
    this._initialized = this._initialize();
  }


  // Workaround to using async functions to initialize web3, dai.js, and
  // dai/weth contracts before running any other functions
  async _initialize() {
    // Set Web3 to the dai.js testchain instance (localhost:2000)
    const web3Provider = new Web3.providers.HttpProvider("http://localhost:2000");
    this.web3 = await new Web3(web3Provider);

    // TODO: REMOVE
    //  Http Provider
    // is used for wider support, but WebSocket provider is needed to subscribe
    // to events. If WebSocket not supported, UI will still funciton, but will
    // need to be refreshed to update list of offers in the market
    // const eventProvider = new Web3.providers.WebsocketProvider("http://localhost:2000")
    // this.eventWeb3 = await new Web3(eventProvider);

    // Create accounts array
    this.accounts = await this.web3.eth.getAccounts();

    // Instantiate Maker object and authenticate dai.js services and APIs
    this.maker = Maker.create('test');
    await this.maker.authenticate();

    // Use dai.js smartContract service to establish instance of Oasis 
    // exchange contract
    const smartContractService = this.maker.service('smartContract');
    this.oasisContractService = smartContractService.getContractByName(
      makerContracts.MAKER_OTC,
      { hybrid: false }
    )
    
    // Use dai.js allowance service to establish instances of Weth and Dai 
    // token contracts. This is actually done through the "token" service,
    // but allowance service inherits from token service and is used 
    // in order to approve transfers to OasisDEX below
    const tokenAllowanceService = this.maker.service('allowance');
    this.wethToken = tokenAllowanceService.get('token').getToken(WETH);
    this.daiToken = tokenAllowanceService.get('token').getToken(DAI);

    // Add contract addresses
    this.makerContractAddresses = {
      // Declared differently becuase of different implementations in
      // smartContractService and ethereumTokenService (.address vs .address())
      oasis: this.oasisContractService.address,
      weth: this.wethToken.address(),
      dai: this.daiToken.address(),
    }

    // Approve OasisDEX to transfer weth and dai tokens
    await this.wethToken.approveUnlimited(this.makerContractAddresses.oasis);
    await this.daiToken.approveUnlimited(this.makerContractAddresses.oasis);

    // User dai.js price service to get the current USD price of ETH
    this.price = this.maker.service('price');
    this.eth_usd_price = (await this.price.getEthPrice())._amount;

    // Initialize dai.js exchange service to interact with the OasisDEX contract
    this.oasisExchange = this.maker.service('exchange');

    // Create an instance of the OasisDEX contract to interact with for functions
    // not included in dai.js exchange service
    const OasisDex = await new this.web3.eth.Contract(
      MatchingMarketInterface, 
      this.makerContractAddresses.oasis
    );
    
    this.oasisContract = OasisDex.methods;
    this.oasisEvents = OasisDex.events

    // TODO: REMOVE
    this.SaiTubContractService = smartContractService.getContractByName(
      makerContracts.SAI_TUB,
      { hybrid: false }
    )
    const SaiTubAddress =this.SaiTubContractService.address;
    console.log("Sai Tube Address: ", SaiTubAddress);
    const Sai_Tub_Contract = await new this.web3.eth.Contract(
      SaiTub,
      SaiTubAddress
    );
    const saiMarketCap = await Sai_Tub_Contract.methods.cap().call();
    console.log("Original Sai Tub Market Cap: ", saiMarketCap);

    // 3000000000000000000000
    // TODO: change the market cap
    const param = this.web3.utils.fromUtf8("cap");
    const val = 300
    // await Sai_Tub_Contract.methods.mold(param, val).send({from: this.accounts[0], gasLimit: 5500000});
    const newSaiMarketCap = await Sai_Tub_Contract.methods.cap().call();
    console.log("New Sai Tub Market Cap: ", newSaiMarketCap);
    console.log("CONTRACT:\n", OasisDex);
    // TODO: remove
    // await truffle.compile;
    // await truffle.migrate;

    // Log Maker contract addresses for user
    console.log("OasisDEX Contract address: ", this.makerContractAddresses.oasis);
    console.log("Weth Token Contract Address: ", this.makerContractAddresses.weth);
    console.log("Dai Token Contract Address: ", this.makerContractAddresses.dai);

    return true;
  }


  async makeDai(daiAmt) {
    // Creates a cdp, locks ETH in it, and draws daiAmount of dai
    // **daiAmt is in Eth units, not Wei
    console.log("Made it to top of makeDai().");

    // Check that initialize() function has completed
    await this._initialized;

    // Collateralization Ratio. Must be > 1.5 (currently)
    const collatRatio = 2;

    // Amount to lock in cdp (in ETH not WEI units). Calculated from 
    // the USD/ETH price. Ideally, this would be the DAI/ETH price, but 
    // there is not currently an easy way to get DAI/ETH price, so 
    // collatRatio is set high to account for variation in DAI/USD price. 
    const lockAmount = (daiAmt / this.eth_usd_price) * collatRatio;

    // Open a cdp and lock eth in it. Note that units of eth_usd_price
    // are carried through, so lockAmount in ETH is locked, not in Wei
    const cdp = await this.maker.openCdp();
    console.log("Made it past makeDai() -- maker.openCdp().");
    console.log("CDP: ", cdp);

    await cdp.lockEth(0.5);
    // await cdp.lockEth(lockAmount);
    console.log("Made it past makeDai() -- cdp.lockEth().");
    
    
    console.log("Dai Amount: ", daiAmt);
    const cdpInfo = await cdp.getInfo();
    console.log("CDP Info: ");
    console.log(cdpInfo[0].toString());
    console.log(cdpInfo[1].toString());
    console.log(cdpInfo[2].toString());
    console.log(cdpInfo[3].toString());

    // CdpId 1
    // 2000000000000000000
    // CDPID 13
    // 2000000000000000000

    // Cup struct from tub Contract. This is what cdp.getInfo() returns
    // struct Cup {
    //   address  lad;      // CDP owner
    //   uint256  ink;      // Locked collateral (in SKR)
    //   uint256  art;      // Outstanding normalised debt (tax only)
    //   uint256  ire;      // Outstanding normalised debt
    // }

    // DRAWDAI() function from dai.js EthereumCdpService
    // drawDai(cdpId, amount, unit = DAI) {
    //   const hexCdpId = numberToBytes32(cdpId);
    //   const value = getCurrency(amount, unit).toEthersBigNumber('wei');
    //   return this._tubContract().draw(hexCdpId, value);
    // }

    // TODO: Failing on cdp.drawDai
    await cdp.drawDai(daiAmt);
    console.log("Made it past makeDai() -- cdp.drawDai.");
  }


  async offer(sellAmt, sellToken, buyAmt, buyToken, sellTokenName='', buyTokenName='') {
    // Makes a limit offer on OasisDEX
    console.log("Made it to top of this.offer().");
    // Check that initialize() function has completed
    await this._initialized;
    console.log("Made it past this.offer() -- this.initialized().");
    // Convert tx amounts to Wei
    const weiSellAmt = this.web3.utils.toWei(sellAmt.toString(), 'ether');
    const weiBuyAmt = this.web3.utils.toWei(buyAmt.toString(), 'ether');

    // Use dai.js exchange service to make an offer on OasisDEX
    await this.oasisExchange.offer(
      weiSellAmt,     // Total amount to sell
      sellToken,      // Address of token to sell
      weiBuyAmt,      // Total amount to buy
      buyToken,       // Address of token to buy
      0,              // pos
      {gasLimit: 5500000}
    );

    console.log("Made it past this.offer() -- this.oasisExchange.offer().");

    // // TODO: Remove?
    // // Make a limit offer on OasisDex. Use contract instance rather than dai.js
    // await this.oasisContract.offer(
    //   weiSellAmt,     // Total amount to sell
    //   sellToken,      // Address of token to sell
    //   weiBuyAmt,      // Total amount to buy
    //   buyToken,       // Address of token to buy
    //   0,              // pos
    //   {from: this.accounts[0], gasLimit: 5500000}
    // );

    // If no tokenNames were provided, use contract addresses
    if (sellTokenName === '')
      sellTokenName = "tokens at address " + sellToken;
    if (buyTokenName === '')
      buyTokenName = "tokens at address " + buyToken;

    // TODO: should check if offer was filled already
    // Log the offer
    console.log("\nLimit offer made.\nSelling: ", sellAmt, " ", sellTokenName, "\nAsking for: ", buyAmt, " ", buyTokenName, "\n")

  }


  async offerDaiForWeth(daiAmt, sellPrice=0) {
    // Creates Dai and places a limit offer on OasisDEX, selling dai for weth
    console.log("Made it to top of this.offerDaiForWeth().");
    // Check that initialize() function has completed
    await this._initialized;
    console.log("Made it past this.offerDaiForWeth() -- this.initialized().");
    // **sellPrice is total cost of the dai sold, in Weth (ETH units, not Wei). 
    // Defaults to the inverse of USD price of ETH, which is ~ equal to 
    // the current market price of dai
    if (sellPrice === 0)
      sellPrice = (1 / this.eth_usd_price) * daiAmt;
    console.log("Made it past this.offerDaiForWeth() -- sellPrice determination.");
    // TODO: FAILING ON makeDai() at low weth price after several offers?

    // Create a cdp, lock eth, and draw dai
    await this.makeDai(daiAmt);
    console.log("Made it past this.offerDaiForWeth() -- this.makeDai().");
    // Make an offer on OasisDex
    await this.offer(daiAmt, this.makerContractAddresses.dai, sellPrice, this.makerContractAddresses.weth, "Dai", "Weth");
    console.log("Made it past this.offerDaiForWeth() -- this.offer().");
  }


  async offerWethForDai(wethAmt, sellPrice=0) {
    // Places a limit offer on OasisDex, selling Weth for Dai
    console.log("Top of offerWethForDai(", wethAmt, ", ", sellPrice, ")");
    
    // Check that initialize() function has completed
    await this._initialized;
    console.log("Passed initialization.");

    // **price is total cost of the Weth sold, in Dai (ETH units, not Wei). 
    // Defaults to the USD price of ETH, which is ~ equal to the current market price of dai
    if (sellPrice === 0)
      sellPrice = (this.eth_usd_price) * wethAmt;
    
    // Wrap ETH (ETH => WETH)
    console.log("Above this.wethToken.deposit");
    // await this.wethToken.deposit(wethAmt, ETH);
    await this.wethToken.deposit(wethAmt);
    console.log("Below this.wethToken.deposit");

    // Make an offer on OasisDex
    await this.offer(wethAmt, this.makerContractAddresses.weth, sellPrice, this.makerContractAddresses.dai, "Weth", "Dai");
  }

  async seed(seedCount=5, daiAmt=400, wethAmt=1) {
    // "Seeds" the market with offset orders near market value, so there 
    // are {seedCount} number of offers on each side of the market, but 
    // the orders do not fulfill each other

    // Check that initialize() function has completed
    await this._initialized;

    const daiMultiplier = 0.99
    const wethMultiplier = 1.01
    let daiRate = this.eth_usd_price * daiMultiplier;
    let wethRate = this.eth_usd_price * wethMultiplier;
    let daiSellPrice;
    let wethSellPrice;
    
    console.log("Initial daiRate: ", daiRate);
    console.log("Initial wethRate: ", wethRate);
    
    // 400 ETH per USD
    for (let i = 0; i < seedCount; i++) {
      daiSellPrice = daiAmt / daiRate;
      console.log("Iteration: " + i + "\ndaiSellPrice: ", daiSellPrice);
      await this.offerDaiForWeth(daiAmt, daiSellPrice);
      
      wethSellPrice = wethAmt * wethRate;
      console.log("wethSellPrice: ", wethSellPrice);
      await this.offerWethForDai(wethAmt, wethRate);

      daiRate = daiRate * daiMultiplier;
      wethRate = wethRate * wethMultiplier
      console.log("New daiRate: ", daiRate);
      console.log("New wethRate: ", wethRate);
    }

    // Every Offer should sell the same amt of dai or weth. The ratio of dai/weth
    // should be offset and should diverge slightly

    // // Offer to sell Dai, Buy Weth
    // await this.offer(daiAmt, this.makerContractAddresses.dai, sellPrice, this.makerContractAddresses.weth, "Dai", "Weth");
    // offerDaiForWeth(daiAmt, sellPrice=)

    // // Offer to sell Weth, Buy Dai
    // await this.offer(wethAmt, this.makerContractAddresses.weth, sellPrice, this.makerContractAddresses.dai, "Weth", "Dai");
    // offerWethForDai(wethAmt, sellPrice=0)

    

    // let multiplier = 1.01;

    // for (let i = 0; i < seedCount; i++) {
      
    // }
  }

  async getOfferCount(sellToken, buyToken) {
    // Check that initialize() function has completed
    await this._initialized;

    // return await this.oasisExchange.getOfferCount(sellToken, buyToken);
    return await this.oasisContract.getOfferCount(sellToken, buyToken).call();
  }
  
  async getBestOffer(sellToken, buyToken) {
    // Returns the offer ID of the best offer for the token pair

    // Check that initialize() function has completed
    await this._initialized;

    return await this.oasisContract.getBestOffer(sellToken, buyToken).call();
  }


  async getWorseOffer(id) {
    // Check that initialize() function has completed
    await this._initialized;

    return await this.oasisContract.getWorseOffer(id).call();
  }


  async getBetterOffer(id) {
    // Check that initialize() function has completed
    await this._initialized;

    return await this.oasisContract.getBetterOffer(id).call();
  }


  async getOffer(id, units="wei") {
    // Check that initialize() function has completed
    await this._initialized;

    const rawOffer = await this.oasisContract.getOffer(id).call();
    
    let sellAmt = rawOffer[0];
    let sellToken = rawOffer[1];
    let buyAmt = rawOffer[2];
    let buyToken = rawOffer[3];

    if (units === "ether") {
      sellAmt = this.web3.utils.fromWei(sellAmt, "ether");
      buyAmt = this.web3.utils.fromWei(buyAmt, "ether");
    }

    if (sellToken.toUpperCase() === this.makerContractAddresses.dai.toUpperCase())
      sellToken = "Dai"
    if (sellToken.toUpperCase() === this.makerContractAddresses.weth.toUpperCase())
      sellToken = "Weth"
    if (buyToken.toUpperCase() === this.makerContractAddresses.dai.toUpperCase())
      buyToken = "Dai"
    if (buyToken.toUpperCase() === this.makerContractAddresses.weth.toUpperCase())
      buyToken = "Weth"

    const offerInfo = {
      id: id,
      sellAmt: sellAmt,
      sellToken: sellToken,
      buyAmt: buyAmt,
      buyToken: buyToken,
    }

    return offerInfo;
  }


  async getTopOffers(sellToken, buyToken, numOffers=5, units="wei") {
    // Check that initialize() function has completed
    await this._initialized;

    let offerCount = await this.getOfferCount(sellToken, buyToken);
    console.log("Offer Count: ", offerCount);

    // Only want top {numOffers} offers
    if (offerCount > numOffers)
      offerCount = numOffers;

    // If there are no offers, return null. offerCount returns a BigNumber,
    // so use toString() method for comparison
    if (offerCount.toString() === '0')
      return null;

    let offers = [];
    
    let topId = await this.getBestOffer(sellToken, buyToken);
    offers.push(await this.getOffer(topId, units));

    for (let i = 2; i <= offerCount; i++) {
      topId = await this.getWorseOffer(topId);
      offers.push(await this.getOffer(topId, units));
    }

    console.log("Sell token for getTopOffers: ", sellToken);
    console.log("getTopOffers() result: ", offers);

    return offers;
  }


  async getWethForDaiOffers(numOffers=5, units="wei") {
    // Check that initialize() function has completed
    await this._initialized;

    return await this.getTopOffers(
      this.makerContractAddresses.weth, 
      this.makerContractAddresses.dai, 
      numOffers,
      units
    );
  }


  async getDaiForWethOffers(numOffers=5, units="wei") {
    // Check that initialize() function has completed
    await this._initialized;

    return await this.getTopOffers(
      this.makerContractAddresses.dai, 
      this.makerContractAddresses.weth, 
      numOffers,
      units
    );
  }


  async cancel(id) {
    // TODO: check that this works
    await this.oasisContract.cancel(id).send({from: this.accounts[0], gasLimit: 5500000});
    console.log("Offer canceled. ID: ", id);
    return true;
  }


  async setEthPrice(newPrice) {
    // Sets the USD price of ETH, in units of USD/ETH

    // Check that initialize() function has completed
    await this._initialized;

    // Set ETH price
    await this.price.setEthPrice(newPrice);

    this.eth_usd_price = (await this.price.getEthPrice())._amount;
    return this.eth_usd_price.toString();
  }

  async getEthPrice() {
    // Returns the current USD price of ETH, in units of USD/ETH

    // Check that initialize() function has completed
    await this._initialized;
    return this.eth_usd_price.toString();
  }

}


export default DaiTestchainService;
// module.exports = DaiTestchainService;