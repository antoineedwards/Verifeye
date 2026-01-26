import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { saveUserAddress } from "@/app/actions/user";

interface GeofenceLocatorProps {
    onNext: () => void;
    onBack: () => void;
}

export function GeofenceLocator({ onNext, onBack }: GeofenceLocatorProps) {
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [mapCenter, setMapCenter] = useState<[number, number]>([32.3668, -86.3000]);

    // Dynamically import the map component to avoid SSR issues
    const Map = useMemo(() => dynamic(
        () => import("@/components/ui/leaflet-map"),
        {
            loading: () => <div className="h-full w-full flex items-center justify-center bg-muted"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>,
            ssr: false
        }
    ), []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (address.length > 5) {
                setIsLoading(true);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timer);
    }, [address]);

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Back
            </Button>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col space-y-6"
            >
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Find your neighborhood</h2>
                    <p className="text-muted-foreground">
                        Enter your full street address to connect with your local community.
                    </p>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="123 Main St, City, State"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-9 pr-9 h-12"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-3">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-[200px] bg-muted rounded-md overflow-hidden border shadow-inner relative">
                        <Map center={mapCenter} zoom={14} />
                    </div>
                </div>

                <Button
                    disabled={!address}
                    className="w-full h-12 text-lg mt-4"
                    onClick={() => {
                        onNext();
                        saveUserAddress(address);
                    }}
                >
                    Continue
                </Button>
            </motion.div>
        </div>
    );
}
