# Elite.Pay — RFID-Powered Contactless Payment Platform

> Tap your card. Payment done. No app, no QR, no friction.

Elite.Pay is a full-stack fintech platform that bridges **physical RFID cards** with a **digital wallet**. Merchants set the amount, customers tap their NFC card on an ESP32 reader, and the payment clears in under 0.5 seconds.

---

## Architecture

```
Elite-Pay/
├── frontend/        # React + Vite — 3 role-based portals
├── backend/         # Node.js + Express + MongoDB REST API
├── firmware/        # Arduino (ESP32 + MFRC522 RFID reader)
└── contracts/       # Solidity smart contract (milestone rewards)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Vanilla CSS |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT (role-based: user / merchant / admin) |
| Payments | Razorpay (order creation + HMAC verification) |
| Hardware | ESP32 + MFRC522 RFID reader (Arduino) |
| Smart Contract | Solidity (Hardhat) — milestone reward NFTs |
| Font | Sora + Inter (Google Fonts) |

---

## Portals

### 👤 User Portal (`/user`)
- Register & log in
- Top up wallet via Razorpay
- Register RFID cards (physical tap or manual)
- View transaction history
- Tier-based Rewards system (Bronze → Silver → Gold → Platinum)

### 🏪 Merchant Portal (`/merchant`)
- POS Terminal — enter amount, await customer card tap
- View all collected payments
- Revenue dashboard with count-up animations

### 🔐 Admin Portal (`/admin`)
- Platform-wide analytics (users, merchants, transactions, revenue)
- Manage all users with tier breakdowns
- Manage all merchants with status control
- Full transaction log with type filters

---

## Hardware Flow

```
Customer taps RFID card on ESP32 reader
        ↓
ESP32 reads card UID via MFRC522
        ↓
POST /api/tap → backend validates UID
        ↓
If balance sufficient → deduct + record transaction
        ↓
Merchant POS terminal shows ✅ Payment Confirmed
```

**Components:**
- ESP32 DevKit
- MFRC522 RFID/NFC module
- MIFARE Classic 1K cards

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Razorpay account (test keys)

### 1. Clone
```bash
git clone https://github.com/Nishant-Mane/Elite-Pay.git
cd Elite-Pay
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:3000`

---

## Environment Variables

### `backend/.env`
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/elitepay
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
DEVICE_SECRET=your_esp32_shared_secret
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> ⚠️ Never commit `.env` files. They are excluded by `.gitignore`.

---

## Firmware

Open `firmware/elite_pay_esp32/elite_pay_esp32.ino` in Arduino IDE.

**Required libraries:**
- `WiFi.h` (built-in ESP32)
- `HTTPClient.h` (built-in ESP32)
- `MFRC522` by GithubCommunity
- `ArduinoJson` by Benoit Blanchon

Update these constants before flashing:
```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
String backendURL    = "http://YOUR_LOCAL_IP:3000/api";
```

---

## Reward Tiers

| Tier | Spending Threshold | Perks |
|---|---|---|
| 🥉 Bronze | ₹0+ | Basic wallet access |
| 🥈 Silver | ₹500+ | Priority support |
| 🥇 Gold | ₹2,000+ | Cashback offers |
| 💎 Platinum | ₹10,000+ | Exclusive rewards + NFT milestone |

---

## Smart Contract

`contracts/MilestoneRewards.sol` — ERC-721 NFT minted when a user crosses a spending milestone.

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network <network>
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/topup/create-order` | Create Razorpay order |
| POST | `/api/topup/verify` | Verify payment + credit wallet |
| POST | `/api/tap` | ESP32 tap event → deduct balance |
| GET | `/api/transactions` | User transaction history |
| GET | `/api/admin/stats` | Platform analytics |

---

## Screenshots

> Landing Page · User Dashboard · Merchant POS · Admin Overview

---

## License

MIT © 2025 Nishant Mane
