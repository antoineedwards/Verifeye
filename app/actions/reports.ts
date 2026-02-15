"use server"

import { createClient } from "@supabase/supabase-js"
import { auth } from "@/auth"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type Report = {
    id: string
    created_at: string
    user_id: string
    title: string
    description: string | null
    location_address: string
    latitude: number | null
    longitude: number | null
    report_count: number
    status: 'unverified' | 'verified' | 'resolved'
    is_verified: boolean
    image_url: string | null
    category: string | null
    is_edited: boolean
}

// Helper: count confirm votes for a report
async function getConfirmVoteCount(reportId: string): Promise<number> {
    const { data, error } = await supabase
        .from("report_votes")
        .select("id")
        .eq("report_id", reportId)
        .eq("vote_type", "confirm")
    if (error || !data) return 0
    return data.length
}

export async function createReport(data: {
    title: string
    description: string
    location_address: string
    latitude?: number
    longitude?: number
    category?: string
    image_url?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const { error } = await supabase
        .from("reports")
        .insert({
            user_id: session.user.id,
            title: data.title,
            description: data.description,
            location_address: data.location_address,
            latitude: data.latitude,
            longitude: data.longitude,
            category: data.category,
            image_url: data.image_url,
            status: 'unverified'
        })

    if (error) {
        console.error("Error creating report:", error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function getReports() {
    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

    if (error) {
        console.error("Error fetching reports:", error)
        return []
    }

    const reports = data || []
    if (reports.length === 0) return []

    // Single batch query for all vote counts (avoids N+1)
    const reportIds = reports.map(r => r.id)
    const { data: votes } = await supabase
        .from("report_votes")
        .select("report_id")
        .in("report_id", reportIds)
        .eq("vote_type", "confirm")

    const voteCounts: Record<string, number> = {}
    if (votes) {
        for (const v of votes) {
            voteCounts[v.report_id] = (voteCounts[v.report_id] || 0) + 1
        }
    }

    return reports.map(r => ({
        ...r,
        report_count: voteCounts[r.id] || 0,
    })) as Report[]
}

export async function voteOnReport(reportId: string, voteType: 'confirm' | 'dispute') {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Insert vote — unique(user_id, report_id) prevents duplicates
    const { error: voteError } = await supabase
        .from("report_votes")
        .insert({
            user_id: session.user.id,
            report_id: reportId,
            vote_type: voteType,
        })

    if (voteError) {
        // Unique constraint violation = already voted
        if (voteError.code === '23505') {
            return { success: false, error: "You have already voted on this report" }
        }
        console.error("Vote error:", voteError)
        return { success: false, error: voteError.message }
    }

    // If confirm, check if the report should be marked as verified
    if (voteType === 'confirm') {
        const confirmCount = await getConfirmVoteCount(reportId)
        if (confirmCount >= 3) {
            await supabase
                .from("reports")
                .update({
                    is_verified: true,
                    status: 'verified'
                })
                .eq("id", reportId)
                .eq("status", "unverified")
        }
    }

    // Award points for participating
    const { awardPoints } = await import("./user")
    await awardPoints(session.user.id, 10)

    return { success: true, pointsAwarded: 10 }
}

export async function getUserVotes(): Promise<Record<string, 'confirm' | 'dispute'>> {
    const session = await auth()
    if (!session?.user?.id) return {}

    const { data, error } = await supabase
        .from("report_votes")
        .select("report_id, vote_type")
        .eq("user_id", session.user.id)

    if (error || !data) return {}

    const votes: Record<string, 'confirm' | 'dispute'> = {}
    for (const row of data) {
        votes[row.report_id] = row.vote_type as 'confirm' | 'dispute'
    }
    return votes
}


export async function deleteReport(reportId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Check ownership
    const { data: report, error: fetchError } = await supabase
        .from("reports")
        .select("user_id")
        .eq("id", reportId)
        .single()

    if (fetchError || !report) return { success: false, error: "Report not found" }

    if (report.user_id !== session.user.id) {
        return { success: false, error: "You can only delete your own reports" }
    }

    const { error: deleteError } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId)

    if (deleteError) return { success: false, error: deleteError.message }

    return { success: true }
}

export async function updateReport(reportId: string, data: { title?: string, description?: string, status?: 'unverified' | 'verified' | 'resolved' }) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Check ownership
    const { data: report, error: fetchError } = await supabase
        .from("reports")
        .select("user_id")
        .eq("id", reportId)
        .single()

    if (fetchError || !report) return { success: false, error: "Report not found" }

    if (report.user_id !== session.user.id) {
        return { success: false, error: "You can only edit your own reports" }
    }

    const { error: updateError } = await supabase
        .from("reports")
        .update({ ...data, is_edited: true })
        .eq("id", reportId)

    if (updateError) return { success: false, error: updateError.message }

    return { success: true }
}

// ─── Report Detail ───────────────────────────────────────────────────

export type ReportDetail = Report & {
    author_name: string | null
    like_count: number
    comment_count: number
    liked_by_me: boolean
}

export type ReportComment = {
    id: string
    created_at: string
    report_id: string
    user_id: string
    content: string
    author_name: string | null
}

export async function getReportById(reportId: string): Promise<ReportDetail | null> {
    const session = await auth()
    const currentUserId = session?.user?.id || null

    const { data: report, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single()

    if (error || !report) return null

    // Parallel queries for author, likes, comments, and vote count
    const [userResult, likesResult, commentsResult, reportCount] = await Promise.all([
        supabase.schema("next_auth").from("users").select("name").eq("id", report.user_id).single(),
        supabase.from("report_likes").select("user_id").eq("report_id", reportId),
        supabase.from("report_comments").select("id").eq("report_id", reportId),
        getConfirmVoteCount(reportId),
    ])

    const authorName = userResult.data?.name || "Neighbor"
    const likeCount = likesResult.data?.length || 0
    const likedByMe = !!likesResult.data?.some(l => l.user_id === currentUserId)
    const commentCount = commentsResult.data?.length || 0

    return {
        ...(report as Report),
        report_count: reportCount,
        author_name: authorName,
        like_count: likeCount,
        comment_count: commentCount,
        liked_by_me: likedByMe,
    }
}

export async function toggleReportLike(reportId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized", liked: false }

    const { data: existing } = await supabase
        .from("report_likes")
        .select("user_id")
        .eq("user_id", session.user.id)
        .eq("report_id", reportId)
        .maybeSingle()

    if (existing) {
        const { error } = await supabase
            .from("report_likes")
            .delete()
            .eq("user_id", session.user.id)
            .eq("report_id", reportId)
        if (error) return { success: false, error: error.message, liked: true }
        return { success: true, liked: false }
    } else {
        const { error } = await supabase
            .from("report_likes")
            .insert({ user_id: session.user.id, report_id: reportId })
        if (error) return { success: false, error: error.message, liked: false }
        return { success: true, liked: true }
    }
}

export async function addReportComment(reportId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const { error } = await supabase
        .from("report_comments")
        .insert({
            report_id: reportId,
            user_id: session.user.id,
            content,
        })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function getReportComments(reportId: string): Promise<ReportComment[]> {
    const { data: comments, error } = await supabase
        .from("report_comments")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: true })

    if (error || !comments) return []

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
        report_id: c.report_id,
        user_id: c.user_id,
        content: c.content,
        author_name: userMap[c.user_id] || "Neighbor",
    }))
}
