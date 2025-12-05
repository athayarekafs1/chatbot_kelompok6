const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow');

const app = express();
const port = 3000;

// Ganti dengan Project ID Dialogflow Anda
const PROJECT_ID = 'chatbot-simple-480114'; 
// Path ke file kunci JSON yang Anda unduh dari GCP
// Catatan: Dalam deployment nyata, gunakan Variabel Lingkungan (Environment Variables) 
// untuk menyimpan kredensial.
const KEYFILE_PATH = './path/to/your/service-account-file.json'; 

// Inisialisasi klien Dialogflow (Gunakan kredensial yang dimuat dari file kunci)
const sessionClient = new dialogflow.SessionsClient({ keyFilename: KEYFILE_PATH });


// Middleware
app.use(cors()); // Izinkan permintaan dari domain frontend (Vercel)
app.use(bodyParser.json());

/**
 * Fungsi untuk mengirim teks ke Dialogflow dan mendapatkan respons.
 * @param {string} projectId - ID proyek GCP Anda.
 * @param {string} sessionId - ID sesi unik untuk setiap pengguna.
 * @param {string} query - Teks yang dikirim pengguna.
 */
async function detectIntent(projectId, sessionId, query) {
    // Sesinya bisa berupa apa saja, tetapi harus unik untuk setiap pengguna
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: 'id', // Ganti sesuai bahasa Anda
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    return {
        fulfillmentText: result.fulfillmentText,
        intentName: result.intent.displayName,
    };
}


// Endpoint API untuk Chatbot
app.post('/api/dialogflow', async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
        return res.status(400).send({ error: 'Missing message or sessionId' });
    }

    try {
        const dialogflowResponse = await detectIntent(PROJECT_ID, sessionId, message);
        res.json({
            response: dialogflowResponse.fulfillmentText,
            intent: dialogflowResponse.intentName
        });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).send({ error: 'Failed to communicate with Dialogflow' });
    }
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});

// Catatan: Untuk deployment di Vercel sebagai Serverless Function, 
// Anda perlu mengadaptasi kode ini menggunakan Vercel Functions.