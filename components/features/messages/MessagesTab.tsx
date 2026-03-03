"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import {
    getNearbyUsers,
    getConversations,
    getOrCreateConversation,
    NearbyUser,
    ConversationPreview,
} from "@/app/actions/messages";

interface MessagesTabProps {
    onOpenChat: (conversationId: string, userName: string) => void;
}

export function MessagesTab({ onOpenChat }: MessagesTabProps) {
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [nearby, convos] = await Promise.all([
                getNearbyUsers(),
                getConversations(),
            ]);
            setNearbyUsers(nearby);
            setConversations(convos);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleStartChat = async (user: NearbyUser) => {
        if (startingChat) return;
        setStartingChat(user.id);

        const result = await getOrCreateConversation(user.id);
        setStartingChat(null);

        if ("error" in result) {
            return;
        }
        onOpenChat(result.id, user.name || "Neighbor");
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto pb-20">
            <div className="p-4 space-y-6">
                {/* Nearby Users */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Nearby Neighbors
                        </h3>
                    </div>
                    {nearbyUsers.length === 0 ? (
                        <div className="rounded-xl border bg-card p-4 text-center">
                            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No verified neighbors nearby yet.
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                            {nearbyUsers.map((user) => (
                                <motion.button
                                    key={user.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStartChat(user)}
                                    disabled={startingChat === user.id}
                                    className="flex flex-col items-center gap-1.5 min-w-[72px]"
                                >
                                    <div className="relative">
                                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                                                {(user.name || "N")[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {startingChat === user.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-foreground font-medium truncate max-w-[72px]">
                                        {(user.name || "Neighbor").split(" ")[0]}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversations */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Messages
                        </h3>
                    </div>
                    {conversations.length === 0 ? (
                        <div className="rounded-xl border bg-card p-6 text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                No conversations yet. Tap a neighbor above to start chatting!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {conversations.map((convo) => (
                                <motion.button
                                    key={convo.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onOpenChat(convo.id, convo.other_user_name || "Neighbor")}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                                >
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={convo.other_user_image || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-bold">
                                            {(convo.other_user_name || "N")[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className={`text-sm font-semibold truncate ${convo.unread_count > 0 ? "text-foreground" : "text-foreground/80"}`}>
                                                {convo.other_user_name || "Neighbor"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                                                {formatTime(convo.last_message_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm truncate flex-1 ${convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                                {convo.last_message || "No messages yet"}
                                            </p>
                                            {convo.unread_count > 0 && (
                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shrink-0">
                                                    {convo.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
