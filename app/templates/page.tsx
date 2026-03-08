"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Book,
  Calendar,
  ArrowLeft,
  Loader2,
  Share2,
  Image,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShareBookModal } from "@/components/book/ShareBookModal";

interface Template {
  _id: string;
  bookName: string;
  createdAt: string;
  updatedAt: string;
  images: Record<string, string>;
  textData: Record<string, string>;
}

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        toast.error("Please log in to view your templates");
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/templates");

        if (response.status === 401) {
          toast.error("Please log in to view your templates");
          router.push("/");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }

        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Failed to load your books");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [isAuthenticated, authLoading, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageCount = (images: Record<string, string>) => {
    return Object.keys(images).length;
  };

  const handleShare = (template: Template) => {
    setSelectedTemplate(template);
    setIsShareModalOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral via-teal to-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
            <Sparkles className="w-8 h-8 text-yellow absolute top-0 right-0 animate-pulse" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">
            Loading your books...
          </p>
          <p className="text-white/80 text-sm">
            Gathering your carnival memories
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 bg-gradient-to-br from-coral/5 via-teal/5 to-yellow/5   px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-top duration-700">
          <Link href="/book">
            <Button
              variant="outline"
              className="mb-6 border-2 border-coral/60 hover:border-coral hover:bg-coral/10 transition-all duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Book
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-1 bg-gradient-to-b from-coral via-teal to-yellow rounded-full" />
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
              My{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-teal to-yellow">
                Carnival
              </span>{" "}
              Books
            </h1>
          </div>

          <p className="text-muted-foreground text-base sm:text-lg ml-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-coral" />
            Your saved carnival memories - view or continue editing
          </p>

          {templates.length > 0 && (
            <div className="mt-6 ml-4 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 px-4 py-2  backdrop-blur-sm rounded-full border border-coral/20">
                <Book className="w-4 h-4 text-coral" />
                <span className="font-semibold">{templates.length}</span>
                <span>{templates.length === 1 ? "Book" : "Books"}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2  backdrop-blur-sm rounded-full border border-teal/20">
                <Image className="w-4 h-4 text-teal" />
                <span className="font-semibold">
                  {templates.reduce(
                    (acc, t) => acc + getImageCount(t.images),
                    0
                  )}
                </span>
                <span>Total Images</span>
              </div>
            </div>
          )}
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12 sm:py-20 animate-in fade-in zoom-in duration-700">
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 max-w-md mx-auto border-2 border-dashed border-coral/30 hover:border-coral/50 transition-all duration-300 hover:shadow-2xl group">
              <div className="relative inline-block mb-6">
                <Book className="w-20 h-20 text-coral/40 group-hover:text-coral/60 transition-colors duration-300" />
                <Sparkles className="w-8 h-8 text-yellow absolute -top-2 -right-2 animate-pulse" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
                No Books Yet
              </h2>
              <p className="text-black mb-8 text-sm sm:text-base">
                Start your carnival journey by creating your first photo book
              </p>
              <Button
                variant="default"
                asChild
                className="bg-gradient-to-r from-coral via-teal to-yellow text-white hover:shadow-lg hover:scale-105 transition-all duration-300 text-base px-8 py-6 rounded-xl"
              >
                <Link href="/book">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your First Book
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-700">
            {templates.map((template, index) => (
              <div
                key={template._id}
                className="group bg-olive text-black backdrop-blur-md rounded-2xl p-6   transition-all duration-500 shadow-lg hover:shadow-2xl hover:-translate-y-2 cursor-pointer relative overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-coral/0 via-teal/0 to-yellow/0 group-hover:from-coral/5 group-hover:via-teal/5 group-hover:to-yellow/5 transition-all duration-500 rounded-2xl" />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl text-black sm:text-2xl mb-2 line-clamp-2 group-hover:text-coral transition-colors duration-300">
                        {template.bookName}
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-coral/10 to-teal/10 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Book className="w-6 h-6 text-coral" />
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-black mb-6">
                    <div className="flex items-center gap-2 group/item hover:text-foreground transition-colors duration-200">
                      <div className="bg-coral/10 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-coral" />
                      </div>
                      <span>Created {formatDate(template.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 group/item hover:text-foreground transition-colors duration-200">
                      <div className="bg-teal/10 p-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-teal" />
                      </div>
                      <span>Updated {formatDate(template.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 group/item hover:text-foreground transition-colors duration-200">
                      <div className="bg-yellow/10 p-1.5 rounded-lg">
                        <Image className="w-4 h-4 text-yellow" />
                      </div>
                      <span className="font-semibold">
                        {getImageCount(template.images)}
                      </span>
                      <span>
                        {getImageCount(template.images) === 1
                          ? "image"
                          : "images"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-foreground/10 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-coral/60 text-coral hover:bg-coral hover:text-white hover:border-coral transition-all duration-300 hover:shadow-md"
                      asChild
                    >
                      <Link href="/book">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Continue Editing
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-teal/60 text-teal hover:bg-teal hover:text-white hover:border-teal transition-all duration-300 hover:shadow-md hover:rotate-12"
                      onClick={() => handleShare(template)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Modal */}
        <ShareBookModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedTemplate(null);
          }}
        />
      </div>
    </div>
  );
};

export default TemplatesPage;
