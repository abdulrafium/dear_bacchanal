"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, BookOpen, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import Link from "next/link";
import { getAvailableTemplates, BookTemplate } from "@/lib/book-templates";
import { toast } from "sonner";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<BookTemplate[]>(getAvailableTemplates());

  const toggleLive = async (templateName: string) => {
    try {
      const template = templates.find(t => t.name === templateName);
      const newStatus = !template?.isActive;

      const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (res.ok) {
        setTemplates(templates.map(t => t.name === templateName ? { ...t, isActive: newStatus } : t));
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
        setTemplates(templates.filter(t => t.name !== templateName));
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {template.spreads.length} Spreads
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.country} • {template.year}</p>
                </div>
                <button 
                  onClick={() => toggleLive(template.name)}
                  className={`${template.isActive ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'} transition-colors`}
                  title="Toggle Live Status"
                >
                  {template.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mt-2 mb-4">
                {template.description}
              </p>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Link 
                  href={`/admin/templates/create?templateName=${encodeURIComponent(template.name)}`}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button 
                  onClick={() => handleDelete(template.name)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <Link 
          href="/admin/templates/create"
          className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center min-h-[300px] hover:border-[#2d2d2d] hover:bg-gray-100 transition-all group"
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#2d2d2d]" />
          </div>
          <h3 className="font-medium text-gray-700">Create New Template</h3>
          <p className="text-sm text-gray-500 mt-1">Start from scratch using the editor</p>
        </Link>
      </div>
    </div>
  );
}
