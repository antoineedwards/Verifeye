# Verifeye architecture

## System map

```mermaid
flowchart TD
    Browser["Next.js app (React client and server components)"]
    Capacitor["Capacitor iOS shell"]
    Routes["App Router pages and API routes"]
    Providers["Auth, theme, and toast providers"]
    Features["Feature components<br/>onboarding · safety · community · messaging"]
    Actions["Server actions<br/>auth · users · verification · reports · community · messages"]
    Auth["NextAuth<br/>Google OAuth and email credentials"]
    Supabase["Supabase<br/>Auth adapter data · application data · image storage"]
    OCR["Tesseract.js<br/>document OCR"]
    Maps["OpenStreetMap Nominatim<br/>geocoding"]
    Email["Resend"]
    Mindee["Mindee"]

    Browser --> Routes
    Capacitor --> Browser
    Routes --> Providers
    Routes --> Features
    Features --> Actions
    Features -->|"sign-in/session"| Auth
    Routes -->|"auth API"| Auth
    Actions --> Auth
    Auth --> Supabase
    Actions --> Supabase
    Actions --> OCR
    Actions --> Maps
    Actions -. "available integration" .-> Email
    Actions -. "available integration" .-> Mindee
```

Solid arrows show integrations visible in the current application code. Resend
and Mindee are listed as dependencies, but are not currently imported by the
application.

## Main user flow

```mermaid
flowchart LR
    Welcome["/ welcome screen"] --> SignUp["Sign-in / sign-up"]
    SignUp --> Address["/signup/address"]
    Address --> Save["Save address and coordinates"]
    Save --> Onboarding["/onboarding"]
    Onboarding --> Gate{"Signed in and has address?"}
    Gate -->|"No address"| Verify["Geofence and document verification"]
    Gate -->|"Yes"| Safety["Incident reporting and safety home"]
    Verify --> Safety
    Safety --> Community["Community"]
    Safety --> Messages["Messages"]
    Safety --> Profile["Profile and resources"]
```

## Code organization

- `app/` contains App Router pages, API routes, and server actions.
- `components/features/` contains onboarding, safety, community, messaging,
  profile, and resources UI.
- `components/ui/` and `components/providers/` contain shared primitives and
  app-wide providers.
- `auth.ts` configures NextAuth with Google and credentials providers and the
  Supabase adapter.
- `supabase/migrations/` contains SQL migrations; Supabase is also used for
  application data and report-image storage.
- `ios/` contains the Capacitor iOS project.

## Important implementation paths

- Document verification: `DocumentUpload` calls the `verifyUserDocument`
  server action, which uses Tesseract.js OCR.
- Report images: the authenticated `/api/upload-image` route uploads to the
  Supabase `report-images` storage bucket.
- User profile/address operations: `app/actions/user.ts` reads and writes
  profile data and uses Nominatim for geocoding.
- Feature data: server actions in `app/actions/` mediate report, community,
  and message operations with Supabase.
