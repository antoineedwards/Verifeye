"use server"
import OpenAI from "openai";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase for updating the user status later
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function verifyUserDocument(formData: FormData) {
  // 1. Get Session
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // 2. Pull target name & address from Supabase (single source of truth)
  const { data: userProfile, error: profileError } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, address")
    .eq("id", session.user.id)
    .single();

  if (profileError || !userProfile) {
    console.error("Supabase Profile Fetch Error:", profileError);
    return { error: "Could not retrieve your profile. Please try again." };
  }

  const targetName = userProfile.name;
  const targetAddress = userProfile.address;

  if (!targetName || !targetAddress) {
    return { error: "User profile is missing name or address. Cannot verify." };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file uploaded" };

  try {
    // 3. Prepare Image for AI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    // 4. Send to OpenAI Vision (Address Verification Agent)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Standard gpt-4o for Vision tasks; much better at small text like 'RM 304C'
      messages: [
        {
          role: "system",
          content: `You are a specialized Address Verification Agent. 
      Your goal is to determine if a physical document (utility bill, ID, etc.) matches a digital profile.
      
      CRITICAL HIERARCHY:
      1. Primary Match: Street Number + Street Name must match exactly (ignoring abbreviations).
      2. Secondary Match: Name must be a variation of the same person.
      3. Disregard: Address Line 2 (Unit, Apt, Room, Suite) is OPTIONAL. If the primary street match is perfect, a mismatch or absence of Line 2 is still a VALID MATCH.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
          --- TARGET PROFILE ---
          Name: "${targetName}"
          Address: "${targetAddress}"

          --- INSTRUCTIONS ---
          1. Extract the name and full address from the image.
          2. Normalize the extracted data (e.g., 'Avenue' -> 'AVE', 'Antoine' -> 'ANTOINE').
          3. Compare the 'Primary Address' (House Number + Street).
          4. If Primary matches, but Address Line 2 (like 'RM 304C' or 'Apt 4') is missing or different, MARK AS MATCH.

          Return JSON ONLY:
          {
            "extracted": { "name": string, "address": string },
            "isMatch": boolean,
            "confidence": number,
            "reasoning": "Explain why. Specifically mention if Address Line 2 was ignored per rules."
          }`
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return { success: false, message: "Could not analyze document." };

    // 5. Parse AI Response
    let result: {
      extracted?: { name: string; address: string };
      isMatch: boolean;
      confidence: number;
      reasoning: string;
    };
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return { success: false, message: "Failed to parse AI response." };
    }

    console.log("AI Verification Result:", JSON.stringify(result, null, 2));

    // 6. Act on Verification
    if (result.isMatch === true) {
      // ✅ Success: Update Database
      const { error } = await supabase
        .schema("next_auth")
        .from("users")
        .update({ address_verified: true })
        .eq("id", session.user.id);

      if (error) {
        console.error("Supabase Update Error:", error);
        return { success: false, message: "Verified, but failed to update status." };
      }

      return {
        success: true,
        message: "Verification Successful!",
        extracted: result.extracted,
        confidence: result.confidence,
      };
    } else {
      // ❌ Failure: Return AI reasoning + what it extracted
      return {
        success: false,
        message: `Verification failed: ${result.reasoning}`,
        extracted: result.extracted,
        confidence: result.confidence,
      };
    }

  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: "Error processing the document. Please try again." };
  }
}