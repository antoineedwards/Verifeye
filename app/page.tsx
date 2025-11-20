"use client";

import { useState } from "react";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { IncidentReportingFlow } from "@/components/features/safety/IncidentReportingFlow";

export default function Home() {
  // In a real app, we would check auth state here
  const [isVerified, setIsVerified] = useState(false);

  if (!isVerified) {
    return (
      <main className="min-h-screen bg-background">
        <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
          {/* 
            We need to pass a callback to OnboardingFlow to know when it's done.
            However, the current OnboardingFlow implementation doesn't expose a top-level completion prop 
            that switches the state *outside* of itself easily without modifying it.
            
            Let's modify OnboardingFlow to accept an onComplete prop or just handle the 'success' step 
            by calling a parent function.
            
            Wait, OnboardingFlow's VerificationSuccess component calls onComplete.
            We need to wire that up.
          */}
          <OnboardingFlow onComplete={() => setIsVerified(true)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <IncidentReportingFlow />
    </main>
  );
}
