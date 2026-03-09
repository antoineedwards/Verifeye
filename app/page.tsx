"use client";


import { useEffect } from "react";
import { useSession } from "next-auth/react"; // Import to check auth state
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "@/components/features/onboarding/WelcomeScreen";

export default function Home() {
  const { data: session, status } = useSession(); // Check if user is authenticated
  const router = useRouter();

  useEffect(() => {
    // If authenticated, redirect to onboarding page
    if (status === "authenticated" && session) {
      router.push("/onboarding");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div
      className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl"
    >Loading...</div>; // Optional loading state
  }

  // If authenticated, return null while redirecting
  if (status === "authenticated" && session) {
    return null;
  }

  // Show welcome screen for unauthenticated users
  return (
    <main className="min-h-dvh bg-background">
      <div className="h-dvh w-full max-w-md mx-auto bg-background overflow-hidden relative shadow-xl">
        <WelcomeScreen onNext={() => router.push("/onboarding")} />
      </div>
    </main>
  );
}