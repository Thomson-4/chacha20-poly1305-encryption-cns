const qs = (id) => document.getElementById(id);

// Utility: Copy to clipboard
function copyToClipboard(id) {
    const el = qs(id);
    navigator.clipboard.writeText(el.value).then(() => {
        const btn = el.parentElement.querySelector('.copy-btn');
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" style="color: var(--success);"></i>';
        lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = originalIcon;
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// UI: Set loading state for buttons
function setBtnLoading(id, isLoading) {
    const btn = qs(id);
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.original = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original;
    }
    lucide.createIcons();
}

async function encryptMessage() {
    const text = qs('plainText').value.trim();

    if (!text) {
        alert('Please enter text to encrypt.');
        return;
    }

    setBtnLoading('encryptBtn', true);

    try {
        const res = await fetch('/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            setBtnLoading('encryptBtn', false);
            return;
        }

        qs('encryptedOutput').value = data.encryptedData;
        qs('nonceOutput').value = data.nonce;
        qs('authTagOutput').value = data.authTag;

        // Pre-fill decryption fields for convenience
        qs('decryptEncryptedData').value = data.encryptedData;
        qs('decryptNonce').value = data.nonce;
        qs('decryptAuthTag').value = data.authTag;

        loadMessages();
    } catch (error) {
        alert('Encryption failed. Please check server connection.');
    } finally {
        setBtnLoading('encryptBtn', false);
    }
}

async function decryptMessage() {
    const encryptedData = qs('decryptEncryptedData').value.trim();
    const nonce = qs('decryptNonce').value.trim();
    const authTag = qs('decryptAuthTag').value.trim();

    if (!encryptedData || !nonce || !authTag) {
        alert('Please enter ciphertext, nonce, and authentication tag.');
        return;
    }

    setBtnLoading('decryptBtn', true);

    try {
        const res = await fetch('/decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedData, nonce, authTag })
        });

        const data = await res.json();

        if (data.error) {
            alert(data.error);
            setBtnLoading('decryptBtn', false);
            return;
        }

        qs('decryptedOutput').value = data.decryptedText;
    } catch (error) {
        alert('Decryption failed. Please check server connection.');
    } finally {
        setBtnLoading('decryptBtn', false);
    }
}

async function loadMessages() {
    try {
        const res = await fetch('/messages');
        const data = await res.json();
        const list = qs('messagesList');

        list.innerHTML = '';

        if (!Array.isArray(data) || !data.length) {
            list.innerHTML = '<div class="record-card" style="text-align: center; color: var(--text-muted); padding: 20px;">No encrypted records found in database.</div>';
            return;
        }

        data.forEach((msg) => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="record-data"><strong>ID:</strong> ${msg.id}</div>
                <div class="record-data"><strong>Ciphertext:</strong> ${msg.encrypted_data}</div>
                <div class="record-data"><strong>Auth Tag:</strong> ${msg.auth_tag}</div>
                <div style="text-align: right; color: var(--text-muted); font-size: 11px;">
                    ${new Date(msg.created_at).toLocaleDateString()}
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        qs('messagesList').innerHTML = '<div class="record-card">Could not load records from server.</div>';
    } finally {
        // Refresh icons for dynamic content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

document.getElementById('encryptBtn').addEventListener('click', encryptMessage);
document.getElementById('decryptBtn').addEventListener('click', decryptMessage);
document.getElementById('refreshBtn').addEventListener('click', loadMessages);

window.addEventListener('load', loadMessages);

// Add spin animation class to document style
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1.5s linear infinite; }
`;
document.head.appendChild(style);