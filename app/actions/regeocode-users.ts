"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // Build query variants from most specific to least.
    // Stored format: "street[, line2], city, state zip"
    // Nominatim chokes on unit/room strings, so we strip middle segments.
    const parts = address.split(",").map((p) => p.trim()).filter(Boolean)

    const queries: string[] = [address] // always try raw address first

    if (parts.length >= 3) {
        // "street, city, state zip" — skip any middle line2 segments
        const street = parts[0]
        const cityStateParts = parts.slice(-2)
        queries.push(`${street}, ${cityStateParts.join(", ")}`)
        // "street, state zip" — even simpler
        queries.push(`${street}, ${parts[parts.length - 1]}`)
    }

    for (const query of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`
            const res = await fetch(url, { headers: { "User-Agent": "Verifeye-App/1.0" } })
            const data = await res.json()
            if (data.length > 0) {
                console.log(`Geocoded "${query}" → lat:${data[0].lat}, lng:${data[0].lon}`)
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
            }
            await new Promise((r) => setTimeout(r, 1100)) // Nominatim rate limit
        } catch (err) {
            console.warn(`Geocoding attempt failed for "${query}":`, err)
        }
    }

    return null
}

/**
 * Re-geocodes all verified users who are missing latitude/longitude.
 * Safe to call multiple times (no-ops for users already geocoded).
 * Returns a summary of the results.
 */
export async function regeocodeVerifiedUsers(): Promise<{
    total: number
    fixed: number
    failed: string[]
}> {
    // Get all users who have an address but are missing lat/lng
    const { data: users, error } = await supabase
        .schema("next_auth")
        .from("users")
        .select("id, address")
        .not("address", "is", null)
        .or("latitude.is.null,longitude.is.null")

    if (error || !users) {
        throw new Error(error?.message || "Failed to fetch users")
    }

    const failed: string[] = []
    let fixed = 0

    for (const user of users) {
        if (!user.address) {
            failed.push(`${user.id} (no address)`)
            continue
        }

        const coords = await geocodeAddress(user.address)

        if (!coords) {
            failed.push(`${user.id} (geocoding failed for: ${user.address})`)
            continue
        }

        const { error: updateError } = await supabase
            .schema("next_auth")
            .from("users")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", user.id)

        if (updateError) {
            failed.push(`${user.id} (update failed: ${updateError.message})`)
        } else {
            fixed++
            // Small delay to respect Nominatim rate limits (1 req/sec)
            await new Promise((r) => setTimeout(r, 1100))
        }
    }

    return { total: users.length, fixed, failed }
}
