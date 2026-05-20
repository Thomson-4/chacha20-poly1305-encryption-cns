CREATE DATABASE IF NOT EXISTS crypto_demo;
USE crypto_demo;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plain_text TEXT,
    encrypted_data LONGTEXT NOT NULL,
    nonce VARCHAR(255) NOT NULL,
    auth_tag VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'ChaCha20-Poly1305',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);