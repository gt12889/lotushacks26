'use client';

import { useState } from 'react';
import AnalyzeForm from '@/components/AnalyzeForm';
import ProgressBar, { TaskStatus } from '@/components/ProgressBar';
import Dashboard from '@/components/Dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AnalyzeResult {
  report: {
    violation_history: any[];
    scene_analysis: any;
    legal_references: any[];
    fault_assessment: string;
    risk_score: number;
    next_steps: string[];
    summary_text: string;
  };
  pdf_url?: string;
  audio_url?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [tasks, setTasks] = useState<{ violations: TaskStatus; scene: TaskStatus; legal: TaskStatus }>({
    violations: 'pending',
    scene: 'pending',
    legal: 'pending',
  });

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setShowProgress(true);
    setResult(null);
    setTasks({ violations: 'pending', scene: 'pending', legal: 'pending' });

    try {
      const response = await fetch(`${API_URL}/analyze/stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok || !response.body) throw new Error('Analysis failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          try {
            const event = JSON.parse(dataMatch[1]);

            // Update progress bar
            if (event.task === 'violations' || event.task === 'scene' || event.task === 'legal') {
              setTasks(prev => ({
                ...prev,
                [event.task]: event.status === 'running' ? 'running' :
                              event.status === 'complete' ? 'complete' : 'error',
              }));
            }

            // Handle final result
            if (event.task === 'result' && event.data) {
              setResult(event.data);
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE event:', parseErr);
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setTasks({ violations: 'error', scene: 'error', legal: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GhostDriver</h1>
              <p className="text-xs text-gray-500">Vietnamese Traffic Incident Analyzer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form - Left Side */}
          <div className="lg:col-span-2">
            <AnalyzeForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Results - Right Side */}
          <div className="lg:col-span-3 space-y-6">
            <ProgressBar tasks={tasks} visible={showProgress} />
            <Dashboard
              report={result?.report ?? null}
              audioUrl={result?.audio_url}
              pdfUrl={result?.pdf_url}
            />
            {!result && !showProgress && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">Enter plate number and upload a photo to begin analysis</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
