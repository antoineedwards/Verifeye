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
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file uploaded" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a document verification assistant. Extract the full name and address from the provided image. Return ONLY a JSON object with keys 'name' and 'address'. If the text is illegible or does not contain a name/address, return null for those values. Do not include markdown formatting (like ```json), just the raw JSON string."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the name and address from this document." },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    if (!content) return { success: false, message: "Could not analyze document." };

    let extractedData: { name: string | null; address: string | null };
    try {
      // basic cleanup to ensure valid JSON parsing
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("JSON Parse Error:", e, content);
      return { success: false, message: "Failed to parse document data." };
    }

    if (!extractedData.name || !extractedData.address) {
      return { success: false, message: "Could not find valid name or address in document." };
    }

    // 3. Verification Logic
    // Normalize logic
    const sessionName = (session.user.name || "").toLowerCase();
    const extractedName = extractedData.name.toLowerCase();

    // Address comparison - fairly loose matching
    // We check if the street number from the user's profile is present in the extracted address
    const userAddress = (session.user as any).address || "";
    const streetNumber = userAddress.split(' ')[0];

    // Basic verification: Check if session name is vaguely in extracted name (or vice versa)
    // and if existing address street number is in extracted address
    const nameMatch = extractedName.includes(sessionName) || sessionName.includes(extractedName);
    const addressMatch = extractedData.address.toLowerCase().includes(streetNumber.toLowerCase());

    if (nameMatch && addressMatch) {
      // 4. Update Supabase status
      await supabase
        .schema("next_auth")
        .from("users")
        .update({ verification_status: 'verified' })
        .eq("id", session.user.id);

      return { success: true, message: "Verification Successful!" };
    }

    return {
      success: false,
      message: `Verification failed. Found Name: ${extractedData.name}, Address: ${extractedData.address}. Expected match for: ${sessionName}, ${userAddress}`
    };

  } catch (error) {
    console.error("OpenAI Error:", error);
    return { error: "Error processing the document. Please try again." };
  }
}