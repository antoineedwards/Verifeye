import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface ResidencyVerificationProps {
    onVerify: () => void;
    onBack: () => void;
}

export function ResidencyVerification({ onVerify, onBack }: ResidencyVerificationProps) {
    const [isCapturing, setIsCapturing] = useState(false);

    const handleCapture = () => {
        setIsCapturing(true);
        // Simulate processing delay
        setTimeout(() => {
            onVerify();
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <div className="p-6 pb-0">
                <Button variant="ghost" onClick={onBack} className="text-white hover:text-white/80 hover:bg-white/10 -ml-4">
                    ← Back
                </Button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold">Scan Proof of Residency</h2>
                    <p className="text-sm text-white/70">
                        Align your document within the frame. Ensure your name and address are visible.
                    </p>
                </div>

                <div className="relative w-full aspect-[3/4] max-w-xs bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                    {/* Camera View Mock */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-white/20" />
                    </div>

                    {/* Guide Frame */}
                    <div className="absolute inset-8 border-2 border-primary rounded-lg opacity-50" />

                    {/* Scanning Animation */}
                    {isCapturing && (
                        <motion.div
                            className="absolute inset-0 bg-primary/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </div>

                <Button
                    size="lg"
                    className="w-full max-w-xs rounded-full h-16 text-lg"
                    onClick={handleCapture}
                    disabled={isCapturing}
                >
                    {isCapturing ? "Verifying..." : "Take Photo & Verify"}
                </Button>
            </div>
        </div>
    );
}
