pragma solidity ^0.4.18;


// From Etherscan contract address: 
// 0x8cf1Cab422A0b6b554077A361f8419cDf122a9F9
// (Kovan network)





contract MatchingMarketInterface {

                                         //false: revert to expiring market
    struct sortInfo {
        uint next;  //points to id of next higher offer
        uint prev;  //points to id of previous lower offer
        uint delb;  //the blocknumber where this entry was marked for delete
    }
    mapping(uint => sortInfo) public _rank;                     //doubly linked lists of sorted offer ids
    mapping(address => mapping(address => uint)) public _best;  //id of the highest offer for a token pair
    mapping(address => mapping(address => uint)) public _span;  //number of offers stored for token pair in sorted orderbook
    mapping(address => uint) public _dust;                      //minimum sell amount for a token to avoid dust offers
    mapping(uint => uint) public _near;         //next unsorted offer id
    mapping(bytes32 => bool) public _menu;      //whitelist tracking which token pairs can be traded
    uint _head;                                 //first unsorted offer id


  
    function last_offer_id() public returns (uint);
    function buyEnabled() public view returns (bool);
    function matchingEnabled() public view returns (bool);
    function close_time() public view returns (uint64);
    function _span() public view returns (uint);
    function _best(address, address) public view returns (uint);
    function _dust(address) public view returns (uint);
    function _menu(bytes32) public view returns (bool);
    function _near(uint) public view returns (uint);
    function _rank(uint) public view returns (uint next, uint prev, uint delb);
    function stopped() public view returns (bool);
    function offers(uint id) public view returns (uint pay_amt, address pay_gem, uint buy_amt, address buy_gem, address owner, uint64 timestamp);
    function owner() public view returns (address);
    function authority() public view returns (address);
    function isClosed() public view returns (bool closed);

    function make(address pay_gem, address buy_gem, uint128 pay_amt, uint128 buy_amt) public returns (bytes32);

    function take(bytes32 id, uint128 maxTakeAmount) public;

    function kill(bytes32 id) public;

    function bump(bytes32 id_) public;
    function isActive(uint id) public constant returns (bool active);
    function getOwner(uint id) public constant returns (address owner);

    // Make a new offer. Takes funds from the caller into market escrow.
    //
    // If matching is enabled:
    //     * creates new offer without putting it in
    //       the sorted list.
    //     * available to authorized contracts only!
    //     * keepers should call insert(id,pos)
    //       to put offer in the sorted list.
    //
    // If matching is disabled:
    //     * calls expiring market's offer().
    //     * available to everyone without authorization.
    //     * no sorting is done.
    //
    function offer(uint pay_amt, address pay_gem, uint buy_amt, address buy_gem) public returns (uint);
    

    // Make a new offer. Takes funds from the caller into market escrow.
    function offer(uint pay_amt, address pay_gem, uint buy_amt, address buy_gem, uint pos) public returns (uint);

    function offer(uint pay_amt, address pay_gem, uint buy_amt, address buy_gem, uint pos, bool rounding) public returns (uint);

    //Transfers funds from caller to offer maker, and from market to caller.
    function buy(uint id, uint amount) public returns (bool);

    // Cancel an offer. Refunds offer maker.
    function cancel(uint id) public returns (bool success);

    //insert offer into the sorted list
    //keepers need to use this function
    function insert(uint id, uint pos) public returns (bool);

    //deletes _rank [id]
    //  Function should be called by keepers.
    function del_rank(uint id) public returns (bool);

    //returns true if token is succesfully added to whitelist
    //  Function is used to add a token pair to the whitelist
    //  All incoming offers are checked against the whitelist.
    function addTokenPairWhitelist(address baseToken, address quoteToken) public returns (bool);

    //returns true if token is successfully removed from whitelist
    //  Function is used to remove a token pair from the whitelist.
    //  All incoming offers are checked against the whitelist.
    function remTokenPairWhitelist(address baseToken, address quoteToken) public returns (bool);

    function isTokenPairWhitelisted(address baseToken, address quoteToken) public constant returns (bool);

    //set the minimum sell amount for a token
    //    Function is used to avoid "dust offers" that have
    //    very small amount of tokens to sell, and it would
    //    cost more gas to accept the offer, than the value
    //    of tokens received.
    function setMinSell(address pay_gem, uint dust) public returns (bool);

    //returns the minimum sell amount for an offer
    function getMinSell(address pay_gem) public constant returns (uint);

    //set buy functionality enabled/disabled
    function setBuyEnabled(bool buyEnabled_) public returns (bool);

    //set matching enabled/disabled
    //    If matchingEnabled true(default), then inserted offers are matched.
    //    Except the ones inserted by contracts, because those end up
    //    in the unsorted list of offers, that must be later sorted by
    //    keepers using insert().
    //    If matchingEnabled is false then MatchingMarket is reverted to ExpiringMarket,
    //    and matching is not done, and sorted lists are disabled.
    function setMatchingEnabled(bool matchingEnabled_) public returns (bool);

    //return the best offer for a token pair
    //      the best offer is the lowest one if it's an ask,
    //      and highest one if it's a bid offer
    function getBestOffer(address sell_gem, address buy_gem) public constant returns(uint);

    //return the next worse offer in the sorted list
    //      the worse offer is the higher one if its an ask,
    //      a lower one if its a bid offer,
    //      and in both cases the newer one if they're equal.
    function getWorseOffer(uint id) public constant returns(uint);

    //return the next better offer in the sorted list
    //      the better offer is in the lower priced one if its an ask,
    //      the next higher priced one if its a bid offer
    //      and in both cases the older one if they're equal.
    function getBetterOffer(uint id) public constant returns(uint);

    //return the amount of better offers for a token pair
    function getOfferCount(address sell_gem, address buy_gem) public constant returns(uint);

    //get the first unsorted offer that was inserted by a contract
    //      Contracts can't calculate the insertion position of their offer because it is not an O(1) operation.
    //      Their offers get put in the unsorted list of offers.
    //      Keepers can calculate the insertion position offchain and pass it to the insert() function to insert
    //      the unsorted offer into the sorted list. Unsorted offers will not be matched, but can be bought with buy().
    function getFirstUnsortedOffer() public constant returns(uint);

    //get the next unsorted offer
    //      Can be used to cycle through all the unsorted offers.
    function getNextUnsortedOffer(uint id) public constant returns(uint);

    function getOffer(uint id) public view returns (uint, address, uint, address);
    function getTime() public view returns (uint64);

    function isOfferSorted(uint id) public constant returns(bool);

    function sellAllAmount(address pay_gem, uint pay_amt, address buy_gem, uint min_fill_amount) public returns (uint fill_amt);


    function buyAllAmount(address buy_gem, uint buy_amt, address pay_gem, uint max_fill_amount) public returns (uint fill_amt);

    function getBuyAmount(address buy_gem, address pay_gem, uint pay_amt) public constant returns (uint fill_amt);

    function getPayAmount(address pay_gem, address buy_gem, uint buy_amt) public constant returns (uint fill_amt);

}