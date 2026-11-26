import React, { useState, useRef } from 'react';
import { Mic, MicOff, X, Check } from 'lucide-react';

const VoiceInput = ({ onResult, placeholder = "Tekan untuk berbicara..." }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'id-ID';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onResult(transcript.trim());
      setTranscript('');
    }
  };

  const handleCancel = () => {
    setTranscript('');
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-800 text-sm">
          Voice input tidak didukung di browser ini. Silakan gunakan input manual.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Input Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
          isListening
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            Berhenti Mendengarkan
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            Mulai Voice Input
          </>
        )}
      </button>

      {/* Transcript Display */}
      {transcript && (
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Hasil Voice Input:</div>
            <div className="font-medium">{transcript}</div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Check className="w-4 h-4" />
              Gunakan
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Tips Voice Input:</div>
        <ul className="space-y-1">
          <li>• Ucapkan dengan jelas dan perlahan</li>
          <li>• Untuk nama: "Nama saya John Doe"</li>
          <li>• Untuk nomor: "Nomor telepon 08123456789"</li>
          <li>• Untuk alamat: "Alamat di Jalan Contoh Nomor 123"</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceInput; 