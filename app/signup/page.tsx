"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEmailUser } from "@/app/actions/user";
import { Mail, User, Phone, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const isFormValid = formData.name.trim().length > 1 && formData.email.includes("@");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await createEmailUser({
                email: formData.email,
                name: formData.name,
                phone: formData.phone || undefined,
            });

            if (!result.success) {
                setError(result.error ?? "Something went wrong.");
                return;
            }

            // Store userId in localStorage so the address step can save the address
            if (result.userId) {
                localStorage.setItem("pendingUserId", result.userId);
                localStorage.setItem("pendingUserEmail", formData.email.toLowerCase().trim());
            }

            router.push("/signup/address");
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-dvh bg-background flex items-center justify-center">
            <div className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl flex flex-col">
                {/* Back button */}
                <div className="p-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="-ml-2 flex items-center gap-1 text-muted-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <div className="flex-1 flex flex-col justify-center p-6 space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4 text-center"
                    >
                        <div className="flex justify-center mb-2">
                            <Image
                                src="/logo.png"
                                alt="Verifeye Logo"
                                width={80}
                                height={80}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
                        <p className="text-muted-foreground">
                            Join your neighborhood. Enter your details to get started.
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="space-y-4 w-full"
                    >
                        {/* Full Name */}
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="signup-name"
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="pl-9 h-12"
                                autoComplete="name"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="pl-9 h-12"
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* Phone (optional) */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="signup-phone"
                                type="tel"
                                placeholder="Phone Number (Optional)"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="pl-9 h-12"
                                autoComplete="tel"
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-destructive text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        {/* Submit */}
                        <Button
                            id="signup-submit"
                            type="submit"
                            className="w-full h-12 text-lg font-medium mt-2"
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Continue"
                            )}
                        </Button>
                    </motion.form>

                    {/* Login link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center"
                    >
                        <Button
                            variant="ghost"
                            className="text-sm text-muted-foreground"
                            onClick={() => router.push("/")}
                        >
                            Already have an account? Log in
                        </Button>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
