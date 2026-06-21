import { useEffect, useRef, useState } from 'react';
import { Lead } from '../types';

interface MapViewProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
}

// Coordinate mappings for locales to center pins realistically
const LOCALITY_COORDS: { [key: string]: [number, number] } = {
  'Banjara Hills': [17.4156, 78.4347],
  'Jubilee Hills': [17.4278, 78.4022],
  'Gachibowli': [17.4401, 78.3489],
  'Madhapur': [17.4483, 78.3741],
  'Begumpet': [17.4448, 78.4601],
  'Kukatpally': [17.4938, 78.3975],
  'Indiranagar': [12.9719, 77.6412],
  'Koramangala': [12.9352, 77.6245],
  'Whitefield': [12.9698, 77.7499],
  'HSR Layout': [12.9116, 77.6388],
  'Jayanagar': [12.9308, 77.5835],
  'Malleshwaram': [13.0031, 77.5701],
  'Bandra West': [19.0600, 72.8228],
  'Andheri East': [19.1155, 72.8727],
  'Colaba': [18.9067, 72.8147],
  'Juhu': [19.1042, 72.8267],
  'Powai': [19.1176, 72.9060],
  'Worli': [19.0188, 72.8168]
};

const CITY_CENTERS: { [key: string]: [number, number] } = {
  'hyderabad': [17.3850, 78.4867],
  'bangalore': [12.9716, 77.5946],
  'mumbai': [19.0760, 72.8777]
};

export default function MapView({ leads, onSelectLead }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]); // For competitor density overlay overlays
  const [densityOverlay, setDensityOverlay] = useState(false);

  // Determine active city to center the map viewport automatically
  let centerCity: 'all' | 'hyderabad' | 'bangalore' | 'mumbai' = 'all';
  const citiesInResults = Array.from(new Set(leads.map(l => l.city.toLowerCase())));
  if (citiesInResults.length === 1) {
    centerCity = citiesInResults[0] as any;
  }

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Initialize Leaflet map instance if not already initialized
    if (!mapRef.current) {
      const initialCenter = centerCity !== 'all' ? CITY_CENTERS[centerCity] : CITY_CENTERS['hyderabad'];
      const initialZoom = centerCity !== 'all' ? 12 : 5;

      mapRef.current = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false
      });

      // Premium Dark Mode Map Tile sets
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);
    } else {
      // Re-coordinate lookups if city filter has locked to singular city
      if (centerCity !== 'all') {
        mapRef.current.setView(CITY_CENTERS[centerCity], 12, { animate: true });
      }
    }

    // Clean up current existing map markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];

    // Cycle leads list plotting pins with offsets to prevent overlap stacking
    leads.forEach((lead, index) => {
      const baseCoords = LOCALITY_COORDS[lead.locality] || LOCALITY_COORDS['Banjara Hills'];
      
      // Inject tiny determinative offsets to layout adjacent records perfectly
      const seedVal = lead.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (seedVal % 12) * (30 * Math.PI / 180);
      const radius = 0.0035 + (seedVal % 5) * 0.001; 
      const lat = baseCoords[0] + radius * Math.sin(angle);
      const lng = baseCoords[1] + radius * Math.cos(angle);

      // Color tier logic
      let pinColor = '#6B7280'; // Low: Wait
      if (lead.score >= 75) pinColor = '#FF3B3B'; // High: Strike Now
      else if (lead.score >= 50) pinColor = '#F5A623'; // Medium: Soon

      // Create a glowing circular pin styled natively with CSS classes
      const markerHtml = `
        <div style="position: relative; display: flex; items-center: center; justify-content: center;">
          <span style="position: absolute; width:12px; height:12px; background-color:${pinColor}; border-radius:50%; border:2px solid #F0F2F5; box-shadow: 0 0 10px ${pinColor}; transform: scale(1.1);"></span>
          ${lead.score >= 75 ? `<span style="position: absolute; width:22px; height:22px; border:2px dashed ${pinColor}; border-radius:50%; animation: ping 1.5s infinite; opacity:0.4;"></span>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);

      // Popup Content Layout
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2.5 font-sans text-xs bg-[#111318] text-[#F0F2F5] rounded-lg border border-brand-border';
      popupContent.style.minWidth = '220px';
      
      popupContent.innerHTML = `
        <div class="flex items-center justify-between mb-1.5 border-b border-brand-border pb-1">
          <strong class="text-xs font-semibold font-display text-[#F0F2F5] truncate block max-w-[130px]">${lead.business_name}</strong>
          <span style="background-color:${pinColor}20; border:1px solid ${pinColor}40; color:${pinColor};" class="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
            ${lead.score} PTS
          </span>
        </div>
        <p class="text-[10px] text-brand-muted font-mono mb-2">${lead.category} • ${lead.locality}</p>
        <div class="border-l border-[#FF3B3B] bg-[#0A0C10] p-1.5 rounded-r text-[9px] font-mono leading-relaxed mb-3 text-brand-muted line-clamp-2">
          "${lead.pressure_signal}"
        </div>
        <button id="btn_map_strike_${lead.id}" class="w-full text-center bg-brand-primary hover:bg-opacity-95 text-white font-semibold rounded py-1 cursor-pointer transition-all uppercase tracking-wider text-[9px]">
          🎯 STRIKE TARGET DETAIL
        </button>
      `;

      // Mount dynamic button click mapping inside Leaflet popup container
      popupContent.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.id === `btn_map_strike_${lead.id}`) {
          onSelectLead(lead.id);
        }
      });

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'dark-leaflet-popup'
      });

      markersRef.current.push(marker);

      // Competitor density circular overlay showing competitor siege area
      if (densityOverlay && lead.competitor_count_nearby >= 2) {
        const circle = L.circle([lat, lng], {
          color: '#FF3B3B',
          fillColor: '#FF3B3B',
          fillOpacity: 0.05 + (lead.competitor_count_nearby * 0.02),
          radius: 280 + (lead.competitor_count_nearby * 100),
          weight: 1,
          dashArray: '3, 6'
        }).addTo(mapRef.current);
        circlesRef.current.push(circle);
      }
    });

  }, [leads, densityOverlay, centerCity]);

  // Handle resizing observer to safely adapt map dimension without breaking Leaflet's bounds
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current.invalidateSize();
    });
    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-brand-border">
      {/* Competitor overlay toggle control */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#111318] border border-brand-border px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-2">
        <input
          type="checkbox"
          id="toggle_competitor_density"
          checked={densityOverlay}
          onChange={(e) => setDensityOverlay(e.target.checked)}
          className="rounded text-brand-primary bg-[#0A0C10] border-brand-border w-3.5 h-3.5 focus:ring-0 focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="toggle_competitor_density" className="font-mono text-[10px] text-[#F0F2F5] font-semibold cursor-pointer select-none">
          COMPETITOR SIEGE GRID OVERLAY
        </label>
      </div>

      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
