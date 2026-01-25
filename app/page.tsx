"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Import to check auth state
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { IncidentReportingFlow } from "@/components/features/safety/IncidentReportingFlow";

export default function Home() {
  const { data: session, status } = useSession(); // Check if user is authenticated
  const [isVerified, setIsVerified] = useState(false);
  const [startStep, setStartStep] = useState<"welcome" | "geofence">(
    status === "authenticated" && session ? "geofence" : "welcome"
  );

  useEffect(() => {
    if (status === "authenticated" && session) {
      // If authenticated, start at geofence step
      setStartStep("geofence");
    }
  }, [status, session]);

  if (status === "loading") {
    return <div>Loading...</div>; // Optional loading state
  }

  if (!isVerified) {
    return (
      <main className="min-h-screen bg-background">
        <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
          <OnboardingFlow onComplete={() => setIsVerified(true)} initialStep={startStep} />
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