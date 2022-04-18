pragma solidity >=0.4.22 <0.6.0;

contract Restock {
    
    bool externalFlag = false;
    bool externalFlag2 = false;
    
    //Instantiate local Redeem contract definition 
    //This instance will be addressed with the externally deployed Redeem.sol contract's address
    //within the makeExternalRedeem() function
    RedeemIFace externalRed;
    
    //Pass in the external Redeem contract address into this function so that 
    //our local Redeem instance can be assigned its address
    //then set the flag to TRUE to signify the connection
    function makeExternalRedeem(address _addr) public {
        externalRed = RedeemIFace(_addr);
        externalFlag = true;
    }
    
    //Instantiate local Beverage contract definition 
    //This instance will be addressed with the externally deployed Beverage.sol contract's address
    //within the makeExternalBeverage() function
    BeverageIFace externalBev;
    
    //Pass in the external Beverage contract address into this function so that 
    //our local Beverage instance can be assigned its address
    //then set the flag to TRUE to signify the connection
    function makeExternalBeverage(address _addr) public {
        externalBev = BeverageIFace(_addr);
        externalFlag2 = true;
    }
    
    //Four globally declared unsigned ints to hold the values of In-Stock #s from the external Redeem contract 
    uint public coke;
    uint public pepsi;
    uint public drp;
    uint public dew;

        
    //Constructor initializes these values to 0 
    //calls the makeExternal.. functions using passed in addresses
    //this only works if the Truffle Deployer is properly configured to pass in the correct addresses   
    constructor(address _addr1, address _addr2) public{
        coke = 0;
        pepsi = 0;
        drp = 0;
        dew = 0; 

        makeExternalRedeem(_addr1);
        makeExternalBeverage(_addr2); 
    }
    
    //Retrieves the current In-Stock data for each beverage from the external Redeem contract 
    function getInStock() public returns(uint, uint, uint, uint){
        require( externalFlag == true, "Error: makeExternalRedeem() not yet called" );
        (coke, pepsi, drp, dew) = externalRed.getBevInStockCounts();
        return (coke, pepsi, drp, dew);
    }
    
    //Increments the In-Stock beverages from the external Redeem contract with the supplied params
    function restock(uint _coke, uint _pepsi, uint _drp, uint _dew) public{
        require( externalFlag == true, "Error: makeExternal() not yet called" );
        externalRed.setBevInStockCounts(_coke, _pepsi, _drp, _dew);
    }
    
    //Retrieves the current Price variable set globally in the external Beverage.sol contract 
    function getGlobalPrice() public view returns(uint256){
        require( externalFlag2 == true, "Error: makeExternalBeverage() not yet called" );
        return externalBev.getPrice();
    }
    
    //Sets the Price variable defined globally in the external Beverage.sol contract
    //It will also change the cost of each beverage to reflect the new Price
    function setGlobalPriceUpdateCost(uint256 _price) public{
        require( externalFlag2 == true, "Error: makeExternalBeverage() not yet called" );
        externalBev.setPrice(_price);
    }
}

contract RedeemIFace {
    //These declarations mirror those in Redeem.sol so that the remote data may be accessed here
    //We are essentially creating an interface to Redeem.sol
    
    //This function increments the current counts of all beverages in-stock by the supplied values
    function setBevInStockCounts(uint _coke, uint _pepsi, uint _drp, uint _dew) public {}
    
    //This function returns the current counts of all beverages in-stock
    function getBevInStockCounts() public view returns(uint, uint, uint, uint){}
}

contract BeverageIFace {
    //This function gets the current global Price value in Beverage.sol
    function getPrice () public view returns(uint256){}
    
    //This function sets the global Price variable with the supplied value
    function setPrice (uint256 _price) public {}
}