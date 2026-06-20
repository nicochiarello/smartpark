"""
app.py

Backend minimo de SmartPark Web3.
Conecta: deteccion de IA -> Supabase (estado rapido) -> Blockchain (sello inmutable).

Endpoints:
  POST /api/occupancy  -> la IA llama esto cuando detecta que un auto entro o se fue
  POST /api/payment     -> se llama cuando se confirma un pago (Mercado Pago, simplificado)
"""

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from supabase import create_client

from blockchain_client import register_parking_event

load_dotenv()

app = Flask(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@app.post("/api/occupancy")
def occupancy_event():
    """
    La IA llama este endpoint cada vez que detecta un cambio de ocupacion.
    Body esperado: { "space_id": 1, "license_plate": "AB123CD", "occupied": true }
    """
    data = request.get_json()
    space_id = data["space_id"]
    license_plate = data["license_plate"].upper()
    occupied = data["occupied"]

    duration_seconds = 0
    if not occupied:
        duration_seconds = _calculate_duration(space_id, license_plate)

    # 1) Escritura rapida en Supabase (lo que ve el dashboard en vivo)
    supabase.table("parking_events").insert({
        "space_id": space_id,
        "license_plate": license_plate,
        "occupied": occupied,
        "duration_seconds": duration_seconds,
        "amount_paid": 0,
    }).execute()

    # 2) Sello inmutable en blockchain
    result = register_parking_event(
        license_plate=license_plate,
        space_id=space_id,
        occupied=occupied,
        duration_seconds=duration_seconds,
        amount_paid=0,
    )

    return jsonify({"status": "ok", "blockchain": result})


@app.post("/api/payment")
def payment_confirmed():
    """
    Se llama cuando se confirma un pago.
    Body esperado: { "space_id": 1, "license_plate": "AB123CD", "amount_pesos": 500.00 }

    NOTA: en una integracion real con Mercado Pago este endpoint recibe solo un
    ID de notificacion, y hay que consultar la API de Mercado Pago para obtener
    el monto real antes de confirmar. Acá se simplifica para el MVP — cuando
    integres el SDK de Mercado Pago, reemplazá la lectura del body por esa consulta.
    """
    data = request.get_json()
    space_id = data["space_id"]
    license_plate = data["license_plate"].upper()
    amount_pesos = data["amount_pesos"]
    amount_centavos = int(round(amount_pesos * 100))  # Solidity no maneja decimales

    supabase.table("parking_events").insert({
        "space_id": space_id,
        "license_plate": license_plate,
        "occupied": True,
        "duration_seconds": 0,
        "amount_paid": amount_pesos,
    }).execute()

    result = register_parking_event(
        license_plate=license_plate,
        space_id=space_id,
        occupied=True,
        duration_seconds=0,
        amount_paid=amount_centavos,
    )

    return jsonify({"status": "ok", "blockchain": result})


def _calculate_duration(space_id, license_plate):
    """Busca el ultimo 'occupied=true' de esta patente/espacio para calcular cuanto estuvo."""
    response = (
        supabase.table("parking_events")
        .select("detected_at")
        .eq("space_id", space_id)
        .eq("license_plate", license_plate)
        .eq("occupied", True)
        .order("detected_at", desc=True)
        .limit(1)
        .execute()
    )
    if not response.data:
        return 0
    last_arrival = datetime.fromisoformat(response.data[0]["detected_at"])
    now = datetime.now(timezone.utc)
    return int((now - last_arrival).total_seconds())


if __name__ == "__main__":
    app.run(debug=True, port=5000)
