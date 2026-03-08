"use client";

import { ProfileMenu } from "@/components/features/profile/ProfileMenu";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { getNeighborhoodLabel } from "@/app/actions/user";

export function AppHeader() {
    const [neighborhood, setNeighborhood] = useState<string>("Your Neighborhood");

    useEffect(() => {
        getNeighborhoodLabel().then(setNeighborhood);
    }, []);

    return (
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-1 text-primary">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm font-extrabold uppercase tracking-wider">{neighborhood}</span>
                </div>
            </div>
            <ProfileMenu />
        </header>
    );
}
