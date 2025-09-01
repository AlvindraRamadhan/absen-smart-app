import { useState, useEffect, useCallback, useRef } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface OfficeLocation {
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchLocation?: boolean;
  officeLocation?: OfficeLocation;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isWithinOfficeRadius: boolean;
  distanceFromOffice: number | null;
  getCurrentLocation: () => Promise<LocationData>;
  startWatching: () => void;
  stopWatching: () => void;
  checkOfficeProximity: (location?: LocationData) => boolean;
  getLocationPermissionStatus: () => Promise<PermissionState>;
}

/**
 * Custom hook for geolocation tracking and office proximity validation
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchLocation = false,
    officeLocation,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithinOfficeRadius, setIsWithinOfficeRadius] = useState(false);
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(
    null
  );

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Default office location from environment
  const defaultOfficeLocation: OfficeLocation = {
    latitude: parseFloat(process.env.NEXT_PUBLIC_OFFICE_LATITUDE || "-6.2088"),
    longitude: parseFloat(
      process.env.NEXT_PUBLIC_OFFICE_LONGITUDE || "106.8456"
    ),
    radius: parseFloat(process.env.NEXT_PUBLIC_OFFICE_RADIUS || "100"),
    address: "Jakarta Pusat",
  };

  const currentOfficeLocation = officeLocation || defaultOfficeLocation;

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    },
    []
  );

  // Check if location is within office radius
  const checkOfficeProximity = useCallback(
    (locationData?: LocationData): boolean => {
      const targetLocation = locationData || location;
      if (!targetLocation) return false;

      const distance = calculateDistance(
        targetLocation.latitude,
        targetLocation.longitude,
        currentOfficeLocation.latitude,
        currentOfficeLocation.longitude
      );

      setDistanceFromOffice(distance);
      const withinRadius = distance <= currentOfficeLocation.radius;
      setIsWithinOfficeRadius(withinRadius);

      return withinRadius;
    },
    [location, calculateDistance, currentOfficeLocation]
  );

  // Handle geolocation success
  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      if (!isMountedRef.current) return;

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setLocation(locationData);
      setError(null);
      setIsLoading(false);

      // Check office proximity
      checkOfficeProximity(locationData);
    },
    [checkOfficeProximity]
  );

  // Handle geolocation error
  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    if (!isMountedRef.current) return;

    const errorMessages = {
      1: "Location access denied by user",
      2: "Location information unavailable",
      3: "Location request timeout",
    };

    const geolocationError: GeolocationError = {
      code: err.code,
      message:
        errorMessages[err.code as keyof typeof errorMessages] ||
        "Unknown geolocation error",
    };

    setError(geolocationError);
    setIsLoading(false);
    setLocation(null);
    setIsWithinOfficeRadius(false);
    setDistanceFromOffice(null);
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error: GeolocationError = {
          code: 0,
          message: "Geolocation is not supported by this browser",
        };
        setError(error);
        reject(error);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          handleLocationSuccess(position);
          resolve(locationData);
        },
        (positionError) => {
          handleLocationError(positionError);
          reject({
            code: positionError.code,
            message: positionError.message,
          } as GeolocationError);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [
    enableHighAccuracy,
    timeout,
    maximumAge,
    handleLocationSuccess,
    handleLocationError,
  ]);

  // Start watching location
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    setIsLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [
    enableHighAccuracy,
    timeout,
    maximumAge,
    handleLocationSuccess,
    handleLocationError,
  ]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Get location permission status
  const getLocationPermissionStatus =
    useCallback(async (): Promise<PermissionState> => {
      if (!navigator.permissions) {
        return "prompt"; // Default for browsers that don't support permissions API
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        return permissionStatus.state;
      } catch {
        return "prompt"; // Fallback
      }
    }, []);

  // Auto-start watching if enabled
  useEffect(() => {
    if (watchLocation) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watchLocation, startWatching, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    error,
    isLoading,
    isWithinOfficeRadius,
    distanceFromOffice,
    getCurrentLocation,
    startWatching,
    stopWatching,
    checkOfficeProximity,
    getLocationPermissionStatus,
  };
}
