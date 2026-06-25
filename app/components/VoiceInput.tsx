'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
}

/**
 * Voice-to-text input with animated waveform visualization.
 * Uses Web Speech API. Gracefully degrades on unsupported browsers.
 */
export default function VoiceInput({ onTranscript, language = 'en-US', disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [bars] = useState(() => Array.from({ length: 5 }, () => Math.random()));
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, [language, onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  if (!isSupported) return null;

  return (
    <motion.button
      className={`kasa-voice-btn ${isListening ? 'kasa-voice-btn-active' : ''}`}
      onClick={toggleListening}
      disabled={disabled}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      title={isListening ? 'Stop listening' : 'Voice input'}
    >
      <AnimatePresence mode="wait">
        {isListening ? (
          <motion.div
            key="listening"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="kasa-voice-wave-container"
          >
            {bars.map((delay, i) => (
              <motion.div
                key={i}
                className="kasa-voice-bar"
                animate={{
                  scaleY: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: delay * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Mic size={18} />
          </motion.div>
        )}
      </AnimatePresence>

      {isListening && <div className="kasa-voice-pulse" />}
    </motion.button>
  );
}
