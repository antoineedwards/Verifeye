"use client";

import { useState } from "react";
import { HomeTab } from "./HomeTab";
import { IncidentTypeSelection } from "./IncidentTypeSelection";
import { LocationConfirmation } from "./LocationConfirmation";
import { IncidentDetails } from "./IncidentDetails";
import { CommunityTab } from "@/components/features/community/CommunityTab";
import { CreatePost } from "@/components/features/community/CreatePost";
import { BottomNav } from "@/components/ui/bottom-nav";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

type ReportingStep = "home" | "type-selection" | "location" | "details" | "community" | "create-post";

export function IncidentReportingFlow() {
    const [step, setStep] = useState<ReportingStep>("home");
    const [activeTab, setActiveTab] = useState<"home" | "community">("home");
    const [incidentData, setIncidentData] = useState<Record<string, string>>({});

    const handleTabChange = (tab: "home" | "community") => {
        setActiveTab(tab);
        setStep(tab);
    };

    const handleTypeSelect = (type: string) => {
        setIncidentData({ ...incidentData, type });
        setStep("location");
    };

    const handleLocationConfirm = () => {
        setStep("details");
    };

    const handlePost = (details: { description: string }) => {
        console.log("Posting incident:", { ...incidentData, ...details });
        setStep("home");
        setActiveTab("home");
        toast.success("Report Posted!", {
            description: "Neighbors are now being alerted.",
            duration: 4000,
        });
    };

    const handleCommunityPost = (post: { title: string; content: string; type: string }) => {
        console.log("Posting to community:", post);
        setStep("community");
        toast.success("Posted to Community!", {
            description: "+10 Community Points earned",
            duration: 3000,
        });
    };

    return (
        <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === "home" && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                        >
                            <HomeTab onReport={() => setStep("type-selection")} />
                        </motion.div>
                    )}

                    {step === "community" && (
                        <motion.div
                            key="community"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                        >
                            <CommunityTab onCreatePost={() => setStep("create-post")} />
                        </motion.div>
                    )}

                    {step === "type-selection" && (
                        <motion.div
                            key="type-selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <IncidentTypeSelection
                                onSelect={handleTypeSelect}
                                onBack={() => setStep("home")}
                            />
                        </motion.div>
                    )}

                    {step === "location" && (
                        <motion.div
                            key="location"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <LocationConfirmation
                                onConfirm={handleLocationConfirm}
                                onBack={() => setStep("type-selection")}
                            />
                        </motion.div>
                    )}

                    {step === "details" && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <IncidentDetails
                                onPost={handlePost}
                                onBack={() => setStep("location")}
                            />
                        </motion.div>
                    )}

                    {step === "create-post" && (
                        <motion.div
                            key="create-post"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <CreatePost
                                onPost={handleCommunityPost}
                                onCancel={() => setStep("community")}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {(step === "home" || step === "community") && (
                <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
            )}
        </div>
    );
}
