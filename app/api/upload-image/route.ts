import { auth } from "@/auth"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC" }, { status: 400 })
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg"
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8)
        const filePath = `${session.user.id}/${timestamp}-${random}.${ext}`

        // Convert File to ArrayBuffer then to Buffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabase.storage
            .from("report-images")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error("Upload error:", uploadError)
            return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from("report-images")
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        console.error("Upload route error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
