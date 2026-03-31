"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/features/onboarding/OnboardingFlow";
import { IncidentReportingFlow } from "@/components/features/safety/IncidentReportingFlow";

interface SessionUser {
    address?: string;
}

function OnboardingContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    // ?setup=true is appended by the signup/address page after the user saves
    // their address. It immediately grants access without waiting for the JWT
    // to refresh with the new address value.
    const [manuallyVerified, setManuallyVerified] = useState(
        searchParams.get("setup") === "true"
    );

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    const isVerified = useMemo(() => {
        if (manuallyVerified) return true;
        return !!(session?.user as SessionUser)?.address;
    }, [session, manuallyVerified]);

    if (status === "loading") {
        return <div className="h-dvh w-full max-w-md mx-auto bg-background" />;
    }

    if (status === "unauthenticated") {
        return null;
    }

    if (!isVerified) {
        return (
            <main className="min-h-dvh bg-background">
                <div className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
                    <OnboardingFlow
                        onComplete={() => setManuallyVerified(true)}
                        initialStep="geofence"
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh bg-background">
            <IncidentReportingFlow />
        </main>
    );
}

// useSearchParams() requires a Suspense boundary in Next.js
export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="h-dvh w-full max-w-md mx-auto bg-background" />}>
            <OnboardingContent />
        </Suspense>
    );
}