import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface LocationConfirmationProps {
    onConfirm: (location: string, coordinates: { lat: number; lng: number }) => void;
    onBack: () => void;
}

export function LocationConfirmation({ onConfirm, onBack }: LocationConfirmationProps) {
    // Mock coordinates for Springfield
    const mockLocation = {
        address: "123 Main St, Springfield",
        coordinates: { lat: 39.7817, lng: -89.6501 }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Map Mock Background */}
            <div className="absolute inset-0 bg-slate-200 opacity-50" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-primary"
                >
                    <MapPin className="h-12 w-12 fill-current" />
                </motion.div>
            </div>

            <div className="absolute top-0 left-0 right-0 p-4 z-10">
                <Button variant="secondary" onClick={onBack} className="shadow-md">
                    ← Back
                </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-background rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 space-y-4">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Confirm Location</h3>
                    <p className="text-sm text-muted-foreground">
                        {mockLocation.address}
                    </p>
                </div>

                <Button
                    onClick={() => onConfirm(mockLocation.address, mockLocation.coordinates)}
                    className="w-full h-12 text-lg"
                >
                    Confirm Location
                </Button>
            </div>
        </div>
    );
}
