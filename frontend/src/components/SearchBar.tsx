'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Search, Camera, Loader2 } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { demoFetch } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  defaultQuery?: string;
}

export default function SearchBar({ onSearch, isSearching, defaultQuery = '' }: SearchBarProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState(defaultQuery);
  const [isListening, setIsListening] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const [supportsVoice, setSupportsVoice] = useState(false);
  useEffect(() => {
    setSupportsVoice(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
        if (transcript.trim()) {
          onSearch(transcript.trim());
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onSearch]);

  const handleImageCapture = useCallback(async (file: File) => {
    setIsOcrProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await demoFetch(`${API_URL}/api/ocr`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('OCR failed');

      const data = await res.json();
      const drugs: { name: string; dosage?: string }[] = data.drugs || [];
      if (drugs.length > 0) {
        const first = drugs[0].dosage ? `${drugs[0].name} ${drugs[0].dosage}` : drugs[0].name;
        setQuery(first);
        onSearch(first);
      }
    } catch (err) {
      console.error('OCR error:', err);
    } finally {
      setIsOcrProcessing(false);
    }
  }, [onSearch]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageCapture(file);
    e.target.value = '';
  }, [handleImageCapture]);

  const quickSearches = ['Metformin 500mg', 'Amoxicillin 500mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Omeprazole 20mg'];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isOcrProcessing ? 'Reading prescription...' : isListening ? t('search.listening') : t('search.placeholder')}
            className={`w-full px-5 py-2.5 text-base bg-deep border rounded-lg focus:ring-1 focus:ring-cyan focus:border-cyan text-t1 placeholder-t3 font-mono outline-none transition-colors ${
              isListening ? 'border-warn animate-pulse' : isOcrProcessing ? 'border-cyan animate-pulse' : 'border-border'
            }`}
            disabled={isSearching || isOcrProcessing}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t3" strokeWidth={1.5} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSearching || isOcrProcessing}
          className="px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-card border border-border text-t2 hover:border-cyan/30 hover:text-cyan"
          title="Scan prescription"
        >
          {isOcrProcessing ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin text-cyan" /> : <Camera size={18} strokeWidth={1.5} />}
        </button>

        {supportsVoice && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={isSearching}
            className={`btn-press px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-warn/20 border border-warn text-warn'
                : 'bg-card border border-border text-t2 hover:border-cyan/30 hover:text-cyan'
            }`}
            title={t('search.voiceTitle')}
          >
            {isListening ? <MicOff size={20} strokeWidth={1.5} /> : <Mic size={20} strokeWidth={1.5} />}
          </button>
        )}

        <button
          type="submit"
          disabled={isSearching || isOcrProcessing || !query.trim()}
          className="btn-press inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSearching ? (
            <>
              <LoadingSpinner size="sm" className="text-abyss [&_span]:border-abyss/30 [&_span]:border-t-abyss" />
              {t('search.scanning')}
            </>
          ) : (
            t('search.deploy')
          )}
        </button>
      </form>
      <div className="flex items-center gap-0 flex-wrap">
        <span className="text-xs text-t3 mr-2">{t('search.quickScan')}</span>
        {quickSearches.map((drug, i) => (
          <span key={drug} className="inline-flex items-center">
            {i > 0 && <span className="text-t3 mx-1">&middot;</span>}
            <button
              onClick={() => {
                setQuery(drug);
                onSearch(drug);
              }}
              disabled={isSearching}
              className="text-xs text-t3 hover:text-cyan cursor-pointer transition-colors disabled:opacity-50"
            >
              {drug}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
