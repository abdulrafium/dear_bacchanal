"use client";

import { BookOpen } from "lucide-react";

export default function AdminBooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Books</h1>
        <p className="text-white/40 text-sm">Manage books by country and yearly editions</p>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
        <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
        <h3 className="text-white/40 font-medium mb-2">Book management coming soon</h3>
        <p className="text-white/20 text-sm">Create and manage carnival books for multiple countries (USA, UK, Canada) with yearly editions (2025, 2026).</p>
      </div>
    </div>
  );
}
