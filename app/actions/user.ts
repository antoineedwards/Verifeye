"use server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveUserAddress(address: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { error } = await supabase
        .from("users")
        .update({ address: address })
        .eq("id", session.user.id)
        .schema("next_auth") // Important: specify the schema

    return { success: !error }
}