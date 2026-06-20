// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ParkingRegistry
/// @notice Registro inmutable de eventos de estacionamiento para SmartPark Web3.
/// @dev La validación de formato de patente (regex) se hace en el backend ANTES
///      de llamar a este contrato. El contrato no valida formato para ahorrar gas.
contract ParkingRegistry is Ownable {
    struct ParkingRecord {
        string licensePlate; // Patente del vehículo
        uint256 spaceId; // ID del espacio de estacionamiento
        uint256 timestamp; // Momento del evento (block timestamp)
        bool occupied; // true = el auto ocupó el lugar, false = el auto se fue
        uint256 durationSeconds; // Duración de la estadía (0 si occupied == true)
        uint256 amountPaid; // Monto cobrado via Mercado Pago/tarjeta (0 si no aplica)
    }

    // Direcciones autorizadas a reportar eventos (ej: la wallet de tu backend/IA)
    mapping(address => bool) public authorizedReporters;

    // Historial de eventos, indexado por ID de espacio
    mapping(uint256 => ParkingRecord[]) private historyBySpace;

    // Contador total de eventos registrados en todo el sistema
    uint256 public totalEvents;

    event ReporterAuthorized(address indexed reporter);
    event ReporterRevoked(address indexed reporter);
    event ParkingEventRegistered(
        uint256 indexed spaceId,
        string licensePlate,
        bool occupied,
        uint256 timestamp,
        uint256 durationSeconds,
        uint256 amountPaid
    );

    modifier onlyAuthorized() {
        require(
            authorizedReporters[msg.sender],
            "ParkingRegistry: not authorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        // Quien despliega el contrato queda autorizado automaticamente
        authorizedReporters[msg.sender] = true;
    }

    /// @notice El owner autoriza una nueva wallet (ej: la de tu backend) a reportar eventos.
    function addAuthorizedReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = true;
        emit ReporterAuthorized(reporter);
    }

    /// @notice El owner revoca el permiso de una wallet previamente autorizada.
    function removeAuthorizedReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = false;
        emit ReporterRevoked(reporter);
    }

    /// @notice Registra un evento de ocupacion/liberacion de un espacio. Solo wallets autorizadas.
    /// @param licensePlate Patente ya validada por el backend (regex) antes de llegar acá.
    /// @param spaceId ID del espacio físico (coincide con el ID en tu base de datos).
    /// @param occupied true si el auto acaba de estacionar, false si se fue.
    /// @param durationSeconds Duración de la estadía en segundos (enviar 0 si occupied == true).
    /// @param amountPaid Monto cobrado via Mercado Pago/tarjeta (enviar 0 si no hubo cobro en este evento).
    function registerEvent(
        string calldata licensePlate,
        uint256 spaceId,
        bool occupied,
        uint256 durationSeconds,
        uint256 amountPaid
    ) external onlyAuthorized {
        require(bytes(licensePlate).length > 0, "ParkingRegistry: empty plate");

        ParkingRecord memory record = ParkingRecord({
            licensePlate: licensePlate,
            spaceId: spaceId,
            timestamp: block.timestamp,
            occupied: occupied,
            durationSeconds: durationSeconds,
            amountPaid: amountPaid
        });

        historyBySpace[spaceId].push(record);
        totalEvents += 1;

        emit ParkingEventRegistered(
            spaceId,
            licensePlate,
            occupied,
            block.timestamp,
            durationSeconds,
            amountPaid
        );
    }

    /// @notice Devuelve el historial completo de eventos de un espacio especifico.
    function getHistoryBySpace(
        uint256 spaceId
    ) external view returns (ParkingRecord[] memory) {
        return historyBySpace[spaceId];
    }

    /// @notice Devuelve cuantos eventos tiene registrados un espacio.
    function getEventCount(uint256 spaceId) external view returns (uint256) {
        return historyBySpace[spaceId].length;
    }
}
