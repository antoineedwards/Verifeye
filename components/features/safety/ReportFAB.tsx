import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ReportFABProps {
    onClick: () => void;
}

export function ReportFAB({ onClick }: ReportFABProps) {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-20 right-6 z-50"
        >
            <Button
                onClick={onClick}
                size="icon"
                className="h-16 w-16 rounded-full bg-urgency-high hover:bg-urgency-high/90 shadow-lg"
            >
                <AlertTriangle className="h-8 w-8 text-white" />
            </Button>
        </motion.div>
    );
}
