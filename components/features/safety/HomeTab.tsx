import { useState, useEffect } from "react";
import { ReportFAB } from "./ReportFAB";
import { IncidentCard } from "./IncidentCard";
import { getReports, Report } from "@/app/actions/reports";

interface HomeTabProps {
    onReport: () => void;
}

export function HomeTab({ onReport }: HomeTabProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            const data = await getReports();
            setReports(data);
            setLoading(false);
        };
        fetchReports();
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

    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

    return (
        <div className="relative h-full bg-background flex flex-col">
            <div className="flex-1 overflow-auto p-4 space-y-4 pb-24">
                {loading ? (
                    <div className="text-center p-4 text-muted-foreground">Loading reports...</div>
                ) : (
                    reports.map((report) => (
                        <IncidentCard
                            key={report.id}
                            id={report.id}
                            title={report.title}
                            type={capitalize(report.category || "General")}
                            description={report.description || ""}
                            location={report.location_address}
                            time={formatTime(report.created_at)}
                            status={report.status === 'resolved' ? "Resolved" : (report.status === 'verified' ? "Verified" : "Unverified")}
                            verifiedCount={report.verification_count}
                        />
                    ))
                )}
                {!loading && reports.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">No reports yet. Be the first to report!</div>
                )}
            </div>

            <ReportFAB onClick={onReport} />
        </div>
    );
}
