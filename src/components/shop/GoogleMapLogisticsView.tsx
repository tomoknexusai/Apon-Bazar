/**
 * Google Maps Interactive Logistics & Delivery Hub View
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { useECommerce } from '../../context/ECommerceContext';
import { getRegisteredDealers } from '../../services/DealerInventoryService';
import { Building2, Navigation, Truck, MapPin, Layers } from 'lucide-react';

export const GoogleMapLogisticsView: React.FC = () => {
  const { warehouses } = useECommerce();
  const registeredDealers = getRegisteredDealers();
  const [selectedHub, setSelectedHub] = useState<any>(warehouses[0]);

  // Default Bangladesh coordinates (Thakurgaon / Central BD)
  const defaultCenter = { lat: 25.6279, lng: 88.6332 };
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const hubLocations = [
    {
      id: 'DLR-THAK-001',
      title: 'M/S Rahman Enterprise',
      tradeLicenseBusinessName: 'M/S Rahman Enterprise',
      zoneName: 'Thakurgaon Sadar',
      lat: 26.0336,
      lng: 88.4617,
      type: 'warehouse',
      address: 'পুরাতন বাসস্ট্যান্ড রোড, ঠাকুরগাঁও সদর, ঠাকুরগাঁও',
      stock: '14,500 pcs'
    },
    {
      id: 'DLR-SAID-002',
      title: 'M/S Karim Traders',
      tradeLicenseBusinessName: 'M/S Karim Traders',
      zoneName: 'Saidpur',
      lat: 25.7785,
      lng: 88.8974,
      type: 'warehouse',
      address: 'রেলওয়ে মার্কেট, সৈয়দপুর, নীলফামারী',
      stock: '8,200 pcs'
    },
    {
      id: 'DLR-DIN-003',
      title: 'M/S Noor Traders',
      tradeLicenseBusinessName: 'M/S Noor Traders',
      zoneName: 'Dinajpur Sadar',
      lat: 25.6279,
      lng: 88.6332,
      type: 'warehouse',
      address: 'বাহাদুর বাজার, দিনাজপুর সদর, দিনাজপুর',
      stock: '6,100 pcs'
    },
    {
      id: 'DLR-DHK-004',
      title: 'M/S Chowdhury & Sons',
      tradeLicenseBusinessName: 'M/S Chowdhury & Sons',
      zoneName: 'Mirpur',
      lat: 23.8069,
      lng: 90.3687,
      type: 'warehouse',
      address: 'প্লট ১৪, রোড ০২, মিরপুর ১০ গোলচত্বর, ঢাকা',
      stock: '9,500 pcs'
    },
    {
      id: 'DLR-CTG-005',
      title: 'M/S Al-Madina Enterprise',
      tradeLicenseBusinessName: 'M/S Al-Madina Enterprise',
      zoneName: 'Kotwali',
      lat: 22.3390,
      lng: 91.8320,
      type: 'warehouse',
      address: 'দোকান ১২, নিউ মার্কেট লেন, আন্দরকিল্লা, কোতোয়ালী, চট্টগ্রাম',
      stock: '7,800 pcs'
    },
    {
      id: 'rider-1',
      title: 'অন-রুট এক্সপ্রেস রাইডার (Transit Rider)',
      lat: 26.0380,
      lng: 88.4680,
      type: 'rider',
      address: 'ঠাকুরগাঁও সদর ইন-ট্রানজিট',
      stock: '৪টি পার্সেল বহনরত'
    }
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>বাংলাদেশ লজিস্টিকস হাব ও রাইডার ম্যাপ (Google Maps)</span>
          </h3>
          <p className="text-xs text-neutral-500">
            রিয়েল-টাইম ডিপো মজুদ, ভেন্ডর শপ এবং রাইডার লোকেশন ট্র্যাকিং।
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> ওয়্যারহাউজ হাব
          </span>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> এক্সপ্রেস রাইডার
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-inner">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={7}
              gestureHandling={'greedy'}
              disableDefaultUI={false}
              className="w-full h-full"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {hubLocations.map((hub) => (
                <Marker
                  key={hub.id}
                  position={{ lat: hub.lat, lng: hub.lng }}
                  onClick={() => setSelectedHub(hub)}
                />
              ))}

              {selectedHub && (
                <InfoWindow
                  position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
                  onCloseClick={() => setSelectedHub(null)}
                >
                  <div className="p-2 space-y-1 text-xs text-neutral-900">
                    <h4 className="font-bold">{selectedHub.title}</h4>
                    <p className="text-[11px] text-neutral-600">{selectedHub.address}</p>
                    <p className="font-mono text-emerald-600 font-bold">স্টক: {selectedHub.stock}</p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          /* Interactive Mock Map Canvas Fallback when key is unconfigured */
          <div className="w-full h-full bg-neutral-900 text-white p-6 relative flex flex-col justify-between bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="flex items-center justify-between z-10">
              <span className="px-3 py-1 bg-emerald-600/90 text-white font-bold text-xs rounded-lg backdrop-blur-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> লাইভ জিপিএস গ্রিড ভিউ
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ঢাকা • চট্টগ্রাম • রাজশাহী বিভাগীয় কভারেজ
              </span>
            </div>

            {/* Simulated Map Markers */}
            <div className="absolute inset-0 flex items-center justify-around px-12 pointer-events-none">
              {hubLocations.map((hub) => (
                <div
                  key={hub.id}
                  className="pointer-events-auto cursor-pointer group flex flex-col items-center"
                  onClick={() => setSelectedHub(hub)}
                >
                  <div className="px-2.5 py-1 bg-white/90 text-neutral-900 font-bold text-[10px] rounded-lg shadow-lg mb-1 group-hover:scale-110 transition-transform">
                    {hub.title}
                  </div>
                  <div className={`p-2 rounded-full shadow-xl border-2 border-white ${
                    hub.type === 'warehouse' ? 'bg-blue-600' : 'bg-emerald-500 animate-bounce'
                  }`}>
                    {hub.type === 'warehouse' ? (
                      <Building2 className="w-4 h-4 text-white" />
                    ) : (
                      <Truck className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="z-10 bg-neutral-800/90 backdrop-blur-md p-3 rounded-xl border border-neutral-700 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold block text-emerald-400">
                  {selectedHub ? selectedHub.title : 'হাব নির্বাচন করুন'}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {selectedHub ? selectedHub.address : 'ম্যাপ পিনে ক্লিক করে বিস্তারিত তথ্য দেখুন'}
                </span>
              </div>
              {selectedHub && (
                <span className="font-mono text-xs bg-emerald-950 text-emerald-300 font-bold px-2 py-1 rounded">
                  {selectedHub.stock}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
