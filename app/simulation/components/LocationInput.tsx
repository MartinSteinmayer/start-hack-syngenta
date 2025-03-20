// components/LocationInput.tsx
'use client'

import React, { useState, useEffect } from 'react';

interface LocationInputProps {
    onLocationChange: (latitude: number, longitude: number, locationName: string) => void;
    disabled?: boolean;
}

interface GeocodeResult {
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
}

const LocationInput: React.FC<LocationInputProps> = ({ onLocationChange, disabled = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [locationName, setLocationName] = useState('');
    const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [showResults, setShowResults] = useState(false);

    // Optional: Get user's current location when component mounts
    useEffect(() => {
        if (navigator.geolocation && !disabled) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                    // Reverse geocode to get location name
                    reverseGeocode(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Set default location (e.g., Central USA)
                    setLatitude(39.8283);
                    setLongitude(-98.5795);
                    setLocationName('United States (default)');
                    onLocationChange(39.8283, -98.5795, 'United States (default)');
                }
            );
        } else if (!disabled) {
            // Geolocation not available, set default
            setLatitude(39.8283);
            setLongitude(-98.5795);
            setLocationName('United States (default)');
            onLocationChange(39.8283, -98.5795, 'United States (default)');
        }
    }, [disabled]);

    // Reverse geocode to get location name from coordinates
    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const placeName = data[0].name;
                const country = data[0].country;
                const fullName = `${placeName}, ${country}`;

                setLocationName(fullName);
                onLocationChange(lat, lon, fullName);
            } else {
                setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                onLocationChange(lat, lon, `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            }
        } catch (error) {
            console.error("Error during reverse geocoding:", error);
            setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            onLocationChange(lat, lon, `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
    };

    // Search for location by name
    const searchLocation = async () => {
        if (!searchQuery.trim() || disabled) return;

        setIsSearching(true);
        setError('');

        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const results: GeocodeResult[] = data.map((item: any) => ({
                    name: item.name,
                    country: item.country,
                    state: item.state,
                    lat: item.lat,
                    lon: item.lon
                }));

                setSearchResults(results);
                setShowResults(true);
            } else {
                setSearchResults([]);
                setError('No locations found. Try a different search term.');
            }
        } catch (error) {
            console.error("Error searching location:", error);
            setError('Error searching for location. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Handle location selection from search results
    const selectLocation = (result: GeocodeResult) => {
        setLatitude(result.lat);
        setLongitude(result.lon);

        const locationString = result.state
            ? `${result.name}, ${result.state}, ${result.country}`
            : `${result.name}, ${result.country}`;

        setLocationName(locationString);
        setSearchQuery('');
        setShowResults(false);

        // Notify parent component
        onLocationChange(result.lat, result.lon, locationString);
    };

    // Handle manual entry of coordinates
    const handleManualCoordinates = () => {
        if (latitude !== null && longitude !== null) {
            reverseGeocode(latitude, longitude);
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold mb-2">Location Settings</h3>

            {/* Search by place name */}
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Search by place name:</label>
                <div className="flex">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                        placeholder="City name, country"
                        className="w-full p-2 border rounded-l"
                        disabled={disabled}
                    />
                    <button
                        onClick={searchLocation}
                        className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                        disabled={isSearching || disabled || !searchQuery.trim()}
                    >
                        {isSearching ? '...' : 'Search'}
                    </button>
                </div>

                {/* Search results dropdown */}
                {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-64 bg-white border rounded shadow-lg">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => selectLocation(result)}
                            >
                                {result.name}, {result.state && `${result.state}, `}{result.country}
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Or enter coordinates manually */}
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Or enter coordinates:</label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <input
                            type="number"
                            value={latitude !== null ? latitude : ''}
                            onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                            placeholder="Latitude"
                            min="-90"
                            max="90"
                            step="0.0001"
                            className="w-full p-2 border rounded"
                            disabled={disabled}
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            value={longitude !== null ? longitude : ''}
                            onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                            placeholder="Longitude"
                            min="-180"
                            max="180"
                            step="0.0001"
                            className="w-full p-2 border rounded"
                            disabled={disabled}
                        />
                    </div>
                </div>
                <button
                    onClick={handleManualCoordinates}
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    disabled={latitude === null || longitude === null || disabled}
                >
                    Set Location
                </button>
            </div>

            {/* Display current location */}
            {locationName && (
                <div className="mt-3 p-2 bg-gray-100 rounded">
                    <p className="text-sm font-medium">Current Location:</p>
                    <p>{locationName}</p>
                    <p className="text-xs text-gray-600">
                        Lat: {latitude?.toFixed(4)}, Lon: {longitude?.toFixed(4)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationInput;
