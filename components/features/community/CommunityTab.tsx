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
        }
    ]);

    return (
        <div className="relative h-full bg-background flex flex-col">
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-[var(--community-primary)]">Community</h1>
                <Button variant="ghost" size="icon" onClick={onCreatePost}>
                    <Plus className="h-6 w-6 text-[var(--community-primary)]" />
                </Button>
            </header>

            <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-lg p-4 shadow-sm space-y-3"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-block px-2 py-1 rounded-full bg-secondary text-xs font-medium mb-2">
                                    {post.type}
                                </span>
                                <h3 className="font-semibold text-lg">{post.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">{post.time}</span>
                        </div>

                        <p className="text-sm text-muted-foreground">{post.content}</p>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground font-mono">{post.author}</span>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                    <Heart className="h-4 w-4" /> {post.likes}
                                </button>
                                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                    <MessageSquare className="h-4 w-4" /> {post.comments}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
