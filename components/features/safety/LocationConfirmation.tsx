import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Loader2, LocateFixed } from "lucide-react";
import dynamic from "next/dynamic";
import { getUserProfile } from "@/app/actions/user";

interface LocationConfirmationProps {
    onConfirm: (location: string, coordinates: { lat: number; lng: number }) => void;
    onBack: () => void;
}

const DEFAULT_CENTER: [number, number] = [32.3668, -86.3000]; // Montgomery, AL fallback

export function LocationConfirmation({ onConfirm, onBack }: LocationConfirmationProps) {
    const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
    const [address, setAddress] = useState<string>("Tap the map to set location");
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Dynamically import map to avoid SSR issues (same pattern as GeofenceLocator)
    const Map = useMemo(() => dynamic(
        () => import("@/components/ui/leaflet-map"),
        {
            loading: () => (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ),
            ssr: false
        }
    ), []);

    // On mount: geocode the user's saved address to center the map there
    useEffect(() => {
        const initializeMap = async () => {
            try {
                const profile = await getUserProfile();
                if (profile?.address) {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.address)}`
                    );
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat);
                        const lng = parseFloat(data[0].lon);
                        setMapCenter([lat, lng]);
                        setPinPosition({ lat, lng });
                        setAddress(profile.address);
                    }
                }
            } catch (error) {
                console.error("Failed to geocode user address:", error);
            } finally {
                setIsInitializing(false);
            }
        };
        initializeMap();
    }, []);

    // Reverse geocode when pin moves
    const reverseGeocode = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
                // Shorten the address: take the first 3 comma-separated parts
                const parts = data.display_name.split(", ");
                setAddress(parts.slice(0, 3).join(", "));
            } else {
                setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        } catch {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const handleMapClick = (latlng: { lat: number; lng: number }) => {
        setPinPosition(latlng);
        reverseGeocode(latlng.lat, latlng.lng);
    };

    const handleUseCurrentGPS = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMapCenter([lat, lng]);
                setPinPosition({ lat, lng });
                reverseGeocode(lat, lng);
            },
            (error) => console.error("Geolocation error:", error)
        );
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Full-screen Map */}
            <div className="absolute inset-0">
                {isInitializing ? (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Map
                        center={mapCenter}
                        zoom={15}
                        interactive={true}
                        markerPosition={pinPosition ? [pinPosition.lat, pinPosition.lng] : undefined}
                        onLocationSelect={handleMapClick}
                    />
                )}
            </div>

            {/* Back button */}
            <div className="absolute top-4 left-4 z-[1000]">
                <Button variant="secondary" onClick={onBack} className="shadow-md">
                    ← Back
                </Button>
            </div>

            {/* GPS button */}
            <div className="absolute top-4 right-4 z-[1000]">
                <Button variant="secondary" size="icon" onClick={handleUseCurrentGPS} className="shadow-md">
                    <LocateFixed className="h-5 w-5" />
                </Button>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-background rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[1000] space-y-4"
            >
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Confirm Incident Location</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {isLoadingAddress ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Getting address...
                            </span>
                        ) : (
                            <span>{address}</span>
                        )}
                    </div>
                </div>

                <Button
                    onClick={() => {
                        if (pinPosition) {
                            onConfirm(address, { lat: pinPosition.lat, lng: pinPosition.lng });
                        }
                    }}
                    disabled={!pinPosition || isLoadingAddress}
                    className="w-full h-12 text-lg"
                >
                    Confirm Location
                </Button>
            </motion.div>
        </div>
    );
}
