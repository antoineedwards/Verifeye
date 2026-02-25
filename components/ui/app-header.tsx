"use client";

import { useState, useEffect } from "react";
import { ProfileMenu } from "@/components/features/profile/ProfileMenu";
import { MapPin } from "lucide-react";
import { getUserGeofenceName } from "@/app/actions/user";

export function AppHeader() {
    const [neighborhoodName, setNeighborhoodName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserGeofenceName()
            .then((name) => setNeighborhoodName(name))
            .catch(() => setNeighborhoodName(null))
            .finally(() => setLoading(false));
    }, []);

    const displayName = neighborhoodName
        ? `${neighborhoodName}, Montgomery AL`
        : "Montgomery, AL";

    return (
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-1 text-primary">
                    <MapPin className="h-3 w-3" />
                    {loading ? (
                        <span className="text-sm font-extrabold uppercase tracking-wider animate-pulse bg-muted rounded w-40 h-4 inline-block" />
                    ) : (
                        <span className="text-sm font-extrabold uppercase tracking-wider">{displayName}</span>
                    )}
                </div>
            </div>
            <ProfileMenu />
        </header>
    );
}
