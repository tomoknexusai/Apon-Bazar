/**
 * Toggle-able Spatial Planning Map View Component for Market/Bazar Management
 * Uses @vis.gl/react-google-maps with AdvancedMarker and InfoWindow
 * Allows admins to visualize market distribution spatially across wards/unions.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MarketItem, MarketType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  ExternalLink,
  Store,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Compass,
  Key,
  ShieldAlert,
  Edit3
} from 'lucide-react';

interface MarketMapViewProps {
  markets: MarketItem[];
  selectedWard?: string;
  selectedUnion?: string;
  onEditMarket?: (market: MarketItem) => void;
  className?: string;
}

// Marker Color mapping by Market Type
const TYPE_PIN_COLORS: Record<string, { bg: string; glyph: string; border: string }> = {
  'Daily Market': { bg: '#10b981', glyph: '#ffffff', border: '#047857' }, // Emerald
  'Weekly Hat': { bg: '#f59e0b', glyph: '#ffffff', border: '#b45309' }, // Amber
  'Shopping Mall': { bg: '#a855f7', glyph: '#ffffff', border: '#6b21a8' }, // Purple
  'Super Shop': { bg: '#3b82f6', glyph: '#ffffff', border: '#1d4ed8' }, // Blue
  'Wholesale Market': { bg: '#6366f1', glyph: '#ffffff', border: '#3730a3' }, // Indigo
  'Local Market': { bg: '#14b8a6', glyph: '#ffffff', border: '#0f766e' }, // Teal
  'Other': { bg: '#6b7280', glyph: '#ffffff', border: '#374151' } // Gray
};

// Base coordinates for Bangladesh divisions/districts for fallback lat/lng generation
const DIVISION_COORDS: Record<string, { lat: number; lng: number }> = {
  'রাজশাহী': { lat: 24.3636, lng: 88.6282 }, // Rajshahi
  'ঢাকা': { lat: 23.8103, lng: 90.4125 }, // Dhaka
  'চট্টগ্রাম': { lat: 22.3569, lng: 91.7832 }, // Chattogram
  'খুলনা': { lat: 22.8456, lng: 89.5403 }, // Khulna
  'সিলেট': { lat: 24.8949, lng: 91.8687 }, // Sylhet
  'বরিশাল': { lat: 22.7010, lng: 90.3535 }, // Barishal
  'রংপুর': { lat: 25.7439, lng: 89.2752 }, // Rangpur
  'ময়মনসিংহ': { lat: 24.7471, lng: 90.4203 } // Mymensingh
};

// Deterministic fallback coordinate calculation for markets lacking explicit lat/lng
const getMarketCoordinates = (market: MarketItem, index: number): { lat: number; lng: number } => {
  if (market.latitude && market.longitude) {
    return { lat: market.latitude, lng: market.longitude };
  }

  // Base coords based on division or Rajshahi default
  const base = DIVISION_COORDS[market.division] || DIVISION_COORDS['রাজশাহী'];

  // Parse ward number offset
  let wardOffset = 0;
  if (market.ward) {
    const numMatch = market.ward.match(/\d+/);
    if (numMatch) {
      wardOffset = parseInt(numMatch[0], 10);
    }
  }

  // Generate deterministic micro offset using market ID hash
  let hash = 0;
  for (let i = 0; i < market.id.length; i++) {
    hash = (hash << 5) - hash + market.id.charCodeAt(i);
    hash |= 0;
  }
  const normHashLat = ((Math.abs(hash) % 100) - 50) / 4000;
  const normHashLng = ((Math.abs(hash * 13) % 100) - 50) / 4000;

  const lat = base.lat + (wardOffset * 0.003) + normHashLat;
  const lng = base.lng + (wardOffset * 0.003) + normHashLng;

  return { lat, lng };
};

// Sub-component for individual market marker & info window
const MarketMarkerItem: React.FC<{
  market: MarketItem;
  position: { lat: number; lng: number };
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onEdit?: (m: MarketItem) => void;
  isBn: boolean;
}> = ({ market, position, isSelected, onSelect, onClose, onEdit, isBn }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const colors = TYPE_PIN_COLORS[market.marketType] || TYPE_PIN_COLORS['Other'];
  const isInactive = market.status === 'Inactive';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={onSelect}
        title={`${market.nameBn} (${market.marketType})`}
      >
        <Pin
          background={isInactive ? '#f43f5e' : colors.bg}
          borderColor={isInactive ? '#be123c' : colors.border}
          glyphColor={colors.glyph}
        />
      </AdvancedMarker>

      {isSelected && (
        <InfoWindow
          anchor={marker}
          onCloseClick={onClose}
          className="max-w-xs font-sans text-neutral-900"
        >
          <div className="p-1 space-y-2.5">
            {/* Header Title */}
            <div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                <h5 className="font-black text-sm text-neutral-900 leading-tight">
                  {market.nameBn}
                </h5>
              </div>
              {market.nameEn && market.nameEn !== market.nameBn && (
                <p className="text-[10px] text-neutral-500 font-medium pl-5.5">
                  {market.nameEn}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                {market.marketType}
              </span>
              <span className="text-[10px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md">
                {market.ward || (isBn ? 'সকল ওয়ার্ড' : 'Ward N/A')}
              </span>
              {market.status === 'Active' ? (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {isBn ? 'সক্রিয়' : 'Active'}
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  {isBn ? 'নিষ্ক্রিয়' : 'Inactive'}
                </span>
              )}
            </div>

            {/* Location Details */}
            <div className="text-[11px] text-neutral-600 space-y-0.5 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
              <p>
                <strong>{isBn ? 'ইউনিয়ন/পৌরসভা:' : 'Union:'}</strong> {market.unionName}
              </p>
              <p>
                <strong>{isBn ? 'উপজেলা ও জেলা:' : 'Upazila & District:'}</strong> {market.upazila}, {market.district}
              </p>
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
              {market.googleMapsUrl && (
                <a
                  href={market.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all text-center"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isBn ? 'গুগল ম্যাপসে খুলুন' : 'Google Maps'}</span>
                </a>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(market)}
                  className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-neutral-700" />
                  <span>{isBn ? 'সম্পাদনা' : 'Edit'}</span>
                </button>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const MarketMapView: React.FC<MarketMapViewProps> = ({
  markets,
  selectedWard = '',
  selectedUnion = '',
  onEditMarket,
  className = ''
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Retrieve Google Maps API key from environment
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  // Compute positions for filtered markets
  const marketPositions = useMemo(() => {
    return markets.map((m, idx) => ({
      market: m,
      pos: getMarketCoordinates(m, idx)
    }));
  }, [markets]);

  // Map center calculation
  const defaultCenter = useMemo(() => {
    if (marketPositions.length > 0) {
      const sumLat = marketPositions.reduce((acc, curr) => acc + curr.pos.lat, 0);
      const sumLng = marketPositions.reduce((acc, curr) => acc + curr.pos.lng, 0);
      return {
        lat: sumLat / marketPositions.length,
        lng: sumLng / marketPositions.length
      };
    }
    return DIVISION_COORDS['রাজশাহী'];
  }, [marketPositions]);

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs space-y-0 ${className}`}>
      {/* Top Map Action Bar */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'স্প্যাশিয়াল বাজার ম্যাপ (Spatial Market Map)' : 'Spatial Market Map'}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                {markets.length} {isBn ? 'টি মার্কেট' : 'Markets'}
              </span>
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {isBn ? 'বর্তমান ফিল্টার অনুযায়ী ভৌগোলিক অবস্থান ও সার্ভিস কভারেজ' : 'Geographic view of filtered markets'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>{isBn ? 'দৈনিক বাজার' : 'Daily'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>{isBn ? 'হাট' : 'Weekly Hat'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span>{isBn ? 'মল' : 'Mall'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[450px] bg-neutral-100 dark:bg-neutral-950">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={13}
              mapId="MARKET_SPATIAL_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {marketPositions.map(({ market, pos }) => (
                <MarketMarkerItem
                  key={market.id}
                  market={market}
                  position={pos}
                  isSelected={selectedMarketId === market.id}
                  onSelect={() => setSelectedMarketId(market.id)}
                  onClose={() => setSelectedMarketId(null)}
                  onEdit={onEditMarket}
                  isBn={isBn}
                />
              ))}
            </Map>
          </APIProvider>
        ) : (
          /* Fallback UI when Google Maps API Key is not configured */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950 text-white text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-base font-black text-white">
                {isBn ? 'গুগল ম্যাপস এপিআই কী (API Key) আবশ্যক' : 'Google Maps API Key Required'}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {isBn
                  ? 'লাইভ গুগল ম্যাপসে বাজারগুলির পিন দেখতে গুগল ম্যাপস এপিআই কী সেট করুন।'
                  : 'To enable live interactive map markers for markets, configure your Google Maps API key.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 text-left max-w-sm w-full space-y-2 text-xs text-neutral-200">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>{isBn ? 'কী যুক্ত করার নিয়মাবলী:' : 'How to add API Key:'}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-300">
                <li>{isBn ? 'উপরে ডানে Settings (⚙️ গিয়ার আইকন) এ ক্লিক করুন' : 'Click Settings (⚙️ gear icon, top-right)'}</li>
                <li>{isBn ? 'Secrets মেনুতে গিয়ে `GOOGLE_MAPS_PLATFORM_KEY` টাইপ করুন' : 'Go to Secrets → enter `GOOGLE_MAPS_PLATFORM_KEY`'}</li>
                <li>{isBn ? 'আপনার Google Maps API Key পেস্ট করুন' : 'Paste your key & press Enter'}</li>
              </ol>
            </div>

            {/* Interactive Fallback Market Grid Visualizer */}
            <div className="pt-2 w-full max-w-lg">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                {isBn ? 'ম্যাপ উইজেট বাজার প্রিভিউ (Fallback Layout):' : 'Fallback Market Grid View:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                {markets.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-2.5 rounded-xl transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-300 truncate">{m.ward || 'Ward N/A'}</span>
                      <span className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    </div>
                    <div className="text-xs font-bold text-white truncate">{m.nameBn}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{m.marketType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
