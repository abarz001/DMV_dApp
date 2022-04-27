//The init functions and balance related functions have been reused from CS764 ODU's example
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
        carTemplate.find('.select').attr('id', i); //sets the index number for the chosen vehicle so it can be selected properly
        carTemplate.find('.btn-select').attr('data-id', data[i].id);
        carRow.append(carTemplate.html());
      }
    });

    return App.initNewRegistrations();
  },

  initNewRegistrations: function () {
    // Load vehicles available for registration
    $.getJSON('../vehicles.json', function (data) {
      var regRow = $('#regRow');
      var regTemplate = $('#regTemplate');

      for (i = 0; i < data.length; i++) {
        regTemplate.find('.panel-title').text(data[i].name);
        regTemplate.find('img').attr('src', data[i].picture);
        regTemplate.find('.regvehicle').text(data[i].name);
        regTemplate.find('.regcost').text(data[i].cost);
        regTemplate.find('.regyear').text(data[i].year);
        regTemplate.find('.regselect').attr('regid', i); 
        regTemplate.find('.btn-select-new-reg').attr('data-id', data[i].id);
        regRow.append(regTemplate.html());
      }
    });

    return App.initNewSales();
  },

  initNewSales: function () {
    // Load vehicles available for reporting as sold
    $.getJSON('../vehicles.json', function (data) {
      var saleRow = $('#reportSaleRow');
      var saleTemplate = $('#reportSaleTemplate');

      for (i = 0; i < data.length; i++) {
        saleTemplate.find('.panel-title').text(data[i].name);
        saleTemplate.find('img').attr('src', data[i].picture);
        saleTemplate.find('.salevehicle').text(data[i].name);
        saleTemplate.find('.salecost').text(data[i].cost);
        saleTemplate.find('.saleyear').text(data[i].year);
        saleTemplate.find('.btn-select-new-sale').attr('data-id', data[i].id);
        saleRow.append(saleTemplate.html());
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
    $(document).on('click', '.btn-select-new-reg', App.select);
    $(document).on('click', '#get-my-vehicles-link', App.calculateYearsRegistered);
    $(document).on('click', '#btn-update-address', App.updateAddress);
    $(document).on('click', '#get-address-update-link', App.grabAddress);
    $(document).on('click', '#get-report-vehicle-sold-link', App.calculateYearsRegistered);
    $(document).on('click', '.btn-select-new-sale', App.select);

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

  updateAddress: function () {
    var dmvInstance;
    //deploy dmv contract then set the instance variable
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;
      dmvInstance.userAddress(web3.eth.accounts[0]).then(function (userAddress) {
        dmvInstance.updateUserAddress(document.getElementById("custName").value,
          document.getElementById("street").value,
          document.getElementById("city").value,
          document.getElementById("state").value,
          document.getElementById("phone").value);
        // console.log("User's State:", userAddress[0]);
        // console.log("User's State:", userAddress[1]);
        // console.log("User's State:", userAddress[2]);
        // console.log("User's State:", userAddress[3]);
        // console.log("User's State:", userAddress[4]);
      }).then(function () {
        App.updatePurse();
      })
    });
  },

  grabAddress: function () {
    var dmvInstance;
    //deploy dmv contract then set the instance variable
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;
      dmvInstance.userAddress(web3.eth.accounts[0]).then(function (userAddress) {
        document.getElementById('custName').value = userAddress[0].toString();
        document.getElementById('street').value = userAddress[1].toString();
        document.getElementById('city').value = userAddress[2].toString();
        document.getElementById('state').value = userAddress[3].toString();
        document.getElementById('phone').value = userAddress[4].toString();
      });
    });

  },


  depositEth: function () {
    var dmvInstance;
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

      //set vehicleID to the int that corresponds to the select buttons
      var vehicleID = parseInt($(event.target).data('id'));
      console.log(vehicleID);

      //Grab the number of vehicles from the dropdown selection
      var vehicleIDIndex = vehicleID - 1;
      var selectedVehicle = document.getElementById(vehicleIDIndex);
      var vehicleRegCount = selectedVehicle.value;
      console.log(selectedVehicle);
      if (window.location.hash == "#myVehicles" || window.location.hash == "#registerNewVehicle"){
        dmvInstance.select(vehicleID, vehicleRegCount).then(function () {
          //call to update the user's current purse display 
          App.updatePurse();
          console.log("URL hash: ", window.location.hash);
          if (window.location.hash == "#myVehicles") {
            document.getElementById("get-my-vehicles-link").click();
          }
          else if (window.location.hash == "#registerNewVehicle"){
            window.alert("Successfully registered new vehicle. Reloading DMV.");
            location.reload();
          }
        });
      }
      else if (window.location.hash == "#reportSoldVehicle"){
        App.sellAVehicle(vehicleID);
      }
    });
  },

  sellAVehicle: function(vehicleID){
    App.contracts.dmv.deployed().then(function (instance) {
    var dmvInstance = instance;
    dmvInstance.sellVehicle(vehicleID);
    console.log('Sold vehicle id ' + vehicleID);
    App.updatePurse();
    window.alert("Successfully sold vehicle. Please reload manually.");
  });
  },

  updateCost: function (value) {
    //Update the vehicle registration cost with the supplied value
    $('.panel-dmv').find('.cost').text(value + "ETH");
    $('.panel-dmv-reg').find('.regcost').text(value + "ETH");
    $('.panel-dmv-sale').find('.salecost').text(value + "ETH");
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

  calculateYearsRegistered: function () {
    App.contracts.dmv.deployed().then(function (instance) {
      dmvInstance = instance;
      dmvInstance.userPurchase(web3.eth.accounts[0]).then(function (userPurse) {
        console.log("Num Years Scion Registered:", userPurse[1].toString());
        console.log("Num Years Civic Registered:", userPurse[2].toString());
        console.log("Num Years Viper Registered:", userPurse[3].toString());
        console.log("Num Years Ferrari Registered:", userPurse[4].toString());


        if (window.location.hash == "#myVehicles") {
          //Update registration counts
          $('.panel-dmv').eq(0).find('.yearsReg').text(userPurse[1].toString());
          $('.panel-dmv').eq(1).find('.yearsReg').text(userPurse[2].toString());
          $('.panel-dmv').eq(2).find('.yearsReg').text(userPurse[3].toString());
          $('.panel-dmv').eq(3).find('.yearsReg').text(userPurse[4].toString());
          var divs = document.querySelectorAll(".panel-dmv");
          Array.from(divs).forEach(function (div) {
            if (div.textContent.indexOf("Years Currently Registered: 0") >= 0) {
              div.style.display = "none";
            }
          });
        }
        else if (window.location.hash == "#reportSoldVehicle"){
          //Update sale counts
          $('.panel-dmv-sale').eq(0).find('.saleYearsReg').text(userPurse[1].toString());
          $('.panel-dmv-sale').eq(1).find('.saleYearsReg').text(userPurse[2].toString());
          $('.panel-dmv-sale').eq(2).find('.saleYearsReg').text(userPurse[3].toString());
          $('.panel-dmv-sale').eq(3).find('.saleYearsReg').text(userPurse[4].toString());
          var divs = document.querySelectorAll(".panel-dmv-sale");
          Array.from(divs).forEach(function (div) {
            if (div.textContent.indexOf("Years Currently Registered: 0") >= 0) {
              div.style.display = "none";
            }
          });
        }

      });
    });
  },


};

