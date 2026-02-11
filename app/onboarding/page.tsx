"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { IncidentReportingFlow } from "@/components/features/safety/IncidentReportingFlow";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    // If the user already has an address, they are considered "verified" (or at least onboarded enough to skip geofence)
    const [isVerified, setIsVerified] = useState(() => {
        return !!(session?.user as any)?.address;
    });

    // Update isVerified if session loads later
    if (status === "authenticated" && !isVerified && (session?.user as any)?.address) {
        setIsVerified(true);
    }

    // Redirect to home if not authenticated
    if (status === "unauthenticated") {
        router.push("/");
        return null;
    }

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (!isVerified) {
        return (
            <main className="min-h-screen bg-background">
                <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
                    <OnboardingFlow
                        onComplete={() => setIsVerified(true)}
                        initialStep="geofence"
                    />
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