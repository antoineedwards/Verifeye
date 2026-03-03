"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShieldCheck, Phone, Eye, Users, Camera, Globe } from "lucide-react";

interface SafetyGuidelinesProps {
    onContinue: () => void;
    onBack: () => void;
}

const guidelines = [
    {
        icon: Phone,
        text: "If this is an emergency, dial 911",
        highlight: true,
    },
    {
        icon: ShieldCheck,
        text: "Never put yourself in harm's way to capture a photo or video.",
    },
    {
        icon: Eye,
        text: "Maintain a safe distance from any incident and avoid confrontation or \"vigilante\" behavior. Your safety is worth more than any report.",
    },
    {
        icon: Users,
        text: "Avoid reporting based on race, ethnicity, or perceived status; stick to objective facts.",
    },
    {
        icon: Camera,
        text: "Avoid capturing clear faces of bystanders or victims unless it is critical for documenting the hazard or event.",
    },
    {
        icon: Globe,
        text: "Always remember this is a public space and anyone may see your posts or comments.",
    },
];

export function SafetyGuidelines({ onContinue, onBack }: SafetyGuidelinesProps) {
    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Back
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col"
            >
                <div className="space-y-2 mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Safety Guidelines</h2>
                    <p className="text-muted-foreground text-sm">
                        Please review before submitting your report.
                    </p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {guidelines.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border ${item.highlight
                                    ? "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900"
                                    : "bg-secondary/50 border-border"
                                }`}
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${item.highlight
                                    ? "bg-red-100 dark:bg-red-900/50"
                                    : "bg-background"
                                }`}>
                                <item.icon className={`h-4 w-4 ${item.highlight
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-muted-foreground"
                                    }`} />
                            </div>
                            <p className={`text-sm leading-relaxed ${item.highlight
                                    ? "font-semibold text-red-700 dark:text-red-400"
                                    : "text-foreground/80"
                                }`}>
                                {item.text}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <Button
                    className="w-full h-12 text-lg mt-6"
                    onClick={onContinue}
                >
                    I Understand, Continue
                </Button>
            </motion.div>
        </div>
    );
}
