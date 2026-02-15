"use client";

import { useState } from "react";
import { HomeTab } from "./HomeTab";
import { IncidentTypeSelection } from "./IncidentTypeSelection";
import { LocationConfirmation } from "./LocationConfirmation";
import { IncidentDetails } from "./IncidentDetails";
import { CommunityTab } from "@/components/features/community/CommunityTab";
import { CreatePost } from "@/components/features/community/CreatePost";
import { CommunityPostDetail } from "@/components/features/community/CommunityPostDetail";
import { ResourcesTab } from "@/components/features/resources/ResourcesTab";
import { ReportDetail } from "@/components/features/safety/ReportDetail";
import { BottomNav } from "@/components/ui/bottom-nav";
import { AppHeader } from "@/components/ui/app-header";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { createReport } from "@/app/actions/reports";

type ReportingStep = "home" | "type-selection" | "location" | "details" | "community" | "create-post" | "resources" | "report-detail" | "post-detail";

export function IncidentReportingFlow() {
    const [step, setStep] = useState<ReportingStep>("home");
    const [activeTab, setActiveTab] = useState<"home" | "community" | "resources">("home");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [incidentData, setIncidentData] = useState<{
        type?: string;
        location?: string;
        coordinates?: { lat: number; lng: number };
        title?: string;
        description?: string;
    }>({});

    const handleTabChange = (tab: "home" | "community" | "resources") => {
        setActiveTab(tab);
        setStep(tab);
    };

    const handleTypeSelect = (type: string) => {
        setIncidentData({ ...incidentData, type });
        setStep("location");
    };

    const handleLocationConfirm = (location: string, coordinates: { lat: number; lng: number }) => {
        setIncidentData({ ...incidentData, location, coordinates });
        setStep("details");
    };

    const handlePost = async (details: { title: string; description: string; image?: File }) => {
        if (isPosting) return;
        setIsPosting(true);

        const finalData = { ...incidentData, ...details };
        console.log("Posting incident:", finalData);

        try {
            let imageUrl: string | undefined;

            // Upload image if provided
            if (details.image) {
                toast.loading("Uploading image...", { id: "upload" });
                const formData = new FormData();
                formData.append("file", details.image);

                const uploadRes = await fetch("/api/upload-image", {
                    method: "POST",
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                toast.dismiss("upload");

                if (!uploadRes.ok) {
                    toast.error("Image upload failed", {
                        description: uploadData.error || "Please try again."
                    });
                    setIsPosting(false);
                    return;
                }

                imageUrl = uploadData.url;
            }

            const result = await createReport({
                title: finalData.title || "Untitled Report",
                description: finalData.description || "",
                category: finalData.type,
                location_address: finalData.location || "Unknown Location",
                latitude: finalData.coordinates?.lat,
                longitude: finalData.coordinates?.lng,
                image_url: imageUrl,
            });

            if (result.success) {
                setStep("home");
                setActiveTab("home");
                toast.success("Report Posted!", {
                    description: "Neighbors are now being alerted.",
                    duration: 4000,
                });
                setIncidentData({});
            } else {
                toast.error("Failed to post report", {
                    description: result.error || "Please try again."
                });
            }
        } catch (error) {
            console.error("Failed to post report:", error);
            toast.error("An error occurred");
        } finally {
            setIsPosting(false);
        }
    };

    const handleCommunityPost = () => {
        setStep("community");
    };

    // Determine if we should show the main header
    const showHeader = step === "home" || step === "community" || step === "resources";

    return (
        <div className="h-screen w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl flex flex-col">
            {showHeader && <AppHeader />}

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
                            <HomeTab
                                onReport={() => setStep("type-selection")}
                                onReportSelect={(id) => {
                                    setSelectedReportId(id);
                                    setStep("report-detail");
                                }}
                            />
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
                            <CommunityTab
                                onCreatePost={() => setStep("create-post")}
                                onPostSelect={(id) => {
                                    setSelectedPostId(id);
                                    setStep("post-detail");
                                }}
                            />
                        </motion.div>
                    )}

                    {step === "resources" && (
                        <motion.div
                            key="resources"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                        >
                            <ResourcesTab />
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

                    {step === "report-detail" && selectedReportId && (
                        <motion.div
                            key="report-detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <ReportDetail
                                reportId={selectedReportId}
                                onBack={() => {
                                    setSelectedReportId(null);
                                    setStep("home");
                                    setActiveTab("home");
                                }}
                            />
                        </motion.div>
                    )}

                    {step === "post-detail" && selectedPostId && (
                        <motion.div
                            key="post-detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full absolute inset-0 z-50 bg-background"
                        >
                            <CommunityPostDetail
                                postId={selectedPostId}
                                onBack={() => {
                                    setSelectedPostId(null);
                                    setStep("community");
                                    setActiveTab("community");
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {showHeader && (
                <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
            )}
        </div>
    );
}
