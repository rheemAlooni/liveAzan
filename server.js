const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve your HTML files (we will save them as actual .html files now)
app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Relay server running on port ${port}`);
});

const wss = new WebSocketServer({ server });

let esp32Source = null;

wss.on('connection', (ws, req) => {
    // We check if the connection is from the ESP32 (you can add a simple password/header)
    // const isESP32 = req.headers['user-agent'] === 'ESP32-S3-Broadcaster';
    const isESP32 = req.headers['x-device-type'] === 'ESP32-S3-Broadcaster';

    if (isESP32) {
        console.log('ESP32 Broadcaster connected');
        esp32Source = ws;
        
        ws.on('message', (data) => {
            // Broadcast the binary audio data to all OTHER connected clients (the listeners)
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === 1) {
                    client.send(data, { binary: true });
                }
            });
        });
    } else {
        console.log('New listener connected');
    }

    ws.on('close', () => {
        if (ws === esp32Source) {
            console.log('ESP32 Disconnected');
            esp32Source = null;
        }
    });
});
