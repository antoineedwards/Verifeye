import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface VerificationSuccessProps {
    onComplete: () => void;
}

export function VerificationSuccess({ onComplete }: VerificationSuccessProps) {
    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }, []);

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-8 bg-background">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
            >
                <CheckCircle2 className="h-24 w-24 text-green-500" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
            >
                <h2 className="text-3xl font-bold tracking-tight">You&apos;re Verified!</h2>
                <p className="text-lg text-muted-foreground">
                    Welcome to the neighborhood. You can now access local reports and alerts.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-sm"
            >
                <Button onClick={onComplete} className="w-full h-12 text-lg">
                    Enter Verifeye
                </Button>
            </motion.div>
        </div>
    );
}
