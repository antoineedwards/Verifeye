"use client";

import { useState, useMemo, useEffect } from "react";
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
    // DEMO: email sign-up users won't have a NextAuth session yet — treat them as verified
    const [emailSignUpUser, setEmailSignUpUser] = useState<boolean | null>(null); // null = not yet checked

    useEffect(() => {
        if (typeof window !== "undefined") {
            const pendingId = localStorage.getItem("pendingUserId");
            setEmailSignUpUser(!!pendingId);
            // NOTE: We intentionally do NOT remove pendingUserId here.
            // React Strict Mode double-invokes effects in development — if we
            // removed the key on the first run, the second run would find it
            // missing, set emailSignUpUser=false, and trigger the redirect to "/".
        }
    }, []);

    // Move redirect into a useEffect so it never fires during render
    useEffect(() => {
        if (emailSignUpUser === null) return; // still checking localStorage
        if (status === "unauthenticated" && !emailSignUpUser) {
            router.push("/");
        }
    }, [status, emailSignUpUser, router]);

    const isVerified = useMemo(() => {
        if (manuallyVerified) return true;
        if (emailSignUpUser) return true;
        return !!(session?.user as SessionUser)?.address;
    }, [session, manuallyVerified, emailSignUpUser]);

    // Wait until we know whether this is an email sign-up user before rendering anything
    if (emailSignUpUser === null || (status === "loading" && !emailSignUpUser)) {
        return <div className="h-dvh w-full max-w-md mx-auto bg-background" />;
    }

    // If unauthenticated and not email sign-up, show nothing while redirecting
    if (status === "unauthenticated" && !emailSignUpUser) {
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