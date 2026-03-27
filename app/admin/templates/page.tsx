"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, BookOpen, ToggleLeft, ToggleRight, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { getAvailableTemplates, BookTemplate } from "@/lib/book-templates";
import { toast } from "sonner";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/templates");
      if (res.ok) {
        const data = await res.json();
        const dbTemplates = data.templates || [];
        const hardTemplates = getAvailableTemplates();
        
        // Merge - DB wins on name
        const merged = [...dbTemplates];
        hardTemplates.forEach(ht => {
          if (!merged.find(m => (m.templateName || m.name) === ht.name)) {
            merged.push({
              _id: ht.id, 
              templateName: ht.name,
              thumbnail: ht.thumbnail,
              country: ht.country,
              year: ht.year,
              description: ht.description,
              spreads: ht.spreads,
              isActive: ht.isActive !== false,
              isHardCoded: true
            });
          }
        });
        
        setTemplates(merged);
      }
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const toggleLive = async (templateName: string) => {
    try {
      const template = templates.find(t => (t.templateName || t.name) === templateName);
      const newStatus = !template?.isActive;

      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (res.ok) {
        setTemplates(templates.map(t => (t.templateName || t.name) === templateName ? { ...t, isActive: newStatus } : t));
        toast.success(`Template ${newStatus ? 'activated' : 'deactivated'}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (templateName: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateName)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setTemplates(templates.filter(t => (t.templateName || t.name) !== templateName));
        toast.success("Template deleted");
      } else {
        toast.error("Failed to delete template");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleUploadPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info("Uploading PDF and processing into template...");
      setTimeout(() => {
        toast.success("PDF processed successfully! (Mocked)");
      }, 2000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Book Templates
          </h1>
          <p className="text-gray-500 mt-1">Manage, create, and upload templates for the Dear Bacchanal editor</p>
        </div>
        
        <div className="flex gap-4">
          <label className="bg-white border-2 border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            Upload PDF
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleUploadPDF}
            />
          </label>
          
          <Link 
            href="/admin/templates/create"
            className="bg-[#2d2d2d] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#404040] transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#2d2d2d] animate-spin mb-4" />
          <p className="text-gray-500 font-medium font-body animate-pulse">Loading templates from cloud...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => {
            const name = template.templateName || template.name;
            return (
              <div key={template._id || template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="aspect-[4/3] relative bg-[#9f2e2b] overflow-hidden">
                  <img 
                    src={template.thumbnail} 
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#2d2d2d] shadow-sm flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {template.spreads?.length || 0} Spreads
                    </div>
                  </div>
                  {template.isHardCoded && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white tracking-widest uppercase">
                        ReadOnly
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-gray-900 truncate tracking-tight">{name}</h3>
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-tighter">{template.country} • {template.year}</p>
                    </div>
                    <button 
                      onClick={() => toggleLive(name)}
                      className={`${template.isActive ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'} transition-all`}
                    >
                      {template.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2 font-body font-normal leading-relaxed h-10">
                    {template.description}
                  </p>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link 
                      href={`/admin/templates/create?templateName=${encodeURIComponent(name)}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-[#2d2d2d] bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all hover:border-gray-300"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Details
                    </Link>
                    {!template.isHardCoded && (
                      <button 
                        onClick={() => handleDelete(name)}
                        className="p-2 aspect-square rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Link 
            href="/admin/templates/create"
            className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center min-h-[350px] hover:border-[#2d2d2d] hover:bg-white transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-lg group-hover:bg-[#2d2d2d]">
              <Plus className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 tracking-tight">Create New Template</h3>
            <p className="text-xs text-gray-500 mt-2 font-medium">Design a new carnival story from scratch</p>
          </Link>
        </div>
      )}
    </div>
  );
}

