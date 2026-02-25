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
        // @ts-expect-error -- custom Supabase user fields not in NextAuth types
        session.user.address = user.address;
        // @ts-expect-error -- custom Supabase user fields not in NextAuth types
        session.user.level = user.level;
        // @ts-expect-error -- custom Supabase user fields not in NextAuth types
        session.user.geofence_id = user.geofence_id;
      }
      return session;
    },
  },
})