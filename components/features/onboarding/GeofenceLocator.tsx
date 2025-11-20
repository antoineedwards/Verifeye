import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface GeofenceLocatorProps {
    onNext: () => void;
    onBack: () => void;
}

export function GeofenceLocator({ onNext, onBack }: GeofenceLocatorProps) {
    const [address, setAddress] = useState("");

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

                <div className="space-y-4">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="123 Main St, City, State"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-9 h-12"
                        />
                    </div>

                    <div className="h-48 bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                        <p className="text-sm text-muted-foreground">Map View Mock</p>
                    </div>
                </div>

                <div className="flex-1" />

                <Button
                    onClick={onNext}
                    disabled={!address}
                    className="w-full h-12 text-lg"
                >
                    Continue
                </Button>
            </motion.div>
        </div>
    );
}
