'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Alert {
  id: number;
  drug_query: string;
  price_threshold: number;
  is_active: number;
  created_at: string;
}

interface Monitor {
  id: number;
  drug_query: string;
  interval_minutes: number;
  is_active: number;
  last_run_at: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newAlertDrug, setNewAlertDrug] = useState('');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');
  const [newMonitorDrug, setNewMonitorDrug] = useState('');
  const [newMonitorInterval, setNewMonitorInterval] = useState('15');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`);
      setAlerts(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/monitors`);
      setMonitors(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAlerts(); fetchMonitors(); }, [fetchAlerts, fetchMonitors]);

  const createAlert = async () => {
    if (!newAlertDrug.trim() || !newAlertThreshold) return;
    await fetch(`${API_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drug_query: newAlertDrug, price_threshold: parseInt(newAlertThreshold) }),
    });
    setNewAlertDrug('');
    setNewAlertThreshold('');
    fetchAlerts();
  };

  const deleteAlert = async (id: number) => {
    await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' });
    fetchAlerts();
  };

  const createMonitor = async () => {
    if (!newMonitorDrug.trim()) return;
    await fetch(`${API_URL}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drug_query: newMonitorDrug, interval_minutes: parseInt(newMonitorInterval) }),
    });
    setNewMonitorDrug('');
    setNewMonitorInterval('15');
    fetchMonitors();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Alerts & Monitors</h2>

        {/* Price Alerts */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Price Alerts</h3>
          <p className="text-sm text-gray-500 mb-4">Get notified on Discord when a drug drops below your threshold.</p>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newAlertDrug}
              onChange={(e) => setNewAlertDrug(e.target.value)}
              placeholder="Drug name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
            <input
              type="number"
              value={newAlertThreshold}
              onChange={(e) => setNewAlertThreshold(e.target.value)}
              placeholder="Threshold (VND)"
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
            <button onClick={createAlert} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Alert
            </button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-gray-400 text-sm">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{alert.drug_query}</span>
                    <span className="text-gray-500 ml-3">below {alert.price_threshold.toLocaleString()} VND</span>
                  </div>
                  <button onClick={() => deleteAlert(alert.id)} className="text-sm text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Monitors */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recurring Monitors</h3>
          <p className="text-sm text-gray-500 mb-4">Automatically track prices at regular intervals.</p>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newMonitorDrug}
              onChange={(e) => setNewMonitorDrug(e.target.value)}
              placeholder="Drug name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
            <select
              value={newMonitorInterval}
              onChange={(e) => setNewMonitorInterval(e.target.value)}
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="5">Every 5 min</option>
              <option value="15">Every 15 min</option>
              <option value="30">Every 30 min</option>
              <option value="60">Every 1 hour</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Every 24 hours</option>
            </select>
            <button onClick={createMonitor} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Add Monitor
            </button>
          </div>

          {monitors.length === 0 ? (
            <p className="text-gray-400 text-sm">No active monitors</p>
          ) : (
            <div className="space-y-2">
              {monitors.map((mon) => (
                <div key={mon.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{mon.drug_query}</span>
                    <span className="text-gray-500 ml-3">every {mon.interval_minutes} min</span>
                    {mon.last_run_at && (
                      <span className="text-xs text-gray-400 ml-3">last: {new Date(mon.last_run_at).toLocaleString()}</span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
