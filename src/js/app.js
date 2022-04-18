App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {

  // Load products.
    $.getJSON('../vehicles.json', function(data) {
      var bevRow = $('#bevRow');
      var bevTemplate = $('#bevTemplate');

      for (i = 0; i < data.length; i ++) {
        bevTemplate.find('.panel-title').text(data[i].name);
        bevTemplate.find('img').attr('src', data[i].picture);
        bevTemplate.find('.name').text(data[i].name);
        bevTemplate.find('.cost').text(data[i].cost);
        bevTemplate.find('.select').attr('id', i);
        bevTemplate.find('.btn-select').attr('data-id', data[i].id);

        bevRow.append(bevTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
      web3 = new Web3(App.web3Provider);
    }

    console.log(web3);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Beverage.json", function(beverage) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Beverage = TruffleContract(beverage);
      // Connect provider to interact with contract
      App.contracts.Beverage.setProvider(App.web3Provider);

      return App.bindEvents();
    });
  },


  bindEvents: function() {
    //bind buttons to their functions
    $(document).on('click', '.btn-deposit', App.depositEth);
    $(document).on('click', '.btn-return', App.cReturn);
    $(document).on('click', '.btn-select', App.select);

    App.contracts.Beverage.deployed().then(function(instance) {
      var beverageInstance = instance;
      $("#contrAddress").html(beverageInstance.address);
      console.log(beverageInstance.address);
    });

     // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        web3.eth.defaultAccount = account;
        $("#accountAddress").html(web3.eth.defaultAccount);
      }
    });

    //if Metamask changes the user account, reload the page.
    window.ethereum.on('accountsChanged', function (accounts) {   location.reload(true);  });

    //Update the UI with the current price AND user's purse upon refresh
    App.updatePurse();
    return App.getCost();
  },


  updatePurse: function(){
    var beverageInstance; 
    //ensure the Beverage contract is deployed before trying to access its instance
    App.contracts.Beverage.deployed().then(function(instance){
      beverageInstance = instance;
      //call the userPurchase mapping using the supplied user account, send result into THEN
      var userPurse = beverageInstance.userPurchase(web3.eth.accounts[0]).then(function(userPurse){
        //parse the integer value of the user's returned purse
        var balance = parseInt(userPurse[0]);
        //constant used for computation
        const ether = 1000000000000000000; //1 ether
        //readableBalance var stores the balance keyed to ETH
        var readableBalance = (balance/ether);
        //replace the HTML element with the parsed balance
        $("#accountBalance").html(readableBalance + " ETH");
        console.log("User's Purse is currently:", readableBalance);
      });
    });

  },

  depositEth: function() {
    //variable intended to store the deployed beverage contract
    var beverageInstance;
    
    //Get the deployed Beverage contract and store the instance in beverageInstance var
    App.contracts.Beverage.deployed().then(function(instance) {
      beverageInstance = instance;

      //This is the amount each deposit transaction will send to the contract using the [Deposit Button]
      const ether = 1000000000000000000; //1 ether
      //Get the multiplier from the UI dropdown
      var dep = document.getElementById("ETH");
      console.log("elementbyID:", dep);
      var multiplier = dep.value;
      console.log("ETH Selected:", multiplier);

      //arrive at the amount of Ether to deposit by calculating ether against the selected multiplier
      var depCoin = (ether * multiplier);
    
      //Execute deposit() as a transaction by sending the depCoin
      //The contract will recognize the buyer as msg.sender 
      return beverageInstance.deposit({value: depCoin});
    }).then(function() {
      //call to update the user's current purse display 
      App.updatePurse();
    });
  },


  cReturn: function() {
    var beverageInstance;

    App.contracts.Beverage.deployed().then(function(instance) {
      beverageInstance = instance;
      //call to coinReturn() reimburses all of the user's deposited amount back to user
      return beverageInstance.coinReturn();
    }).then(function(){
      //call to update the user's current purse display 
      App.updatePurse();
    });
  }, 


  select: function() {
    var beverageInstance;

    App.contracts.Beverage.deployed().then(function(instance) {
      beverageInstance = instance;

      //set bevId to the int that corresponds to the select buttons
      //i.e. bevId = [1(coke) || 2(pepsi) || 3(Dr. Pep) || 4(Mnt. Dew)]
      var bevId = parseInt($(event.target).data('id'));
      console.log(bevId);

      //Grab the number of beverages from the dropdown selection
      //bevId - 1 because bevId is keyed to 1-4 and ElementIds are keyed to 0-3
      var element = bevId - 1;
      var bevSelect = document.getElementById(element);
      console.log("elementbyID:", bevSelect);
      var bevCount = bevSelect.value;
      console.log("Quantity Selected:", bevCount);
    
      //Call the select() function THEN update the purse with the local value
      beverageInstance.select(bevId, bevCount).then(function(){
        //call to update the user's current purse display 
        App.updatePurse();
      });
    });

  },


  updateCost: function(value){
    //Update the beverage cost with the supplied value
    $('.panel-bev').find('.cost').text(value + "ETH");
  },


  getCost: function(){
    const ether = 1000000000000000000; //1 ether

    //Ensure that Beverages has been deployed
    App.contracts.Beverage.deployed().then(function(instance) {
      beverageInstance = instance;
      //newPrice is pulled from getPrice() and sent to THEN
      var newPrice = beverageInstance.getPrice().then(function(newPrice){
        //readablePrice is just the price keyed to ETH instead of WEI
        var readablePrice = (newPrice/ether);
        console.log("Global Price is Currently:", readablePrice);
        //update the Cost on the UI
        App.updateCost(readablePrice);
      });
    });
  },


}; 

$(function() {
  $(window).load(function() {
    App.init();
  });
});
