"""
app.py – Backend SmartPark

Endpoints:
  GET  /api/spaces              → estado actual de los 4 espacios (Supabase)
  POST /api/reserve             → crea reserva después del pago mock MP
  POST /api/occupancy           → la maqueta/CV reporta detección de auto
  GET  /api/spaces/<id>/history → historial blockchain de un espacio
"""

import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client

from blockchain_client import register_parking_event, get_history_by_space

load_dotenv()

app = Flask(__name__)
CORS(app)

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


# ---------------------------------------------------------------------------
# GET /api/spaces
# ---------------------------------------------------------------------------
@app.get("/api/spaces")
def get_spaces():
    result = supabase.table("parking_spaces").select("*").order("id").execute()
    return jsonify(result.data)


# ---------------------------------------------------------------------------
# POST /api/reserve
# Body: { space_id, user_name, license_plate, date, time_from, time_to, amount_pesos }
# ---------------------------------------------------------------------------
@app.post("/api/reserve")
def reserve():
    data = request.get_json()
    space_id      = data["space_id"]
    user_name     = data["user_name"].strip()
    license_plate = data["license_plate"].upper().strip()
    res_date      = data["date"]
    time_from     = data["time_from"]
    time_to       = data["time_to"]
    amount_pesos  = float(data["amount_pesos"])
    amount_centavos = int(round(amount_pesos * 100))

    mp_mock_id = f"MP-MOCK-{uuid.uuid4().hex[:8].upper()}"

    # 1) Guardar reserva en Supabase
    res = supabase.table("reservations").insert({
        "space_id":      space_id,
        "user_name":     user_name,
        "license_plate": license_plate,
        "date":          res_date,
        "time_from":     time_from,
        "time_to":       time_to,
        "amount_pesos":  amount_pesos,
        "mp_mock_id":    mp_mock_id,
        "status":        "active",
    }).execute()

    res_id = res.data[0]["id"] if res.data else None

    # 2) Marcar el espacio como 'reserved'
    supabase.table("parking_spaces").update({
        "status":     "reserved",
        "updated_at": _now(),
    }).eq("id", space_id).execute()

    # 3) Sellar en blockchain (tolerante a fallos)
    blockchain = _blockchain_register(
        license_plate=license_plate,
        space_id=space_id,
        occupied=True,
        duration_seconds=0,
        amount_paid=amount_centavos,
    )

    if res_id and blockchain.get("tx_hash"):
        supabase.table("reservations").update(
            {"blockchain_tx_hash": blockchain["tx_hash"]}
        ).eq("id", res_id).execute()

    return jsonify({
        "status":         "ok",
        "reservation_id": res_id,
        "mp_mock_id":     mp_mock_id,
        "blockchain":     blockchain,
    })


# ---------------------------------------------------------------------------
# POST /api/occupancy
# Body: { space_id, license_plate, occupied }
# ---------------------------------------------------------------------------
@app.post("/api/occupancy")
def occupancy():
    data          = request.get_json()
    space_id      = data["space_id"]
    license_plate = data.get("license_plate", "").upper().strip()
    occupied      = bool(data["occupied"])

    duration_seconds = 0
    is_valid         = None
    new_status       = "available"

    if occupied:
        is_valid   = _check_valid_reservation(space_id, license_plate)
        new_status = "occupied_valid" if is_valid else "occupied_illegal"
    else:
        duration_seconds = _calculate_duration(space_id)
        _complete_reservation(space_id)

    # Actualizar espacio en Supabase
    supabase.table("parking_spaces").update({
        "status":                new_status,
        "current_license_plate": license_plate if occupied else None,
        "updated_at":            _now(),
    }).eq("id", space_id).execute()

    # Sellar en blockchain
    blockchain = _blockchain_register(
        license_plate=license_plate or "UNKNOWN",
        space_id=space_id,
        occupied=occupied,
        duration_seconds=duration_seconds,
        amount_paid=0,
    )

    # Log de auditoría
    supabase.table("occupancy_events").insert({
        "space_id":            space_id,
        "license_plate":       license_plate,
        "occupied":            occupied,
        "is_valid":            is_valid,
        "duration_seconds":    duration_seconds,
        "blockchain_tx_hash":  blockchain.get("tx_hash"),
    }).execute()

    return jsonify({
        "status":       "ok",
        "space_status": new_status,
        "is_valid":     is_valid,
        "blockchain":   blockchain,
    })


# ---------------------------------------------------------------------------
# GET /api/spaces/<space_id>/history
# ---------------------------------------------------------------------------
@app.get("/api/spaces/<space_id>/history")
def space_history(space_id):
    try:
        space_num = int(space_id.replace("P", ""))
        history   = get_history_by_space(space_num)
        return jsonify({"status": "ok", "history": history})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _check_valid_reservation(space_id: str, license_plate: str) -> bool:
    """True si hay una reserva activa para este espacio y patente en este momento."""
    now          = datetime.now(timezone.utc)
    today        = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")

    result = (
        supabase.table("reservations")
        .select("id")
        .eq("space_id",      space_id)
        .eq("license_plate", license_plate)
        .eq("date",          today)
        .eq("status",        "active")
        .lte("time_from",    current_time)
        .gte("time_to",      current_time)
        .execute()
    )
    return len(result.data) > 0


def _calculate_duration(space_id: str) -> int:
    """Segundos transcurridos desde que llegó el último auto a este espacio."""
    result = (
        supabase.table("occupancy_events")
        .select("detected_at")
        .eq("space_id", space_id)
        .eq("occupied",  True)
        .order("detected_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return 0
    last = datetime.fromisoformat(result.data[0]["detected_at"])
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return int((datetime.now(timezone.utc) - last).total_seconds())


def _complete_reservation(space_id: str):
    """Marca como 'completed' la reserva activa vigente de este espacio."""
    now          = datetime.now(timezone.utc)
    today        = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    (
        supabase.table("reservations")
        .update({"status": "completed"})
        .eq("space_id", space_id)
        .eq("date",     today)
        .eq("status",   "active")
        .lte("time_from", current_time)
        .execute()
    )


def _blockchain_register(license_plate, space_id, occupied, duration_seconds, amount_paid) -> dict:
    """Llama a ParkingRegistry.registerEvent(); ignora errores para no bloquear el flujo."""
    try:
        space_num = int(str(space_id).replace("P", ""))
        return register_parking_event(
            license_plate=license_plate,
            space_id=space_num,
            occupied=occupied,
            duration_seconds=duration_seconds,
            amount_paid=amount_paid,
        )
    except Exception as e:
        return {"status": "error", "error": str(e)}


if __name__ == "__main__":
    app.run(debug=True, port=8000)
