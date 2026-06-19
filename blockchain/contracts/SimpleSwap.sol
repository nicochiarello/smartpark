// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleSwap
/// @notice Pool de intercambio entre SPARK y mUSDC usando la formula
///         constant product (x*y=k), el mismo principio que Uniswap V2.
/// @dev Simplificado para un MVP: un solo proveedor de liquidez (el owner),
///      sin tokens LP ni rangos de precio. Pensado para ser explicado
///      facilmente frente a un jurado.
contract SimpleSwap is Ownable {
    IERC20 public immutable tokenA; // SPARK
    IERC20 public immutable tokenB; // mUSDC

    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(uint256 amountA, uint256 amountB);
    event Swapped(
        address indexed user,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /// @notice Carga liquidez inicial al pool. Requiere haber hecho approve()
    ///         de ambos tokens hacia este contrato antes de llamarla.
    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "SimpleSwap: invalid amounts");
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        reserveA += amountA;
        reserveB += amountB;
        emit LiquidityAdded(amountA, amountB);
    }

    /// @notice Calcula cuanto se recibiria por un swap, sin ejecutarlo.
    ///         Util para mostrar una vista previa en el dashboard antes de confirmar.
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "SimpleSwap: insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "SimpleSwap: insufficient liquidity");
        uint256 amountInWithFee = amountIn * 997; // fee de 0.3%, igual que Uniswap V2
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Intercambia tokenIn (SPARK o mUSDC) por el otro token del pool.
    ///         Requiere approve() previo de tokenIn hacia este contrato.
    function swap(address tokenIn, uint256 amountIn) external returns (uint256 amountOut) {
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "SimpleSwap: invalid token"
        );
        bool isTokenA = tokenIn == address(tokenA);

        (uint256 reserveIn, uint256 reserveOut) = isTokenA
            ? (reserveA, reserveB)
            : (reserveB, reserveA);

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);

        IERC20 inputToken = isTokenA ? tokenA : tokenB;
        IERC20 outputToken = isTokenA ? tokenB : tokenA;

        inputToken.transferFrom(msg.sender, address(this), amountIn);
        outputToken.transfer(msg.sender, amountOut);

        if (isTokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        emit Swapped(msg.sender, tokenIn, amountIn, address(outputToken), amountOut);
    }

    /// @notice Devuelve las reservas actuales del pool.
    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }
}
