import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { createClient } from "@supabase/supabase-js"

// Server-side only — used in authorize and jwt callbacks
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // Look up the user that was already created by createEmailUser
        const { data: user } = await supabaseAdmin
          .schema("next_auth")
          .from("users")
          .select("id, name, email, image")
          .eq("email", (credentials.email as string).toLowerCase().trim())
          .maybeSingle()

        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
        }
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    // JWT strategy means auth() in server actions decodes the cookie directly
    // — no DB session lookup needed. This works reliably for BOTH Google OAuth
    // and Credentials users, unlike the database strategy which fails for
    // Credentials in NextAuth v5 beta.
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // `user` is only populated on initial sign-in
      if (user?.id) {
        token.id = user.id
      }

      // Fetch fresh profile data on sign-in or when update() is called client-side
      // (e.g. after the user saves their address on the signup/address page)
      if (user || trigger === "update") {
        const userId = (token.id as string | undefined) ?? user?.id
        if (userId) {
          const { data: profile } = await supabaseAdmin
            .schema("next_auth")
            .from("users")
            .select("address, level")
            .eq("id", userId)
            .maybeSingle()

          token.address = profile?.address ?? null
          token.level = profile?.level ?? null
        }
      }

      return token
    },

    async session({ session, token }) {
      // Shape the client-visible session from the JWT payload
      if (session.user) {
        session.user.id = token.id as string
        // @ts-expect-error -- custom Supabase user fields not in NextAuth types
        session.user.address = token.address ?? null
        // @ts-expect-error -- custom Supabase user fields not in NextAuth types
        session.user.level = token.level ?? null
      }
      return session
    },
  },
})