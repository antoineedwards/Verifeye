"use client"; // Ensure this is a client component

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GoogleSignIn } from "@/components/auth/google-signin";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface WelcomeScreenProps {
    onNext: () => void;
}

export function WelcomeScreen({ onNext: _onNext }: WelcomeScreenProps) {
    const router = useRouter();

    const handleEmailSignUp = () => {
        // Bypass onboarding and push to the main app route
        // Replace "/dashboard" with whatever your main app route is (e.g., "/map" or "/home")
        router.push("/onboarding");
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
            >
                <div className="flex justify-center mb-4">
                    <Image src="/logo.png" alt="Verifeye Logo" width={200} height={200} className="object-contain" priority />
                </div>
                <p className="text-lg text-muted-foreground">
                    Connect with your verified neighbors. Build a safer community together.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full max-w-sm space-y-4"
            >
                <div className="space-y-2">
                    {/* ✅ Changed onClick to use handleEmailSignUp */}
                    <Button onClick={handleEmailSignUp} className="w-full h-12 text-lg font-medium">
                        Sign Up with Email
                    </Button>

                    <GoogleSignIn />

                    <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                        Already have an account? Log in
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

