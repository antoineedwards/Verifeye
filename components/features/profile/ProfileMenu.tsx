"use client";

import { useState, useEffect } from "react";
import { getUserProfile } from "@/app/actions/user";
import { signOut } from "next-auth/react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Shield, LogOut } from "lucide-react";

export function ProfileMenu() {
    const [user, setUser] = useState<{
        name: string | null;
        image: string | null;
        address: string | null;
        level: number | null;
    } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const data = await getUserProfile();
            if (data) {
                setUser(data);
            }
        };
        fetchUser();
    }, []);

    const getCommunity = (address: string | null) => {
        if (!address) return "No Address";
        const parts = address.split(",");
        if (parts.length > 1) {
            // content between first and last comma is often the community/city
            return parts[1].trim();
        }
        return address;
    };

    if (!user) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border-2 border-primary/20">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4" align="end">
                <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-medium leading-none text-lg">{user.name || "User"}</h4>
                            {/* <p className="text-sm text-muted-foreground mt-1">Member since 2023</p> */}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <Shield className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Level</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{user.level || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Community</p>
                                <p className="text-sm font-medium truncate">{getCommunity(user.address)}</p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive mt-2"
                        onClick={() => signOut({ redirectTo: "/" })}
                    >
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
