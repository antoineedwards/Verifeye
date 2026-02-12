"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon
// @ts-expect-error leaflet icon workaround
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
    markerPosition?: [number, number];
    onLocationSelect?: (latlng: { lat: number; lng: number }) => void;
    interactive?: boolean;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

function ClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: { lat: number; lng: number }) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function LeafletMap({
    center = [32.3668, -86.3000],
    zoom = 13,
    className,
    markerPosition,
    onLocationSelect,
    interactive = false
}: LeafletMapProps) {
    const marker = markerPosition || center;

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={interactive}
            className={className}
            style={{ height: "100%", width: "100%" }}
        >
            <ChangeView center={center} zoom={zoom} />
            {onLocationSelect && <ClickHandler onLocationSelect={onLocationSelect} />}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={marker}>
                <Popup>
                    {interactive ? "Incident location" : "Your neighborhood"}
                </Popup>
            </Marker>
        </MapContainer>
    );
}
