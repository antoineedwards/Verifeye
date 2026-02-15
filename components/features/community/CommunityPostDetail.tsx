"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Heart,
    MessageSquare,
    MapPin,
    Send,
    Loader2,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
    getCommunityPostById,
    toggleLike,
    addComment,
    getComments,
    deleteCommunityPost,
    CommunityPost,
    Comment,
} from "@/app/actions/community";

interface CommunityPostDetailProps {
    postId: string;
    currentUserId?: string | null;
    onBack: () => void;
    onDelete?: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
    general: "General",
    lost_and_found: "Lost & Found",
    event: "Event",
    hazard: "Hazard",
    alert: "Alert",
};

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
    event: { bg: "bg-violet-100", text: "text-violet-700" },
    hazard: { bg: "bg-orange-100", text: "text-orange-700" },
    alert: { bg: "bg-red-100", text: "text-red-700" },
    lost_and_found: { bg: "bg-amber-100", text: "text-amber-700" },
    general: { bg: "bg-secondary", text: "text-secondary-foreground" },
};

export function CommunityPostDetail({ postId, currentUserId, onBack, onDelete }: CommunityPostDetailProps) {
    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const postData = await getCommunityPostById(postId);
            setPost(postData);
            setLoading(false);
        };
        fetchData();
    }, [postId]);

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

    const handleLike = async () => {
        if (!post) return;
        const wasLiked = post.liked_by_me;
        setPost({
            ...post,
            liked_by_me: !wasLiked,
            like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
        });

        const result = await toggleLike(postId);
        if (!result.success) {
            setPost({
                ...post,
                liked_by_me: wasLiked,
                like_count: post.like_count,
            });
            toast.error(result.error || "Failed to toggle like");
        }
    };

    const handleToggleComments = async () => {
        if (showComments) {
            setShowComments(false);
            setComments([]);
            return;
        }
        setShowComments(true);
        setLoadingComments(true);
        const data = await getComments(postId);
        setComments(data);
        setLoadingComments(false);
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !post) return;
        setPostingComment(true);
        const result = await addComment(postId, commentText.trim());
        if (result.success) {
            setCommentText("");
            const data = await getComments(postId);
            setComments(data);
            setPost({ ...post, comment_count: post.comment_count + 1 });
        } else {
            toast.error(result.error || "Failed to add comment");
        }
        setPostingComment(false);
    };

    const handleDelete = async () => {
        if (!confirm("Delete this post?")) return;
        const result = await deleteCommunityPost(postId);
        if (result.success) {
            toast.success("Post deleted");
            onDelete?.(postId);
            onBack();
        } else {
            toast.error(result.error || "Failed to delete");
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-background gap-3">
                <p className="text-muted-foreground">Post not found</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const isOwner = currentUserId === post.user_id;
    const isEvent = post.type === "event";
    const typeLabel = TYPE_LABELS[post.type] || post.type;
    const typeStyle = TYPE_STYLES[post.type] || TYPE_STYLES.general;

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold truncate">Post Details</h1>
                </div>
                {isOwner && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </header>

            <div className="flex-1 overflow-auto">
                {/* Image */}
                {post.image_url && (
                    <div className="relative w-full aspect-video bg-muted overflow-hidden">
                        <img
                            src={post.image_url}
                            alt={post.title || "Post image"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className={`p-4 space-y-4 ${isEvent ? "bg-violet-50/30" : ""}`}>
                    {/* Badge + Time */}
                    <div className="flex items-center justify-between">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeStyle.bg} ${typeStyle.text}`}>
                            {typeLabel}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-md border">
                            {formatTime(post.created_at)}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold leading-tight">{post.title}</h2>

                    {/* Author */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                            {(post.author_name || "N")[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">{post.author_name || "Neighbor"}</span>
                    </div>

                    {/* Content */}
                    {post.content && (
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    )}

                    {/* Location */}
                    {post.location_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{post.location_name}</span>
                        </div>
                    )}

                    {/* Like & Comment Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${post.liked_by_me
                                ? "text-pink-500 bg-pink-50"
                                : "text-muted-foreground hover:text-pink-500 bg-secondary/50 hover:bg-pink-50"
                                }`}
                        >
                            <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
                            {post.like_count} {post.like_count === 1 ? "Like" : "Likes"}
                        </button>
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${showComments
                                ? "text-blue-500 bg-blue-50"
                                : "text-muted-foreground hover:text-blue-500 bg-secondary/50 hover:bg-blue-50"
                                }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            {post.comment_count} {post.comment_count === 1 ? "Comment" : "Comments"}
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
