# Verifeye — Deployment Readiness Report

**Generated**: February 15, 2026  
**Build Status**: ✅ Passes (`next build` completes successfully)  
**Lint Status**: ⚠️ 8 errors, 17 warnings

---

## 🔴 Critical — Must Fix Before Deploy

### 1. Run the `report_votes` SQL Migration
The `report_votes` table doesn't exist in Supabase yet. Without it, voting on reports will fail with "permission denied."

**Action**: Run `supabase/migrations/create_report_votes.sql` in the **Supabase SQL Editor**.

### 2. `SignIn.tsx` is an Async Client Component
`components/features/onboarding/SignIn.tsx` is marked `"use client"` but exports an `async` function. This is unsupported in React and will break in production.

**File**: `components/features/onboarding/SignIn.tsx`  
**Fix**: It imports from `@/auth` (server-only). This component should either:
- Remove `"use client"` and be used only in server components, OR
- Use the server action pattern (call `handleGoogleSignIn()` from `app/actions/auth.ts` instead)

### 3. `awardPoints()` Has No Auth Check
`app/actions/user.ts → awardPoints()` accepts a raw `userId` parameter and doesn't verify the caller. Any authenticated user could call it with any user ID to award themselves unlimited points.

**Fix**: Either remove the `userId` parameter and get the user from `auth()`, or verify that the caller has permission (e.g., `session.user.id === userId` or admin check).

### 4. Missing `AUTH_SECRET` Environment Variable
NextAuth v5 requires an `AUTH_SECRET` env var in production. Make sure this is set in your deployment environment (Vercel, etc.). You can generate one with `npx auth secret`.

### 5. Hardcoded Codespaces Origin in `next.config.ts`
The `serverActions.allowedOrigins` contains `zany-happiness-699vj9g97x76cx45j-3000.app.github.dev`, which is a development Codespaces URL. This should be replaced with your actual production domain.

```ts
// next.config.ts → experimental.serverActions.allowedOrigins
allowedOrigins: [
  'your-production-domain.com', // ← update this
  'localhost:3000'
],
```

### 6. `onboarding/page.tsx` Calls `setState` During Render
Line 18-20 in `app/onboarding/page.tsx` calls `setIsVerified(true)` directly in the component body (not in a `useEffect`), which triggers an infinite re-render loop in strict mode.

**Fix**: Move this session-check logic into the existing `useEffect` or a separate effect.

---

## 🟡 Important — Should Fix

### 7. Middleware Deprecation Warning
The build warns: `The "middleware" file convention is deprecated. Please use "proxy" instead.` Next.js 16 has renamed middleware. Your `middleware.ts` should be renamed/refactored to use the new `proxy` convention per Next.js docs.

### 8. `@ts-ignore` → `@ts-expect-error` in `auth.ts`
ESLint flags two `@ts-ignore` comments in `auth.ts` (lines 16, 18). Replace with `@ts-expect-error` which is safer — it will alert you if the underlying type issue is ever fixed.

### 9. Unused Imports (17 warnings)
Multiple files have unused imports/variables. These inflate bundle size and indicate dead code:

| File | Unused |
|------|--------|
| `app/layout.tsx` | `Metadata` type |
| `ResidencyVerification.tsx` | `CheckCircle2` |
| `WelcomeScreen.tsx` | `onNext` prop |
| `ResourcesTab.tsx` | `CardDescription` |
| `IncidentCard.tsx` | `setStatus`, `e` param |
| `IncidentReportingFlow.tsx` | `useCallback` |
| `app-header.tsx` | `title` variable |

### 10. Use `next/image` Instead of `<img>`
Five components use raw `<img>` tags. `next/image` provides automatic optimization (lazy loading, WebP conversion, responsive sizes), which improves LCP and bandwidth:

- `CommunityPostDetail.tsx`
- `IncidentCard.tsx`
- `IncidentDetails.tsx`
- `ReportDetail.tsx`
- `WelcomeScreen.tsx`

### 11. `scripts/debug-auth.js` Uses `require()` Imports
This debug script uses CommonJS `require()` which triggers lint errors. It's fine for local debugging, but consider either:
- Adding it to `.eslintignore`, or
- Converting to ESM with `import`, or  
- Excluding `scripts/` from the lint config

### 12. Capacitor Config `webDir` Should Point to Build Output
`capacitor.config.ts` sets `webDir: 'public'`, but for a Next.js app the build output directory should be `out` (for static export) or the app needs a different deployment strategy for Capacitor.

---

## ⚡ Performance Optimizations

### P1. N+1 Query Problem in `getReports()`
`getReports()` fetches all reports, then for **each report** makes a separate DB call via `getConfirmVoteCount()`. With 50 reports, that's 50 extra queries.

**Fix**: Do a single batch query to count votes per report:
```ts
export async function getReports() {
    const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) return []
    const reports = data || []
    if (reports.length === 0) return []

    // Single batch query for all vote counts
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
```

### P2. Multiple Sequential DB Queries in `getReportById()` and `getCommunityPostById()`
Both functions make 4 sequential queries (report → user → likes → comments). These should be parallelized with `Promise.all()`:

