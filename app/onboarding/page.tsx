"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { IncidentReportingFlow } from "@/components/features/safety/IncidentReportingFlow";
import { useRouter } from "next/navigation";

interface SessionUser {
    address?: string;
}

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [manuallyVerified, setManuallyVerified] = useState(false);

    const isVerified = useMemo(() => {
        if (manuallyVerified) return true;
        return !!(session?.user as SessionUser)?.address;
    }, [session, manuallyVerified]);

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
                        onComplete={() => setManuallyVerified(true)}
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