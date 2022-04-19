pragma solidity >=0.4.22 <0.6.0;

contract DMV {

    //Variable to hold the msg.sender's address
    //Set to payable since we may have to return unused deposited funds after purchase 
    address payable public buyer;
    
    //Globally creating a price variable
    //Intended to be used for Beverage price & msg.value requirement
    uint256 Price;

  //Struct to model a beverage selection
  struct Beverages {
      uint id;
      string name;
      uint256 cost;
      uint lifeTimeCount;
  }
  
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
    
     uint numberOfBeverageOptions = 0;
  
  
    // Mapping for Beverages
    mapping(uint => Beverages) public beverages;
    
    // Mapping for a user (msg.sender)
    mapping(address => Purchases) public userPurchase;
  
   //Constructor function initializes the 4 default drink choices
   constructor () public {
        Price = 1000000000000000; //wei... 0.001 Eth
        buyer = msg.sender;
        addBeverage("Coke");
        addBeverage("Pepsi");
        addBeverage("Dr. Pepper");
        addBeverage("Mountain Dew");
    }
    
    //This function is called by the constructor() and adds a beverage to the beverage mapping
    //The mapping's key is based off of the incrementor
    //Each beverage's cost is currently set to 0.001 ETH (1,000,000,000,000,000 wei)
    //Total purchased count per beverage is initialized to zero
    function addBeverage (string memory _name) private {
        numberOfBeverageOptions++;
        beverages[numberOfBeverageOptions] = Beverages(numberOfBeverageOptions, _name, Price, 0);
    }
    
    //This function gets the current global Price value
    function getPrice () public view returns(uint256){
        return Price;
    }
    
    //This function sets the global Price variable with the supplied value
    function setPrice (uint256 _price) public {
        Price = _price;
        setBevCost();
    }
    
    //This function sets the cost of each beverage with the value of the global Price variable
    function setBevCost() private{
        beverages[1].cost = Price;
        beverages[2].cost = Price;
        beverages[3].cost = Price;
        beverages[4].cost = Price;
    }
    
    
    //This function allows the buyer to deposit funds into the contract
    //The deposit MUST be at least the cost of 1 beverage, which at the start is 0.001ETH
    //Then it sets the individual user's purse variable to the amount deposited 
    //We don't want to deposit funds into the contract and have anyone else withdraw from it
    function deposit() public payable returns (uint256, uint256){
        require(
            msg.value >= Price,
            "Error: Insufficient Deposit (Deposit of current cost required)"
            );
        buyer = msg.sender;
        
        userPurchase[buyer].purse += msg.value;
        return (address(this).balance, userPurchase[buyer].purse);
    }
    
    
    //subtract the total cost of the current beverage selection from the user's purse
    function calcPurseBalance (uint256 _totalCost) private{
        userPurchase[buyer].purse -= _totalCost;
    }
    
    //This is the main selection function; it takes in the beverage ID (1-4) and the quantity
    //It requires that the msg.sender's avaiable funds be able to cover the quantity
    //If so, it increments the total number of that beverage purchased (for vendor usage in another contract)
    //It increases the purchased count for the msg.sender (for redemption in another contract)
    //And it calculates the purse balance
    function select (uint _beverageID, uint _count) public payable returns (bool){
        buyer = msg.sender;
   
        //requires that buyer's balance (purse) can accomodate current purchase count
        require(
            userPurchase[buyer].purse >= (_count * beverages[_beverageID].cost),
            "Error: Insufficient Funds"
            );
        
        require(
            (_beverageID > 0 && _beverageID <5),
            "Error: Invalid Selection"
            );
        
        //variable to hold the total cost of the 
        uint256 totalCost = _count * beverages[_beverageID].cost;
        
        //increase the total number of Cokes ever ordered 
        beverages[_beverageID].lifeTimeCount += _count;
        
        //increase the total number of the respective beverage the buyer has ever ordered
        if(_beverageID == 1){userPurchase[buyer].cokePurchaseCount += _count; }
        else if(_beverageID == 2){userPurchase[buyer].pepsiPurchaseCount += _count;}
        else if(_beverageID == 3){userPurchase[buyer].drpPurchaseCount += _count;}
        else if(_beverageID == 4){userPurchase[buyer].dewPurchaseCount += _count; }
    
        //deduct the purchase from the user's purse
        calcPurseBalance(totalCost);
    
        return true;
    }
    
    //return the current user's purse back to the user's account
    //zero out the current user's purse
    function coinReturn () public payable {
        buyer = msg.sender;
        require(
            userPurchase[buyer].purse > 0,
            "Error: No funds to return"
            );
            
        buyer.transfer(userPurchase[buyer].purse);
        userPurchase[buyer].purse -= userPurchase[buyer].purse;
    }  

        
    
}
