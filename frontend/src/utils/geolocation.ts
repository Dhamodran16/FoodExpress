// Geolocation utility to get current location
// Based on improved LocationDetector implementation

export interface LocationData {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface GeocodeResult {
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
    postcode?: string;
  };
}

const getAddressFromCoordinates = async (lat: number, lon: number): Promise<GeocodeResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'FoodExpress App'
        },
      }
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data: GeocodeResult = await response.json();
    return data;
  } catch (err) {
    console.error('Geocoding error:', err);
    throw err;
  }
};

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      // Fallback to default location if geolocation is not available
      resolve({
        address: 'Current Location',
        city: 'Erode',
        state: 'Tamil Nadu',
        postalCode: '638052'
      });
      return;
    }

    console.log('Requesting geolocation...');
    
    const options: PositionOptions = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 20000, // Increased timeout for better accuracy
      maximumAge: 0, // Always get fresh position, no cache
    };

    console.log('Requesting fresh location with high accuracy...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('📍 Got coordinates:', {
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            accuracy: `${accuracy.toFixed(2)} meters`,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          
          // Log a Google Maps link for verification
          console.log(`🔗 Verify location: https://www.google.com/maps?q=${latitude},${longitude}`);
          
          try {
            console.log('🌐 Geocoding coordinates to address...');
            const geocodeData = await getAddressFromCoordinates(latitude, longitude);
            const address = geocodeData.address || {};
            
            console.log('📋 Geocoding result:', {
              display_name: geocodeData.display_name,
              address_details: address
            });
            
            const locationData: LocationData = {
              address: geocodeData.display_name || address.road || address.suburb || 'Current Location',
              city: address.city || address.town || address.village || address.county || 'Unknown',
              state: address.state || address.region || 'Unknown',
              postalCode: address.postcode || '000000',
              coordinates: { latitude, longitude }
            };
            
            console.log('✅ Final location data:', {
              formatted: `${locationData.city}, ${locationData.postalCode}`,
              full_address: locationData.address,
              coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            resolve(locationData);
          } catch (geocodingError) {
            console.error('Geocoding error:', geocodingError);
            // If geocoding fails, still return coordinates-based location
            resolve({
              address: 'Current Location',
              city: `Lat: ${latitude.toFixed(4)}`,
              state: `Lon: ${longitude.toFixed(4)}`,
              postalCode: 'Current',
              coordinates: { latitude, longitude }
            });
          }
        } catch (error) {
          console.error('Error processing location:', error);
          // Fallback to default
          resolve({
            address: 'Current Location',
            city: 'Erode',
            state: 'Tamil Nadu',
            postalCode: '638052'
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unknown error';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission denied by user. Please enable location access in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Request timeout. Please try again.';
            break;
        }
        console.error('Geolocation error details:', errorMessage);
        // Fallback to default location
        resolve({
          address: 'Current Location',
          city: 'Erode',
          state: 'Tamil Nadu',
          postalCode: '638052'
        });
      },
      options
    );
  });
};

export const formatLocationString = (location: LocationData): string => {
  // If we have a valid city and postal code, use them
  if (location.city && location.postalCode && location.city !== 'Unknown' && location.postalCode !== '000000' && !location.city.startsWith('Lat:')) {
    return `${location.city}, ${location.postalCode}`;
  }
  // If we have coordinates but no address, show coordinates
  if (location.coordinates) {
    return `Current Location (${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)})`;
  }
  // Fallback
  return 'Erode, 638052';
};

// Check permission status
export const checkLocationPermission = async (): Promise<PermissionState | null> => {
  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state;
    } catch (err) {
      console.log('Permission API not fully supported');
      return null;
    }
  }
  return null;
};

