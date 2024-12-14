// server.js
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const cors = require('cors');
const OpenAI = require("openai");

// Load env variables
dotenv.config();

// Validation for required ENV variables
if (!process.env.OPENAI_API_KEY || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: Missing required environment variables.');
  process.exit(1);
}

// Set the credentials for Google Cloud
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const app = express();
app.use(cors());

// Initialize Clients
const speechClient = new speech.SpeechClient();
const textToSpeechClient = new textToSpeech.TextToSpeechClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Serve the React static files after building
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.send({ status: 'ok', message: 'caretalkai is healthy.' });
});

// Fallback: for any other route, serve the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Start HTTP server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// ============ WEBSOCKET SERVER ============
const wss = new WebSocketServer({ server }); // Attach to the same HTTP server
console.log('WebSocket server attached.');

// Setup real-time transcription & translation
wss.on('connection', (ws) => {
  console.log('Client connected for real-time transcription and translation');
  let recognizeStream = null;
  let originalLanguage = 'en-US'; // Default original lang
  let translatedLanguage = 'hi-IN'; // Default transalated lang

  ws.on('message', async (data) => {
    try {
      // Check if the incoming data is JSON (for language config updates)
      const parsedData = JSON.parse(data);
      if (parsedData.originalLanguage && parsedData.translatedLanguage) {
        originalLanguage = parsedData.originalLanguage;
        translatedLanguage = parsedData.translatedLanguage;
        console.log(`Languages updated: ${originalLanguage} => ${translatedLanguage}`);
        return;
      }
    } catch (err) {
      // Assume it's audio buffer if parsing fails
      if (!(err instanceof SyntaxError)) {
        console.error("Unexpected error while processing message:", err);
        return;
      }
    }

    // Process audio buffer (binary data)
    const audioBuffer = Buffer.from(data);

    // Initialize recognizeStream if it's null
    if (!recognizeStream) {
      console.log('Google Credentials:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      console.log('Initializing new recognizeStream...');
      try {
        recognizeStream = speechClient
          .streamingRecognize({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 24000,
              languageCode: originalLanguage,
            },
            interimResults: true,
          })
          .on('data', async (response) => {
            console.log("Data event received");
            try {
              console.log('Transcription response:', response);
              const transcription = response.results
                .map((result) => result.alternatives[0].transcript)
                .join('\n');

              // Translate and generate TTS audio
              const translatedText = await translateText(transcription, translatedLanguage);
              const ttsAudioBase64 = await generateTTS(translatedText, translatedLanguage);
              console.log("transcription: ",transcription)

              // Send results back to the client
              ws.send(JSON.stringify({
                original: transcription,
                translated: translatedText,
                ttsAudioBase64,
              }));
            } catch (innerError) {
              console.error('Error during transcription processing:', innerError);
              ws.send(JSON.stringify({ error: innerError.message }));
            }
          })
          .on('error', (error) => {
            console.error('Error during streaming:', error);
            recognizeStream = null;
          })
          .on('end', () => {
            console.log('Recognition stream ended');
            recognizeStream = null;
          });
      } catch (streamError) {
        console.error('Error initializing recognizeStream:', streamError);
        ws.send(JSON.stringify({ error: streamError.message }));
        recognizeStream = null;
      }
    }

    // If recognizeStream is active, write the audio buffer to it
    // Debug
    console.log('Audio Buffer Size:', audioBuffer.length);
    console.log('Audio Buffer Data (first 10 bytes):', audioBuffer.slice(0, 10));
    if (recognizeStream) {
      try {
        recognizeStream.write(audioBuffer);
      } catch (writeError) {
        console.error('Error writing to recognizeStream:', writeError);
        ws.send(JSON.stringify({ error: writeError.message }));
      }
    }
  });
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (recognizeStream){
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

// ============ HELPER FUNCTIONS ============

async function translateText(text, targetLanguage) {
  if (!text.trim()) return '';
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Translate the following text into ${targetLanguage}: ${text}`,
        }
      ],
      temperature: 1,
      max_tokens: 100,
      top_p: 1,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Translation error:', error.message);
    return 'Error in translation';
  }
}

async function generateTTS(text, languageCode) {
  try {
    const [response] = await textToSpeechClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    if (response.audioContent) {
      return response.audioContent.toString('base64');
    } else {
      console.error('No audio content received from TTS');
      return null;
    }
  } catch (error) {
    console.error('TTS generation error:', error.message);
    return null;
  }
}
