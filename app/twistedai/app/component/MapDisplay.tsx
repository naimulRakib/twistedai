"use client";
import React, { FC, useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GetLocation from './GetLocation';
// Mock import for your file structure
import UserLocationData from '../Json/JsonData.json';

// --- TYPES ---
interface Location {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: string;
}

interface UserLocation {
  userId: string;
  name: string;
  location: Location;
}

interface MapDisplayProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Props for the navigation component
interface ManualNavigationProps {
  onNavigate: (lat: number, lng: number) => void;
}

// --- STYLES ---
const styles = {
  map: { height: '50vh', width: '50%' },
  controlPanel: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    zIndex: 1000,
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  input: {
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    color: 'black'
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  }
};

// --- COMPONENTS ---

/**
 * Component to handle zooming to a specific location inside a Popup
 */
const FlyToButton: FC<{ lat: number; lng: number; label?: string }> = ({ lat, lng, label = "Zoom Here" }) => {
  const map = useMap();
  
  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling
    map.flyTo([lat, lng], 18, { duration: 1.5 });
  };

  return (
    <button onClick={handleZoom} style={styles.button}>
      {label}
    </button>
  );
};

/**
 * Control panel to manually enter coordinates
 */
const ManualNavigation: FC<ManualNavigationProps> = ({ onNavigate }) => {
  const map = useMap();
  const [lat, setLat] = useState<string>("23.81");
  const [lng, setLng] = useState<string>("90.41");
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent map interactions when typing in inputs
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handlePan = () => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    
    if (!isNaN(numLat) && !isNaN(numLng)) {
      // 1. Move the map
      map.flyTo([numLat, numLng], 14);
      // 2. Trigger the marker creation in the parent
      onNavigate(numLat, numLng);
    } else {
      alert("Invalid Coordinates");
    }
  };

  return (
    <div ref={containerRef} style={styles.controlPanel}>
      <strong style={{ fontSize: '0.9rem', color: 'black' }}>Manual Nav</strong>
      <input 
        type="number" 
        placeholder="Lat"
        className='text-black'
        value={lat} 
        onChange={e => setLat(e.target.value)} 
        style={styles.input}
        onKeyDown={(e) => e.key === 'Enter' && handlePan()}
      />
      <input 
        type="number" 
        placeholder="Lng"
        className='text-black'
        value={lng} 
        onChange={e => setLng(e.target.value)} 
        style={styles.input}
        onKeyDown={(e) => e.key === 'Enter' && handlePan()}
      />
      <button onClick={handlePan} style={styles.button}>Go</button>
    </div>
  );
};

// --- MAIN COMPONENT ---

const MapDisplay: FC<MapDisplayProps> = ({ 
  initialCenter = [23.8103, 90.4125], // Default: Dhaka
  initialZoom = 10 
}) => {
  
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Optimize data loading
  const userData = useMemo(() => {
    return (UserLocationData as any).users as UserLocation[]; 
  }, []);

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={initialZoom} 
      scrollWheelZoom={true} 
      style={styles.map}
    >
      {/* 1. Base Layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* 2. UI Controls - Now passes the setManualLocation function */}
      <ManualNavigation onNavigate={(lat, lng) => setManualLocation({ lat, lng })} />

      {/* 3. Current User Position (GPS) */}
      <GetLocation onLocationFound={setUserPos} /> 
      
      {userPos && (
        <CircleMarker
          center={[userPos.lat, userPos.lng]}
          radius={8}
          pathOptions={{ color: 'blue', fillColor: '#2196F3', fillOpacity: 1 }}
        >
          <Popup>
            <strong>You are here (GPS)</strong>
          </Popup>
        </CircleMarker>
      )}

      {/* 4. Manual Navigation Marker (The requested feature) */}
      {manualLocation && (
        <CircleMarker
          center={[manualLocation.lat, manualLocation.lng]}
          radius={12}
          pathOptions={{ color: 'green', fillColor: '#4CAF50', fillOpacity: 0.8 }}
        >
          <Popup>
            <strong>Manual Destination</strong><br/>
            Lat: {manualLocation.lat}<br/>
            Lng: {manualLocation.lng}
          </Popup>
        </CircleMarker>
      )}

      {/* 5. Render JSON Data Users */}
      {userData.map((user) => (
        <CircleMarker
          key={user.userId}
          center={[user.location.lat, user.location.lng]}
          radius={10}
          pathOptions={{ color: 'red', fillColor: '#f44336', fillOpacity: 0.7, stroke: false }}
        >
          <Popup>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <strong>{user.name}</strong>
              <span style={{ fontSize: '12px' }}>{user.location.address || "No address"}</span>
              <FlyToButton lat={user.location.lat} lng={user.location.lng} />
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default MapDisplay;