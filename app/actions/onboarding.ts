"use server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NOMINATIM_HEADERS = { "User-Agent": "Verifeye-App/1.0" }

async function geocodeAddress(fields: {
    street?: string
    city?: string
    state?: string
    zip?: string
}): Promise<{ lat: number; lon: number } | null> {
    const { street, city, state, zip } = fields

    // Attempt 1: Full structured query (street + city + state + zip)
    if (street && city && state) {
        const params = new URLSearchParams({
            format: "json",
            limit: "1",
            countrycodes: "us",
            street,
            city,
            state,
            ...(zip ? { postalcode: zip } : {}),
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: NOMINATIM_HEADERS })
        const data = await res.json()
        if (data?.length > 0) {
            console.log("Geocoded via structured query (street+city+state)")
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
    }

    // Attempt 2: Free-text query (sometimes works better for informal addresses)
    if (street && city && state) {
        const q = `${street}, ${city}, ${state}${zip ? ` ${zip}` : ""}`
        const params = new URLSearchParams({ format: "json", limit: "1", countrycodes: "us", q })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: NOMINATIM_HEADERS })
        const data = await res.json()
        if (data?.length > 0) {
            console.log("Geocoded via free-text query")
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
    }

    // Attempt 3: Fall back to city + state (guarantees at least a city-level match)
    if (city && state) {
        const q = `${city}, ${state}`
        const params = new URLSearchParams({ format: "json", limit: "1", countrycodes: "us", q })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: NOMINATIM_HEADERS })
        const data = await res.json()
        if (data?.length > 0) {
            console.log("Geocoded via city+state fallback")
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        }
    }

    return null
}

export async function completeOnboarding(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const addressInput = formData.get("address") as string
    const street = formData.get("street") as string | null
    const city = formData.get("city") as string | null
    const state = formData.get("state") as string | null
    const zip = formData.get("zip") as string | null

    try {
        // 1. Geocode with structured fields + fallback
        const coords = await geocodeAddress({
            street: street || undefined,
            city: city || undefined,
            state: state || undefined,
            zip: zip || undefined,
        })

        if (!coords) {
            return { error: "Address not found. Please check your address and try again." }
        }

        const { lat, lon } = coords
        console.log(`Geocoded "${addressInput}" → (${lat}, ${lon})`)

        // 2. Try to match coordinate to a geofence in the DB
        const { data: geofenceId, error: rpcError } = await supabase.rpc(
            'find_geofence_by_point',
            { lat, long: lon }
        )

        if (rpcError) {
            console.error("Geofence RPC Error:", rpcError)
        }

        // 3. Update the user record — save address and geofence (if found)
        const updateFields: Record<string, unknown> = {
            address: addressInput,
        }

        if (geofenceId) {
            updateFields.geofence_id = geofenceId
        }

        const { error: updateError } = await supabase
            .schema('next_auth')
            .from('users')
            .update(updateFields)
            .eq('id', session.user.id)

        if (updateError) throw updateError

        // 4. Log if no geofence matched
        if (!geofenceId) {
            console.log(`No geofence found for address: ${addressInput} (${lat}, ${lon})`)
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error("Onboarding flow failed:", message)
        return { error: "An unexpected error occurred. Please try again." }
    }

    // 5. Success — redirect to dashboard
    redirect("/dashboard")
}


