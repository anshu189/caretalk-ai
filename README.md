# CareTalk-AI

The Healthcare Translation Web App with Generative AI

## Introduction

**CareTalk-AI** is a cutting-edge Healthcare Translation Web App designed to enhance communication between patients and healthcare professionals. By leveraging Generative AI, it delivers accurate and context-aware translations tailored specifically for the healthcare industry. The platform supports multilingual translations, real-time communication, and document processing, ensuring accessibility and understanding across linguistic barriers.

## Features Overview

- **AI-Powered Translation**
  - Utilizes Generative AI to translate medical terms, prescriptions, and patient records with high contextual accuracy.

- **Multilingual Support**
  - Facilitates communication in multiple languages, making it ideal for diverse users.

- **Document Translation**
  - Upload medical documents (e.g., PDFs, Word files) for precise translations while maintaining original formatting.

- **Real-Time Communication**
  - Enables live chat translations with text-to-voice and voice-to-text functionality for seamless doctor-patient interactions.

- **Customizable Dictionaries**
  - Edit and define specific medical terminologies to improve translation accuracy.

- **Data Privacy and Security**
  - Complies with HIPAA and other healthcare data privacy standards, ensuring encrypted storage and transmission.

## User Guide

### 1. Accessing the Application
- Open the deployed URL in a web browser (supports desktop and mobile).

### 2. Using the App’s Features
- **Select Languages:**
  - Choose the original and target languages from the dropdown menus.

- **Start Recording:**
  - Press the microphone button to begin speaking.
  - The app captures your voice, converts it to text, and displays the transcript in the first text area.

- **View Translations:**
  - Translated text appears in the second text area in real time.

- **Play Translated Audio:**
  - Click the speaker button to hear the translated text in audio format.

### 3. Important Notes
- Recordings automatically stop after 5 seconds.
- Ensure microphone permissions are enabled in your browser settings.
- Unsupported languages will display an error message.

## Technical Specifications

### Frontend
- **Framework:** React.js
- **Features:**
  - Voice-to-text recording with a microphone button.
  - Real-time transcript and translation display.
  - Language selection for original and translated text.
  - Audio playback for translated text.
  - Fully responsive design for mobile and desktop.

### Backend
- **Framework:** Node.js with Express.js
- **Features:**
  - Real-time communication using WebSocket.
  - Speech-to-text conversion using Google Cloud Speech API.
  - Translation powered by OpenAI GPT-3.5 API.
  - Text-to-speech generation using Google Cloud Text-to-Speech.

### Environment Variables
- Sensitive information (API keys and configurations) is securely stored in a `.env` file.

### Assets
- Icons and UI elements are stored in the `assets` folder.

## AI Tools Used

- **Google Cloud APIs:**
  - **Speech-to-Text:** Converts spoken audio to text.
  - **Text-to-Speech:** Converts translated text into audio.

- **OpenAI GPT-3.5 API:**
  - Handles translations with high accuracy and contextual understanding.

## Security Considerations

- **Environment Variables:**
  - API keys and sensitive configurations are stored securely in the `.env` file to avoid hardcoding.

- **Input Validation:**
  - User inputs are sanitized on both frontend and backend to prevent injection attacks and misuse through prompt engineering.

## Support

For assistance or feedback, you can:
- Contact us via the "Help" link in the app.
- Email: [contactoanshu@gmail.com](mailto:contactoanshu@gmail.com)
- Raise an issue on the [GitHub Repository](https://github.com/anshu189/caretalk-ai/issues).

---
