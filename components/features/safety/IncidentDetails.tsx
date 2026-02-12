import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Camera, Mic, Image as ImageIcon } from "lucide-react";

interface IncidentDetailsProps {
    onPost: (details: { title: string; description: string }) => void;
    onBack: () => void;
}

export function IncidentDetails({ onPost, onBack }: IncidentDetailsProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Back
            </Button>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col space-y-6"
            >
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Add Details</h2>
                    <p className="text-muted-foreground">
                        Describe what happened. Photos and videos help verify your report.
                    </p>
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="Title (e.g., Pothole on Main St)"
                        className="text-lg h-12"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                        placeholder="Describe the incident..."
                        className="h-32 resize-none text-lg"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-24 flex-col gap-2">
                            <Camera className="h-6 w-6" />
                            <span className="text-xs">Photo</span>
                        </Button>
                        <Button variant="outline" className="flex-1 h-24 flex-col gap-2">
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-xs">Gallery</span>
                        </Button>
                        <Button variant="outline" className="flex-1 h-24 flex-col gap-2">
                            <Mic className="h-6 w-6" />
                            <span className="text-xs">Voice</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1" />

                <Button
                    onClick={() => onPost({ title, description })}
                    disabled={!title.trim() || !description.trim()}
                    className="w-full h-12 text-lg bg-urgency-high hover:bg-urgency-high/90 text-white"
                >
                    Post Report
                </Button>
            </motion.div>
        </div>
    );
}
