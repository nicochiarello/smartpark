// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SmartPark {
    // ─── Structs ───────────────────────────────────────────────

    struct ParkingSpace {
        string id;
        string name;
        string location;
        uint256 pricePerHour;
        bool isOccupied;
        bool exists;
    }

    struct Reservation {
        uint256 id;
        string spaceId;
        address user;
        string date;
        string timeFrom;
        string timeTo;
        uint256 totalPaid;
        bool active;
    }

    // ─── State ─────────────────────────────────────────────────

    address public owner;

    mapping(string => ParkingSpace) public spaces;
    string[] public spaceIds;

    uint256 public reservationCount;
    mapping(uint256 => Reservation) public reservations;

    mapping(string => bool) public slotTaken;

    mapping(address => uint256[]) public userReservations;

    // ─── Events ────────────────────────────────────────────────

    event SpaceCreated(string spaceId, string name);
    event ReservationCreated(
        uint256 reservationId,
        string spaceId,
        address user,
        string date,
        string timeFrom,
        string timeTo,
        uint256 totalPaid
    );
    event ReservationCancelled(uint256 reservationId, address user);
    event OccupancyChanged(string spaceId, bool occupied);

    // ─── Constructor ───────────────────────────────────────────

    constructor() {
        owner = msg.sender;

        _createSpace(
            "space-1",
            "Estacionamiento San Martin 400",
            "San Martin 400, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-2",
            "Estacionamiento Sarmiento 200",
            "Sarmiento 200, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-3",
            "Estacionamiento Av. Espana",
            "Av. Espana 500, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-4",
            "Estacionamiento Garibaldi",
            "Garibaldi 300, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-5",
            "Estacionamiento Las Heras",
            "Las Heras 100, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-6",
            "Estacionamiento Gutierrez",
            "Gutierrez 450, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-7",
            "Estacionamiento Montevideo",
            "Montevideo 600, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-8",
            "Estacionamiento Colon",
            "Colon 700, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-9",
            "Estacionamiento Rivadavia",
            "Rivadavia 350, Mendoza",
            0.001 ether
        );
        _createSpace(
            "space-10",
            "Estacionamiento Belgrano",
            "Belgrano 800, Mendoza",
            0.001 ether
        );
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the municipality can do this");
        _;
    }

    modifier spaceExists(string memory spaceId) {
        require(spaces[spaceId].exists, "Parking space does not exist");
        _;
    }

    // ─── Internal ──────────────────────────────────────────────

    function _createSpace(
        string memory id,
        string memory name,
        string memory location,
        uint256 pricePerHour
    ) internal {
        spaces[id] = ParkingSpace(
            id,
            name,
            location,
            pricePerHour,
            false,
            true
        );
        spaceIds.push(id);
        emit SpaceCreated(id, name);
    }

    function _slotKey(
        string memory spaceId,
        string memory date,
        string memory timeFrom
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(spaceId, "_", date, "_", timeFrom));
    }

    // ─── Public functions ──────────────────────────────────────

    function reserve(
        string memory spaceId,
        string memory date,
        string memory timeFrom,
        string memory timeTo,
        uint256 durationHours
    ) external payable spaceExists(spaceId) {
        ParkingSpace memory space = spaces[spaceId];

        uint256 expectedPayment = space.pricePerHour * durationHours;
        require(msg.value == expectedPayment, "Incorrect ETH amount sent");

        string memory key = _slotKey(spaceId, date, timeFrom);
        require(!slotTaken[key], "This slot is already reserved");

        slotTaken[key] = true;

        reservationCount++;
        reservations[reservationCount] = Reservation({
            id: reservationCount,
            spaceId: spaceId,
            user: msg.sender,
            date: date,
            timeFrom: timeFrom,
            timeTo: timeTo,
            totalPaid: msg.value,
            active: true
        });

        userReservations[msg.sender].push(reservationCount);

        emit ReservationCreated(
            reservationCount,
            spaceId,
            msg.sender,
            date,
            timeFrom,
            timeTo,
            msg.value
        );
    }

    function cancelReservation(uint256 reservationId) external {
        Reservation storage res = reservations[reservationId];
        require(res.user == msg.sender, "You did not make this reservation");
        require(res.active, "Reservation is already cancelled");

        res.active = false;

        string memory key = _slotKey(res.spaceId, res.date, res.timeFrom);
        slotTaken[key] = false;

        payable(msg.sender).transfer(res.totalPaid);

        emit ReservationCancelled(reservationId, msg.sender);
    }

    // Called by the vision script to update real-time occupancy
    function setOccupied(
        string memory spaceId,
        bool occupied
    ) external onlyOwner {
        spaces[spaceId].isOccupied = occupied;
        emit OccupancyChanged(spaceId, occupied);
    }

    function getMyReservationIds() external view returns (uint256[] memory) {
        return userReservations[msg.sender];
    }

    function getReservation(
        uint256 reservationId
    ) external view returns (Reservation memory) {
        return reservations[reservationId];
    }

    function isSlotTaken(
        string memory spaceId,
        string memory date,
        string memory timeFrom
    ) external view returns (bool) {
        return slotTaken[_slotKey(spaceId, date, timeFrom)];
    }

    function getSpaceIds() external view returns (string[] memory) {
        return spaceIds;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
