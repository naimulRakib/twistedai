import React, { useState } from 'react';
import { useMap } from 'react-leaflet';

import { supabase } from '@/lib/supabaseClient'; 

interface Location {
  lat: number;
  lng: number;
}

interface GetLocationProps {
  onLocationFound: (pos: Location) => void;
  
  onInsertSuccess?: () => void; 
}

const GetLocation: React.FC<GetLocationProps> = ({ onLocationFound, onInsertSuccess }) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFoundLocation, setHasFoundLocation] = useState(false);

  const insertLocationIntoSupabase = async (location: Location) => {
    
    
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { 
          lat: location.lat, 
          lng: location.lng,
      
        }
      ])
      .select();

    if (error) {
      console.error("Supabase Insert Error:", error);
      alert("Failed to save location to database: " + error.message);
      return false;
    }
    
    console.log("Location successfully inserted into Supabase:", data);
    onInsertSuccess?.();
    return true;
  };


  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => { 
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

       
        const insertSuccessful = await insertLocationIntoSupabase(newLocation);
        
       
        if (insertSuccessful) {
          
            onLocationFound(newLocation);
            setHasFoundLocation(true);

            
            map.flyTo([newLocation.lat, newLocation.lng], 16, { duration: 1.5 });
        }
       
      
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        alert("Could not get location. Ensure GPS is enabled.");
        
        
        setIsLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 0
      }
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1000
    }}>
      <button 
        onClick={handleGetLocation}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : 'white',
          color: 'black',
          border: '2px solid #ccc',
          padding: '10px 15px',
          borderRadius: '4px',
          cursor: isLoading ? 'wait' : 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          transition: 'background-color 0.3s'
        }}
      >
        {isLoading 
          ? "Locating and Saving..." 
          : hasFoundLocation 
            ? "🎯 Recenter & Update" 
            : "📍 Find & Save Location"}
      </button>
    </div>
  );
};

export default GetLocation;