"use client"

import { useState } from "react"
import { regeocodeVerifiedUsers } from "@/app/actions/regeocode-users"

export default function AdminRegeocodePage() {
    const [status, setStatus] = useState<"idle" | "running" | "done">("idle")
    const [result, setResult] = useState<{ total: number; fixed: number; failed: string[] } | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleRun() {
        setStatus("running")
        setError(null)
        try {
            const res = await regeocodeVerifiedUsers()
            setResult(res)
            setStatus("done")
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error")
            setStatus("idle")
        }
    }

    return (
        <div style={{ padding: 32, fontFamily: "monospace", maxWidth: 640 }}>
            <h1>Re-geocode Verified Users</h1>
            <p style={{ color: "#666", marginBottom: 24 }}>
                Finds all verified users with null <code>latitude</code>/<code>longitude</code> and
                re-geocodes their stored address. Rate-limited to 1 req/sec (Nominatim policy).
            </p>

            <button
                onClick={handleRun}
                disabled={status === "running"}
                style={{
                    padding: "10px 20px",
                    background: status === "running" ? "#ccc" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: status === "running" ? "not-allowed" : "pointer",
                    fontSize: 16,
                }}
            >
                {status === "running" ? "Running… (may take a minute)" : "Run Backfill"}
            </button>

            {error && (
                <div style={{ marginTop: 24, padding: 16, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6 }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && status === "done" && (
                <div style={{ marginTop: 24, padding: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6 }}>
                    <p>✅ <strong>Done!</strong></p>
                    <p>Users needing fix: <strong>{result.total}</strong></p>
                    <p>Successfully geocoded: <strong>{result.fixed}</strong></p>
                    {result.failed.length > 0 && (
                        <>
                            <p>Failed ({result.failed.length}):</p>
                            <ul style={{ marginTop: 4 }}>
                                {result.failed.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
