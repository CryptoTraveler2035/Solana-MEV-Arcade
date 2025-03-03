// public/client.js
function logToConsole(message) {
    const output = document.getElementById('console-output');
    if (output) {
        output.textContent += `[TRON GRID] ${message}\n`;
        output.scrollTop = output.scrollHeight;
    } else {
        console.error('Console output element not found');
    }
}

function showQRCode(qrPath) {
    const screen = document.querySelector('.screen');
    const qrImage = document.createElement('img');
    qrImage.src = qrPath;
    qrImage.alt = 'Deposit QR Code';
    qrImage.style.maxWidth = '200px';
    qrImage.style.display = 'block';
    qrImage.style.margin = '10px auto';
    screen.appendChild(qrImage);
}

const ws = new WebSocket('ws://localhost:8081');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'log') logToConsole(data.message);
};
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onclose = () => console.log('WebSocket closed');

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const welcome = document.querySelector('.welcome-message');
        const mainMenu = document.querySelector('.main-menu');
        if (welcome && mainMenu) {
            logToConsole("Grid initialization complete. Entering command mode...");
            welcome.style.display = 'none';
            mainMenu.style.display = 'block';
        } else {
            console.error('Welcome or main menu element not found');
        }
    }, 2000);
});

document.querySelectorAll('.arcade-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const action = e.target.dataset.action || e.target.dataset.setting;
        switch(action) {
            case 'wallet-info':
                try {
                    const walletRes = await fetch('/api/wallet-info');
                    if (!walletRes.ok) {
                        throw new Error(`HTTP error! Status: ${walletRes.status}`);
                    }
                    const walletData = await walletRes.json();
                    logToConsole('Wallet Access: ' + JSON.stringify(walletData, null, 2));
                } catch (error) {
                    logToConsole('Error accessing wallet: ' + error.message);
                    console.error('Wallet fetch error:', error);
                }
                break;
            case 'deposit-qr':
                try {
                    const qrRes = await fetch('/api/deposit-qr');
                    if (!qrRes.ok) {
                        throw new Error(`HTTP error! Status: ${qrRes.status}`);
                    }
                    const qrData = await qrRes.json();
                    logToConsole('Deposit Scan Generated: ' + qrData.qrPath);
                    showQRCode(qrData.qrPath); // Display QR code in GUI
                } catch (error) {
                    logToConsole('Error generating QR code: ' + error.message);
                    console.error('QR fetch error:', error);
                }
                break;
                case 'balance':
                    try {
                        const balRes = await fetch('/api/balance');
                        if (!balRes.ok) {
                            const errorData = await balRes.json();
                            throw new Error(errorData.error || `HTTP error! Status: ${balRes.status}`);
                        }
                        const balData = await balRes.json();
                        logToConsole(`Credit Balance: ${balData.balance !== undefined ? balData.balance.toFixed(2) : 'unknown'} SOL`);
                    } catch (error) {
                        logToConsole('Error checking balance: ' + error.message);
                        console.error('Balance fetch error:', error);
                    }
                    break;
            case 'start':
                const startRes = await fetch('/api/start', { method: 'POST' });
                if (startRes.ok) {
                    const startData = await startRes.json();
                    logToConsole('Bot Launched: ' + startData.message);
                } else {
                    const errorData = await startRes.json();
                    logToConsole('Launch Failed: ' + errorData.error);
                }
                break;
            case 'withdraw':
                const withdrawAddress = prompt('Enter withdrawal address:');
                if (withdrawAddress) {
                    const withdrawAmount = prompt('Enter amount (SOL):');
                    if (withdrawAmount) {
                        const withdrawRes = await fetch('/api/withdraw', {
                            method: 'POST',
                            body: JSON.stringify({ recipientAddress: withdrawAddress, amountSol: parseFloat(withdrawAmount) }),
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const withdrawData = await withdrawRes.json();
                        logToConsole('Funds Extracted: ' + withdrawData.message);
                    }
                }
                break;
            case 'settings':
                document.querySelector('.main-menu').style.display = 'none';
                document.querySelector('.settings-menu').style.display = 'block';
                logToConsole('Entered Grid Settings...');
                break;
            case 'new-wallet':
                const walletExistsRes = await fetch('/api/new-wallet', {
                    method: 'POST',
                    body: JSON.stringify({ overwrite: false }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const walletExistsData = await walletExistsRes.json();
                if (walletExistsData.error === 'Wallet already exists') {
                    const overwrite = confirm('The current wallet on file, you would like to overwrite at this time?');
                    if (overwrite) {
                        const newWalletRes = await fetch('/api/new-wallet', {
                            method: 'POST',
                            body: JSON.stringify({ overwrite: true }),
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const newWalletData = await newWalletRes.json();
                        logToConsole('New Circuit Created: ' + JSON.stringify(newWalletData, null, 2));
                    } else {
                        logToConsole("Operation cancelled. Keeping existing wallet.");
                        output.textContent = `[TRON GRID] Grid initialization complete. Entering command mode...\n`;
                    }
                } else {
                    logToConsole('New Circuit Created: ' + JSON.stringify(walletExistsData, null, 2));
                }
                break;
            case 'import-wallet':
                const base58Key = prompt('Enter your private key (Base58):');
                if (base58Key) {
                    const importRes = await fetch('/api/import-wallet', {
                        method: 'POST',
                        body: JSON.stringify({ base58Key }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const importData = await importRes.json();
                    logToConsole('Core Imported: ' + JSON.stringify(importData, null, 2));
                }
                break;
            case 'exit':
                logToConsole('Exiting Grid... (Tab closing)');
                window.close();
                break;
            case 'market-cap':
                logToConsole('Market Cap module not yet operational');
                break;
            case 'sltp':
                logToConsole('SL/TP module not yet operational');
                break;
            case 'autobuy':
                logToConsole('Auto-Buy module not yet operational');
                break;
            case 'dex':
                logToConsole('DEX Portal module not yet operational');
                break;
            case 'back':
                document.querySelector('.settings-menu').style.display = 'none';
                document.querySelector('.main-menu').style.display = 'block';
                logToConsole('Returned to Grid Command');
                break;
        }
    });
});