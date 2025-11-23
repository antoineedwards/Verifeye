import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IncidentCardProps {
    id: string;
    type: string;
    description: string;
    location: string;
    time: string;
    status: "Unverified" | "In Progress" | "Verified";
    verifiedCount: number;
}

export function IncidentCard({ id, type, description, location, time, status: initialStatus, verifiedCount: initialCount }: IncidentCardProps) {
    const [status, setStatus] = useState(initialStatus);
    const [verifiedCount, setVerifiedCount] = useState(initialCount);
    const [hasVoted, setHasVoted] = useState(false);

    const handleVerify = () => {
        if (hasVoted) return;
        setStatus("Verified");
        setVerifiedCount(c => c + 1);
        setHasVoted(true);
        toast.success("Verified! +50 Points", {
            description: "New Badge: Community Watch",
            duration: 3000,
        });
    };

    const handleDispute = () => {
        if (hasVoted) return;
        setHasVoted(true);
        toast("Feedback Recorded", {
            description: "Thanks for keeping the map accurate.",
        });
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "Verified": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Unverified": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-blue-100 text-blue-700 border-blue-200";
        }
    };

    const getTypeStyles = (t: string) => {
        switch (t) {
            case "Crime": return {
                bg: "bg-gradient-to-br from-red-50 to-background",
                border: "border-red-200",
                iconBg: "bg-red-100",
                iconColor: "text-red-600"
            };
            case "Hazard": return {
                bg: "bg-gradient-to-br from-orange-50 to-background",
                border: "border-orange-200",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600"
            };
            default: return {
                bg: "bg-gradient-to-br from-blue-50 to-background",
                border: "border-blue-200",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600"
            };
        }
    };

    const styles = getTypeStyles(type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card border rounded-xl overflow-hidden shadow-sm ${styles.bg} ${styles.border}`}
        >
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shadow-sm ${styles.iconBg} ${styles.iconColor}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">{type}</h3>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {location}
                            </div>
                        </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                        {status}
                    </span>
                </div>

                <p className="text-sm">{description}</p>

                <div className="text-xs text-muted-foreground">
                    Posted {time} • Verified by {verifiedCount} neighbors
                </div>
            </div>

            {!hasVoted && status === "Unverified" && (
                <div className="grid grid-cols-2 border-t divide-x">
                    <Button
                        variant="ghost"
                        className="rounded-none h-12 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleVerify}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm
                    </Button>
                    <Button
                        variant="ghost"
                        className="rounded-none h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDispute}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dispute
                    </Button>
                </div>
            )}

            {hasVoted && (
                <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground border-t">
                    Thanks for your verification!
                </div>
            )}
        </motion.div>
    );
}
