// client/src/App.js
import React, { useState, useRef } from 'react';
import micicon from './assets/mic.svg';
import linkicon from './assets/link.svg';
import swaparrowsicon from './assets/swaparrows.svg';
import speakericon from './assets/speaker.svg';
import medtabicon from './assets/medtab.svg';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('en-US');
  const [translatedLanguage, setTranslatedLanguage] = useState('hi-IN');
  const [storedAudio, setStoredAudio] = useState(null);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    setOriginalText(null);
    setTranslatedText(null);
    setStoredAudio(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      // Auto Detection for mic
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let silenceStartTime = null;

      source.connect(analyser);

      // Connect to WebSocket (LOCAL DEV: ws://localhost:5000)
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const host = window.location.host;
      wsRef.current = new WebSocket(protocol + host);

      wsRef.current.onopen = () => {
        console.log('WebSocket connection opened');
        wsRef.current.send(JSON.stringify({ originalLanguage, translatedLanguage }));
      };

      wsRef.current.onmessage = (event) => {
        const { original, translated, ttsAudioBase64, error } = JSON.parse(event.data);
        if (error) {
          console.error('Error received from server:', error);
        } else {
          setOriginalText(original);
          setTranslatedText(translated);

          if (ttsAudioBase64) {
            try {
              const binaryString = atob(ttsAudioBase64);
              const binaryData = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                binaryData[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([binaryData], { type: 'audio/mp3' });
              setStoredAudio(audioBlob);
            } catch (error) {
              console.error('Error decoding audio:', error);
            }
          }
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            wsRef.current.send(buffer);
          });
        }
      };

      mediaRecorder.start(300); // sends audio chunks every 300ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Silence detection logic
      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        if (average < 10) { // Silence threshold
          if (!silenceStartTime) silenceStartTime = Date.now();
          if (Date.now() - silenceStartTime > 2000) { // 2 seconds of silence
            stopRecording();
          }
        } else {
          silenceStartTime = null;
        }

        if (isRecording) requestAnimationFrame(checkSilence);
      };

      setInterval(checkSilence, 100);

      // Add pulse animation to microphone button
      const micButton = document.querySelector('.mic-button');
      micButton.classList.add('pulse');

    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsRecording(false);

     // Remove pulse animation from microphone button
     const micButton = document.querySelector('.mic-button');
     micButton.classList.remove('pulse');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playStoredAudio = () => {
    if (storedAudio) {
      const audioUrl = URL.createObjectURL(storedAudio);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play();
    }
  };

  const languages = [
    { code: 'af-ZA', name: 'Afrikaans (South Africa)' },
    { code: 'am-ET', name: 'Amharic (Ethiopia)' },
    { code: 'ar-XA', name: 'Arabic (Extended)' },
    { code: 'bg-BG', name: 'Bulgarian' },
    { code: 'bn-IN', name: 'Bengali (India)' },
    { code: 'ca-ES', name: 'Catalan (Spain)' },
    { code: 'cmn-CN', name: 'Mandarin (China)' },
    { code: 'cmn-TW', name: 'Mandarin (Taiwan)' },
    { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
    { code: 'da-DK', name: 'Danish (Denmark)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'el-GR', name: 'Greek (Greece)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'en-US', name: 'English (United States)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-US', name: 'Spanish (United States)' },
    { code: 'et-EE', name: 'Estonian (Estonia)' },
    { code: 'eu-ES', name: 'Basque (Spain)' },
    { code: 'fi-FI', name: 'Finnish (Finland)' },
    { code: 'fil-PH', name: 'Filipino (Philippines)' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'gl-ES', name: 'Galician (Spain)' },
    { code: 'gu-IN', name: 'Gujarati (India)' },
    { code: 'he-IL', name: 'Hebrew (Israel)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'hu-HU', name: 'Hungarian (Hungary)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'is-IS', name: 'Icelandic (Iceland)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'kn-IN', name: 'Kannada (India)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
    { code: 'lv-LV', name: 'Latvian (Latvia)' },
    { code: 'ml-IN', name: 'Malayalam (India)' },
    { code: 'mr-IN', name: 'Marathi (India)' },
    { code: 'ms-MY', name: 'Malay (Malaysia)' },
    { code: 'nb-NO', name: 'Norwegian (Norway)' },
    { code: 'nl-BE', name: 'Dutch (Belgium)' },
    { code: 'nl-NL', name: 'Dutch (Netherlands)' },
    { code: 'pa-IN', name: 'Punjabi (India)' },
    { code: 'pl-PL', name: 'Polish (Poland)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)' },
    { code: 'ro-RO', name: 'Romanian (Romania)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'sk-SK', name: 'Slovak (Slovakia)' },
    { code: 'sr-RS', name: 'Serbian (Serbia)' },
    { code: 'sv-SE', name: 'Swedish (Sweden)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'te-IN', name: 'Telugu (India)' },
    { code: 'th-TH', name: 'Thai (Thailand)' },
    { code: 'tr-TR', name: 'Turkish (Turkey)' },
    { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'ur-IN', name: 'Urdu (India)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'yue-HK', name: 'Cantonese (Hong Kong)' },
  ];  

  return (
    <div className="min-h-[90vh] lg:min-h-screen greenbg flex flex-col items-center">
      {/* Header */}
      <a href="/" className="w-full flex items-center justify-center gap-2 bg-white greenfg p-4 text-2xl font-bold mb-4 rounded-b-3xl">
        <img src={medtabicon} alt="Caretalk.ai" className='size-7 rotate-45'/>
          Caretalk.ai
      </a>

      <div className='w-full p-6 pt-0 xl:pt-10'>
        {/* Language Selection */}
        <div className="flex items-center justify-between bg-white rounded-full shadow-md px-4 py-3 mb-6 w-full max-xl:max-w-md mx-auto max-w-xl">
        <select
              value={originalLanguage}
              onChange={(e) => setOriginalLanguage(e.target.value)}
              className="max-xl:w-[35%] bg-transparent focus:outline-none max-xl:text-sm text-gray-700"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

          <button
            onClick={() => {
              const temp = originalLanguage;
              setOriginalLanguage(translatedLanguage);
              setTranslatedLanguage(temp);
            }}
          >
            <img src={swaparrowsicon} alt="Swap Languages"/>
          </button>

          <select
              value={translatedLanguage}
              onChange={(e) => setTranslatedLanguage(e.target.value)}
              className="max-xl:w-[35%] bg-transparent focus:outline-none max-xl:text-sm text-gray-700"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
        </div>

        {/* Input and Output Text Areas */}
        <div className="relative max-lg:flex-col flex items-center rounded-lg max-lg:min-h-[75vh] gap-4 w-full xl:w-[60vw] mx-auto">
        <textarea 
              className="w-full min-h-[35vh] xl:min-h-[60vh] p-4 lg:pt-6 lg:text-xl focus:outline-none rounded-lg text-gray-700 placeholder-gray-400 resize-none"
              placeholder="Try Speaking Something..."
              readOnly
              value={originalText || ''}
            >
            </textarea>

          {/* Microphone Button */}
          <button 
            className="mic-button absolute z-10 top-[calc(64.5vh/2)] lg:top-[calc(50vh/2)] lg:left-[calc(56vw/2)] greenbg text-white p-4 rounded-full shadow-lg hover:scale-110 duration-500 ease-in-out"
            onClick={startRecording}
            disabled={isRecording}
          >
            <img src={micicon} alt="Speak" className='size-7'/>
          </button>

          {/* Translated Text Area */}
          <textarea 
              className="relative w-full min-h-[37vh] xl:min-h-[60vh] p-4 pt-6 lg:text-xl focus:outline-none rounded-lg text-gray-700 placeholder-gray-400 resize-none"
              placeholder="Waiting For Translation..."
              readOnly
              value={translatedText || ''}
            >
            </textarea>
              {/* Speak Button to play stored audio */}
              <button 
                className="absolute bottom-[2.5vh] right-[3vw] lg:right-[1vw] darkbg text-white p-3 rounded-full shadow-md hover:shadow-lg duration-500 ease-in-out"
                onClick={playStoredAudio}
                disabled={!storedAudio}
              >
                <img src={speakericon} alt="Speak" className='invert size-5'/>
                {/* Speak */}
              </button>
        </div>

        {/* Footer */}
        <footer className="mt-5 lg:mt-12 flex items-center justify-center gap-10 text-white">
          <a
            href="https://github.com/anshu189/caretalkai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            Github
            <img src={linkicon} alt="Caretalkai - By anshu189 Github" className='size-4'/>
          </a>
          <a
            href="https://github.com/anshu189/caretalkai/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            Help
          </a>
        </footer>
      </div>
    </div>
  );
};

export default AudioRecorder;