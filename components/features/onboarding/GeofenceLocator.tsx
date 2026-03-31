import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const US_STATES = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" }
];

interface GeofenceLocatorProps {
    onNext: () => void;
    onBack: () => void;
    onAddressReady: (address: string) => Promise<void> | void;
}

export function GeofenceLocator({ onNext, onBack, onAddressReady }: GeofenceLocatorProps) {
    const [formData, setFormData] = useState({
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
            const { line1, city, state, zip } = formData;
            // Only search if we have enough info to form a meaningful query
            if (line1.length > 3 && (city.length > 2 || zip.length > 4)) {
                setIsLoading(true);
                try {
                    // Exclude line2 from geocoding query
                    const query = `${line1}, ${city}, ${state} ${zip}`;
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
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
        }, 1500); // Debounce for 1.5 seconds

        return () => clearTimeout(timer);
    }, [formData.line1, formData.city, formData.state, formData.zip]); // Exclude line2 from dependency array

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = formData.line1 && formData.city && formData.state && formData.zip;

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

                <div className="space-y-4 flex-1 flex flex-col overflow-y-auto pr-1">
                    <div className="space-y-4">
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Address Line 1"
                                value={formData.line1}
                                onChange={(e) => handleChange("line1", e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Input
                            placeholder="Address Line 2 (Optional)"
                            value={formData.line2}
                            onChange={(e) => handleChange("line2", e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="City"
                                value={formData.city}
                                onChange={(e) => handleChange("city", e.target.value)}
                            />

                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.state}
                                onChange={(e) => handleChange("state", e.target.value)}
                            >
                                <option value="" disabled>Select State</option>
                                {US_STATES.map((state) => (
                                    <option key={state.value} value={state.value}>
                                        {state.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            placeholder="Zip Code"
                            value={formData.zip}
                            onChange={(e) => handleChange("zip", e.target.value)}
                        />
                    </div>

                    <div className="flex-1 min-h-[200px] mt-4 bg-muted rounded-md overflow-hidden border shadow-inner relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <Map center={mapCenter} zoom={14} />
                    </div>
                </div>

                <Button
                    disabled={!isFormValid || isLoading || isSaving}
                    className="w-full h-12 text-lg mt-4"
                    onClick={async () => {
                        // Build the full address string
                        const { line1, line2, city, state, zip } = formData;
                        const fullAddress = `${line1}${line2 ? `, ${line2}` : ""}, ${city}, ${state} ${zip}`;
                        // Await the address save BEFORE navigating away
                        setIsSaving(true);
                        try {
                            await onAddressReady(fullAddress);
                        } finally {
                            setIsSaving(false);
                        }
                        onNext();
                    }}
                >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
                </Button>
            </motion.div>
        </div>
    );
}
