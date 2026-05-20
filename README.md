# ChaCha20-Poly1305 Authenticated Encryption Demo

A **Cryptography and Network Security** project demonstrating **authenticated encryption** using the **ChaCha20-Poly1305** AEAD algorithm, built with Node.js, Express, and MySQL.

---

## What is ChaCha20-Poly1305?

**ChaCha20-Poly1305** is a modern **Authenticated Encryption with Associated Data (AEAD)** algorithm that provides two security guarantees in a single pass:

| Property | Component | What It Does |
|----------|-----------|--------------|
| **Confidentiality** | ChaCha20 (stream cipher) | Encrypts the plaintext — makes it unreadable |
| **Integrity** | Poly1305 (MAC) | Generates an auth tag — detects any tampering |

Used in **TLS 1.3**, **OpenSSH**, and **WireGuard**. Originally designed by Daniel J. Bernstein.

---

## Features

- Encrypt any text using ChaCha20-Poly1305 (256-bit key, 96-bit nonce)
- Decrypt ciphertext using the nonce and authentication tag
- Tamper detection — decryption fails if the ciphertext is modified
- All encrypted records stored in MySQL database
- View stored encrypted records in the browser
- Clean web UI with copy-to-clipboard for ciphertext/nonce/auth tag

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Node.js | Runtime |
| Express | HTTP server + REST API |
| `crypto` (built-in) | ChaCha20-Poly1305 encryption |
| MySQL2 | Database connection |
| dotenv | Environment variable management |
| HTML/CSS/JS | Frontend SPA |

---

## Project Structure

```
├── server.js          # Express server — encrypt, decrypt, list APIs
├── db.sql             # MySQL schema
├── package.json       # Dependencies
├── .env.example       # Environment variable template
├── public/
│   ├── index.html     # Frontend UI
│   ├── style.css      # Styles
│   └── app.js         # Frontend logic
```

---

## How It Works

### Encryption
1. A random **96-bit nonce** is generated for every encryption
2. **ChaCha20** uses the secret key + nonce to produce a keystream, which is XOR'd with the plaintext to create ciphertext
3. **Poly1305** computes a 128-bit authentication tag over the ciphertext
4. The ciphertext, nonce, and auth tag are saved to MySQL

### Decryption
1. Poly1305 recomputes the auth tag using the provided ciphertext and nonce
2. If it **matches** — the message is authentic, ChaCha20 decrypts it
3. If it **fails** — the data was tampered with, decryption is rejected

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1 — Clone and install

```bash
git clone https://github.com/Thomson-4/chacha20-poly1305-encryption-demo.git
cd chacha20-poly1305-encryption-demo
npm install
```

### 2 — Set up the database

```bash
mysql -u root -p < db.sql
```

### 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crypto_demo
SECRET_KEY=replace_with_a_long_random_secret_key_min_32_chars
```

> Generate a strong SECRET_KEY with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4 — Start the server

```bash
npm start
```

Open **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/encrypt` | Encrypt text and store to DB |
| `POST` | `/decrypt` | Decrypt using ciphertext + nonce + auth tag |
| `GET` | `/messages` | Retrieve all stored encrypted records |

### POST /encrypt
```json
Request:  { "text": "Hello, World!" }
Response: { "encryptedData": "...", "nonce": "...", "authTag": "..." }
```

### POST /decrypt
```json
Request:  { "encryptedData": "...", "nonce": "...", "authTag": "..." }
Response: { "decryptedText": "Hello, World!" }
```

---

## Author

**Thomson Sunny**  
GitHub: [@Thomson-4](https://github.com/Thomson-4)
