import { ReportFAB } from "./ReportFAB";
import { IncidentCard } from "./IncidentCard";
import { motion } from "framer-motion";

interface HomeTabProps {
    onReport: () => void;
}

export function HomeTab({ onReport }: HomeTabProps) {
    const incidents = [
        {
            id: "1",
            type: "Hazard",
            description: "Large pothole in the middle of the intersection. Caused a flat tire.",
            location: "Main St & 4th Ave",
            time: "10m ago",
            status: "Unverified" as const,
            verifiedCount: 1
        },
        {
            id: "2",
            type: "Crime",
            description: "Suspicious individual checking car door handles.",
            location: "Oak Lane",
            time: "45m ago",
            status: "Verified" as const,
            verifiedCount: 5
        },
        {
            id: "3",
            type: "Hazard",
            description: "Street light out at the corner of Elm and Pine.",
            location: "Elm St & Pine Ave",
            time: "1h ago",
            status: "Unverified" as const,
            verifiedCount: 0
        },
        {
            id: "4",
            type: "Crime",
            description: "Package theft reported from porch.",
            location: "123 Cedar Dr",
            time: "2h ago",
            status: "Verified" as const,
            verifiedCount: 3
        }
    ];

    return (
        <div className="relative h-full bg-background flex flex-col">


            <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
                {incidents.map((incident) => (
                    <IncidentCard key={incident.id} {...incident} />
                ))}
            </div>

            <ReportFAB onClick={onReport} />
        </div>
    );
}
