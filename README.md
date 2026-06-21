# SmartPark

Sistema de estacionamiento inteligente con reservas via MercadoPago (mock), registro inmutable en blockchain (Ethereum Sepolia) y detección de autos en maqueta física mediante computer vision.

---

## Arquitectura general

```text
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js · puerto 3000)                           │
│  - Mapa con 4 lugares en tiempo real                        │
│  - Reserva con mock MercadoPago                             │
│  - Polling cada 3 s → actualiza colores automáticamente     │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTP
┌───────────────────▼─────────────────────────────────────────┐
│  BACKEND (Flask · puerto 8000)                              │
│  - Lógica de negocio                                        │
│  - Escribe en Supabase (estado actual)                      │
│  - Sella en blockchain (auditoría inmutable)                │
└────────┬──────────────────────┬─────────────────────────────┘
         │                      │
┌────────▼────────┐   ┌─────────▼─────────────────────────────┐
│  Supabase       │   │  Ethereum Sepolia (testnet)            │
│  (estado vivo)  │   │  Contrato: ParkingRegistry.sol         │
└────────▲────────┘   └───────────────────────────────────────┘
         │
┌────────┴────────────────────────────────────────────────────┐
│  CV DETECTOR (Python · cv_detector.py)                      │
│  - Detecta autos en la maqueta física (webcam)              │
│  - Notifica al backend via POST /api/occupancy              │
└─────────────────────────────────────────────────────────────┘
```

---

## Estados de un lugar

| Color en mapa | Estado             | Significado                                 |
|---------------|--------------------|---------------------------------------------|
| 🟢 Verde      | `available`        | Libre, disponible para reservar             |
| 🔵 Azul       | `reserved`         | Reserva pagada, el auto aún no llegó        |
| 🟣 Violeta    | `occupied_valid`   | Auto detectado por CV con reserva válida    |
| 🔴 Rojo       | `occupied_illegal` | Auto detectado por CV sin reserva (intruso) |

---

## Requisitos previos

