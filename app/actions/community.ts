"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Types ───────────────────────────────────────────────────────────

export type CommunityPost = {
    id: string
    created_at: string
    user_id: string
    type: 'general' | 'lost_and_found' | 'event' | 'hazard' | 'alert'
    title: string
    content: string | null
    image_url: string | null
    location_name: string | null
    latitude: number | null
    longitude: number | null
    // Joined / computed fields
    author_name: string | null
    like_count: number
    comment_count: number
    liked_by_me: boolean
}

export type Comment = {
    id: string
    created_at: string
    post_id: string
    user_id: string
    content: string
    author_name: string | null
}

// ─── Posts ────────────────────────────────────────────────────────────

export async function createCommunityPost(data: {
    title: string
    content: string
    type: string
    image_url?: string
    location_name?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Map UI type labels to DB enum values
    const typeMap: Record<string, string> = {
        "General": "general",
        "Lost & Found": "lost_and_found",
        "Local Event": "event",
        "Help/Request": "general",
        "Hazard": "hazard",
        "Alert": "alert",
    }
    const dbType = typeMap[data.type] || "general"

    const { error } = await supabase
        .from("community_posts")
        .insert({
            user_id: session.user.id,
            title: data.title,
            content: data.content,
            type: dbType,
            image_url: data.image_url,
            location_name: data.location_name,
        })

    if (error) {
        console.error("Error creating community post:", error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
    const session = await auth()
    const currentUserId = session?.user?.id || null

    // Fetch posts
    const { data: posts, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

    if (error || !posts) {
        console.error("Error fetching community posts:", error)
        return []
    }

    // Fetch all user names for the post authors
    const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))]
    let userMap: Record<string, string> = {}
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id, name")
            .in("id", userIds)
        if (users) {
            userMap = Object.fromEntries(users.map(u => [u.id, u.name || "Neighbor"]))
        }
    }

    // Fetch like counts
    const postIds = posts.map(p => p.id)
    const { data: likes } = await supabase
        .from("community_post_likes")
        .select("post_id, user_id")
        .in("post_id", postIds)

    const likeCounts: Record<string, number> = {}
    const myLikes = new Set<string>()
    if (likes) {
        for (const like of likes) {
            likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
            if (like.user_id === currentUserId) myLikes.add(like.post_id)
        }
    }

    // Fetch comment counts
    const { data: comments } = await supabase
        .from("community_comments")
        .select("post_id")
        .in("post_id", postIds)

    const commentCounts: Record<string, number> = {}
    if (comments) {
        for (const c of comments) {
            commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1
        }
    }

    return posts.map(p => ({
        id: p.id,
        created_at: p.created_at,
        user_id: p.user_id,
        type: p.type,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        location_name: p.location_name,
        latitude: p.latitude,
        longitude: p.longitude,
        author_name: userMap[p.user_id] || "Neighbor",
        like_count: likeCounts[p.id] || 0,
        comment_count: commentCounts[p.id] || 0,
        liked_by_me: myLikes.has(p.id),
    }))
}

export async function getCommunityPostById(postId: string): Promise<CommunityPost | null> {
    const session = await auth()
    const currentUserId = session?.user?.id || null

    const { data: post, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", postId)
        .single()

    if (error || !post) return null

    // Parallel queries for author, likes, and comments
    const [userResult, likesResult, commentsResult] = await Promise.all([
        supabase.schema("next_auth").from("users").select("name").eq("id", post.user_id).single(),
        supabase.from("community_post_likes").select("user_id").eq("post_id", postId),
        supabase.from("community_comments").select("id").eq("post_id", postId),
    ])

    const authorName = userResult.data?.name || "Neighbor"
    const likeCount = likesResult.data?.length || 0
    const likedByMe = !!likesResult.data?.some(l => l.user_id === currentUserId)
    const commentCount = commentsResult.data?.length || 0

    return {
        id: post.id,
        created_at: post.created_at,
        user_id: post.user_id,
        type: post.type,
        title: post.title,
        content: post.content,
        image_url: post.image_url,
        location_name: post.location_name,
        latitude: post.latitude,
        longitude: post.longitude,
        author_name: authorName,
        like_count: likeCount,
        comment_count: commentCount,
        liked_by_me: likedByMe,
    }
}

export async function deleteCommunityPost(postId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const { data: post, error: fetchError } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .single()

    if (fetchError || !post) return { success: false, error: "Post not found" }
    if (post.user_id !== session.user.id) return { success: false, error: "You can only delete your own posts" }

    const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── Likes ───────────────────────────────────────────────────────────

export async function toggleLike(postId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized", liked: false }

    // Check if already liked
    const { data: existing } = await supabase
        .from("community_post_likes")
        .select("user_id")
        .eq("user_id", session.user.id)
        .eq("post_id", postId)
        .maybeSingle()

    if (existing) {
        // Unlike
        const { error } = await supabase
            .from("community_post_likes")
            .delete()
            .eq("user_id", session.user.id)
            .eq("post_id", postId)
        if (error) return { success: false, error: error.message, liked: true }
        return { success: true, liked: false }
    } else {
        // Like
        const { error } = await supabase
            .from("community_post_likes")
            .insert({ user_id: session.user.id, post_id: postId })
        if (error) return { success: false, error: error.message, liked: false }
        return { success: true, liked: true }
    }
}

// ─── Comments ────────────────────────────────────────────────────────

export async function addComment(postId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const { error } = await supabase
        .from("community_comments")
        .insert({
            post_id: postId,
            user_id: session.user.id,
            content,
        })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function getComments(postId: string): Promise<Comment[]> {
    const { data: comments, error } = await supabase
        .from("community_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

    if (error || !comments) return []

    // Fetch author names
    const userIds = [...new Set(comments.map(c => c.user_id).filter(Boolean))]
    let userMap: Record<string, string> = {}
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id, name")
            .in("id", userIds)
        if (users) {
            userMap = Object.fromEntries(users.map(u => [u.id, u.name || "Neighbor"]))
        }
    }

    return comments.map(c => ({
        id: c.id,
        created_at: c.created_at,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        author_name: userMap[c.user_id] || "Neighbor",
    }))
}
