
A full-stack digital wallet application built with the **MERN stack** (MongoDB replaced with **MySQL** via Sequelize) featuring OTP-based authentication, wallet management, passbook, and KYC verification.


### Step 1 — Git Clone

```bash
git clone https://github.com/Arunkumar262004/wallet-app.git
cd mern-wallet-app
```

### Step 2 — Create the MySQL Database

<!-- Open MySQL and run: -->

CREATE DATABASE wallet_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


### Step 3 — Backend Environment
<!-- ----------------------------------------------------------------------- -->

cd backend
cp .env


Edit `.env` with your values:

PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wallet_app

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d

OTP_EXPIRES_IN=300000
CLIENT_URL=http://localhost:3000

<!-- ----------------------------------------------------------------------- -->
### Step 4 — Installd Dependencies

<!-- # Install frontend dependencies -->
npm install,boootstrap,browserrouter,axios
npm start

<!-- # Install backend dependencies -->
cd backend && npm install,express,mysql,cors
npm run dev

### Step 6 — Open in Browser
http://localhost:3000


## API Documentation

All endpoints return JSON. Protected routes require `Authorization: Bearer <token>` header.
### Auth Routes — `/api/auth`

| Method | Endpoint         | Description                        |
|--------|----------------- |------------------------------------|
| POST   | `/check-user`    | Check if mobile is registered      |
| POST   | `/send-otp`      | Send OTP to mobile number          |
| POST   | `/verify-otp`    | Verify OTP → returns JWT token     |
| GET    | `/profile`       | Get current user profile           |
| PUT    | `/profile`       | Update name / email                |

### Wallet Routes — `/api/wallet`

| Method | Endpoint         | Description                        |
|--------|------------------|------------------------------------|
| GET    | `/`              | Get wallet balance                 |
| POST   | `/add`           | Add money to wallet                |
| POST   | `/withdraw`      | Withdraw money from wallet         |
| GET    | `/passbook`      | Get paginated transaction history  |


### KYC Routes — `/api/kyc`

| Method | Endpoint         | Description                        |
|--------|------------------|------------------------------------|
| POST   | `/submit`        | Submit Aadhaar + PAN for KYC       |
| GET    | `/status`        | Get current KYC status             |

-----------------------------------------------------------------------------------------------------
<!-- Technologies Used -->
Frontend:
React, React-Router-Dom, Axios, React-Hot-Toast, Bootstrap, Bootstrap-Icons

Backend: 
Express, Sequelize, mysql2, jsonwebtoken, bcryptjs, express-validator, express-rate-limit, uuid, dotenv, nodemon

Database: MySQL
------------------------------------------------------------------------------------------------------
<!-- ### User Module -->
<!-- -  **OTP-based Authentication** — Mobile number + 6-digit OTP login
-  **Smart Register/Login Flow** — Auto-detects new vs existing users
-  **Profile Management** — Update name and email

### Wallet Module
-  **Add Money** — Quick-pick amounts or custom entry (up to ₹1,00,000)
-  **Withdraw Money** — Instant wallet debit with balance check
-  **Live Balance** — Real-time wallet balance display

### Passbook Module
-  **Transaction History** — Paginated list of all credits & debits
-  **Filter by Type** — View All / Credits / Debits
-  **Aggregate Summary** — Total credited, debited, and transaction count (SQL aggregate functions)

### KYC Module
-  **Aadhaar + PAN Verification** — Standard Indian KYC flow
-  **Auto-polling Status** — UI auto-refreshes until verification completes
-  **Masked Display** — Sensitive data masked in responses -->
<!-- 
### Security
- JWT authentication (7-day expiry)
- Rate limiting on all endpoints (stricter on OTP)
- SQL injection prevention via Sequelize ORM
- Password/data encryption with bcryptjs
- CORS configured -->
