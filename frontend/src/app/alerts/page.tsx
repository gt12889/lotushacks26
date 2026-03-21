'use client';

import { useState, useEffect, useCallback } from 'react';
import MegalodonBadge from '@/components/ui/megalodon-badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Alert { id: number; drug_query: string; price_threshold: number; is_active: number; created_at: string; }
interface Monitor { id: number; drug_query: string; interval_minutes: number; is_active: number; last_run_at: string | null; created_at: string; }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [newAlertDrug, setNewAlertDrug] = useState('');
  const [newAlertThreshold, setNewAlertThreshold] = useState('');
  const [newMonitorDrug, setNewMonitorDrug] = useState('');
  const [newMonitorInterval, setNewMonitorInterval] = useState('15');

  const fetchAlerts = useCallback(async () => { try { const res = await fetch(`${API_URL}/api/alerts`); setAlerts(await res.json()); } catch (e) { console.error(e); } }, []);
  const fetchMonitors = useCallback(async () => { try { const res = await fetch(`${API_URL}/api/monitors`); setMonitors(await res.json()); } catch (e) { console.error(e); } }, []);
  useEffect(() => { fetchAlerts(); fetchMonitors(); }, [fetchAlerts, fetchMonitors]);

  const createAlert = async () => { if (!newAlertDrug.trim() || !newAlertThreshold) return; await fetch(`${API_URL}/api/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drug_query: newAlertDrug, price_threshold: parseInt(newAlertThreshold) }) }); setNewAlertDrug(''); setNewAlertThreshold(''); fetchAlerts(); };
  const deleteAlert = async (id: number) => { await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' }); fetchAlerts(); };
  const createMonitor = async () => { if (!newMonitorDrug.trim()) return; await fetch(`${API_URL}/api/monitor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drug_query: newMonitorDrug, interval_minutes: parseInt(newMonitorInterval) }) }); setNewMonitorDrug(''); setNewMonitorInterval('15'); fetchMonitors(); };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-t1">Megalodon Alert System</h2>
          <p className="text-xs text-t3 mt-1">Configuring deep-sea price tripwires</p>
        </div>

        <div className="bg-deep border border-border rounded-lg p-6">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Active Tripwires</h3>
          <p className="text-xs text-t3 mb-4">Get notified on Discord when a drug drops below your threshold.</p>
          <div className="flex gap-3 mb-6">
            <input type="text" value={newAlertDrug} onChange={(e) => setNewAlertDrug(e.target.value)} placeholder="Drug name" className="flex-1 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <input type="number" value={newAlertThreshold} onChange={(e) => setNewAlertThreshold(e.target.value)} placeholder="Threshold (VND)" className="w-48 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <button onClick={createAlert} className="px-5 py-2.5 bg-cyan text-abyss rounded-lg font-bold text-sm hover:bg-cyan/80 transition-colors">Deploy</button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-t3 text-xs font-mono">No active tripwires</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-3 px-4 bg-abyss border border-alert-red/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-t1 text-sm">{alert.drug_query}</span>
                    <span className="text-warn text-xs font-mono">below {alert.price_threshold.toLocaleString()} VND</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MegalodonBadge status="active" label="ARMED" />
                    <button onClick={() => deleteAlert(alert.id)} className="text-xs text-alert-red hover:text-alert-red/80 transition-colors">Disarm</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-deep border border-border rounded-lg p-6">
          <h3 className="text-xs font-bold text-cyan uppercase tracking-wider mb-4">Sonar Probes</h3>
          <p className="text-xs text-t3 mb-4">Automatically track prices at regular intervals.</p>
          <div className="flex gap-3 mb-6">
            <input type="text" value={newMonitorDrug} onChange={(e) => setNewMonitorDrug(e.target.value)} placeholder="Drug name" className="flex-1 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono placeholder-t3 focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm" />
            <select value={newMonitorInterval} onChange={(e) => setNewMonitorInterval(e.target.value)} className="w-48 px-4 py-2.5 bg-abyss border border-border rounded-lg text-t1 font-mono focus:ring-1 focus:ring-cyan focus:border-cyan outline-none text-sm">
              <option value="5">Every 5 min</option>
              <option value="15">Every 15 min</option>
              <option value="30">Every 30 min</option>
              <option value="60">Every 1 hour</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Every 24 hours</option>
            </select>
            <button onClick={createMonitor} className="px-5 py-2.5 bg-cyan text-abyss rounded-lg font-bold text-sm hover:bg-cyan/80 transition-colors">Deploy</button>
          </div>
          {monitors.length === 0 ? (
            <p className="text-t3 text-xs font-mono">No active probes</p>
          ) : (
            <div className="space-y-2">
              {monitors.map((mon) => (
                <div key={mon.id} className="flex items-center justify-between py-3 px-4 bg-abyss border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-t1 text-sm">{mon.drug_query}</span>
                    <span className="text-t3 text-xs font-mono">every {mon.interval_minutes}min</span>
                    {mon.last_run_at && <span className="text-[10px] text-t3 font-mono">last: {new Date(mon.last_run_at).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <MegalodonBadge status="active" label="ACTIVE" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
