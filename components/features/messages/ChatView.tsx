"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
    getMessages,
    sendMessage,
    markAsRead,
    Message,
} from "@/app/actions/messages";

interface ChatViewProps {
    conversationId: string;
    otherUserName: string;
    currentUserId: string;
    onBack: () => void;
}

export function ChatView({ conversationId, otherUserName, currentUserId, onBack }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
    };

    const fetchMessages = async () => {
        const msgs = await getMessages(conversationId);
        setMessages(msgs);
        setLoading(false);
        await markAsRead(conversationId);
    };

    useEffect(() => {
        fetchMessages().then(scrollToBottom);

        // Poll every 5 seconds for new messages
        pollRef.current = setInterval(async () => {
            const msgs = await getMessages(conversationId);
            setMessages(prev => {
                if (msgs.length !== prev.length) {
                    scrollToBottom();
                    markAsRead(conversationId);
                }
                return msgs;
            });
        }, 5000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        const content = text.trim();
        setSending(true);
        setText("");

        // Optimistic add
        const optimistic: Message = {
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            sender_id: currentUserId,
            content,
            is_read: false,
        };
        setMessages(prev => [...prev, optimistic]);
        scrollToBottom();

        const result = await sendMessage(conversationId, content);
        if (result.success) {
            // Re-fetch to get server-generated ID
            const msgs = await getMessages(conversationId);
            setMessages(msgs);
        } else {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setText(content);
        }
        setSending(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Group messages by date
    const getDateKey = (dateString: string) => new Date(dateString).toDateString();

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 text-xs font-bold">
                        {otherUserName[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-semibold truncate">{otherUserName}</h1>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground text-sm">
                            Start a conversation with {otherUserName}!
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = msg.sender_id === currentUserId;
                        const showDate = i === 0 || getDateKey(msg.created_at) !== getDateKey(messages[i - 1].created_at);

                        return (
                            <div key={msg.id}>
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="text-[11px] text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full">
                                            {formatDateSeparator(msg.created_at)}
                                        </span>
                                    </div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex mb-1 ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${isMine
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-secondary text-foreground rounded-bl-md"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                                            }`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="border-t bg-background px-4 py-3 flex gap-2">
                <Input
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    className="text-sm"
                />
                <Button
                    size="icon"
                    disabled={!text.trim() || sending}
                    onClick={handleSend}
                    className="h-10 w-10 shrink-0"
                >
                    {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
