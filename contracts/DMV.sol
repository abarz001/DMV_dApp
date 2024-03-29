pragma solidity >=0.4.22 <0.6.0;

contract DMV {
    address payable public buyer;
    uint256 globalPrice;

    struct Vehicles {
        uint256 id;
        string name;
        uint256 cost;
    }
    struct VehicleOther {
        string year;
        string vehicleBrand;
        uint256 cost;
        uint256 yearsReg;
    }
    struct Purchases {
        uint256 purse;
        uint256 scionRenewCount;
        uint256 civicRenewCount;
        uint256 viperRenewCount;
        uint256 ferrariRenewCount;
        uint256 lexusRenewCount;
        uint256 otherRenewCount;
    }
    struct AddressDetails{
        string custName;
        string street;
        string city;
        string state;
        string phone;
    }

    uint256 numVehicleRegistrations = 0;

    mapping(uint256 => Vehicles) public vehicles;
    mapping(address => VehicleOther) public otherVehicle;
    mapping(address => Purchases) public userPurchase;
    mapping(address => AddressDetails) public userAddress;

    constructor() public {
        globalPrice = 1000000000000000; // 0.001 Eth
        buyer = msg.sender;
        addVehicle("Scion");
        addVehicle("Civic");
        addVehicle("Viper");
        addVehicle("Ferrari");
        addVehicle("Lexus");
    }

    function addVehicle(string memory _name) private {
        numVehicleRegistrations++;
        vehicles[numVehicleRegistrations] = Vehicles(
            numVehicleRegistrations,
            _name,
            globalPrice
        );
    }

     function addOtherVehicle(string memory _year, string memory _brand) public {
        otherVehicle[msg.sender].year = _year;
        otherVehicle[msg.sender].vehicleBrand = _brand;
        otherVehicle[msg.sender].cost = 1000000000000000;
        otherVehicle[msg.sender].yearsReg = 1;
    }

    function getGlobalPrice() public view returns (uint256) {
        return globalPrice;
    }

    function setGlobalPrice(uint256 _price) public {
        globalPrice = _price;
        setVehicleRegCost();
    }

    function setVehicleRegCost() private {
        vehicles[1].cost = globalPrice;
        vehicles[2].cost = globalPrice;
        vehicles[3].cost = globalPrice;
        vehicles[4].cost = globalPrice;
        vehicles[5].cost = globalPrice;
    }

    function deposit() public payable returns (uint256, uint256) {
        require(msg.value >= globalPrice, "Error");
        buyer = msg.sender;
        userPurchase[buyer].purse += msg.value;
        return (address(this).balance, userPurchase[buyer].purse);
    }

    function updateUserBalance(uint256 _totalCost) private {
        userPurchase[buyer].purse -= _totalCost;
    }

    function updateUserAddress(string memory _custName, string memory _street, string memory _city, string memory _state, string memory _phone) public {
        userAddress[msg.sender].custName = _custName;
        userAddress[msg.sender].street = _street;
        userAddress[msg.sender].city = _city;
        userAddress[msg.sender].state = _state;
        userAddress[msg.sender].phone = _phone;
    }

    function select(uint256 vehicleID, uint256 _count)
        public
        payable
        returns (bool)
    {
        buyer = msg.sender;

        //Check balance is enough to cover purchase
        require(
            userPurchase[buyer].purse >= (_count * vehicles[vehicleID].cost),
            "Error: Insufficient Funds"
        );

        uint256 totalCost = _count * vehicles[vehicleID].cost;
        if (vehicleID == 1) {
            userPurchase[buyer].scionRenewCount += _count;
        } else if (vehicleID == 2) {
            userPurchase[buyer].civicRenewCount += _count;
        } else if (vehicleID == 3) {
            userPurchase[buyer].viperRenewCount += _count;
        } else if (vehicleID == 4) {
            userPurchase[buyer].ferrariRenewCount += _count;
        }
        else if (vehicleID == 5) {
            userPurchase[buyer].lexusRenewCount += _count;
        }
        updateUserBalance(totalCost);
        return true;
    }

       function sellVehicle(uint256 vehicleID)
        public
        payable
        returns (bool)
    {
        buyer = msg.sender;
        require(
            userPurchase[buyer].purse >= (vehicles[vehicleID].cost),
            "Error: Insufficient Funds"
        );

        uint256 totalCost = vehicles[vehicleID].cost;

        if (vehicleID == 1) {
            userPurchase[buyer].scionRenewCount = 0;
        } else if (vehicleID == 2) {
            userPurchase[buyer].civicRenewCount = 0;
        } else if (vehicleID == 3) {
            userPurchase[buyer].viperRenewCount = 0;
        } else if (vehicleID == 4) {
            userPurchase[buyer].ferrariRenewCount = 0;
        }
         else if (vehicleID == 5) {
            userPurchase[buyer].lexusRenewCount = 0;
        }
        updateUserBalance(totalCost);
        return true;
    }

    function coinReturn() public payable {
        buyer = msg.sender;
        require(userPurchase[buyer].purse > 0, "Error: No funds to return");

        buyer.transfer(userPurchase[buyer].purse);
        userPurchase[buyer].purse -= userPurchase[buyer].purse;
    }

    function getRegCounts()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            userPurchase[buyer].scionRenewCount,
            userPurchase[buyer].civicRenewCount,
            userPurchase[buyer].viperRenewCount,
            userPurchase[buyer].ferrariRenewCount,
            userPurchase[buyer].lexusRenewCount
        );
    }
}
