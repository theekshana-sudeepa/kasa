'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  disabled?: boolean;
}

/* global SpeechRecognition, webkitSpeechRecognition */
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognitionAPI(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  return (win.SpeechRecognition || win.webkitSpeechRecognition) as
    (new () => SpeechRecognitionInstance) | null;
}

/**
 * Voice-to-text input with animated waveform visualization.
 * Uses Web Speech API. Gracefully degrades on unsupported browsers.
 */
export default function VoiceInput({ onTranscript, language = 'en-US', disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [bars] = useState(() => Array.from({ length: 5 }, () => Math.random()));
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const initializedRef = useRef(false);

  const ensureRecognition = useCallback(() => {
    if (initializedRef.current) return !!recognitionRef.current;

    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    initializedRef.current = true;
    return !!recognitionRef.current;
  }, [language, onTranscript]);

  const toggleListening = useCallback(() => {
    if (!ensureRecognition()) return;
    const recognition = recognitionRef.current!;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, ensureRecognition]);

  // Defer browser API check to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (!getSpeechRecognitionAPI()) return null;

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
