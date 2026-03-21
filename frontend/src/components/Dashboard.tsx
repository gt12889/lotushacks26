'use client';

interface ViolationRecord {
  date: string;
  description: string;
  status: string;
  fine_amount: number;
  location?: string;
}

interface SceneAnalysis {
  damage_description: string;
  impact_point: string;
  road_conditions: string;
  vehicle_positions: string;
  plate_confirmed: boolean;
}

interface LegalReference {
  article_number: string;
  title: string;
  summary: string;
  relevance: number;
}

interface EvidenceReport {
  violation_history: ViolationRecord[];
  scene_analysis: SceneAnalysis;
  legal_references: LegalReference[];
  fault_assessment: string;
  risk_score: number;
  next_steps: string[];
  summary_text: string;
}

interface DashboardProps {
  report: EvidenceReport | null;
  audioUrl?: string;
  pdfUrl?: string;
}

function RiskBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-100 text-red-800 border-red-300' :
                score >= 40 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                'bg-green-100 text-green-800 border-green-300';
  const label = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MODERATE' : 'LOW RISK';

  return (
    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${color}`}>
      <span className="text-4xl font-bold">{score.toFixed(0)}</span>
      <div>
        <div className="text-sm font-bold">{label}</div>
        <div className="text-xs opacity-75">Risk Score</div>
      </div>
    </div>
  );
}

export default function Dashboard({ report, audioUrl, pdfUrl }: DashboardProps) {
  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header with Risk Score */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Evidence Report</h2>
            <p className="text-gray-500 mt-1">AI-generated incident analysis</p>
          </div>
          <RiskBadge score={report.risk_score} />
        </div>
      </div>

      {/* Violation History */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Violation History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-600">Fine (VND)</th>
              </tr>
            </thead>
            <tbody>
              {report.violation_history.map((v, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-gray-700">{v.date}</td>
                  <td className="py-3 px-2 text-gray-700">{v.description}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      v.status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-gray-700">
                    {v.fine_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scene Analysis */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Scene Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Damage</p>
            <p className="text-gray-700 mt-1">{report.scene_analysis.damage_description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Impact Point</p>
            <p className="text-gray-700 mt-1">{report.scene_analysis.impact_point}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Road Conditions</p>
            <p className="text-gray-700 mt-1">{report.scene_analysis.road_conditions}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Vehicle Positions</p>
            <p className="text-gray-700 mt-1">{report.scene_analysis.vehicle_positions}</p>
          </div>
        </div>
        {report.scene_analysis.plate_confirmed && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">License plate confirmed in image</span>
          </div>
        )}
      </div>

      {/* Legal References */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Applicable Legal Codes</h3>
        <div className="space-y-3">
          {report.legal_references.map((ref, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{ref.article_number} - {ref.title}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {(ref.relevance * 100).toFixed(0)}% relevant
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{ref.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fault Assessment */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fault Assessment</h3>
        <p className="text-gray-700 leading-relaxed">{report.fault_assessment}</p>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2">
          {report.next_steps.map((step, i) => (
            <li key={i} className="text-gray-700">{step}</li>
          ))}
        </ol>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vietnamese Audio Summary</h3>
          <audio controls autoPlay className="w-full" src={audioUrl} />
        </div>
      )}

      {/* Export */}
      {pdfUrl && (
        <a
          href={pdfUrl}
          download
          className="block w-full text-center py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors text-lg shadow-lg"
        >
          Export PDF Report
        </a>
      )}
    </div>
  );
}
