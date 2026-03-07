"use server"
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { createWorker } from "tesseract.js";
import path from "path";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Address Normalization ──────────────────────────────────────────

const ABBREVIATIONS: Record<string, string> = {
  street: "ST", str: "ST", st: "ST",
  avenue: "AVE", ave: "AVE",
  boulevard: "BLVD", blvd: "BLVD",
  drive: "DR", dr: "DR",
  lane: "LN", ln: "LN",
  road: "RD", rd: "RD",
  court: "CT", ct: "CT",
  circle: "CIR", cir: "CIR",
  place: "PL", pl: "PL",
  way: "WAY",
  terrace: "TER", ter: "TER",
  trail: "TRL", trl: "TRL",
  parkway: "PKWY", pkwy: "PKWY",
  highway: "HWY", hwy: "HWY",
  apartment: "APT", apt: "APT",
  suite: "STE", ste: "STE",
  unit: "UNIT",
  room: "RM", rm: "RM",
  building: "BLDG", bldg: "BLDG",
  floor: "FL", fl: "FL",
  north: "N", south: "S", east: "E", west: "W",
  northeast: "NE", northwest: "NW", southeast: "SE", southwest: "SW",
};

function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/[.,#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(word => ABBREVIATIONS[word.toLowerCase()] || word)
    .join(" ");
}

function extractStreetPrimary(normalized: string): string {
  // Extract house number + street name (ignore unit/apt/suite)
  const stopWords = ["APT", "STE", "UNIT", "RM", "BLDG", "FL", "#"];
  const parts = normalized.split(" ");
  const primary: string[] = [];

  for (const part of parts) {
    if (stopWords.includes(part)) break;
    primary.push(part);
  }

  return primary.join(" ");
}

function fuzzyNameMatch(name1: string, name2: string): boolean {
  const n1 = name1.toUpperCase().trim();
  const n2 = name2.toUpperCase().trim();

  // Exact match
  if (n1 === n2) return true;

  // One name contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Compare individual name parts (handles middle name differences, etc.)
  const parts1 = n1.split(/\s+/);
  const parts2 = n2.split(/\s+/);

  // At least first and last name should match
  const matchingParts = parts1.filter(p => parts2.includes(p));
  return matchingParts.length >= 2 || (matchingParts.length >= 1 && Math.min(parts1.length, parts2.length) === 1);
}

// ─── Main Verification ─────────────────────────────────────────────

export async function verifyUserDocument(formData: FormData) {
  // 1. Get Session
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // 2. Get target data
  const targetName = session.user.name;
  const targetAddress = formData.get("address") as string | null;

  if (!targetName || !targetAddress) {
    return { error: "User profile is missing name or address. Cannot verify." };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file uploaded" };

  try {
    // 3. Run Tesseract.js OCR directly
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Initializing Tesseract worker...");
    const worker = await createWorker("eng", 1, {
      workerPath: path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js"),
    });

    console.log("Running OCR...");
    const { data } = await worker.recognize(buffer);

    console.log("Terminating worker...");
    await worker.terminate();

    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length < 5) {
      return { success: false, message: "Could not read text from the document. Please upload a clearer image." };
    }

    console.log("OCR Extracted Text:", extractedText);

    // 4. Deterministic Address Matching
    const normalizedTarget = normalizeAddress(targetAddress);
    const targetPrimary = extractStreetPrimary(normalizedTarget);

    const extractedLines = extractedText.split("\n").map((l: string) => l.trim()).filter(Boolean);

    let addressMatch = false;
    let nameMatch = false;
    let matchedAddress = "";
    let matchedName = "";

    for (const line of extractedLines) {
      const normalizedLine = normalizeAddress(line);
      const linePrimary = extractStreetPrimary(normalizedLine);

      // Check street address match
      if (targetPrimary && linePrimary && targetPrimary === linePrimary) {
        addressMatch = true;
        matchedAddress = line;
      }

      // Partial match: target primary contained in the line
      if (!addressMatch && targetPrimary && normalizedLine.includes(targetPrimary)) {
        addressMatch = true;
        matchedAddress = line;
      }

      // Check name match
      if (fuzzyNameMatch(line, targetName)) {
        nameMatch = true;
        matchedName = line;
      }
    }

    // Also check if name parts appear anywhere in the full text
    if (!nameMatch) {
      const nameParts = targetName.toUpperCase().split(/\s+/);
      const textUpper = extractedText.toUpperCase();
      const foundParts = nameParts.filter(part => part.length > 1 && textUpper.includes(part));
      if (foundParts.length >= 2 || (foundParts.length >= 1 && nameParts.length === 1)) {
        nameMatch = true;
        matchedName = foundParts.join(" ") + " (found in document text)";
      }
    }

    // 5. Determine result
    const isMatch = addressMatch && nameMatch;
    const confidence = (addressMatch ? 0.5 : 0) + (nameMatch ? 0.5 : 0);

    let reasoning = "";
    if (isMatch) {
      reasoning = `Address "${matchedAddress}" matches target. Name "${matchedName}" matches "${targetName}".`;
    } else {
      const issues = [];
      if (!addressMatch) issues.push(`Could not find address matching "${targetAddress}" in the document`);
      if (!nameMatch) issues.push(`Could not find name matching "${targetName}" in the document`);
      reasoning = issues.join(". ") + ".";
    }

    console.log("Verification Result:", { isMatch, addressMatch, nameMatch, confidence, reasoning });

    // 6. Act on Verification
    if (isMatch) {
      const toTitleCase = (str: string) =>
        str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Geocode the address for proximity messaging
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        // Try multiple query variants to maximize geocoding success
        const geoQueries = [
          targetAddress,                                          // Full address as-is
          targetAddress.replace(/\s+/g, " ").trim(),             // Cleaned whitespace
        ];

        for (const query of geoQueries) {
          const geocodeRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`,
            { headers: { "User-Agent": "Verifeye-App/1.0 (verifeye@app.com)" } }
          );
          const geocodeData = await geocodeRes.json();
          if (geocodeData.length > 0) {
            latitude = parseFloat(geocodeData[0].lat);
            longitude = parseFloat(geocodeData[0].lon);
            console.log(`Geocoded "${query}" → lat:${latitude}, lng:${longitude}`);
            break;
          }
        }

        if (latitude === null || longitude === null) {
          console.warn(`⚠️ Geocoding returned no results for address: "${targetAddress}". Proximity messaging will not work for this user until their coordinates are updated.`);
        }
      } catch (geoErr) {
        console.warn("Geocoding failed (non-blocking):", geoErr);
      }

      const { error } = await supabase
        .schema("next_auth")
        .from("users")
        .update({
          address: toTitleCase(targetAddress),
          address_verified: true,
          ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
        })
        .eq("id", session.user.id);

      if (error) {
        console.error("Supabase Update Error:", error);
        return { success: false, message: "Verified, but failed to update status." };
      }

      return {
        success: true,
        message: "Verification Successful!",
        extracted: { name: matchedName, address: matchedAddress },
        confidence,
      };
    } else {
      return {
        success: false,
        message: `Verification failed: ${reasoning}`,
        extracted: { name: matchedName || "(not found)", address: matchedAddress || "(not found)" },
        confidence,
      };
    }

  } catch (error) {
    console.error("Verification Error:", error);
    return { error: "Error processing the document. Please try again." };
  }
}