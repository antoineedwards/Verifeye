"use server"
import * as mindee from "mindee";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase for updating the user status later
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function verifyUserDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file uploaded" };

  // 1. Setup Mindee Client
  const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Load the file into Mindee
    const inputSource = mindeeClient.docFromBuffer(buffer, file.name);

    // 2. Parse using the Financial Document model (Best for Bills)
    const apiResponse = await mindeeClient.parse(
      mindee.product.FinancialDocumentV1, 
      inputSource
    );

    // Get the full text as a lowercase string for searching
    const fullText = apiResponse.document.toString().toLowerCase();

    // 3. Verification Logic
    const userName = session.user.name?.toLowerCase() || "";
    // Grab the first part of the address (the street number)
    const userAddress = (session.user as any).address || "";
    const streetNumber = userAddress.split(' ')[0];

    const hasName = fullText.includes(userName);
    const hasAddress = fullText.includes(streetNumber);

    if (hasName && hasAddress) {
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
      message: "Could not find matching name and address on the document." 
    };

  } catch (error) {
    console.error("Mindee Error:", error);
    return { error: "Error processing the document. Please try again." };
  }
}