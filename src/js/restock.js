App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

init: async function() {

  // Load products.
  $.getJSON('../renew_registration.json', function(data) {
      var bevRow = $('#bevRow');
      var bevTemplate = $('#bevTemplate');

      for (i = 0; i < data.length; i ++) {
        bevTemplate.find('.panel-title').text(data[i].name);
        bevTemplate.find('img').attr('src', data[i].picture);
        bevTemplate.find('.name').text(data[i].name);
        bevTemplate.find('.count').text(data[i].count);
        bevTemplate.find('.price').text(data[i].price);
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
    $.getJSON("Restock.json", function(restock) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Restock = TruffleContract(restock);
      // Connect provider to interact with contract
      App.contracts.Restock.setProvider(App.web3Provider);
      
      return App.initRedContract();
    });

  },

  initRedContract: function() {
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

    //bind html buttons to App functions
    $(document).on('click', '.btn-GlobalInStock', App.getStock);
    $(document).on('click', '.btn-select', App.reUp);
    $(document).on('click', '.btn-set-price', App.setPrice);

    //declare contract instance variables
    var restockInstance;
    var redemptionInstance;
    var beverageInstance; 

    //Ensure that Beverage has been deployed
    App.contracts.Beverage.deployed().then(function(instance) {
      beverageInstance = instance;

      //display the address to HTML for debug/testing purposes
      $("#bevContrAddress").html(beverageInstance.address);

      return beverageInstance;
    }).then(function(beverageInstance){

          //Ensure that Redeem has been deployed
          App.contracts.Redeem.deployed().then(function(instance) {
            redemptionInstance = instance;
          
            //display the address to HTML for debug/testing purposes
            $("#redContrAddress").html(redemptionInstance.address);
  
            return redemptionInstance;
          }).then(function(redemptionInstance){

              //Ensure that Restock has been deployed
              App.contracts.Restock.deployed().then(function(instance) {
              restockInstance = instance;
          
              //display the address to HTML for debug/testing purposes
              $("#restContrAddress").html(restockInstance.address);
  
              return restockInstance;
            });
        });
      });

    //if Metamask changes the user account, reload the page.
    window.ethereum.on('accountsChanged', function (accounts) {   location.reload(true);  });

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        web3.eth.defaultAccount = account;
        //display the address to HTML for debug/testing purposes
        $("#accountAddress").html(web3.eth.defaultAccount);
      }   
    }); 

  },


  updateCount: function(index, value){
    //Update the appropriate beverage count with the supplied value
    $('.panel-bev').eq(index).find('.InStock').text(value);
  },

  
  getStock: function(){
    //Ensure that Redeem has been deployed because that contract has data needed for inventory calculation
    App.contracts.Redeem.deployed().then(function(instance) {
      redemptionInstance = instance;

      return redemptionInstance;
      }).then(function(redemptionInstance){

        //Ensure that Restock has been deployed
        App.contracts.Restock.deployed().then(function(instance) {
        restockInstance = instance;

          //call Restock.sol's function which pulls the in-stock data from Redeem.sol
          restockInstance.getInStock().then(function(){

            //For each beverage, get the stock count (updated by getInStock()) and send it to updateCount()
            //updateCount will update the UI 
            var cokestock = restockInstance.coke().then(function(cokestock){
              console.log("Current Coke stock:", cokestock);
              App.updateCount(1, cokestock);
            });
            
            var pepsistock = restockInstance.pepsi().then(function(pepsistock){
              console.log("Current Pepsi stock:", pepsistock);
              App.updateCount(2, pepsistock);
            });
            
            var drpstock = restockInstance.drp().then(function(drpstock){
              console.log("Current Dr. Pepper stock:", drpstock);
              App.updateCount(3, drpstock);
            });
          
            var dewstock = restockInstance.dew().then(function(dewstock){
              console.log("Current Mnt Dew stock:", dewstock);
              App.updateCount(4, dewstock);
            });
          });
        });
      });

      //Call getPrice too so that current inventory and price are shown
      return App.getPrice();
  },


