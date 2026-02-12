"use server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toTitleCase(str: string): string {
    // Normalize the string to lowercase first
    return str.toLowerCase().split(' ').map((word) => {
        // Capitalize the first character and add the rest of the word
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export async function saveUserAddress(address: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { error } = await supabase
        .schema("next_auth") // Important: specify the schema
        .from("users")
        .update({ address: toTitleCase(address) })
        .eq("id", session.user.id)

    return { success: !error }
}

export async function getUserProfile() {
    const session = await auth()
    if (!session?.user?.id) return null

    const { data: user, error } = await supabase
        .schema("next_auth")
        .from("users")
        .select("name, email, image, address, level")
        .eq("id", session.user.id)
        .single()

    if (error || !user) return null
    return user
}