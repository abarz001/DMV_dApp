App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function () {

    // Load vehicles available for registration
    $.getJSON('../vehicles.json', function (data) {
      var carRow = $('#carRow');
      var carTemplate = $('#carTemplate');

      for (i = 0; i < data.length; i++) {
        carTemplate.find('.panel-title').text(data[i].name);
        carTemplate.find('img').attr('src', data[i].picture);
        carTemplate.find('.vehicle').text(data[i].name);
        carTemplate.find('.cost').text(data[i].cost);
        carTemplate.find('.year').text(data[i].year);
        carTemplate.find('.select').attr('id', i);
        carTemplate.find('.btn-select').attr('data-id', data[i].id);

        carRow.append(carTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // MetaMask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Default provider if none provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
      web3 = new Web3(App.web3Provider);
    }

    console.log(web3);
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("DMV.json", function (dmv) {
      // Use artificate to instantiate new contract
      App.contracts.dmv = TruffleContract(dmv);
      // Connect web3 to contract
      App.contracts.dmv.setProvider(App.web3Provider);

      return App.bindButtonsToContractFunctions();
    });
  },


  bindButtonsToContractFunctions: function () {
    $(document).on('click', '.btn-deposit', App.depositEth);
    $(document).on('click', '.btn-return', App.cReturn);
    $(document).on('click', '.btn-select', App.select);

    App.contracts.dmv.deployed().then(function (instance) {
      var DMV_Wallet = instance;
      $("#dmvAddress").html(DMV_Wallet.address);
      console.log(DMV_Wallet.address);
    });

    //Loading account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        web3.eth.defaultAccount = account;
        $("#accountAddress").html(web3.eth.defaultAccount);
      }
    });

    //reload page upon MetaMask account change then update balance / current price
    window.ethereum.on('accountsChanged', function (accounts) { location.reload(true); });
    App.updatePurse();
    return App.getCost();
  },


  updatePurse: function () {
    var dmvInstance;
    //deploy dmv contract then set the instance variable
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;

      dmvInstance.userPurchase(web3.eth.accounts[0]).then(function (userPurse) {
      var balance = parseInt(userPurse[0]);
        //constant used for computation
        const ether = 1000000000000000000; //1 ether
        //readableBalance var stores the balance keyed to ETH
        var readableBalance = (balance / ether);
        //replace the HTML element with the parsed balance
        $("#accountBalance").html("Your balance: " + readableBalance + " ETH");
        console.log("User's Balance:", readableBalance);
      });
    });

  },

  depositEth: function () {
    //store dmv contract instance
    var dmvInstance;

    //Get deployed dmv contract, store instance in dmvInstance
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;

      //This is the amount each deposit transaction will send to the contract using the [Deposit Button]
      const ether = 1000000000000000000; //1 ether
      //Get the multiplier from the UI dropdown
      var dep = document.getElementById("ETH");
      var multiplier = dep.value;
      console.log("ETH Selected:", multiplier);

      //arrive at the amount of Ether to deposit by calculating ether against the selected multiplier
      var depCoin = (ether * multiplier);

      //Execute deposit() as a transaction by sending the depCoin
      //The contract will recognize the buyer as msg.sender 
      return dmvInstance.deposit({ value: depCoin });
    }).then(function () {
      //call to update the user's current purse display 
      App.updatePurse();
    });
  },


  cReturn: function () {
    var dmvInstance;

    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;
      //call to coinReturn() reimburses all of the user's deposited amount back to user
      return dmvInstance.coinReturn();
    }).then(function () {
      //call to update the user's current purse display 
      App.updatePurse();
    });
  },


  select: function () {
    var dmvInstance;

    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;

      //set dmvID to the int that corresponds to the select buttons
      //i.e. dmvID = [1(coke) || 2(pepsi) || 3(Dr. Pep) || 4(Mnt. Dew)]
      var dmvID = parseInt($(event.target).data('id'));
      console.log(dmvID);

      //Grab the number of vehicles from the dropdown selection
      //dmvID - 1 because dmvId is keyed to 1-4 and ElementIds are keyed to 0-3
      var element = dmvID - 1;
      var dmvSelect = document.getElementById(element);
      console.log("elementbyID:", dmvSelect);
      var dmvCount = dmvSelect.value;
      console.log("Quantity Selected:", dmvCount);

      //Call the select() function THEN update the purse with the local value
      dmvInstance.select(dmvID, dmvCount).then(function () {
        //call to update the user's current purse display 
        App.updatePurse();
      });
    });

  },


  updateCost: function (value) {
    //Update the vehicle registration cost with the supplied value
    $('.panel-dmv').find('.cost').text(value + "ETH");
  },


  getCost: function () {
    const ether = 1000000000000000000; //1 ether

    //Ensure that dmv has been deployed
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;
      dmvInstance.getGlobalPrice().then(function (newPrice) {
        //readablePrice is just the price keyed to ETH instead of WEI
        var readablePrice = (newPrice / ether);
        console.log("Global Price is Currently:", readablePrice);
        //update the Cost on the UI
        App.updateCost(readablePrice);
      });
    });
  },


};

$(function () {
  $(window).load(function () {
    App.init();
    document.getElementById("tableOfRegistrations").style.display = 'none';
    document.getElementById("addressContainer").style.display = 'none';
    document.getElementById("reportSoldVehicleContainer").style.display = 'none';
    document.getElementById("registerNewVehicleContainer").style.display = 'none';
  });
});

async function showAccountDetails() {
  document.getElementById("accountDetails").style.display = 'block';
  document.getElementById("tableOfRegistrations").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}


async function showRegistrations() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfRegistrations").style.display = 'block';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}


async function showAddressUpdate() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfRegistrations").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'block';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}

async function registerNewVehicle() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfRegistrations").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'block';
}

async function reportVehicleSold() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfRegistrations").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'block';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}

if (document.getElementById("get-account-details-link") != null) {
  document.getElementById("get-account-details-link").onclick = showAccountDetails;
}

if (document.getElementById("get-registrations-link") != null) {
  document.getElementById("get-registrations-link").onclick = showRegistrations;
}


if (document.getElementById("get-address-update-link") != null) {
  console.log('?');
  document.getElementById("get-address-update-link").onclick = showAddressUpdate;
}

if (document.getElementById("get-register-new-vehicle-link") != null) {
  document.getElementById("get-register-new-vehicle-link").onclick = registerNewVehicle;
}

if (document.getElementById("get-report-vehicle-sold-link") != null) {
  console.log('?');
  document.getElementById("get-report-vehicle-sold-link").onclick = reportVehicleSold;
}


