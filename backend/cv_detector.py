"""
cv_detector.py – Detector de autos en la maqueta SmartPark

Modos de uso:
  python cv_detector.py              → detección real con webcam
  python cv_detector.py --demo       → modo teclado sin cámara (1/2/3/4 = toggle)
  python cv_detector.py --calibrate  → calibración visual de las 4 zonas ROI

Flujo normal:
  1. Abre la cámara y aprende el fondo durante 3 segundos (sin autos).
  2. Monitorea 4 zonas ROI definidas en cv_config.json.
  3. Cuando detecta un auto (cambio de píxeles > threshold), llama a POST /api/occupancy.
  4. Repite al detectar que el auto se va.

Configuración (cv_config.json):
  - camera_index: índice de la cámara (0 = primera disponible)
  - debounce_frames: frames consecutivos para confirmar cambio de estado
  - detection_threshold: fracción de píxeles distintos para "ocupado" (0.0–1.0)
  - spaces[].id: debe coincidir con los IDs en Supabase (P1, P2, P3, P4)
  - spaces[].mock_plate: patente simulada del auto en ese lugar
  - spaces[].roi: [x, y, ancho, alto] en píxeles sobre la imagen de la cámara
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

BACKEND_URL = "http://localhost:8000"
CONFIG_PATH = Path(__file__).parent / "cv_config.json"

DEFAULT_CONFIG = {
    "backend_url": BACKEND_URL,
    "camera_index": 0,
    "debounce_frames": 8,
    "detection_threshold": 0.12,
    "spaces": [
        {"id": "P1", "name": "Lugar P1", "mock_plate": "ABC123", "roi": [20,  20,  220, 220]},
        {"id": "P2", "name": "Lugar P2", "mock_plate": "XYZ456", "roi": [260, 20,  220, 220]},
        {"id": "P3", "name": "Lugar P3", "mock_plate": "DEF789", "roi": [20,  260, 220, 220]},
        {"id": "P4", "name": "Lugar P4", "mock_plate": "GHI012", "roi": [260, 260, 220, 220]},
    ],
}


def load_config() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return DEFAULT_CONFIG


def save_config(cfg: dict):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)
    print(f"Configuración guardada en {CONFIG_PATH}")


def notify_backend(backend_url: str, space_id: str, license_plate: str, occupied: bool):
    tag = datetime.now().strftime("%H:%M:%S")
    try:
        r = requests.post(
            f"{backend_url}/api/occupancy",
            json={"space_id": space_id, "license_plate": license_plate, "occupied": occupied},
            timeout=5,
        )
        data = r.json()
        status   = data.get("space_status", "?")
        is_valid = data.get("is_valid")
        tx       = data.get("blockchain", {}).get("tx_hash", "")
        tx_short = f"{tx[:16]}..." if tx else "N/A"
        icon     = "🟢" if not occupied else ("✅" if is_valid else "🔴")
        print(f"[{tag}] {space_id} {icon}  estado={status}  válido={is_valid}  tx={tx_short}")
    except Exception as e:
        print(f"[{tag}] Error al notificar backend ({space_id}): {e}")


# ---------------------------------------------------------------------------
# Modo calibración: dibujá los 4 ROIs a mano
# ---------------------------------------------------------------------------
_roi_drawing = False
_roi_start = None
_roi_end   = None

def _mouse_cb(event, x, y, _flags, _param):
    global _roi_drawing, _roi_start, _roi_end
    import cv2
    if event == cv2.EVENT_LBUTTONDOWN:
        _roi_drawing = True
        _roi_start = (x, y)
    elif event == cv2.EVENT_MOUSEMOVE and _roi_drawing:
        _roi_end = (x, y)
    elif event == cv2.EVENT_LBUTTONUP:
        _roi_drawing = False
        _roi_end = (x, y)


def run_calibrate(config: dict):
    import cv2
    global _roi_start, _roi_end

    cap = cv2.VideoCapture(config["camera_index"])
    if not cap.isOpened():
        print("No se pudo abrir la cámara.")
        return

    spaces  = config["spaces"]
    rois    = [None] * len(spaces)
    current = 0

    cv2.namedWindow("SmartPark – Calibración")
    cv2.setMouseCallback("SmartPark – Calibración", _mouse_cb)

    print(f"\nDibujá el ROI para '{spaces[0]['name']}' y presioná ENTER para confirmar.\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        display = frame.copy()

        for i, roi in enumerate(rois):
            if roi:
                x, y, w, h = roi
                cv2.rectangle(display, (x, y), (x + w, y + h), (0, 220, 0), 2)
                cv2.putText(display, spaces[i]["name"], (x, max(y - 8, 10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 0), 2)

        if _roi_start and _roi_end:
            cv2.rectangle(display, _roi_start, _roi_end, (0, 120, 255), 2)

        if current < len(spaces):
            msg = f"ROI para: {spaces[current]['name']}  — ENTER confirma | ESC sale"
        else:
            msg = "Todos los ROIs listos! Presioná S para guardar | ESC para salir"

        cv2.putText(display, msg, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        cv2.imshow("SmartPark – Calibración", display)
        key = cv2.waitKey(1) & 0xFF

        if key == 27:  # ESC
            break
        elif key == 13 and _roi_start and _roi_end and current < len(spaces):  # ENTER
            x0 = min(_roi_start[0], _roi_end[0])
            y0 = min(_roi_start[1], _roi_end[1])
            x1 = max(_roi_start[0], _roi_end[0])
            y1 = max(_roi_start[1], _roi_end[1])
            rois[current] = [x0, y0, x1 - x0, y1 - y0]
            print(f"  {spaces[current]['name']}: {rois[current]}")
            current += 1
            _roi_start = _roi_end = None
            if current < len(spaces):
                print(f"Ahora dibujá el ROI para '{spaces[current]['name']}'")
            else:
                print("Todos los ROIs definidos. Presioná S para guardar.")
        elif key in (ord("s"), ord("S")):
            for i, roi in enumerate(rois):
                if roi:
                    config["spaces"][i]["roi"] = roi
            save_config(config)
            break

    cap.release()
    cv2.destroyAllWindows()


# ---------------------------------------------------------------------------
# Modo demo: teclado simula detección (sin cámara)
# ---------------------------------------------------------------------------
def run_demo(config: dict):
    spaces      = config["spaces"]
    backend_url = config.get("backend_url", BACKEND_URL)
    state       = {s["id"]: False for s in spaces}

    print("\n=== SmartPark CV – Modo Demo ===")
    print("Teclas: 1 2 3 4  →  toggle del espacio correspondiente")
    print("        Q         →  salir\n")
    for i, s in enumerate(spaces):
        print(f"  {i + 1}  →  {s['name']} ({s['id']})  patente: {s['mock_plate']}")
    print()

    try:
        import termios, tty
        fd  = sys.stdin.fileno()
        old = termios.tcgetattr(fd)

        def getch():
            try:
                tty.setraw(fd)
                return sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old)

        while True:
            _print_demo_status(spaces, state)
            ch = getch()
            if ch in ("q", "Q"):
                print("\nSaliendo...")
                break
            if ch in "1234":
                idx = int(ch) - 1
                if idx < len(spaces):
                    s        = spaces[idx]
                    new_val  = not state[s["id"]]
                    state[s["id"]] = new_val
                    action   = "OCUPADO" if new_val else "LIBRE"
                    print(f"\n  → {s['name']}: {action}")
                    notify_backend(backend_url, s["id"], s["mock_plate"], new_val)

    except ImportError:
        # Windows fallback
        import msvcrt
        while True:
            _print_demo_status(spaces, state)
            ch = msvcrt.getwch()
            if ch in ("q", "Q"):
                break
            if ch in "1234":
                idx = int(ch) - 1
                if idx < len(spaces):
                    s       = spaces[idx]
                    new_val = not state[s["id"]]
                    state[s["id"]] = new_val
                    notify_backend(backend_url, s["id"], s["mock_plate"], new_val)


def _print_demo_status(spaces, state):
    parts = [
        f"{s['name']}: {'🔴 OCUP' if state[s['id']] else '🟢 LIBRE'}"
        for s in spaces
    ]
    print("\r" + "  |  ".join(parts) + "    ", end="", flush=True)


# ---------------------------------------------------------------------------
# Modo normal: webcam + background subtraction
# ---------------------------------------------------------------------------
def run_normal(config: dict):
    import cv2
    import numpy as np

    spaces      = config["spaces"]
    backend_url = config.get("backend_url", BACKEND_URL)
    debounce    = config.get("debounce_frames", 8)
    threshold   = config.get("detection_threshold", 0.12)

    cap = cv2.VideoCapture(config.get("camera_index", 0))
    if not cap.isOpened():
        print("No se pudo abrir la cámara. Usá --demo para modo sin cámara.")
        sys.exit(1)

    # MOG2 aprende el fondo durante los primeros frames
    bg_sub = cv2.createBackgroundSubtractorMOG2(
        history=200, varThreshold=25, detectShadows=False
    )

    print("Inicializando modelo de fondo (3 s) — asegurate de que no haya autos en los ROIs...")
    for _ in range(30):
        ret, frame = cap.read()
        if ret:
            bg_sub.apply(frame)
        time.sleep(0.1)
    print("Listo. Detectando... (Q para salir)\n")

    current_state = {s["id"]: False for s in spaces}
    pending       = {s["id"]: 0    for s in spaces}   # frames consecutivos de estado opuesto

    COLOR = {True: (0, 0, 210), False: (0, 200, 0)}   # rojo / verde

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error leyendo cámara.")
            break

        fg_mask = bg_sub.apply(frame)
        display  = frame.copy()

        for space in spaces:
            x, y, w, h = space["roi"]
            roi_mask = fg_mask[y: y + h, x: x + w]
            if roi_mask.size == 0:
                continue

            ratio    = np.count_nonzero(roi_mask) / roi_mask.size
            detected = ratio > threshold
            sid      = space["id"]

            if detected != current_state[sid]:
                pending[sid] += 1
                if pending[sid] >= debounce:
                    current_state[sid] = detected
                    pending[sid]       = 0
                    notify_backend(backend_url, sid, space["mock_plate"], detected)
            else:
                pending[sid] = 0

            color = COLOR[current_state[sid]]
            cv2.rectangle(display, (x, y), (x + w, y + h), color, 2)
            label = f"{space['name']}: {'OCUP' if current_state[sid] else 'LIBRE'}"
            cv2.putText(display, label, (x, max(y - 8, 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.52, color, 2)
            cv2.putText(display, f"{ratio:.0%}", (x + w - 44, y + h - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (190, 190, 190), 1)

        cv2.imshow("SmartPark CV", display)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="SmartPark CV Detector")
    parser.add_argument("--demo",      action="store_true", help="Modo demo sin cámara (teclado)")
    parser.add_argument("--calibrate", action="store_true", help="Calibrar zonas ROI visualmente")
    args   = parser.parse_args()
    config = load_config()

    if args.calibrate:
        run_calibrate(config)
    elif args.demo:
        run_demo(config)
    else:
        run_normal(config)


if __name__ == "__main__":
    main()
