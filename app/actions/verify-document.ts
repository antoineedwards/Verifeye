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

interface SessionUser {
  address?: string;
}

export async function verifyUserDocument(formData: FormData) {
  // 1. Get Session & User Data
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // 2. Dynamic Data Extraction (No more hardcoding)
  const targetName = session.user.name;
  const targetAddress = (session.user as SessionUser).address;

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

    // 4. Send to OpenAI (Dynamic Prompt)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a document verification expert. Your job is to semantically match a document to a user profile, allowing for normal variations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
              Verify if the document in this image matches the following user:
              
              Target Name: "${targetName}"
              Target Address: "${targetAddress}"

              Rules for Matching:
              - Ignore case (e.g., 'a.j.' matches 'ANTOINE J').
              - Ignore middle initials vs. full names.
              - Ignore specific unit numbers (like RM 304C) if the street number and name match.
              - Abbreviations like 'ST' for 'Street' or 'AL' for 'Alabama' are a match.
              
              Return JSON ONLY with this structure:
              {
                "isMatch": boolean,
                "confidence": number (0-100),
                "reasoning": "Brief explanation of why it matched or failed"
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
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return { success: false, message: "Failed to parse AI response." };
    }

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

      return { success: true, message: "Verification Successful!" };
    } else {
      // ❌ Failure: Return AI reasoning
      return {
        success: false,
        message: `Verification failed: ${result.reasoning}`
      };
    }

  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: "Error processing the document. Please try again." };
  }
}