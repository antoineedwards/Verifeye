import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Heart, Trash2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import {
    getCommunityPosts,
    deleteCommunityPost,
    toggleLike,
    addComment,
    getComments,
    CommunityPost,
    Comment
} from "@/app/actions/community";
import { getUserProfile } from "@/app/actions/user";

interface CommunityTabProps {
    onCreatePost: () => void;
}

const TYPE_LABELS: Record<string, string> = {
    general: "General",
    lost_and_found: "Lost & Found",
    event: "Event",
    hazard: "Hazard",
    alert: "Alert",
};

export function CommunityTab({ onCreatePost }: CommunityTabProps) {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [expandedComments, setExpandedComments] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [postsData, userData] = await Promise.all([
                getCommunityPosts(),
                getUserProfile()
            ]);
            setPosts(postsData);
            if (userData) setCurrentUserId(userData.id);
            setLoading(false);
        };
        fetchData();
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const handleLike = async (postId: string) => {
        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const liked = !p.liked_by_me;
            return {
                ...p,
                liked_by_me: liked,
                like_count: liked ? p.like_count + 1 : p.like_count - 1
            };
        }));

        const result = await toggleLike(postId);
        if (!result.success) {
            // Revert on failure
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                return {
                    ...p,
                    liked_by_me: !p.liked_by_me,
                    like_count: p.liked_by_me ? p.like_count + 1 : p.like_count - 1
                };
            }));
            toast.error(result.error || "Failed to toggle like");
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Delete this post?")) return;
        const result = await deleteCommunityPost(postId);
        if (result.success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            toast.success("Post deleted");
        } else {
            toast.error(result.error || "Failed to delete");
        }
    };

    const handleToggleComments = async (postId: string) => {
        if (expandedComments === postId) {
            setExpandedComments(null);
            setComments([]);
            return;
        }
        setExpandedComments(postId);
        setLoadingComments(true);
        const data = await getComments(postId);
        setComments(data);
        setLoadingComments(false);
    };

    const handleAddComment = async (postId: string) => {
        if (!commentText.trim()) return;
        setPostingComment(true);
        const result = await addComment(postId, commentText.trim());
        if (result.success) {
            setCommentText("");
            // Refresh comments
            const data = await getComments(postId);
            setComments(data);
            // Update comment count
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
            ));
        } else {
            toast.error(result.error || "Failed to add comment");
        }
        setPostingComment(false);
    };

    return (
        <div className="relative h-full bg-background flex flex-col">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Community</h1>
                    <p className="text-xs text-muted-foreground font-medium">Connect with your neighbors</p>
                </div>
                <Button size="icon" onClick={onCreatePost} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-0 shadow-md">
                    <Plus className="h-5 w-5 text-white" />
                </Button>
            </header>

            <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">No posts yet. Start the conversation!</div>
                ) : (
                    posts.map((post) => {
                        const isEvent = post.type === "event";
                        const isOwner = currentUserId === post.user_id;
                        const typeLabel = TYPE_LABELS[post.type] || post.type;
                        return (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-card border rounded-xl p-4 shadow-sm relative overflow-hidden ${isEvent ? "border-violet-200 bg-violet-50/30" : "border-border"}`}
                            >
                                {isEvent && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 ${isEvent
                                            ? "bg-violet-100 text-violet-700"
                                            : "bg-secondary text-secondary-foreground"
                                            }`}>
                                            {typeLabel}
                                        </span>
                                        <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-md border">{formatTime(post.created_at)}</span>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{post.content}</p>

                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {(post.author_name || "N")[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">{post.author_name || "Neighbor"}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-md ${post.liked_by_me
                                                    ? "text-pink-500 bg-pink-50"
                                                    : "text-muted-foreground hover:text-pink-500 bg-secondary/50 hover:bg-pink-50"
                                                }`}
                                        >
                                            <Heart className={`h-3.5 w-3.5 ${post.liked_by_me ? "fill-current" : ""}`} /> {post.like_count}
                                        </button>
                                        <button
                                            onClick={() => handleToggleComments(post.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-md ${expandedComments === post.id
                                                    ? "text-blue-500 bg-blue-50"
                                                    : "text-muted-foreground hover:text-blue-500 bg-secondary/50 hover:bg-blue-50"
                                                }`}
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" /> {post.comment_count}
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {expandedComments === post.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                                                {loadingComments ? (
                                                    <div className="flex justify-center py-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : comments.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
                                                ) : (
                                                    comments.map((c) => (
                                                        <div key={c.id} className="flex gap-2">
                                                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0 mt-0.5">
                                                                {(c.author_name || "N")[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-semibold">{c.author_name || "Neighbor"}</span>
                                                                <p className="text-xs text-muted-foreground">{c.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Write a comment..."
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleAddComment(post.id);
                                                            }
                                                        }}
                                                        className="h-8 text-xs"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        disabled={!commentText.trim() || postingComment}
                                                        onClick={() => handleAddComment(post.id)}
                                                        className="h-8 w-8 shrink-0"
                                                    >
                                                        {postingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
