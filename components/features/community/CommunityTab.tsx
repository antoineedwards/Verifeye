import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, MessageSquare, Heart } from "lucide-react";

interface CommunityTabProps {
    onCreatePost: () => void;
}

export function CommunityTab({ onCreatePost }: CommunityTabProps) {
    const [posts] = useState([
        {
            id: 1,
            title: "Lost Cat - 'Mittens'",
            type: "Lost & Found",
            content: "Has anyone seen my orange tabby cat? Last seen near Maple St.",
            author: "Neighbor #4291",
            likes: 12,
            comments: 3,
            time: "2h ago"
        },
        {
            id: 2,
            title: "Block Party this Saturday!",
            type: "Event",
            content: "Join us for the annual summer block party. Potluck style!",
            author: "Neighbor #8821",
            likes: 24,
            comments: 8,
            time: "5h ago"
        },
        {
            id: 3,
            title: "Gardening Tools to Share",
            type: "General",
            content: "I have a lawn mower and hedge trimmer available for anyone to borrow this weekend.",
            author: "Neighbor #1024",
            likes: 15,
            comments: 2,
            time: "1d ago"
        },
        {
            id: 4,
            title: "Book Club Meeting",
            type: "Event",
            content: "Next meeting is at the community center. We're discussing 'The Great Gatsby'.",
            author: "Neighbor #5567",
            likes: 18,
            comments: 5,
            time: "2d ago"
        },
        {
            id: 5,
            title: "Found Keys",
            type: "Lost & Found",
            content: "Found a set of keys near the park entrance. Turned them into the management office.",
            author: "Neighbor #3342",
            likes: 8,
            comments: 1,
            time: "3d ago"
        }
    ]);

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
                {posts.map((post) => {
                    const isEvent = post.type === "Event";
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
                                        {post.type}
                                    </span>
                                    <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-md border">{post.time}</span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{post.content}</p>

                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {post.author.split('#')[1].substring(0, 2)}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{post.author}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-pink-500 transition-colors bg-secondary/50 px-2 py-1 rounded-md hover:bg-pink-50">
                                        <Heart className="h-3.5 w-3.5" /> {post.likes}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-500 transition-colors bg-secondary/50 px-2 py-1 rounded-md hover:bg-blue-50">
                                        <MessageSquare className="h-3.5 w-3.5" /> {post.comments}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
