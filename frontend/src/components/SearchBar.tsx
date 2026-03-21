'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const supportsVoice = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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

  const quickSearches = ['Metformin 500mg', 'Amoxicillin 500mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Omeprazole 20mg'];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Scan molecular signals...'}
            className={`w-full px-5 py-3.5 text-base bg-deep border rounded-lg focus:ring-1 focus:ring-cyan focus:border-cyan text-t1 placeholder-t3 font-mono outline-none transition-colors ${
              isListening ? 'border-warn animate-pulse' : 'border-border'
            }`}
            disabled={isSearching}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t3" strokeWidth={1.5} />
        </div>

        {/* Voice input button */}
        {supportsVoice && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={isSearching}
            className={`px-4 py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-warn/20 border border-warn text-warn'
                : 'bg-card border border-border text-t2 hover:border-cyan/30 hover:text-cyan'
            }`}
            title="Voice search (Vietnamese)"
          >
            {isListening ? <MicOff size={20} strokeWidth={1.5} /> : <Mic size={20} strokeWidth={1.5} />}
          </button>
        )}

        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3.5 bg-cyan text-abyss font-bold rounded-lg hover:bg-cyan/80 disabled:bg-t3/30 disabled:text-t3 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isSearching ? 'Scanning...' : 'Deploy Probe'}
        </button>
      </form>
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-t3">Quick scan:</span>
        {quickSearches.map((drug) => (
          <button
            key={drug}
            onClick={() => { setQuery(drug); onSearch(drug); }}
            disabled={isSearching}
            className="px-3 py-1 text-xs bg-card text-t2 rounded border border-border hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-50"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
