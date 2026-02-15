import { voteOnReport, deleteReport, updateReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IncidentCardProps {
    id: string;
    title?: string | null;
    type: string;
    description: string;
    location: string;
    time: string;
    status: "Unverified" | "In Progress" | "Verified" | "Resolved";
    verifiedCount: number;
    reportUserId: string;
    currentUserId?: string | null;
    imageUrl?: string | null;
    isEdited?: boolean;
    userVote?: 'confirm' | 'dispute' | null;
    onClick?: () => void;
    onDelete?: (id: string) => void;
}

export function IncidentCard({
    id,
    title: initialTitle,
    type,
    description: initialDescription,
    location,
    time,
    status: initialStatus,
    verifiedCount: initialCount,
    reportUserId,
    currentUserId,
    imageUrl,
    isEdited,
    userVote,
    onClick,
    onDelete
}: IncidentCardProps) {
    const [status, setStatus] = useState(initialStatus);
    const [verifiedCount, setVerifiedCount] = useState(initialCount);
    const [hasVoted, setHasVoted] = useState(!!userVote);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle || "");
    const [description, setDescription] = useState(initialDescription);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = currentUserId === reportUserId;

    const handleVerify = async () => {
        if (hasVoted) return;

        // Optimistic update
        setHasVoted(true);
        setVerifiedCount(c => c + 1);

        const result = await voteOnReport(id, 'confirm');
        if (result.success) {
            toast.success(`Confirmed! +${result.pointsAwarded} Points`);
        } else {
            // Rollback
            setHasVoted(false);
            setVerifiedCount(c => c - 1);
            toast.error(result.error || "Failed to verify report");
        }
    };

    const handleDispute = async () => {
        if (hasVoted) return;
        setHasVoted(true);

        const result = await voteOnReport(id, 'dispute');
        if (result.success) {
            toast.success(`Feedback recorded! +${result.pointsAwarded} Points`, {
                description: "Thanks for keeping the map accurate.",
            });
        } else {
            setHasVoted(false);
            toast.error(result.error || "Failed to record dispute");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this report?")) return;
        setIsDeleting(true);

        const result = await deleteReport(id);
        if (result.success) {
            toast.success("Report deleted");
            if (onDelete) onDelete(id);
        } else {
            toast.error(result.error || "Failed to delete");
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        const result = await updateReport(id, { title, description });
        if (result.success) {
            toast.success("Report updated");
            setIsEditing(false);
        } else {
            toast.error(result.error || "Failed to update");
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "Verified": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Resolved": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Unverified": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getTypeStyles = (t: string) => {
        const typeLower = t?.toLowerCase() || '';
        if (typeLower.includes("crime")) {
            return {
                bg: "bg-gradient-to-br from-red-50 to-background",
                border: "border-red-200",
                iconBg: "bg-red-100",
                iconColor: "text-red-600"
            };
        } else if (typeLower.includes("hazard")) {
            return {
                bg: "bg-gradient-to-br from-orange-50 to-background",
                border: "border-orange-200",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600"
            };
        } else {
            return {
                bg: "bg-gradient-to-br from-blue-50 to-background",
                border: "border-blue-200",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600"
            };
        }
    };

    const styles = getTypeStyles(type);

    if (isDeleting) return null; // Optimistic remove from view

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card border rounded-xl overflow-hidden shadow-sm ${styles.bg} ${styles.border} relative group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
                if (isEditing) return;
                onClick?.();
            }}
        >
            {isOwner && !isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/70 hover:bg-white shadow-sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/70 hover:bg-white hover:text-red-600 shadow-sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {imageUrl && (
                <div className="relative w-full h-40 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt="Report photo"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shadow-sm ${styles.iconBg} ${styles.iconColor}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-8 font-semibold text-base mb-1"
                                />
                            ) : (
                                <h3 className="font-semibold text-base">{title || type}</h3>
                            )}
                            <div className="flex items-center text-xs text-muted-foreground mr-8">
                                <MapPin className="h-3 w-3 mr-1" />
                                {location}
                            </div>
                        </div>
                    </div>
                    {!isEditing && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                            {status}
                        </span>
                    )}
                </div>

                {isEditing ? (
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-sm min-h-[80px]"
                    />
                ) : (
                    <p className="text-sm">{description}</p>
                )}

                <div className="text-xs text-muted-foreground">
                    Posted {time}{isEdited && <span className="italic text-muted-foreground/70"> (edited)</span>} • Verified by {verifiedCount} neighbors
                </div>

                {isEditing && (
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save Changes</Button>
                    </div>
                )}
            </div>

            {!hasVoted && status === "Unverified" && !isEditing && (
                <div className="grid grid-cols-2 border-t divide-x" onClick={(e) => e.stopPropagation()}>
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

            {hasVoted && !isEditing && (
                <div className="bg-muted/50 p-3 text-center text-xs text-muted-foreground border-t">
                    Thanks for your verification!
                </div>
            )}
        </motion.div>
    );
}
