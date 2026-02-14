import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, Image as ImageIcon, X } from "lucide-react";

interface IncidentDetailsProps {
    onPost: (details: { title: string; description: string; image?: File }) => void;
    onBack: () => void;
}

export function IncidentDetails({ onPost, onBack }: IncidentDetailsProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File | undefined) => {
        if (!file) return;

        // Validate type
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
        if (!allowed.includes(file.type)) return;

        // Validate size (10MB)
        if (file.size > 10 * 1024 * 1024) return;

        setImageFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        if (galleryInputRef.current) galleryInputRef.current.value = "";
    };

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Back
            </Button>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col space-y-6 overflow-auto"
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

                    {/* Hidden file inputs */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2"
                            onClick={() => cameraInputRef.current?.click()}
                        >
                            <Camera className="h-6 w-6" />
                            <span className="text-xs">Photo</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-24 flex-col gap-2"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-xs">Gallery</span>
                        </Button>
                        <Button variant="outline" className="flex-1 h-24 flex-col gap-2">
                            <Mic className="h-6 w-6" />
                            <span className="text-xs">Voice</span>
                        </Button>
                    </div>

                    {/* Image Preview */}
                    <AnimatePresence>
                        {imagePreview && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative rounded-xl overflow-hidden border border-border"
                            >
                                <img
                                    src={imagePreview}
                                    alt="Selected photo"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                                    {imageFile?.name}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1" />

                <Button
                    onClick={() => onPost({ title, description, image: imageFile || undefined })}
                    disabled={!title.trim() || !description.trim()}
                    className="w-full h-12 text-lg bg-urgency-high hover:bg-urgency-high/90 text-white"
                >
                    Post Report
                </Button>
            </motion.div>
        </div>
    );
}
