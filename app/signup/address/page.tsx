"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GeofenceLocator } from "@/components/features/onboarding/GeofenceLocator";
import { saveUserAddressById } from "@/app/actions/user";

export default function SignUpAddressPage() {
    const router = useRouter();

    const handleAddressReady = async (address: string) => {
        try {
            const userId = localStorage.getItem("pendingUserId");
            if (userId) {
                await saveUserAddressById(userId, address);
            }
        } catch (err) {
            // Non-blocking — the user can still access the dashboard
            console.warn("Could not save address:", err);
        }
    };

    const handleComplete = () => {
        // Navigate first — onboarding page reads pendingUserId on mount,
        // so we must NOT clear it here. The onboarding page will clean it up.
        router.push("/onboarding");
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
