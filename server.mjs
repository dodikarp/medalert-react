import awsIoT from "aws-iot-device-sdk"
import dotenv from "dotenv"
import express from "express"
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";

import { WebSocket, WebSocketServer } from "ws";


dotenv.config()

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const device = awsIoT.device({
    keyPath: './certs/wearable_tracker/private.pem.key',
    certPath: './certs/wearable_tracker/certificate.pem.crt',
    caPath: './certs/wearable_tracker/AmazonRootCA1.pem',
    clientId: clientId,
    host: process.env.AWS_ENDPOINT,
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let vitalSignArray = [];

device.on('connect', () => {
    console.log('Connected to IoT Core');
    console.log('Ctrl+C to cancel.');

    device.subscribe("topic_1")

    const dataGenerationInterval = 5000;
    setInterval(() => {


        const vitalSigns = generateRandomVitalSigns();
        // console.log('Generated Data:', vitalSigns);


        vitalSignArray.push(vitalSigns);
        // console.log(vitalSignArray);


        // const device_id = device.clientId;
        const time = Date.now().toString();


        device.publish('topic_1', JSON.stringify({
            time: time, device_id: 1, heartRate: generateHeartRate(), bloodPressureSystolic: generateBloodPressureSystolic(),
            bloodPressureDiatolic: generateBloodPressureDiastolic(), oxygenSaturation: generateOxygenSaturation(), respirationRate: generateRespirationRate(), bodyTemperature: generateBodyTemperature()
        }));


    }, dataGenerationInterval);
})


// var currentMessage

wss.on("connection", (ws) => {
    console.log("Connect to Me")
    ws.on("message", async (message) => {
        console.log(message)
    })
})

device.on("message", (topic, payload) => {
    console.log("message", topic, payload.toString());
    // currentMessage = payload
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
});

// async function getData(req, res) {
//     try {
//         if (currentMessage) {
//             res.status(200).json({ message: currentMessage });
//         } else {
//             // Wait for currentMessage to be set
//             await new Promise(resolve => {
//                 const interval = setInterval(() => {
//                     if (currentMessage) {
//                         clearInterval(interval);
//                         resolve();
//                     }
//                 }, 100);
//             });
//             res.status(200).json({ message: currentMessage });
//         }
//     } catch (error) {
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHeartRate() {
    return getRandomNumber(60, 110);
}

function generateBloodPressureSystolic() {
    return getRandomNumber(90, 110);
}

function generateBloodPressureDiastolic() {
    return getRandomNumber(60, 90);
}

function generateOxygenSaturation() {
    return getRandomNumber(95, 110);
}

function generateRespirationRate() {
    return getRandomNumber(12, 22);
}

function generateBodyTemperature() {
    return getRandomNumber(36.5, 38);
}

function generateRandomVitalSigns() {
    return {
        heartRate: generateHeartRate(),
        bloodPressureSystolic: generateBloodPressureSystolic(),
        bloodPressureDiatolic: generateBloodPressureDiastolic(),
        oxygenSaturation: generateOxygenSaturation(),
        respirationRate: generateRespirationRate(),
        bodyTemperature: generateBodyTemperature(),
    };
}










// Middleware
app.use(bodyParser.json({ strict: false }));
app.use(cors({ origin: "*" }));

// app.get("/getData", getData)



const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
