const Migrations = artifacts.require("Migrations");
const Beverage = artifacts.require("Beverage");

module.exports = function(deployer) {
  deployer.deploy(Migrations);

  //Deploy Beverage, then deploy Redeem, passing in Beverage's newly deployed address
  //THEN deploy Restock, passing in Redeem AND Beverage's newly deployed addresses
  deployer.deploy(Beverage)
};
