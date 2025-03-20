'use client'

import React, { useEffect, useRef, useState } from 'react';

interface MapComponentProps {
    latitude: number;
    longitude: number;
    onLocationSelect?: (lat: number, lng: number) => void;
    disabled?: boolean;
    className?: string;
    hectares?: number;
    showCircle?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
    latitude,
    longitude,
    onLocationSelect,
    disabled = false,
    className = '',
    hectares,
    showCircle = false
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Generate a unique ID for this map instance to prevent conflicts
    const mapId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);

    // Function to clean up the map instance and remove it from the DOM
    const cleanupMap = () => {
        if (mapInstanceRef.current) {
            console.log('Cleaning up map instance...');
            // Remove all event listeners
            mapInstanceRef.current.off();
            // Remove the map instance
            mapInstanceRef.current.remove();
            // Clear the reference
            mapInstanceRef.current = null;

            // Also clear these references
            markerRef.current = null;
            if (circleRef.current) {
                circleRef.current = null;
            }
        }
    };

    // Initialize map
    useEffect(() => {
        // Skip if no container or window.L not ready
        if (!mapContainerRef.current || typeof window === 'undefined') return;

        // Set a unique ID for the map container
        mapContainerRef.current.id = mapId.current;

        // Load Leaflet if not already loaded
        const loadLeaflet = async () => {
            if (!window.L) {
                console.log('Loading Leaflet library...');
                // Load CSS
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);

                // Load JS
                return new Promise<void>((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.async = true;
                    script.onload = () => {
                        console.log('Leaflet loaded successfully');
                        resolve();
                    };
                    document.head.appendChild(script);
                });
            }
            return Promise.resolve();
        };

        const initializeMap = async () => {
            await loadLeaflet();

            // Check again if container exists (might have unmounted during loading)
            if (!mapContainerRef.current) return;

            // Clean up existing map if it exists
            cleanupMap();

            try {
                console.log('Initializing map with container ID:', mapId.current);

                // Create map instance
                mapInstanceRef.current = window.L.map(mapId.current).setView([latitude, longitude], 10);

                // Add OpenStreetMap tile layer
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstanceRef.current);

                // Fix Leaflet's default icon path issues
                window.L.Icon.Default.imagePath = '/';

                // Create custom icon
                const customIcon = window.L.icon({
                    iconUrl: '/images/icons/marker-icon.png',
                    iconRetinaUrl: '/images/icons/marker-icon-2x.png',
                    shadowUrl: '/images/icons/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                // Add a marker at the initial position with custom icon
                markerRef.current = window.L.marker([latitude, longitude], {
                    draggable: !disabled,
                    icon: customIcon
                }).addTo(mapInstanceRef.current);

                // Add circle to show farm size if requested
                if (showCircle && hectares) {
                    // Convert hectares to meters radius (sqrt of area ÷ π)
                    const areaInSquareMeters = hectares * 10000; // 1 hectare = 10,000 sq meters
                    const radiusInMeters = Math.sqrt(areaInSquareMeters / Math.PI);

                    circleRef.current = window.L.circle([latitude, longitude], {
                        radius: radiusInMeters,
                        fillColor: '#3388ff',
                        fillOpacity: 0.2,
                        color: '#3388ff',
                        weight: 2
                    }).addTo(mapInstanceRef.current);
                }

                // Handle map click events
                if (!disabled && onLocationSelect) {
                    mapInstanceRef.current.on('click', (e: any) => {
                        const { lat, lng } = e.latlng;
                        markerRef.current.setLatLng(e.latlng);
                        onLocationSelect(lat, lng);

                        // Update circle position if it exists
                        if (circleRef.current) {
                            circleRef.current.setLatLng(e.latlng);
                        }
                    });

                    // Handle marker drag events
                    markerRef.current.on('dragend', (e: any) => {
                        const position = e.target.getLatLng();
                        onLocationSelect(position.lat, position.lng);

                        // Update circle position if it exists
                        if (circleRef.current) {
                            circleRef.current.setLatLng(position);
                        }
                    });
                }

                setIsMapReady(true);
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initializeMap();

        // Clean up function
        return () => {
            console.log('MapComponent unmounting, cleaning up...');
            cleanupMap();
        };
    }, [mapId]); // Only run on component mount/unmount

    // Update marker and view when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current && isMapReady) {
            const newLatLng = window.L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());

            // Update circle position if it exists
            if (circleRef.current) {
                circleRef.current.setLatLng(newLatLng);
            }
        }
    }, [latitude, longitude, isMapReady]);

    return (
        <div
            ref={mapContainerRef}
            className={`${className} map-container`}
            style={{
                width: '100%',
                height: '100%',
                cursor: disabled ? 'default' : 'pointer'
            }}
        />
    );
};

// Define Leaflet on the Window object for TypeScript
declare global {
    interface Window {
        L: any;
    }
}

export default MapComponent;
