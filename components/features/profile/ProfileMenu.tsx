"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Shield } from "lucide-react";

export function ProfileMenu() {
    // Mock user data
    const user = {
        name: "Alex Johnson",
        rank: "Community Guardian",
        rankLevel: 5,
        address: "123 Maple Ave, Cloverdale, Montgomery AL",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border-2 border-primary/20">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mr-4" align="end">
                <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>AJ</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-medium leading-none text-lg">{user.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">Member since 2023</p>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <Shield className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Rank</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{user.rank}</span>
                                    <Badge variant="outline" className="text-[10px] h-5">Lvl {user.rankLevel}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Address</p>
                                <p className="text-sm font-medium truncate">{user.address}</p>
                            </div>
                        </div>
                    </div>
                    <Button className="w-full" variant="outline">Edit Profile</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
