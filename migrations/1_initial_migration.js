const Migrations = artifacts.require("Migrations");
const Beverage = artifacts.require("Beverage");
const Redeem = artifacts.require("Redeem");
const extBeverage = artifacts.require("extBeverage");
const Restock = artifacts.require("Restock");
const BeverageIFace = artifacts.require("BeverageIFace");
const RedeemIFace = artifacts.require("RedeemIFace");

module.exports = function(deployer) {
  deployer.deploy(Migrations);

  //Deploy the interface contracts that Redeem.sol and Beverage.sol use
  deployer.deploy(extBeverage);
  deployer.deploy(BeverageIFace);
  deployer.deploy(RedeemIFace);

  //Deploy Beverage, then deploy Redeem, passing in Beverage's newly deployed address
  //THEN deploy Restock, passing in Redeem AND Beverage's newly deployed addresses
  deployer.deploy(Beverage).then(function() {
  return deployer.deploy(Redeem, Beverage.address);
  }).then(function(){
  return deployer.deploy(Restock, Redeem.address, Beverage.address); 
  });

};
