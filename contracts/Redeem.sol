pragma solidity >=0.4.22 <0.6.0;

contract Redeem {
    
    address public user;
    
    //Struct to hold a user's beverage data
    //Intended per msg.sender
    //It tracks the counts for each drink
    //It can be instantiated to hold either total counts redeemed and to-be redeemed
    struct BevCounts{
        uint cokePurchaseCount; 
        uint pepsiPurchaseCount; 
        uint drpPurchaseCount; 
        uint dewPurchaseCount;
    }
    
    //Struct intended to track the number of beverages currently in-stock
    BevCounts bevInStock;

    //Mapping for a user's (msg.sender) lifetime count of beverages redeemed
    mapping(address => BevCounts) public userPurchased;
    
    //Mapping for a user's (msg.sender) lifetime count of beverages redeemed
    mapping(address => BevCounts) public userRedeemed;
    
    //Mapping for a user's (msg.sender) current count of beverages left redeemable
    mapping(address => BevCounts) public userRedeemable;
    
    //Constructor initializes the individual beverage counts at 100
    constructor(address _addr) public{
        bevInStock = BevCounts(10,10,10,10);
        makeExternal(_addr);
    }
    
    //This function increments the current counts of all beverages in-stock by the supplied values
    function setBevInStockCounts(uint _coke, uint _pepsi, uint _drp, uint _dew) public {
       bevInStock.cokePurchaseCount += _coke; 
       bevInStock.pepsiPurchaseCount += _pepsi; 
       bevInStock.drpPurchaseCount += _drp; 
       bevInStock.dewPurchaseCount += _dew;
    }
    
    //This function returns the current counts of all beverages in-stock
    function getBevInStockCounts() public view returns(uint, uint, uint, uint){
        return (bevInStock.cokePurchaseCount, bevInStock.pepsiPurchaseCount, bevInStock.drpPurchaseCount, bevInStock.dewPurchaseCount);
    }
    
    //Flag is intended to signal when makeExternal() has been called
    //Default value is false;
    bool externalFlag = false;

    function returnFlag() public view returns(bool){
        return externalFlag;
    }
    
    //Instantiate local Beverage contract Definition 
    //This instance will be addressed with the externally deployed Beverage contract
    //within the makeExternal() function
    extBeverage externalBev;
    
    //Pass in the external Beverage contract address into this function so that 
    //our local Beverage instance can be assigned its address
    function makeExternal(address _addr) public {
        externalBev = extBeverage(_addr);
        externalFlag = true;
    }
    
    //This function is intended to be called after makeExternal has been called.
    function readUserPurchase() private view returns(uint256 _purse, 
                                               uint _cokePurchaseCount, 
                                               uint _pepsiPurchaseCount, 
                                               uint _drpPurchaseCount, 
                                               uint _dewPurchaseCount) 
                                              { 
                                                  require(
                                                      externalFlag == true, 
                                                      "Error: makeExternal() has not yet been called");
                                                  //user = msg.sender;
                                                  return(externalBev.userPurchase(msg.sender)); 
                                               }
                                                            
    
    //This function is suppose to grab the external values and store them locally to be worked upon
    function userPurchasedCount() private{
        require(
            externalFlag == true, 
            "Error: makeExternal() has not yet been called");

        //This (_purse) is likely going to be unused. 
        //Needed it since readUserPurchase() returns a tuple and BevCounts doesn't match up exactly 
        uint256 _purse;
        
        //initialize the local copy of user's total purchase count
        (_purse, 
        userPurchased[msg.sender].cokePurchaseCount, 
        userPurchased[msg.sender].pepsiPurchaseCount, 
        userPurchased[msg.sender].drpPurchaseCount,
        userPurchased[msg.sender].dewPurchaseCount) = readUserPurchase();
    }

    
    //This function is meant to calculate the quantaties of redeemable beverages per user
    //It is currently set to public in case I want to expose a "refresh" button on the front-end
    function calcCurrentlyRedeemable() public {
         
        userPurchasedCount();
    
        userRedeemable[msg.sender].cokePurchaseCount = 
        userPurchased[msg.sender].cokePurchaseCount - userRedeemed[msg.sender].cokePurchaseCount;
        
        userRedeemable[msg.sender].pepsiPurchaseCount = 
        userPurchased[msg.sender].pepsiPurchaseCount - userRedeemed[msg.sender].pepsiPurchaseCount;
        
        userRedeemable[msg.sender].drpPurchaseCount = 
        userPurchased[msg.sender].drpPurchaseCount - userRedeemed[msg.sender].drpPurchaseCount;
        
        userRedeemable[msg.sender].dewPurchaseCount = 
        userPurchased[msg.sender].dewPurchaseCount - userRedeemed[msg.sender].dewPurchaseCount;
       
       }

    
    //function to redeem
    function redeemBev(uint _beverageID, uint _quantity) public {
        
        calcCurrentlyRedeemable();
        
        require(
            (_beverageID > 0 && _beverageID <5),
            "Error: Invalid Selection"
            );
            
        if(_beverageID == 1){
            require(
                (userRedeemable[msg.sender].cokePurchaseCount >= _quantity),
                "Error: Insufficient Redeemable Coke Beverage Quantity"
            );
            require(
                (bevInStock.cokePurchaseCount >= _quantity),
                "Error: Insufficient Available Coke Beverage Quantity In-Stock"
            );
            
            userRedeemed[msg.sender].cokePurchaseCount += _quantity;
            bevInStock.cokePurchaseCount -= _quantity;
            
        }
        else if(_beverageID == 2){
            require(
                (userRedeemable[msg.sender].pepsiPurchaseCount >= _quantity),
                "Error: Insufficient Redeemable Pepsi Beverage Quantity"
            );
            require(
                (bevInStock.pepsiPurchaseCount >= _quantity),
                "Error: Insufficient Available Pepsi Beverage Quantity In-Stock"
            );
            
            userRedeemed[msg.sender].pepsiPurchaseCount += _quantity;
            bevInStock.pepsiPurchaseCount -= _quantity;
        }
        else if(_beverageID == 3){
            require(
                (userRedeemable[msg.sender].drpPurchaseCount >= _quantity),
                "Error: Insufficient Redeemable Dr. Pepper Beverage Quantity"
            );
            require(
                (bevInStock.drpPurchaseCount >= _quantity),
                "Error: Insufficient Available Dr. Pepper Beverage Quantity In-Stock"
            );
            
            userRedeemed[msg.sender].drpPurchaseCount += _quantity;
            bevInStock.drpPurchaseCount -= _quantity;
        }
        else if(_beverageID == 4){
            require(
                (userRedeemable[msg.sender].dewPurchaseCount >= _quantity),
                "Error: Insufficient Redeemable Mountain Dew Beverage Quantity"
            );
            require(
                (bevInStock.dewPurchaseCount >= _quantity),
                "Error: Insufficient Available Mountain Dew Beverage Quantity In-Stock"
            );
            
            userRedeemed[msg.sender].dewPurchaseCount += _quantity;
            bevInStock.dewPurchaseCount -= _quantity;
        }
        
        //Additional call at the end to ensure local counts are up-to-date after transaction
        calcCurrentlyRedeemable();
        
    }
    
}


contract extBeverage {
    
    //These declarations mirror those in Beverage.sol so that the remote data may be accessed here
    //We are essentially creating an interface to Beverage.sol
    
    //Struct to hold a user's transaction data
    //Intended per msg.sender
    //It tracks the total counts for each drink
    //It tracks the msg.sender's current purse (balance)
    struct Purchases{
        uint256 purse;
        uint cokePurchaseCount; 
        uint pepsiPurchaseCount; 
        uint drpPurchaseCount; 
        uint dewPurchaseCount;
    }
    
    // Mapping for a user (msg.sender)
    mapping(address => Purchases) public userPurchase;
}




