// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Stablecoin simulada para el MVP — no depende de la USDC real.
///         Se mintea un supply fijo al desplegar para que el deployer
///         pueda usarlo como liquidez inicial del pool de swap.
contract MockUSDC is ERC20 {
    /// @param initialSupply Cantidad total a mintear al deployer, en unidades
    ///        con 18 decimales (ej: 1_000_000 * 10**18 para 1 millon de mUSDC).
    constructor(uint256 initialSupply) ERC20("Mock USD Coin", "mUSDC") {
        _mint(msg.sender, initialSupply);
    }
}
