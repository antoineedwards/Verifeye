"use client"
import { useState } from "react";
import { verifyUserDocument } from "@/app/actions/verify-document";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

interface DocumentUploadProps {
  onVerify: () => void;
  onBack: () => void;
}

export function DocumentUpload({ onVerify, onBack }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await verifyUserDocument(formData);
    setResult(res);
    setLoading(false);

    // If verification was successful, proceed to next step
    if (res.success) {
      setTimeout(() => {
        onVerify();
      }, 1500);
    }
  }

  return (
    <div className="flex flex-col h-full p-6 bg-background">
      <Button variant="ghost" onClick={onBack} className="self-start -ml-4 mb-6">
        ← Back
      </Button>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Upload Proof of Residency</h2>
          <p className="text-muted-foreground">
            Upload a utility bill, lease agreement, or other official document. Ensure your name and address are clearly visible.
          </p>
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            onChange={handleUpload} 
            disabled={loading || result?.success}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {fileName && <p className="text-xs text-muted-foreground mt-2">Selected: {fileName}</p>}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
            <p>Analyzing document...</p>
          </div>
        )}
        
        {result?.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">{result.message}</p>
          </motion.div>
        )}

        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700">{result.message || result.error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}