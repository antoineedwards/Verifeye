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

export async function saveUserAddressById(userId: string, address: string) {
    const { error } = await supabase
        .schema("next_auth")
        .from("users")
        .update({ address: toTitleCase(address) })
        .eq("id", userId)

    return { success: !error }
}

export async function createEmailUser({
    email,
    name,
    phone,
}: {
    email: string;
    name: string;
    phone?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
    // Check if a user with this email already exists
    const { data: existing } = await supabase
        .schema("next_auth")
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

    if (existing) {
        return { success: false, error: "An account with this email already exists." };
    }

    const userId = crypto.randomUUID();

    const { error: insertError } = await supabase
        .schema("next_auth")
        .from("users")
        .insert({
            id: userId,
            email: email.toLowerCase().trim(),
            name: toTitleCase(name.trim()),
            //phone: phone?.trim() ?? null,
            emailVerified: null,
        });

    if (insertError) {
        console.error("createEmailUser error:", insertError);
        return { success: false, error: "Failed to create account. Please try again." };
    }

    return { success: true, userId };
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

export async function getNeighborhoodLabel(): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) return "Your Neighborhood"

    const { data: user } = await supabase
        .schema("next_auth")
        .from("users")
        .select("latitude, longitude, address")
        .eq("id", session.user.id)
        .single()

    if (!user) return "Your Neighborhood"

    // Path A: Reverse geocode using lat/lng (most accurate)
    if (user.latitude && user.longitude) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${user.latitude}&lon=${user.longitude}`,
                { headers: { "User-Agent": "Verifeye-App/1.0" }, next: { revalidate: 3600 } }
            )
            const data = await res.json()
            const addr = data?.address
            if (addr) {
                // Pick the most specific human-readable neighborhood label available
                const label =
                    addr.neighbourhood ||
                    addr.suburb ||
                    addr.city_district ||
                    addr.quarter ||
                    addr.village ||
                    addr.town ||
                    addr.city
                if (label) {
                    const state = addr.state_code || addr.state || ""
                    return state ? `${label}, ${state}` : label
                }
            }
        } catch (err) {
            console.warn("Reverse geocode failed:", err)
        }
    }

    // Path B: Parse city from stored address string
    // Format: "street[, line2], city, state zip"
    if (user.address) {
        const parts = user.address.split(",").map((p: string) => p.trim()).filter(Boolean)
        if (parts.length >= 2) {
            // City is second-to-last, state+zip is last
            const city = parts[parts.length - 2]
            const statePart = parts[parts.length - 1].split(" ")[0] // "AL" from "AL 36104"
            return statePart ? `${city}, ${statePart}` : city
        }
    }

    return "Your Neighborhood"
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