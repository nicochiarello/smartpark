// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SparkToken (SPARK)
/// @notice Representa pesos recaudados y tokenizados on-chain.
///         Se mintea 1:1 cada vez que el backend confirma un pago real
///         (Mercado Pago / tarjeta) por estacionamiento.
/// @dev Usa 18 decimales como cualquier ERC20 estandar. Para tokenizar
///      $100 ARS de un pago, el backend mintea 100 * 10^18 SPARK.
contract SparkToken is ERC20, Ownable {
    constructor() ERC20("SmartPark Token", "SPARK") Ownable(msg.sender) {}

    /// @notice Solo el owner (la wallet autorizada de tu backend) puede mintear,
    ///         atado a un pago real confirmado por la pasarela de pago.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
