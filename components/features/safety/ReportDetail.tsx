"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    MessageSquare,
    MapPin,
    Clock,
    Shield,
    ShieldAlert,
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
    getReportById,
    addReportComment,
    getReportComments,
    voteOnReport,
    getUserVotes,
    ReportDetail as ReportDetailType,
    ReportComment,
} from "@/app/actions/reports";

interface ReportDetailProps {
    reportId: string;
    onBack: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    unverified: { bg: "bg-amber-100", text: "text-amber-700", label: "Unverified" },
    verified: { bg: "bg-green-100", text: "text-green-700", label: "Verified" },
    resolved: { bg: "bg-blue-100", text: "text-blue-700", label: "Resolved" },
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
    theft: { bg: "bg-red-100", text: "text-red-700" },
    suspicious: { bg: "bg-amber-100", text: "text-amber-700" },
    vandalism: { bg: "bg-orange-100", text: "text-orange-700" },
    safety: { bg: "bg-blue-100", text: "text-blue-700" },
    noise: { bg: "bg-purple-100", text: "text-purple-700" },
    missing_pet: { bg: "bg-violet-100", text: "text-violet-700" },
    other: { bg: "bg-gray-100", text: "text-gray-700" },
    general: { bg: "bg-gray-100", text: "text-gray-700" },
};

export function ReportDetail({ reportId, onBack }: ReportDetailProps) {
    const [report, setReport] = useState<ReportDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<ReportComment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [userVoteType, setUserVoteType] = useState<'confirm' | 'dispute' | null>(null);

    // Dynamically import map to avoid SSR issues
    const Map = useMemo(() => dynamic(
        () => import("@/components/ui/leaflet-map"),
        { loading: () => <div className="h-full w-full flex items-center justify-center bg-muted"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>, ssr: false }
    ), []);

    const getCircleColor = (category: string | null) => {
        const cat = (category || "").toLowerCase();
        if (cat.includes("theft") || cat.includes("crime") || cat.includes("suspicious")) return "#dc2626";
        if (cat.includes("hazard") || cat.includes("vandalism")) return "#ea580c";
        if (cat.includes("pet") || cat.includes("missing")) return "#7c3aed";
        return "#2563eb";
    };

    useEffect(() => {
        const fetchData = async () => {
            const [reportData, votesData] = await Promise.all([
                getReportById(reportId),
                getUserVotes(),
            ]);
            setReport(reportData);
            if (votesData[reportId]) {
                setHasVoted(true);
                setUserVoteType(votesData[reportId]);
            }
            setLoading(false);
        };
        fetchData();
    }, [reportId]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };


    const handleToggleComments = async () => {
        if (showComments) {
            setShowComments(false);
            setComments([]);
            return;
        }
        setShowComments(true);
        setLoadingComments(true);
        const data = await getReportComments(reportId);
        setComments(data);
        setLoadingComments(false);
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !report) return;
        setPostingComment(true);
        const result = await addReportComment(reportId, commentText.trim());
        if (result.success) {
            setCommentText("");
            const data = await getReportComments(reportId);
            setComments(data);
            setReport({ ...report, comment_count: report.comment_count + 1 });
        } else {
            toast.error(result.error || "Failed to add comment");
        }
        setPostingComment(false);
    };

    const handleVote = async (voteType: 'confirm' | 'dispute') => {
        if (hasVoted || !report) return;
        setHasVoted(true);
        setUserVoteType(voteType);
        if (voteType === 'confirm') {
            setReport({ ...report, report_count: report.report_count + 1 });
        }

        const result = await voteOnReport(reportId, voteType);
        if (result.success) {
            toast.success(
                voteType === 'confirm'
                    ? `Confirmed! +${result.pointsAwarded} Points`
                    : `Feedback recorded! +${result.pointsAwarded} Points`
            );
        } else {
            setHasVoted(false);
            setUserVoteType(null);
            if (voteType === 'confirm') {
                setReport({ ...report, report_count: report.report_count });
            }
            toast.error(result.error || "Failed to vote");
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background gap-3">
                <p className="text-muted-foreground">Report not found</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.unverified;
    const catKey = (report.category || "general").toLowerCase();
    const categoryStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.general;
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold truncate">Report Details</h1>
            </header>

            <div className="flex-1 overflow-auto">
                {/* Image */}
                {report.image_url && (
                    <div className="relative w-full aspect-video bg-muted overflow-hidden">
                        <Image
                            src={report.image_url}
                            alt={report.title || "Report image"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                )}

                <div className="p-4 space-y-4">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${categoryStyle.bg} ${categoryStyle.text}`}>
                            {capitalize(report.category || "General")}
                        </span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}>
                            {statusStyle.label}
                        </span>
                        {report.is_edited && (
                            <span className="text-[10px] italic text-muted-foreground/70">(edited)</span>
                        )}
                    </div>

                    {/* Title & Author */}
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{report.title}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {(report.author_name || "N")[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">{report.author_name || "Neighbor"}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {report.description && (
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{report.description}</p>
                    )}

                    {/* Meta: Location & Time */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{report.location_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{formatTime(report.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>Verified by {report.report_count || 0} neighbor{(report.report_count || 0) !== 1 ? "s" : ""}</span>
                        </div>
                    </div>

                    {/* Map with Circle Overlay */}
                    {report.latitude && report.longitude && (
                        <div className="rounded-xl overflow-hidden border shadow-sm h-[200px]">
                            <Map
                                center={[report.latitude, report.longitude]}
                                zoom={15}
                                showMarker={false}
                                circle={{
                                    center: [report.latitude, report.longitude],
                                    radius: 200,
                                    color: getCircleColor(report.category),
                                }}
                            />
                        </div>
                    )}

                    {/* Voting */}
                    <div className="border rounded-xl p-4 space-y-3 bg-card">
                        <p className="text-sm font-semibold">Is this report accurate?</p>
                        {hasVoted ? (
                            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${userVoteType === 'confirm'
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                                }`}>
                                {userVoteType === 'confirm' ? (
                                    <><CheckCircle2 className="h-4 w-4" /> You confirmed this report</>
                                ) : (
                                    <><XCircle className="h-4 w-4" /> You disputed this report</>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => handleVote('confirm')}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirm
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => handleVote('dispute')}
                                >
                                    <ShieldAlert className="h-4 w-4 mr-1.5" /> Dispute
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Comment Action */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${showComments
                                ? "text-blue-500 bg-blue-50"
                                : "text-muted-foreground hover:text-blue-500 bg-secondary/50 hover:bg-blue-50"
                                }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            {report.comment_count} {report.comment_count === 1 ? "Comment" : "Comments"}
                        </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                        {showComments && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-3 pb-4">
                                    {loadingComments ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
                                    ) : (
                                        comments.map((c) => (
                                            <div key={c.id} className="flex gap-2.5">
                                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 mt-0.5">
                                                    {(c.author_name || "N")[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 bg-secondary/40 rounded-lg px-3 py-2">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs font-semibold">{c.author_name || "Neighbor"}</span>
                                                        <span className="text-[10px] text-muted-foreground">{formatTime(c.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 mt-0.5">{c.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Comment Input */}
                                    <div className="flex gap-2 pt-2">
                                        <Input
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                            className="text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            disabled={!commentText.trim() || postingComment}
                                            onClick={handleAddComment}
                                            className="h-10 w-10 shrink-0"
                                        >
                                            {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
