// components/farm/MapComponent.tsx
'use client'

import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number) => void;
    disabled?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
    latitude,
    longitude,
    onLocationSelect,
    disabled = false
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const customIconRef = useRef<any>(null);

    useEffect(() => {
        // Initialize the map only once
        if (!mapInstanceRef.current && mapContainerRef.current) {
            // Load Leaflet from CDN if it's not already loaded
            if (!window.L) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);

                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.async = true;
                script.onload = initializeMap;
                document.head.appendChild(script);
            } else {
                initializeMap();
            }
        }

        return () => {
            // Clean up map when component unmounts
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update marker when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            const newLatLng = window.L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());
        }
    }, [latitude, longitude]);

    const initializeMap = () => {
        if (!mapContainerRef.current || !window.L) return;

        // Create map instance
        mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([latitude, longitude], 10);

        // Add OpenStreetMap tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);

        // Fix Leaflet's default icon path issues
        window.L.Icon.Default.imagePath = '/';

        // Create custom icon using marker from public directory
        customIconRef.current = window.L.icon({
            iconUrl: '/images/icons/marker-icon.png',
            iconRetinaUrl: 'images/icons/marker-icon-2x.png',
            shadowUrl: 'images/icons/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Add a marker at the initial position with custom icon
        markerRef.current = window.L.marker([latitude, longitude], {
            draggable: !disabled,
            icon: customIconRef.current
        }).addTo(mapInstanceRef.current);

        // Handle map click events
        if (!disabled) {
            mapInstanceRef.current.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                markerRef.current.setLatLng(e.latlng);
                onLocationSelect(lat, lng);
            });

            // Handle marker drag events
            markerRef.current.on('dragend', (e: any) => {
                const position = e.target.getLatLng();
                onLocationSelect(position.lat, position.lng);
            });
        }
    };

    return (
        <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '300px' }}
            className={disabled ? 'cursor-default' : 'cursor-pointer'}
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
