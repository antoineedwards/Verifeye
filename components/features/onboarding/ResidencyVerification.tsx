import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Camera, CheckCircle2 } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";

export function ResidencyVerification({ onVerify, onBack }: ResidencyVerificationProps) {
    /*const [isCapturing, setIsCapturing] = useState(false);

    const handleCapture = () => {
        setIsCapturing(true);
        // Simulate processing delay
        setTimeout(() => {
            onVerify();
        }, 1500);
    };*/

    return (
        
        <DocumentUpload onVerify={onVerify} onBack={onBack} />
    );
}
