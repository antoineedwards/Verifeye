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
        .select("id, name, email, image, address, level, points")
        .eq("id", session.user.id)
        .single()

    if (error || !user) return null
    return user
}

export async function awardPoints(userId: string, amount: number) {
    // Verify the caller is authenticated and matches the target user
    const session = await auth()
    if (!session?.user?.id || session.user.id !== userId) {
        console.error("Unauthorized awardPoints call")
        return { success: false }
    }

    // Fetch current points
    const { data: user, error: fetchError } = await supabase
        .schema("next_auth")
        .from("users")
        .select("points")
        .eq("id", userId)
        .single()

    if (fetchError || !user) {
        console.error("Error fetching user for points:", fetchError)
        return { success: false }
    }

    const currentPoints = (user.points as number) || 0
    const newPoints = currentPoints + amount
    const newLevel = Math.floor(newPoints / 50) + 1

    const { error: updateError } = await supabase
        .schema("next_auth")
        .from("users")
        .update({ points: newPoints, level: newLevel })
        .eq("id", userId)

    if (updateError) {
        console.error("Error updating points:", updateError)
        return { success: false }
    }

    return { success: true, points: newPoints, level: newLevel }
}