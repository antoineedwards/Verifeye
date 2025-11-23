"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, FileText, ShieldAlert, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResourcesTab() {
    const resources = [
        {
            title: "Emergency Contacts",
            icon: Phone,
            items: [
                { name: "Police (Non-Emergency)", number: "555-0123" },
                { name: "Fire Department", number: "555-0124" },
                { name: "Poison Control", number: "1-800-222-1222" },
            ]
        },
        {
            title: "Safety Guides",
            icon: FileText,
            items: [
                { name: "Home Security Checklist", link: "#" },
                { name: "Neighborhood Watch Handbook", link: "#" },
                { name: "Disaster Preparedness", link: "#" },
            ]
        },
        {
            title: "Local Alerts",
            icon: ShieldAlert,
            items: [
                { name: "Sign up for SMS Alerts", link: "#" },
                { name: "Weather Warnings", link: "#" },
            ]
        }
    ];

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Resources</h2>
                <p className="text-muted-foreground">
                    Important contacts and guides for your safety.
                </p>
            </div>

            <div className="grid gap-4">
                {resources.map((section, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <section.icon className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {section.items.map((item, j) => (
                                <div key={j} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                                    <span className="font-medium text-sm">{item.name}</span>
                                    {'number' in item ? (
                                        <a href={`tel:${item.number}`} className="text-sm text-primary font-semibold hover:underline">
                                            {item.number}
                                        </a>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
