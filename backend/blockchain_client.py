"""
blockchain_client.py

Cliente Python para interactuar con el contrato ParkingRegistry desplegado en Sepolia.

Lo usa tu backend para:
  1) Sellar en la blockchain cada evento de ocupacion que detecta la IA (YOLOv8).
  2) Sellar el monto cobrado cuando Mercado Pago / tarjeta confirma un pago.

Requiere estas variables en tu .env:
  SEPOLIA_RPC_URL=...
  PRIVATE_KEY=0x...                  (la wallet autorizada como reporter)
  PARKING_REGISTRY_ADDRESS=0x...     (direccion del contrato ya desplegado)
"""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

RPC_URL = os.environ["SEPOLIA_RPC_URL"]
PRIVATE_KEY = os.environ["PRIVATE_KEY"]
CONTRACT_ADDRESS = Web3.to_checksum_address(os.environ["PARKING_REGISTRY_ADDRESS"])

ABI_PATH = Path(__file__).parent / "ParkingRegistry.abi.json"
with open(ABI_PATH) as f:
    CONTRACT_ABI = json.load(f)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


def _send_transaction(function_call):
    """Firma y envia una transaccion de escritura, espera la confirmacion en la red."""
    nonce = w3.eth.get_transaction_count(account.address)
    tx = function_call.build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt


def register_parking_event(license_plate, space_id, occupied, duration_seconds=0, amount_paid=0):
    """
    Sella un evento de estacionamiento en la blockchain.

    license_plate:    patente ya validada por el analizador lexico (regex) del backend
    space_id:          ID del espacio (debe coincidir con el ID usado en Supabase)
    occupied:          True si el auto acaba de estacionar, False si se fue
    duration_seconds:  duracion de la estadia en segundos (0 si occupied == True)
    amount_paid:       monto cobrado via Mercado Pago/tarjeta, en centavos (0 si no aplica)

    Devuelve un dict con el hash de la transaccion y si se confirmo correctamente.
    """
    function_call = contract.functions.registerEvent(
        license_plate, space_id, occupied, duration_seconds, amount_paid
    )
    receipt = _send_transaction(function_call)
    return {
        "tx_hash": receipt.transactionHash.hex(),
        "block_number": receipt.blockNumber,
        "status": "success" if receipt.status == 1 else "failed",
    }


def get_history_by_space(space_id):
    """Devuelve el historial completo de eventos de un espacio, ya decodificado."""
    records = contract.functions.getHistoryBySpace(space_id).call()
    return [
        {
            "license_plate": r[0],
            "space_id": r[1],
            "timestamp": r[2],
            "occupied": r[3],
            "duration_seconds": r[4],
            "amount_paid": r[5],
        }
        for r in records
    ]


def add_authorized_reporter(reporter_address):
    """Autoriza una nueva wallet para llamar registerEvent. Solo lo puede ejecutar el owner."""
    function_call = contract.functions.addAuthorizedReporter(
        Web3.to_checksum_address(reporter_address)
    )
    return _send_transaction(function_call)


if __name__ == "__main__":
    # Ejemplo de uso: simula un auto estacionando con un pago ya confirmado
    result = register_parking_event(
        license_plate="AB123CD",
        space_id=1,
        occupied=True,
        duration_seconds=0,
        amount_paid=50000,  # ej: $500.00 ARS representado en centavos
    )
    print("Evento registrado:", result)

    history = get_history_by_space(1)
    print("Historial del espacio 1:", history)
