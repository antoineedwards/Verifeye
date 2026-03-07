"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Types ───────────────────────────────────────────────────────────

export type NearbyUser = {
    id: string
    name: string | null
    image: string | null
}

export type ConversationPreview = {
    id: string
    other_user_id: string
    other_user_name: string | null
    other_user_image: string | null
    last_message: string | null
    last_message_at: string
    unread_count: number
}

export type Message = {
    id: string
    created_at: string
    sender_id: string
    content: string
    is_read: boolean
}

// ─── Haversine Distance (miles) ──────────────────────────────────────

function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Nearby Users ────────────────────────────────────────────────────

export async function getNearbyUsers(): Promise<NearbyUser[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    // Get current user's location AND address
    const { data: currentUser } = await supabase
        .schema("next_auth")
        .from("users")
        .select("latitude, longitude, address")
        .eq("id", session.user.id)
        .single()

    if (!currentUser) return []

    // ── Path A: Coordinate-based proximity (preferred) ─────────────────
    if (currentUser.latitude && currentUser.longitude) {
        const { latitude: myLat, longitude: myLng } = currentUser

        // Bounding box (~1 mile ≈ 0.0145° latitude, longitude varies)
        const latDelta = 0.0145
        const lngDelta = 0.0145 / Math.cos(myLat * Math.PI / 180)

        const { data: users } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id, name, image, latitude, longitude")
            .neq("id", session.user.id)
            .eq("address_verified", true)
            .gte("latitude", myLat - latDelta)
            .lte("latitude", myLat + latDelta)
            .gte("longitude", myLng - lngDelta)
            .lte("longitude", myLng + lngDelta)

        if (!users) return []

        // Refine with Haversine and sort alphabetically (not by distance for privacy)
        return users
            .filter(u => u.latitude && u.longitude &&
                haversineDistance(myLat, myLng, u.latitude, u.longitude) <= 1
            )
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(u => ({ id: u.id, name: u.name, image: u.image }))
    }

    // ── Path B: Address-string fallback (when geocoding failed) ────────
    // Match users who share the same street number + street name
    if (!currentUser.address) return []

    // Extract "915 S JACKSON" from "915 S Jackson St, Montgomery, AL 36104"
    const streetKey = currentUser.address
        .toUpperCase()
        .split(",")[0]  // drop city/state/zip
        .replace(/\b(ST|AVE|BLVD|DR|LN|RD|CT|CIR|PL|WAY|TER|TRL|PKWY|HWY)\b.*$/, "") // drop street suffix+
        .trim()

    if (!streetKey) return []

    const { data: users } = await supabase
        .schema("next_auth")
        .from("users")
        .select("id, name, image, address")
        .neq("id", session.user.id)
        .eq("address_verified", true)
        .ilike("address", `%${streetKey.split(" ").slice(0, 3).join(" ")}%`)

    if (!users) return []

    return users
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .map(u => ({ id: u.id, name: u.name, image: u.image }))
}

// ─── Conversations ───────────────────────────────────────────────────

export async function getConversations(): Promise<ConversationPreview[]> {
    const session = await auth()
    if (!session?.user?.id) return []
    const userId = session.user.id

    // Get all conversations where user is a participant
    const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })

    if (error || !convos || convos.length === 0) return []

    // Gather other user IDs
    const otherUserIds = convos.map(c =>
        c.user1_id === userId ? c.user2_id : c.user1_id
    )

    // Batch fetch user info
    const { data: users } = await supabase
        .schema("next_auth")
        .from("users")
        .select("id, name, image")
        .in("id", otherUserIds)

    const userMap: Record<string, { name: string | null; image: string | null }> = {}
    if (users) {
        for (const u of users) {
            userMap[u.id] = { name: u.name, image: u.image }
        }
    }

    // Get last message + unread count for each conversation
    const results: ConversationPreview[] = []

    for (const c of convos) {
        const otherId = c.user1_id === userId ? c.user2_id : c.user1_id

        // Last message
        const { data: lastMsg } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        // Unread count (messages from the other user that I haven't read)
        const { data: unread } = await supabase
            .from("messages")
            .select("id")
            .eq("conversation_id", c.id)
            .eq("sender_id", otherId)
            .eq("is_read", false)

        results.push({
            id: c.id,
            other_user_id: otherId,
            other_user_name: userMap[otherId]?.name || "Neighbor",
            other_user_image: userMap[otherId]?.image || null,
            last_message: lastMsg?.content || null,
            last_message_at: c.last_message_at,
            unread_count: unread?.length || 0,
        })
    }

    return results
}

// ─── Get or Create Conversation ──────────────────────────────────────

export async function getOrCreateConversation(otherUserId: string): Promise<{ id: string } | { error: string }> {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const userId = session.user.id

    if (userId === otherUserId) return { error: "Cannot message yourself" }

    // Ensure consistent ordering: lower UUID is user1
    const [user1, user2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId]

    // Check if conversation exists
    const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .single()

    if (existing) return { id: existing.id }

    // Create new conversation
    const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({ user1_id: user1, user2_id: user2 })
        .select("id")
        .single()

    if (error || !newConvo) return { error: error?.message || "Failed to create conversation" }

    return { id: newConvo.id }
}

// ─── Messages ────────────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<Message[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    // Verify user is a participant
    const { data: convo } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .single()

    if (!convo) return []
    if (convo.user1_id !== session.user.id && convo.user2_id !== session.user.id) return []

    const { data: messages } = await supabase
        .from("messages")
        .select("id, created_at, sender_id, content, is_read")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100)

    return (messages || []) as Message[]
}

export async function sendMessage(conversationId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    if (!content.trim()) return { success: false, error: "Message cannot be empty" }

    // Verify user is a participant
    const { data: convo } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .single()

    if (!convo) return { success: false, error: "Conversation not found" }
    if (convo.user1_id !== session.user.id && convo.user2_id !== session.user.id) {
        return { success: false, error: "Not a participant" }
    }

    // Insert message
    const { error: msgError } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_id: session.user.id,
            content: content.trim(),
        })

    if (msgError) return { success: false, error: msgError.message }

    // Update last_message_at on the conversation
    await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId)

    return { success: true }
}

export async function markAsRead(conversationId: string) {
    const session = await auth()
    if (!session?.user?.id) return

    // Mark all messages from the other user as read
    const { data: convo } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .single()

    if (!convo) return

    const otherId = convo.user1_id === session.user.id ? convo.user2_id : convo.user1_id

    await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("sender_id", otherId)
        .eq("is_read", false)
}
