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
    verification_count: number
    status: 'unverified' | 'verified' | 'resolved'
    is_verified: boolean
    image_url: string | null
    category: string | null
    is_edited: boolean
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
    // We don't need auth to view reports based on the policy "Reports are viewable by everyone"
    // But usually we might want to know who is viewing to show "my report" status etc.

    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching reports:", error)
        return []
    }

    return data as Report[]
}

export async function verifyReport(reportId: string) {
    const { data: currentReport, error: fetchError } = await supabase
        .from("reports")
        .select("verification_count, is_verified, status")
        .eq("id", reportId)
        .single();

    if (fetchError || !currentReport) {
        return { success: false, error: fetchError?.message || "Report not found" }
    }

    const newCount = (currentReport.verification_count || 0) + 1;
    const isVerified = newCount >= 3; // Example threshold
    const newStatus = isVerified && currentReport.status === 'unverified' ? 'verified' : currentReport.status;

    const { error: updateError } = await supabase
        .from("reports")
        .update({
            verification_count: newCount,
            is_verified: isVerified,
            status: newStatus
        })
        .eq("id", reportId);

    if (updateError) {
        return { success: false, error: updateError.message }
    }

    return { success: true }
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
