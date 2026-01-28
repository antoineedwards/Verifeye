"use client"
import { useState } from "react";
import { verifyUserDocument } from "@/app/actions/verify-document";

export function DocumentUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await verifyUserDocument(formData);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center">
      <h3 className="text-lg font-bold mb-2">Upload Utility Bill</h3>
      <p className="text-sm text-gray-500 mb-4">Please ensure your name and address are clearly visible.</p>
      
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        onChange={handleUpload} 
        disabled={loading}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {loading && <p className="mt-4 text-blue-600 animate-pulse">Analyzing document...</p>}
      
      {result && (
        <p className={`mt-4 font-semibold ${result.success ? "text-green-600" : "text-red-600"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}