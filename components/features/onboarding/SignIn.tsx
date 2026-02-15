"use client"

import { handleGoogleSignIn } from "@/app/actions/auth"

export default function SignIn() {
  return (
    <form action={handleGoogleSignIn}>
      <button type="submit">Signin with Google</button>
    </form>
  )
}