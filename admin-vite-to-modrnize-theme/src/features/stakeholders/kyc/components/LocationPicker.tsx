import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '450px'
};

const center = {
  lat: 23.8103, // Dhaka coordinates
  lng: 90.4125
};

interface LocationData {
  division: string;
  district: string;
  thana: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  onLocationSelect: (data: LocationData) => void;
  className?: string;
}

export function LocationPicker({ onLocationSelect, className }: LocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState(center);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsGeocoding(false);
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        setAddress(result.formatted_address);

        let division = '';
        let district = '';
        let thana = '';

        result.address_components.forEach(component => {
          if (component.types.includes('administrative_area_level_1')) {
            division = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (component.types.includes('sublocality') || component.types.includes('locality')) {
            thana = component.long_name;
          }
        });

        onLocationSelect({
          division,
          district,
          thana,
          address: result.formatted_address,
          lat,
          lng
        });
      }
    });
  }, [onLocationSelect]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(newPos);
      reverseGeocode(newPos.lat, newPos.lng);
    }
  }, [reverseGeocode]);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMarkerPos(newPos);
        if (map) map.panTo(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
      }
    }
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-[300px] w-full bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-200">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("relative group rounded-3xl overflow-hidden border border-slate-200 shadow-xl animate-in fade-in duration-500", className)}>
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{ componentRestrictions: { country: 'bd' } }}
        >
          <div className="relative group/search">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg -z-10 transition-all group-focus-within/search:bg-white" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-primary-600 transition-colors" />
            <input
              type="text"
              placeholder="Search location in Bangladesh..."
              className="w-full bg-transparent pl-12 pr-4 py-3.5 text-[11px] font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            />
          </div>
        </Autocomplete>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPos}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#616161" }]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#e9e9e9" }]
              }
            ]
          }}
        >
          <Marker position={markerPos} />
        </GoogleMap>
        
        {isGeocoding && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-primary-600 animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Identifying...</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl flex items-start gap-3 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
          <div className="w-8 h-8 rounded-xl bg-primary-600/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Selected Location</p>
            <p className="text-[10px] font-bold text-slate-900 truncate">
              {isGeocoding ? 'Fetching address...' : address || 'Click on map to select'}
            </p>
          </div>
          <button 
            className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:scale-105 transition-transform"
            title="Use current location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
