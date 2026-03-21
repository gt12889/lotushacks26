'use client';

export type TaskStatus = 'pending' | 'running' | 'complete' | 'error';

interface ProgressBarProps {
  tasks: {
    violations: TaskStatus;
    scene: TaskStatus;
    legal: TaskStatus;
  };
  visible: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-200',
  running: 'bg-yellow-400 animate-pulse',
  complete: 'bg-green-500',
  error: 'bg-red-500',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Waiting',
  running: 'Loading...',
  complete: 'Done',
  error: 'Failed',
};

export default function ProgressBar({ tasks, visible }: ProgressBarProps) {
  if (!visible) return null;

  const segments = [
    { key: 'violations', label: 'Violation History', status: tasks.violations },
    { key: 'scene', label: 'Scene Analysis', status: tasks.scene },
    { key: 'legal', label: 'Legal Search', status: tasks.legal },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Analysis Progress</h3>
      <div className="flex gap-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex-1">
            <div className={`h-3 rounded-full ${statusColors[seg.status]} transition-all duration-500`} />
            <div className="flex justify-between mt-1">
              <span className="text-xs font-medium text-gray-700">{seg.label}</span>
              <span className="text-xs text-gray-500">{statusLabels[seg.status]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
