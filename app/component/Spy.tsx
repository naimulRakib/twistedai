'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MapDisplay from './MapDisplay'; // Ensure this component exists
import SpyMasterSearch from './SpyMaster';
import { useToast } from '../context/ToastContext';
import SpyDetails from './SystemDetails/SpyDetails';
// --- CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
interface SpyData {
  fingerPrint: string;
  masterId?: string;
  ip: string;
  city: string;
  country: string;
  lat: string;
  lon: string;
  isp: string;
  gpu: string;
  cpu_cores: number;
  ram_gb: number | string;
  battery_level: string;
  is_charging: boolean;
  screen_res: string;
  window_res: string;
  pixel_ratio: number;
  os_platform: string;
  user_agent: string;
  browser_lang: string;
  timezone: string;
  connection_type: string;
  downlink_speed: string;
}

const SpyReportViewer: React.FC = () => {
  const toast = useToast();
  const [messageId, setMessageId] = useState<string>('');
  const [report, setReport] = useState<SpyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH REPORT ---
  const fetchReport = async () => {
    if (!messageId) {
      setError('Please enter a Message ID.');
      setReport(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('messages')
        .select('spy')
        .eq('id', messageId)
        .single();

      if (supabaseError) throw supabaseError;

      if (data && data.spy) {
        setReport(data.spy as SpyData);
      } else {
        setError(`No spy data found for ID: ${messageId}`);
      }

    } catch (e: any) {
      console.error('Fetch Error:', e);
      setError(`Access Denied: ${e.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for rows
  const DataRow = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => (
    <div className="flex justify-between items-start border-b border-green-900/30 pb-1 mb-1 last:border-0">
      <span className="text-gray-500 font-mono">{label}:</span>
      <span className={`font-mono text-right break-all ${highlight ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
        {value === undefined || value === null || value === '' ? 'N/A' : String(value)}
      </span>
    </div>
  );

  // Map Coordinates Check
  const latitude = report ? Number(report.lat) : undefined;
  const longitude = report ? Number(report.lon) : undefined;
  const hasValidCoordinates = report && !isNaN(latitude!) && !isNaN(longitude!) && latitude !== 0;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 space-y-6">
      
      {/* --- MAIN TERMINAL CARD --- */}
      <div className="bg-[#0a0a0a] border border-green-900/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[length:100%_4px]"></div>

        {/* Header */}
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-green-900/50 pb-3 text-green-500 tracking-widest">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          SPY REPORT VIEWER
        </h2>

        {/* Search Input */}
        <div className="mb-8 flex gap-2 relative z-10">
          <input
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="Enter Target Message ID..."
            className="flex-grow p-3 bg-black/50 border border-green-900/50 rounded-lg text-green-300 placeholder-green-900/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 font-mono text-sm transition-all"
          />
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-6 py-2 bg-green-900/20 border border-green-500/30 text-green-400 font-bold rounded-lg hover:bg-green-500 hover:text-black transition-all uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'DECRYPTING...' : 'FETCH DATA'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/10 border border-red-500/30 text-red-400 rounded font-mono text-xs">
            ❌ SYSTEM ERROR: {error}
          </div>
        )}

        {/* REPORT DISPLAY */}
        {report && (
          <div className="space-y-6 relative z-10 text-xs animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Section 1: Identity */}
            <div className="bg-green-900/10 p-4 rounded-lg border border-green-900/30">
                <h3 className="text-green-600 font-bold mb-3 uppercase tracking-widest border-b border-green-900/30 pb-1">:: Target Identity</h3>
                <DataRow label="MASTER ID" value={report.masterId} highlight />
                <DataRow label="FINGERPRINT" value={report.fingerPrint} />
                <DataRow label="IP ADDRESS" value={report.ip} highlight />
            </div>

            {/* Section 2: Location & Network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
                    <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest">:: Geo-Location</h3>
                    <DataRow label="CITY" value={report.city} />
                    <DataRow label="COUNTRY" value={report.country} />
                    <DataRow label="ISP" value={report.isp} />
                    <DataRow label="COORDS" value={`${report.lat}, ${report.lon}`} />
                </div>
                <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
                    <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest">:: Network</h3>
                    <DataRow label="CONNECTION" value={report.connection_type} />
                    <DataRow label="SPEED" value={report.downlink_speed} />
                    <DataRow label="TIMEZONE" value={report.timezone} />
                    <DataRow label="LANG" value={report.browser_lang} />
                </div>
            </div>

            {/* Section 3: Hardware */}
            <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest">:: Hardware Signature</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <DataRow label="OS" value={report.os_platform} />
                    <DataRow label="CORES" value={report.cpu_cores} />
                    <DataRow label="RAM" value={report.ram_gb} />
                    <DataRow label="BATTERY" value={`${report.battery_level} ${report.is_charging ? '⚡' : ''}`} highlight />
                    <DataRow label="SCREEN" value={report.screen_res} />
                    <DataRow label="GPU" value={report.gpu} />
                </div>
            </div>

            {/* User Agent (Collapsible look) */}
            <div className="pt-2 opacity-60 hover:opacity-100 transition-opacity">
               <p className="text-[10px] text-gray-600 font-mono break-all">UA: {report.user_agent}</p>
            </div>

          </div>
        )}

        {/* Idle State */}
        {!report && !isLoading && !error && (
          <div className="text-center py-12 opacity-30">
            <div className="w-16 h-16 mx-auto border-2 border-green-500/50 rounded-full flex items-center justify-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
            <p className="text-green-500 font-mono text-xs">WAITING FOR TARGET ID...</p>
          </div>
        )}
      </div>

      {/* --- MAP SECTION --- */}
      <div className="max-w-2xl mx-auto">
        {hasValidCoordinates ? (
          <div className="border border-green-900/30 rounded-xl overflow-hidden shadow-lg bg-black">
             <div className="bg-green-900/20 px-4 py-2 text-[10px] font-mono text-green-400 border-b border-green-900/30 flex justify-between">
                <span>WEAK LOCATION : ESTABLISHED</span>
                <span>{report?.lat}, {report?.lon}</span>
             </div>
             <MapDisplay />
          </div>
        ) : report ? (
          <div className="p-4 bg-yellow-900/10 border border-yellow-600/30 text-yellow-500/80 rounded-xl text-xs text-center font-mono">
            [!] UNABLE TO TRIANGULATE EXACT POSITION
          </div>
        ) : null}
      </div>
<SpyMasterSearch/>
<br /><br />
<SpyDetails/>
    </div>
  );
};

export default SpyReportViewer;