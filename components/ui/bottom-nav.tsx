import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";

interface BottomNavProps {
    activeTab: "home" | "community";
    onTabChange: (tab: "home" | "community") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-16 z-40 pb-safe">
            <Button
                variant="ghost"
                className={`flex-col gap-1 h-full w-full rounded-none ${activeTab === "home" ? "text-primary" : "text-muted-foreground"
                    }`}
                onClick={() => onTabChange("home")}
            >
                <Home className="h-6 w-6" />
                <span className="text-xs">Home</span>
            </Button>

            <Button
                variant="ghost"
                className={`flex-col gap-1 h-full w-full rounded-none ${activeTab === "community" ? "text-[var(--community-primary)]" : "text-muted-foreground"
                    }`}
                onClick={() => onTabChange("community")}
            >
                <Users className="h-6 w-6" />
                <span className="text-xs">Community</span>
            </Button>
        </div>
    );
}