- Node.js 18+
- Python 3.10+
- Cuenta en [Supabase](https://supabase.com) con el proyecto ya creado
- (Opcional) Wallet en Ethereum Sepolia con fondos para gas

---

## Instalación

### 1. Frontend

```bash
npm install
```

Crear `.env.local` en la raíz (ya existe, verificar):

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

El archivo `backend/.env` debe tener:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
PRIVATE_KEY=0x<clave_privada_de_la_wallet_autorizada>
PARKING_REGISTRY_ADDRESS=0x<dirección_del_contrato_desplegado>
```

> **IMPORTANTE:** Nunca subas `backend/.env` al repositorio. Está en `.gitignore`.

### 3. Base de datos (Supabase)

Copiar el contenido de `backend/supabase_schema.sql` y ejecutarlo en el **SQL Editor** de Supabase (una sola vez).

Esto crea las tablas `parking_spaces`, `reservations` y `occupancy_events`, y carga los 4 lugares iniciales (P1–P4).

---

## Levantar el proyecto

```bash
# Terminal 1 — Backend
cd backend
python app.py
# → corriendo en http://localhost:8000

# Terminal 2 — Frontend
npm run dev
# → corriendo en http://localhost:3000
```

---

## API del Backend

Base URL: `http://localhost:8000`

---

### `GET /api/spaces`

Devuelve el estado actual de los 4 lugares desde Supabase.

**Response:**

```json
[
  {
    "id": "P1",
    "name": "Lugar P1",
    "address": "Maqueta SmartPark – Sector A",
    "lat": -32.8895,
    "lng": -68.8455,
    "price_per_hour": 1000.0,
    "status": "available",
    "current_license_plate": null,
    "updated_at": "2026-06-21T02:00:00+00:00"
  }
]
```

**Posibles valores de `status`:** `available` · `reserved` · `occupied_valid` · `occupied_illegal`

---

### `POST /api/reserve`

Crea una reserva luego de que el usuario completa el pago mock de MercadoPago. Actualiza el lugar a `reserved` y sella el evento en blockchain.

**Body:**

```json
{
  "space_id": "P1",
  "user_name": "Juan Pérez",
  "license_plate": "ABC123",
  "date": "2026-06-21",
  "time_from": "10:00",
  "time_to": "12:00",
  "amount_pesos": 2000
}
```

**Response:**

```json
{
  "status": "ok",
  "reservation_id": "uuid-...",
  "mp_mock_id": "MP-MOCK-A1B2C3D4",
  "blockchain": {
    "tx_hash": "0xabc...",
    "block_number": 123456,
    "status": "success"
  }
}
```

> Si la blockchain falla (sin gas, contrato no desplegado, etc.), `blockchain` devuelve `{"status": "error", "error": "..."}` pero la reserva **igual se guarda en Supabase** y la respuesta es exitosa.

---

### `POST /api/occupancy`

Llamado por el script de computer vision cuando detecta que un auto entra o sale de un lugar. Verifica si hay una reserva activa para esa patente en ese momento y actualiza el estado del lugar.

**Body:**

```json
{
  "space_id": "P2",
  "license_plate": "XYZ456",
  "occupied": true
}
```

- `occupied: true` → auto llegó
- `occupied: false` → auto se fue

**Response:**

```json
{
  "status": "ok",
  "space_status": "occupied_valid",
  "is_valid": true,
  "blockchain": { "tx_hash": "0xdef...", "status": "success" }
}
```

**Lógica de validación:**

| Condición                                          | `space_status`      | `is_valid` |
|----------------------------------------------------|---------------------|------------|
| `occupied: true` + reserva activa para esa patente | `occupied_valid`    | `true`     |
| `occupied: true` + sin reserva                     | `occupied_illegal`  | `false`    |
| `occupied: false`                                  | `available`         | `null`     |

Una reserva es **activa** si cumple todo esto al mismo tiempo:

- `status = active`
- `date = hoy`
- `time_from ≤ hora_actual ≤ time_to`
- `license_plate` coincide exactamente

---

### `GET /api/spaces/<space_id>/history`

Devuelve el historial de eventos de un lugar desde la blockchain.

**Ejemplo:** `GET /api/spaces/P1/history`

**Response:**

```json
{
  "status": "ok",
  "history": [
    {
      "license_plate": "ABC123",
      "space_id": 1,
      "timestamp": 1718928000,
      "occupied": true,
      "duration_seconds": 0,
      "amount_paid": 200000
    }
  ]
}
```

---

## Maqueta física — Computer Vision

El script `backend/cv_detector.py` conecta la maqueta física con el sistema. Monitorea 4 zonas de la cámara y notifica al backend cuando detecta presencia de un auto.

### Modos de uso

#### Modo demo (sin cámara) — para testing

Simula la detección de autos con el teclado. Útil para probar el sistema completo sin necesitar la maqueta física.

```bash
cd backend
python cv_detector.py --demo
```

Controles:

- `1` → toggle Lugar P1
- `2` → toggle Lugar P2
- `3` → toggle Lugar P3
- `4` → toggle Lugar P4
- `Q` → salir

Cada press envía un `POST /api/occupancy` al backend y el mapa del frontend se actualiza en ≤3 segundos.

#### Modo calibración — primera vez con cámara real

Define visualmente las 4 zonas de la imagen (ROIs) que corresponden a cada lugar de la maqueta.

```bash
cd backend
python cv_detector.py --calibrate
```

Instrucciones:

1. Se abre la imagen de la cámara en vivo
2. Hacés click y arrastrás para dibujar el rectángulo del Lugar P1
3. Presionás `ENTER` para confirmar
4. Repetís para P2, P3 y P4
5. Presionás `S` para guardar la configuración en `cv_config.json`

#### Modo normal — producción con cámara

```bash
cd backend
python cv_detector.py
```

Requiere haber calibrado previamente. Usa sustracción de fondo (MOG2) para detectar objetos en las zonas definidas.

### Patentes simuladas

Cada lugar tiene una patente de auto asignada en la configuración. Cuando el CV detecta un auto en un lugar, informa esa patente al backend para verificar si tiene reserva.

| Lugar | Patente CV (`mock_plate`) |
|-------|---------------------------|
| P1    | `ABC123`                  |
| P2    | `XYZ456`                  |
| P3    | `DEF789`                  |
| P4    | `GHI012`                  |

Para que una detección sea **válida**, el usuario debe haber reservado el lugar con la misma patente de la tabla. Si usa otra patente, el sistema la detecta como intrusión.

Para cambiar las patentes, editá `backend/cv_config.json` (se crea al calibrar) o el `DEFAULT_CONFIG` en `cv_detector.py`.

---

## Flujo completo de la demo

### 1. Reservar un lugar desde la web

1. Abrir `http://localhost:3000`
2. Hacer click en un lugar disponible (pin verde)
3. Seleccionar fecha de hoy y un rango horario que incluya la hora actual
4. Click en **"Reservar con MercadoPago"**
5. Ingresar nombre y la patente correspondiente al lugar (ver tabla de arriba)
6. En el mock de MercadoPago, click en **"Pagar"**
7. El lugar pasa a **azul** (reserved)

### 2. Simular llegada del auto (demo con teclado)

```bash
python cv_detector.py --demo
```

Presionar la tecla del lugar que reservaste → el pin pasa a **violeta** (occupied_valid).

### 3. Simular auto intruso

Presionar la tecla de un lugar **sin reserva activa** → el pin pasa a **rojo** (occupied_illegal).

### 4. Simular que el auto se va

Presionar la misma tecla de nuevo → el pin vuelve a **verde** (available).

---

## Reset de datos para la demo

Cuando quieran limpiar todos los estados y empezar de cero, ejecutar en el **SQL Editor** de Supabase:

```sql
DELETE FROM occupancy_events;
DELETE FROM reservations;
UPDATE parking_spaces
SET status = 'available', current_license_plate = NULL, updated_at = NOW();
```

> La blockchain es inmutable — los eventos ya registrados permanecen, pero no afectan el funcionamiento de la demo.

---

## Estructura del proyecto

```text
smartpark/
├── app/                         # Páginas Next.js
│   ├── page.tsx                 # Página principal (mapa)
│   └── reservations/page.tsx    # Historial de reservas
├── components/                  # Componentes React
│   ├── Map.tsx                  # Mapa con Leaflet
│   ├── SpacePin.tsx             # Pin del mapa (colores por estado)
│   ├── SpaceDetailPanel.tsx     # Panel lateral al seleccionar lugar
│   ├── ReservationModal.tsx     # Modal de reserva + mock MercadoPago
│   ├── ReservationCard.tsx      # Tarjeta en historial de reservas
│   ├── StatusBadge.tsx          # Badge de estado
│   └── Header.tsx               # Barra de navegación
├── context/
│   └── AppContext.tsx           # Estado global + polling al backend
├── lib/
│   ├── types.ts                 # Tipos TypeScript (ParkingSpace, Reservation)
│   ├── utils.ts                 # Helpers (formatARS, calculateDuration, etc.)
│   └── mockData.ts              # Datos de fallback si el backend no responde
├── backend/
│   ├── app.py                   # API Flask (endpoints principales)
│   ├── blockchain_client.py     # Cliente web3 para ParkingRegistry
│   ├── cv_detector.py           # Script de computer vision para la maqueta
│   ├── cv_config.json           # Configuración de ROIs (se genera al calibrar)
│   ├── supabase_schema.sql      # Schema de la base de datos
│   ├── ParkingRegistry.abi.json # ABI del contrato desplegado
│   ├── requirements.txt         # Dependencias Python
│   └── .env                     # Variables de entorno (NO subir al repo)
└── blockchain/
    └── contracts/
        ├── SmartPark.sol        # Contrato de reservas (referencia)
        └── ParkingRegistry.sol  # Contrato de auditoría (en uso)
```

---

## Tablas de Supabase

### `parking_spaces`

Estado actual de cada lugar (fuente de verdad para el frontend).

| Columna                  | Tipo         | Descripción                               |
|--------------------------|--------------|-------------------------------------------|
| `id`                     | text PK      | Identificador del lugar (P1, P2, P3, P4)  |
| `name`                   | text         | Nombre visible                            |
| `address`                | text         | Dirección                                 |
| `lat` / `lng`            | float        | Coordenadas para el mapa                  |
| `price_per_hour`         | numeric      | Precio en ARS por hora                    |
| `status`                 | text         | Estado actual del lugar                   |
| `current_license_plate`  | text         | Patente del auto actualmente detectado    |
| `updated_at`             | timestamptz  | Última actualización                      |

### `reservations`

Reservas creadas desde la web.

| Columna               | Tipo        | Descripción                           |
|-----------------------|-------------|---------------------------------------|
| `id`                  | uuid PK     | ID único de la reserva                |
| `space_id`            | text FK     | Lugar reservado                       |
| `user_name`           | text        | Nombre del usuario                    |
| `license_plate`       | text        | Patente del vehículo                  |
| `date`                | date        | Fecha de la reserva                   |
| `time_from`           | time        | Hora de inicio                        |
| `time_to`             | time        | Hora de fin                           |
| `amount_pesos`        | numeric     | Monto pagado en ARS                   |
| `mp_mock_id`          | text        | ID simulado de MercadoPago            |
| `blockchain_tx_hash`  | text        | Hash de la transacción en Sepolia     |
| `status`              | text        | `active` / `completed` / `cancelled`  |

### `occupancy_events`

Log de cada detección del CV (complementa el registro en blockchain).

| Columna               | Tipo        | Descripción                                             |
|-----------------------|-------------|---------------------------------------------------------|
| `id`                  | uuid PK     | ID del evento                                           |
| `space_id`            | text FK     | Lugar donde se detectó el auto                          |
| `license_plate`       | text        | Patente detectada                                       |
| `occupied`            | boolean     | `true` = llegó, `false` = se fue                        |
| `is_valid`            | boolean     | `true` = reserva, `false` = intruso, `null` = salida    |
| `duration_seconds`    | integer     | Segundos que estuvo el auto                             |
| `blockchain_tx_hash`  | text        | TX hash del evento en blockchain                        |
| `detected_at`         | timestamptz | Momento de la detección                                 |
