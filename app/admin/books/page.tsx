"use client";

import { useEffect, useState } from "react";
import { BookOpen, User, Calendar, ImageIcon, Edit2, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("/api/admin/books");
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
        }
      } catch (err) {
        console.error("Failed to fetch books", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-white animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Books Catalog</h1>
          <p className="text-white/40 text-sm">Review activity and content across all user-created books</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-white/40 font-medium mb-2">No user books found</h3>
          <p className="text-white/20 text-sm max-w-xs mx-auto">When users start creating their books, they will appear here for you to review and manage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div 
              key={book._id} 
              className="group bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white/60" />
                </div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                  {book.activeTemplateName || "DEAR BACCHANAL"}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-white/80 font-semibold mb-1">
                    <User className="w-3.5 h-3.5 text-white/40" />
                    {book.userId}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/30">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated: {book.updatedAt ? format(new Date(book.updatedAt), "PPP p") : "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                    <div className="text-[9px] text-white/30 uppercase font-black mb-1">Total Spreads</div>
                    <div className="text-lg font-bold text-white">{(book.spreads?.length || 0)}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
                    <div className="text-[9px] text-white/30 uppercase font-black mb-1">Photos/Elements</div>
                    <div className="text-lg font-bold text-white">{book.imageCount || 0}</div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Link 
                    href={`/editor?isAdmin=true&userId=${book.userId}`}
                    className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Review Content
                  </Link>
                  <button className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/5 transition-colors">
                    <ExternalLink className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
