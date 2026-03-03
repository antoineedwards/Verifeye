import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertTriangle, Flame, ShieldAlert, PawPrint } from "lucide-react";

interface IncidentTypeSelectionProps {
    onSelect: (type: string) => void;
    onBack: () => void;
}

export function IncidentTypeSelection({ onSelect, onBack }: IncidentTypeSelectionProps) {
    const types = [
        {
            id: "crime",
            label: "Crime / Suspicious",
            icon: ShieldAlert,
            color: "bg-red-500",
            description: "Theft, assault, or suspicious behavior"
        },
        {
            id: "hazard",
            label: "Hazard / Damage",
            icon: AlertTriangle,
            color: "bg-orange-500",
            description: "Potholes, broken lights, or debris"
        },
        {
            id: "emergency",
            label: "Fire / Medical",
            icon: Flame,
            color: "bg-rose-600",
            description: "Smoke, fire, or medical emergencies"
        },
        {
            id: "missing_pet",
            label: "Missing Pet",
            icon: PawPrint,
            color: "bg-violet-500",
            description: "Lost or found pets in your area"
        }
    ];

    return (
        <div className="flex flex-col h-full p-6 bg-background">
            <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-4">
                ← Cancel
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <h2 className="text-2xl font-bold tracking-tight">What&apos;s happening?</h2>

                <div className="grid gap-4">
                    {types.map((type) => (
                        <motion.button
                            key={type.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(type.id)}
                            className={`flex items-center p-6 rounded-xl text-white shadow-lg ${type.color} text-left w-full`}
                        >
                            <type.icon className="h-10 w-10 mr-4 flex-shrink-0" />
                            <div>
                                <div className="font-bold text-lg">{type.label}</div>
                                <div className="text-white/80 text-sm">{type.description}</div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
