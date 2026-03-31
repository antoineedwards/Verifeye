"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { GeofenceLocator } from "@/components/features/onboarding/GeofenceLocator";
import { saveUserAddress } from "@/app/actions/user";

export default function SignUpAddressPage() {
    const { update } = useSession();
    const router = useRouter();

    const handleAddressReady = async (address: string) => {
        try {
            await saveUserAddress(address);
        } catch (err) {
            // Non-blocking — the user can still access the dashboard
            console.warn("Could not save address:", err);
        }
    };

    const handleComplete = async () => {
        // Attempt to refresh the JWT with the new address in the background.
        // We also pass ?setup=true so the onboarding page immediately grants
        // access regardless of whether the JWT update finishes in time.
        update(); // fire-and-forget — don't await
        window.location.href = "/onboarding?setup=true";
    };

    return (
        <main className="min-h-dvh bg-background">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl"
            >
                <GeofenceLocator
                    onNext={handleComplete}
                    onBack={() => router.push("/signup")}
                    onAddressReady={handleAddressReady}
                />
            </motion.div>
        </main>
    );
}
