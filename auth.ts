import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { SupabaseAdapter } from "@auth/supabase-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      // This maps your custom Supabase fields to the session object
      if (session.user) {
        session.user.id = user.id;
        // @ts-ignore
        session.user.address = user.address;
        // @ts-ignore
        session.user.level = user.level;
      }
      return session;
    },
  },
})