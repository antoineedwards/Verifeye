"use client";

import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { GeofenceLocator } from "./GeofenceLocator";
import { VerificationSelection } from "./VerificationSelection";
import { ResidencyVerification } from "./ResidencyVerification";
import { CampusVerification } from "./CampusVerification";
import { VerificationSuccess } from "./VerificationSuccess";
import { AnimatePresence, motion } from "framer-motion";

type OnboardingStep =
    | "welcome"
    | "geofence"
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

    const nextStep = (next: OnboardingStep) => setStep(next);

    return (
        <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
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
                            onNext={() => nextStep("selection")}
                            onBack={() => nextStep("welcome")}
                        />
                    )}
                    {step === "selection" && (
                        <VerificationSelection
                            onSelectResidency={() => nextStep("residency")}
                            onSelectCampus={() => nextStep("campus")}
                            onBack={() => nextStep("geofence")}
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
