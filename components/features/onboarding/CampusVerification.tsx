import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

interface CampusVerificationProps {
    onVerify: () => void;
    onBack: () => void;
}

export function CampusVerification({ onVerify, onBack }: CampusVerificationProps) {
    const [email, setEmail] = useState("");

    const handleSend = () => {
        // Simulate API call
        onVerify();
    };

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Back
            </Button>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col space-y-6"
            >
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Campus Verification</h2>
                    <p className="text-muted-foreground">
                        Enter your university email address to receive a verification link.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="email"
                            placeholder="student@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-9 h-12"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        We&apos;ll send a magic link to this address. You must have access to this email to continue.
                    </p>
                </div>

                <div className="flex-1" />

                <Button
                    onClick={handleSend}
                    disabled={!email || !email.includes("@")}
                    className="w-full h-12 text-lg"
                >
                    Send Verification Link
                </Button>
            </motion.div>
        </div>
    );
}
