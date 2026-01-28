"use client" // This makes it compatible with your WelcomeScreen
import { signIn } from "next-auth/react" // NOTE: Import from 'next-auth/react', not '@/auth'
import { useFormStatus } from "react-dom"

export function GoogleSignIn() {
  const { pending } = useFormStatus()
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
    >
      {pending ? "Signing in..." : "Sign in with Google"}
    </button>
  )
}