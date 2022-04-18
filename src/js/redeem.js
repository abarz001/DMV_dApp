App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

init: async function() {

  // Load products.
  $.getJSON('../buy_registration.json', function(data) {
      var bevRow = $('#bevRow');
      var bevTemplate = $('#bevTemplate');

      for (i = 0; i < data.length; i ++) {
        bevTemplate.find('.panel-title').text(data[i].name);
        bevTemplate.find('img').attr('src', data[i].picture);
        bevTemplate.find('.name').text(data[i].name);
        bevTemplate.find('.count').text("[Reload]");
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
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Redeem.json", function(redeem) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Redeem = TruffleContract(redeem);
      // Connect provider to interact with contract
      App.contracts.Redeem.setProvider(App.web3Provider);
      
      return App.initBevContract();
    });

  },

  initBevContract: function() {
    $.getJSON("Beverage.json", function(beverage) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Beverage = TruffleContract(beverage);
      // Connect provider to interact with contract
      App.contracts.Beverage.setProvider(App.web3Provider);

      return App.bindEvents();
    });
  },


  bindEvents: function() {

    //bind the buttons to their functions
    $(document).on('click', '.btn-update', App.loadUpdate);
    $(document).on('click', '.btn-select', App.select);

    var redemptionInstance;
    var beverageInstance; 

    //Ensure that Beverage has been deployed
    App.contracts.Beverage.deployed().then(function(instance){
      beverageInstance = instance;

      //Update UI with address for debug/testing
      $("#bevContrAddress").html(beverageInstance.address);

      return beverageInstance;
    }).then(function(beverageInstance){

          //Ensure that Redeem has been deployed
          App.contracts.Redeem.deployed().then(function(instance) {
            redemptionInstance = instance;
          
            //Update UI with address for debug/testing
            $("#redContrAddress").html(redemptionInstance.address);
  
            return redemptionInstance;
          }).then(function(redemptionInstance){

              //Display the user's redeemable beverage counts on refresh
              //Notice this bypasses loadUpdate()
              //What this means is that the user's counts that are on display after refresh,
              //are only those known locally to the contract.
              //This was done to spare a transaction upon refresh yet at least give the user some count 
              //(even if it's less than their total # of redeemable beverages) 
              App.calcUpdate(redemptionInstance);
          
            });
        });

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        web3.eth.defaultAccount = account;
        //Update UI with address for debug/testing
        $("#accountAddress").html(web3.eth.defaultAccount);
      }   
    }); 

    //if Metamask changes the user account, reload the page.
    window.ethereum.on('accountsChanged', function (accounts) {   location.reload(true);  });
  },

  /*By the end of the page loading/initialization, the user's redeemable beverage counts only reflect 
  those that are known locally to Redeem.sol. In order to get the UP-TO-DATE redeemable counts, the user
  needs to invoke the [LOAD] button. This is done because the [LOAD] button is a write to the blockchain 
  which costs wei. Beyond that, if a [LOAD] was forced on every init/refresh, then a cost/transaction would
  be incurred--this represented a worse user experience.*/


  updateCount: function(index, value){
    //Update the appropriate beverage count with the supplied value
    $('.panel-bev').eq(index).find('.count').text(value);
  },

  calcUpdate: function(instance){
    redemptionInstance = instance;

    //Initial display of the redeemable beverage counts by calling the user's mapping
    var countStruct = redemptionInstance.userRedeemable(web3.eth.accounts[0]).then(function(countStruct){
      console.log("All Redeemable Bev Counts:",countStruct);
      console.log("Coke:",countStruct[0]);
      console.log("Pepsi:",countStruct[1]);
      console.log("DrP:",countStruct[2]);
      console.log("Dew:",countStruct[3]);

      //update the counts for the UI
      App.updateCount(0, countStruct[0]);
      App.updateCount(1, countStruct[1]);
      App.updateCount(2, countStruct[2]);
      App.updateCount(3, countStruct[3]);
    });
  },

  loadUpdate: function(){
    //Ensure that Redeem has been deployed
    App.contracts.Redeem.deployed().then(function(instance) {
      redemptionInstance = instance;

      //Get the freshest most up-to-date redeemable count by accessing Beverage.sol data
      redemptionInstance.calcCurrentlyRedeemable().then(function(redemptionInstance){

        //nest the the UI update in a timeout to give the front-end user a chance to approve the transaction
        //associated with redemptionInstance.calcCurrentlyRedeemable()
        setTimeout(() => {  App.calcUpdate(redemptionInstance); }, 5600);

        location.reload(true);
      });
    });
  },

   select: function() { 
    var redemptionInstance;

    App.contracts.Redeem.deployed().then(function(instance) {
    redemptionInstance = instance;

    //set bevId to the int that corresponds to the select buttons
    //i.e. bevId = [1(coke) || 2(pepsi) || 3(Dr. Pep) || 4(Mnt. Dew)]
    var bevId = parseInt($(event.target).data('id'));
    console.log("bevId", bevId);

    //Grab the number of beverages from the dropdown selection
    //bevId - 1 because bevId is keyed to 1-4 and ElementIds are keyed to 0-3
    var element = bevId - 1;
    var bevSelect = document.getElementById(element);
    console.log("elementbyID:", bevSelect);
    var bevCount = bevSelect.value;
    console.log("Quantity Selected:", bevCount);

    //call to redeemBev THEN calculate the update THEN refresh the UI
    redemptionInstance.redeemBev(bevId, bevCount).then(function(redemptionInstance){
      
      App.contracts.Redeem.deployed().then(function(instance) {
        redemptionInstance = instance;

        App.calcUpdate(redemptionInstance).then(function(){
            location.reload(true);
          });
        });
      });
    }); 
  
  },

}; 

$(function() {
  $(window).load(function() {
    App.init();
  });
});
