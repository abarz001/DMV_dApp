const Migrations = artifacts.require("Migrations");
const DMV = artifacts.require("DMV");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(DMV)
};
