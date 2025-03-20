"use client";

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoLocation } from '@/types/farm';

interface MapComponentProps {
    location: GeoLocation;
    onLocationChange: (location: GeoLocation) => void;
}

// Component to handle map clicks and update location
function LocationMarker({
    position,
    setPosition
}: {
    position: GeoLocation;
    setPosition: (pos: GeoLocation) => void;
}) {
    const map = useMapEvents({
        click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPos);
        },
    });

    return <Marker position={[position.lat, position.lng]} />;
}

export default function MapComponent({ location, onLocationChange }: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);

    // Fix Leaflet icon issue - only runs on client
    useEffect(() => {
        // Fix for Leaflet marker icons in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/images/icons/marker-icon-2x.png',
            iconUrl: '/images/icons/marker-icon.png',
            shadowUrl: '/images/icons/marker-shadow.png',
        });

        // Center map when location changes from external sources
        if (mapRef.current) {
            mapRef.current.setView([location.lat, location.lng], 10);
        }
    }, [location.lat, location.lng]);

    return (
        <div className="h-64 rounded-md overflow-hidden border border-gray-300">
            <MapContainer
                center={[location.lat, location.lng]}
                zoom={10}
                className="h-full w-full"
                whenCreated={(map) => {
                    mapRef.current = map;
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={location}
                    setPosition={onLocationChange}
                />
            </MapContainer>
        </div>
    );
}
