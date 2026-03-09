"use client";

import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { GeofenceLocator } from "./GeofenceLocator";
import { VerificationSelection } from "./VerificationSelection";
import { ResidencyVerification } from "./ResidencyVerification";
import { CampusVerification } from "./CampusVerification";
import { DocumentUpload } from "./DocumentUpload";
import { VerificationSuccess } from "./VerificationSuccess";
import { AnimatePresence, motion } from "framer-motion";

type OnboardingStep =
    | "welcome"
    | "geofence"
    | "document-upload"
    | "selection"
    | "residency"
    | "campus"
    | "success";

interface OnboardingFlowProps {
    onComplete: () => void;
    initialStep?: "welcome" | "geofence"; // Ensure this matches your step types

}

export function OnboardingFlow({ onComplete, initialStep }: OnboardingFlowProps) {
    const [step, setStep] = useState<OnboardingStep>(initialStep || "welcome");
    const [pendingAddress, setPendingAddress] = useState<string | null>(null);

    const nextStep = (next: OnboardingStep) => setStep(next);

    return (
        <div className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full"
                >
                    {step === "welcome" && (
                        <WelcomeScreen onNext={() => nextStep("geofence")} />
                    )}
                    {step === "geofence" && (
                        <GeofenceLocator
                            onNext={onComplete} // DEMO: bypass doc-upload, go straight to dashboard
                            onBack={() => nextStep("welcome")}
                            onAddressReady={(address) => setPendingAddress(address)}
                        />
                    )}
                    {step === "document-upload" && pendingAddress && (
                        <DocumentUpload
                            onVerify={() => nextStep("success")}
                            onBack={() => nextStep("geofence")}
                            address={pendingAddress}
                        />
                    )}
                    {step === "selection" && (
                        <VerificationSelection
                            onSelectResidency={() => nextStep("residency")}
                            onSelectCampus={() => nextStep("campus")}
                            onBack={() => nextStep("document-upload")}
                        />
                    )}
                    {step === "residency" && (
                        <ResidencyVerification
                            onVerify={() => nextStep("success")}
                            onBack={() => nextStep("selection")}
                        />
                    )}
                    {step === "campus" && (
                        <CampusVerification
                            onVerify={() => nextStep("success")}
                            onBack={() => nextStep("selection")}
                        />
                    )}
                    {step === "success" && (
                        <VerificationSuccess onComplete={onComplete} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