$(function () {
  $(window).load(function () {
    App.init();
    document.getElementById("tableOfMyVehicles").style.display = 'none';
    document.getElementById("addressContainer").style.display = 'none';
    document.getElementById("reportSoldVehicleContainer").style.display = 'none';
    document.getElementById("registerNewVehicleContainer").style.display = 'none';
  });
});

async function showAccountDetails() {
  document.getElementById("accountDetails").style.display = 'block';
  document.getElementById("tableOfMyVehicles").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}


async function showRegistrations() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfMyVehicles").style.display = 'block';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}


async function showAddressUpdate() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfMyVehicles").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'block';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}

async function registerNewVehicle() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfMyVehicles").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'none';
  document.getElementById("registerNewVehicleContainer").style.display = 'block';
}

async function reportVehicleSold() {
  document.getElementById("accountDetails").style.display = 'none';
  document.getElementById("tableOfMyVehicles").style.display = 'none';
  document.getElementById("addressContainer").style.display = 'none';
  document.getElementById("reportSoldVehicleContainer").style.display = 'block';
  document.getElementById("registerNewVehicleContainer").style.display = 'none';
}

if (document.getElementById("get-account-details-link") != null) {
  document.getElementById("get-account-details-link").onclick = showAccountDetails;
}

if (document.getElementById("get-my-vehicles-link") != null) {
  document.getElementById("get-my-vehicles-link").onclick = showRegistrations;
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