```ts
const [userResult, likesResult, commentsResult, voteCount] = await Promise.all([
    supabase.schema("next_auth").from("users").select("name").eq("id", report.user_id).single(),
    supabase.from("report_likes").select("user_id").eq("report_id", reportId),
    supabase.from("report_comments").select("id").eq("report_id", reportId),
    getConfirmVoteCount(reportId),
])
```

### P3. Duplicate `getUserProfile()` Calls
Both `HomeTab` and `ProfileMenu` independently call `getUserProfile()` on mount. If they render on the same page (which they do — `IncidentReportingFlow` renders `HomeTab` while `AppHeader` renders `ProfileMenu`), this results in redundant auth + DB calls.

**Fix**: Lift the user profile fetch into `IncidentReportingFlow` and pass it down as a prop, or use React context.

### P4. No Pagination on Reports or Community Posts
`getReports()` and `getCommunityPosts()` fetch **all** records with no limit. As the app grows, this will degrade performance.

**Fix**: Add `.limit(25)` and implement cursor-based or offset pagination with "load more" UI.

### P5. Geocoding Calls to Nominatim
`GeofenceLocator` and `LocationConfirmation` call the free Nominatim API directly. This works for development but Nominatim has strict rate limits (1 request/second) and their usage policy prohibits heavy or commercial use.

**Fix**: For production, use a commercial geocoding provider (Google Maps, Mapbox, etc.) or self-host Nominatim.

### P6. Leaflet CSS Loaded Globally
Leaflet CSS (`leaflet/dist/leaflet.css`) is imported in the component but loads for all users, even those who never see the map.

**Fix**: Since you already `dynamic()` import the map component with `ssr: false`, this is somewhat mitigated, but consider lazy-loading the CSS only when the map is used.

---

## 🔒 Security Considerations

### S1. Service Role Key Used Everywhere
All server actions create Supabase clients with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses all RLS policies. This is a valid pattern for server actions since they run server-side, but be cautious:
- **Never** expose this key to the client
- Ensure all authorization checks are done in your server action code (currently they check `auth()` properly ✅)

### S2. No Input Sanitization on Comments/Posts
User-submitted content (report descriptions, comments, post content) is stored and rendered as-is. While React auto-escapes JSX, sanitize inputs on the server side to prevent stored XSS if content is ever rendered in a non-React context (emails, exports, etc.).

### S3. No Rate Limiting on Server Actions
Actions like `voteOnReport`, `addComment`, `createReport` have no rate limiting. A malicious user could spam these endpoints.

**Fix**: Implement rate limiting via middleware or a library like `@upstash/ratelimit`.

### S4. Image Upload Lacks Content Verification
The upload API validates file type by MIME type (`file.type`), but MIME types are user-controlled headers — a malicious file could be uploaded with a spoofed type.

**Fix**: Use magic bytes / file signature verification, or process images through a CDN with transformation (which validates the content).

---

## 🧹 Cleanup Before Deploy

| Item | Action |
|------|--------|
| `scripts/debug-auth.js` | Remove or add to `.gitignore` — it's a debug utility with hardcoded env loading |
| `public/` placeholder files | Remove unused default Next.js assets: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` |
| `{/* commented metadata */}` in `layout.tsx` (lines 9-13) | Remove the commented-out metadata block |
| `"name": "temp_app"` in `package.json` | Update to `"verifeye"` |
| `baseline-browser-mapping` warning | Run `npm i baseline-browser-mapping@latest -D` to clear build warnings |
| `GeofenceLocator.tsx` missing `formData` dep | Add `formData` to the `useEffect` dependency array or restructure |

---

## ✅ What's Already Good

- **Build passes cleanly** — no TypeScript compilation errors
- **Auth flow** is well-structured with NextAuth v5 + Supabase adapter
- **Optimistic UI updates** implemented throughout (voting, likes, comments)
- **Server actions** properly check authentication
- **Image upload** validates type and size with sensible limits (10MB)
- **Dynamic imports** for Leaflet prevent SSR issues
- **`.env*` files** are properly gitignored
- **Responsive design** with mobile-first max-width container
- **Dark mode support** is configured in CSS custom properties

---

## 📋 Deployment Checklist

- [X] Run `create_report_votes.sql` in Supabase
- [X] Fix `SignIn.tsx` async client component
- [X] Secure `awardPoints()` with auth check
- [X] Set `AUTH_SECRET` in production environment
- [X] Update `allowedOrigins` with production domain
- [X] Fix `setIsVerified` render-time setState
- [X] Rename `temp_app` → `verifeye` in package.json
- [X] Apply N+1 query fix in `getReports()`
- [X] Parallelize queries in `getReportById()` / `getCommunityPostById()`
- [X] Add pagination to report/post list queries
- [X] Remove unused imports and placeholder assets
- [X] Replace `<img>` with `next/image` across all components
- [X] Replace `@ts-ignore` with `@ts-expect-error` in `auth.ts`
- [X] Remove `any` types in `verify-document.ts` and `onboarding/page.tsx`
- [ ] Set up rate limiting for server actions
- [ ] Replace Nominatim with production geocoding provider
