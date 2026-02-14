import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { createCommunityPost } from "@/app/actions/community";
import { toast } from "sonner";

interface CreatePostProps {
    onPost: () => void;
    onCancel: () => void;
}

export function CreatePost({ onPost, onCancel }: CreatePostProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("General");
    const [isPosting, setIsPosting] = useState(false);

    const types = ["Lost & Found", "Local Event", "Help/Request", "General"];

    const handlePublish = async () => {
        setIsPosting(true);
        try {
            const result = await createCommunityPost({ title, content, type });
            if (result.success) {
                toast.success("Posted to Community!", {
                    description: "+10 Community Points earned",
                    duration: 3000,
                });
                onPost();
            } else {
                toast.error(result.error || "Failed to publish post");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={onCancel} className="-ml-4">
                    Cancel
                </Button>
                <h2 className="font-semibold">New Post</h2>
                <Button
                    variant="ghost"
                    onClick={handlePublish}
                    disabled={!title || !content || isPosting}
                    className="text-primary font-semibold -mr-4"
                >
                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {types.map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${type === t
                                ? "bg-[var(--community-primary)] text-white"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-semibold border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    />

                    <Textarea
                        placeholder="What&apos;s on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[200px] resize-none border-none px-0 focus-visible:ring-0 text-base"
                    />
                </div>

                <div className="pt-4 border-t">
                    <Button variant="outline" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Add Photo
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
