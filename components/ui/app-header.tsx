"use client";

import { ProfileMenu } from "@/components/features/profile/ProfileMenu";
import { MapPin } from "lucide-react";

interface AppHeaderProps {
    title?: string;
}

export function AppHeader({ title = "Verifeye" }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-1 text-primary">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm font-extrabold uppercase tracking-wider">Cloverdale, Montgomery AL</span>
                </div>
            </div>
            <ProfileMenu />
        </header>
    );
}
