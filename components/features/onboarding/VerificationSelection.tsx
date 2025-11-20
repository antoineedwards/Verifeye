import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Building2, GraduationCap } from "lucide-react";

interface VerificationSelectionProps {
    onSelectResidency: () => void;
    onSelectCampus: () => void;
    onBack: () => void;
}

export function VerificationSelection({ onSelectResidency, onSelectCampus, onBack }: VerificationSelectionProps) {
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
                    <h2 className="text-2xl font-bold tracking-tight">Verify your account</h2>
                    <p className="text-muted-foreground">
                        Choose how you&apos;d like to verify your connection to the neighborhood.
                    </p>
                </div>

                <div className="grid gap-4">
                    <Button
                        variant="outline"
                        className="h-auto p-6 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5"
                        onClick={onSelectResidency}
                    >
                        <Building2 className="h-8 w-8 text-primary" />
                        <div className="text-center">
                            <div className="font-semibold text-lg">Residential Address</div>
                            <div className="text-sm text-muted-foreground">
                                Verify with a photo of your mail or ID
                            </div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-auto p-6 flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5"
                        onClick={onSelectCampus}
                    >
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <div className="text-center">
                            <div className="font-semibold text-lg">Campus Email</div>
                            <div className="text-sm text-muted-foreground">
                                Verify with your .edu email address
                            </div>
                        </div>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