reUp: function() {

  //set bevId to the int that corresponds to the select buttons
  //i.e. bevId = [1(coke) || 2(pepsi) || 3(Dr. Pep) || 4(Mnt. Dew)]
  var bevId = parseInt($(event.target).data('id'));
  console.log(bevId);

  //Declare a 4-index array to hold the number of sodas to reUp for each beverage
  //Array in case we ever wanted to have different values for each
  //Currently all values are set to 10 in renew_registration.json
  var reUpCounts = [4];

  //open the JSON and pull out the intended number of sodas to use for reUP (restock)
  //the variable is currently set for 10 for all beverages ("count":"10")
  $.getJSON('../renew_registration.json', function(data) {
    for (i = 0; i < data.length; i ++) {
      reUpCounts[i] = data[i].count;
      }
    }).then(function(){

      //Ensure that Redeem has been deployed
      App.contracts.Redeem.deployed().then(function(instance) {
      redemptionInstance = instance;
      
      return redemptionInstance;
      }).then(function(redemptionInstance){

        //Ensure that Restock has been deployed
        App.contracts.Restock.deployed().then(function(instance) {
        restockInstance = instance;

        console.log("button#", bevId);
       
        //For each bevId (1-4), corresponding to each soda, restock() is called
        //restock() requires 4 inputs--the reUp count for each soda--and can update all sodas at once
        //however, we are passing in the corresponding amount (from our 4-index array, created using inputs from the JSON)
        //and reUping one at a time because we have a per-soda [restock] button
        if(bevId == 1){
          restockInstance.restock(reUpCounts[0],0,0,0).then(function(){
          console.log("Coke Increased by stock:", reUpCounts[0]);
          });
        }
        else if (bevId == 2){
          restockInstance.restock(0,reUpCounts[1],0,0).then(function(){
          console.log("Pepsi Increased by stock:", reUpCounts[1]);
          });
        }
        else if (bevId == 3){
          restockInstance.restock(0,0,reUpCounts[2],0).then(function(){
          console.log("DrP Increased by stock:", reUpCounts[2]);
          });
        }
        else if (bevId == 4){
          restockInstance.restock(0,0,0,reUpCounts[3]).then(function(){
          console.log("Dew Increased by stock:", reUpCounts[3]);
          });
        }
      
        })
      })
    }) 
  },


updatePrice: function(value){
    //Update the html with the retrieved Price from Beverage.sol for all sodas
    $('.panel-bev').find('.price').text(value + "ETH");
},

getPrice: function() {
  const ether = 1000000000000000000; //1 ether, constant used for calculations below

  //Ensure that Beverages has been deployed
  App.contracts.Beverage.deployed().then(function(instance) {
    beverageInstance = instance;

    return beverageInstance;
    }).then(function(beverageInstance){

      //Ensure that Restock has been deployed
      App.contracts.Restock.deployed().then(function(instance) {
        restockInstance = instance;

        //retrieve the price from Beverage.sol using Restock.sol's getGlobalPrice() and pass to THEN
        var price = restockInstance.getGlobalPrice().then(function(price){
          //readablePrice is just a more readable form of the price; keyed to ether and not wei
          var readablePrice = (price/ether);
          console.log("Global Price is Currently:", readablePrice);
          //update the UI with the price
          App.updatePrice(readablePrice);
   
          });
        });
    });
},

setPrice: function() {
  const ether = 1000000000000000000; //1 ether, constant used for calculations below

  //Ensure that Beverages has been deployed
  App.contracts.Beverage.deployed().then(function(instance){
    beverageInstance = instance;

    return beverageInstance;
    }).then(function(beverageInstance){

      //Ensure that Restock has been deployed
      App.contracts.Restock.deployed().then(function(instance){
        restockInstance = instance;

        //Grab the price from the dropdown selection
        var changePrice = document.getElementById("selPrice");
        var newPrice = changePrice.value;
        console.log("New Price:", newPrice);

        //pass the new price to the Beverage.sol contract via Restock.sol's setGlobalPriceUpdateCost()
        restockInstance.setGlobalPriceUpdateCost(newPrice).then(function(){
          //readable price keyed to eth and not wei
          var readablePrice = (newPrice/ether);
          console.log("Global Price is NOW Currently SET TO:", readablePrice);
          //Update the UI with the local variable readablePrice
          //This is fine since the newPrice was previously sent to Beverage.sol via setGlobalPriceUpdateCost()
          //and should be in-sync still
          App.updatePrice(readablePrice);
   
        });
      });
    })
},



}
  
$(function() {
  $(window).load(function() {
    App.init();
  });
});
