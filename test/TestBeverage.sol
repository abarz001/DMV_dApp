pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Beverage.sol";

contract TestBeverage {

	//must initial the contract with an initial balance so that this contract can pass wei to the beverage contract
	uint public initialBalance = 400000000000 wei;
 // The address of the beverage contract to be tested
 Beverage beverage = Beverage(DeployedAddresses.Beverage());

 // The id of the beverage that will be used for testing
 // 1 = coke
 uint256 beverageId = 1;

 uint256 expectedId = 1;

 string expectedName = "Coke";

 uint256 expectedCost = 111111111;


 //The address of expected buyer of beverage is the msg.sender
 address expectedBuyer = msg.sender;

 /*// Testing the beverage mapping getter
 function testUserCanGetBeverage() public {
  (uint256 actualId, string memory actualName, uint256 actualCost, uint256 actualCount) = beverage.beverages(beverageId);

  Assert.equal(actualId, expectedId, "The beverage ID should match what is returned.");
}*/

//This deposit should fail since the minimum amount of wei was not deposited
function testUserDepositFail() public {
	beverage.deposit.value(1)();
}

//This deposit should pass since the minimum amount of wei was deposited
function testUserDepositPass() public {
	beverage.deposit.value(100000000000)();
}

}
