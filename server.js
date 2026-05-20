const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

function getKey() {
  return crypto.createHash('sha256').update(process.env.SECRET_KEY).digest();
}

function encryptText(text) {
  const key = getKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString('hex'),
    nonce: nonce.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptText(encryptedData, nonceHex, authTagHex) {
  const key = getKey();
  const nonce = Buffer.from(nonceHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedData, 'hex');

  const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

app.post('/encrypt', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = encryptText(text);

    const [dbResult] = await pool.execute(
      `INSERT INTO messages (plain_text, encrypted_data, nonce, auth_tag, algorithm)
       VALUES (?, ?, ?, ?, ?)`,
      [text, result.encryptedData, result.nonce, result.authTag, 'ChaCha20-Poly1305']
    );

    res.json({
      id: dbResult.insertId,
      algorithm: 'ChaCha20-Poly1305',
      originalText: text,
      encryptedData: result.encryptedData,
      nonce: result.nonce,
      authTag: result.authTag
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/decrypt', async (req, res) => {
  try {
    const { encryptedData, nonce, authTag } = req.body;

    if (!encryptedData || !nonce || !authTag) {
      return res.status(400).json({ error: 'Encrypted data, nonce, and auth tag are required' });
    }

    const decryptedText = decryptText(encryptedData, nonce, authTag);
    res.json({ decryptedText });
  } catch (error) {
    res.status(500).json({
      error: 'Decryption failed. The ciphertext may have been modified, or the key/nonce/tag is invalid.'
    });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, encrypted_data, nonce, auth_tag, algorithm, created_at FROM messages ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});