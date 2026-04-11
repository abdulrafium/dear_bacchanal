"use client";
import { useState, useEffect, useRef } from "react";
import { X, Calendar, Edit3, Trash2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

interface CalendarEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: { day: number; month: string };
    initialEventName?: string;
    onSave: (eventName: string) => void;
    isReadOnly?: boolean;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
    isOpen,
    onClose,
    date,
    initialEventName = "",
    onSave,
    isReadOnly = false,
}) => {
    const [eventName, setEventName] = useState(initialEventName);
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setEventName(initialEventName);
            // Animation for modal opening
            if (modalRef.current && backdropRef.current) {
                gsap.fromTo(backdropRef.current, 
                    { opacity: 0 }, 
                    { opacity: 1, duration: 0.3 }
                );
                gsap.fromTo(modalRef.current, 
                    { scale: 0.8, opacity: 0, y: 20 }, 
                    { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
                );
            }
        }
    }, [isOpen, initialEventName]);

    const handleSave = () => {
        onSave(eventName);
        handleClose();
    };

    const handleDelete = () => {
        onSave("");
        handleClose();
    };

    const handleClose = () => {
        if (modalRef.current && backdropRef.current) {
            gsap.to(modalRef.current, { scale: 0.8, opacity: 0, y: 20, duration: 0.3 });
            gsap.to(backdropRef.current, { opacity: 0, duration: 0.3, onComplete: onClose });
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div
                ref={backdropRef}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Modal */}
            <div 
                ref={modalRef}
                className="relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-md w-full mx-4 overflow-hidden border border-white/20"
            >
                {/* Carnival Gradient Top Bar */}
                <div className="h-2 bg-gradient-to-r from-[#fbba00] via-[#d22e56] to-[#009d94]" />

                <div className="p-8">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hove:text-gray-900 transition-all duration-200"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm relative group overflow-hidden">
                            <Calendar className="w-8 h-8 text-[#d22e56]" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                                {date.day} {date.month}
                            </h2>
                            <p className="text-gray-500 font-medium text-sm mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5 text-[#fbba00]" />
                                {isReadOnly ? "View Note" : initialEventName ? "Edit Note" : "Add Note"}
                            </p>
                        </div>
                    </div>

                    {/* Input Section */}
                    {!isReadOnly ? (
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="eventName"
                                    className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]"
                                >
                                    Write Your Notes
                                </label>
                                <Edit3 className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            <div className="relative group">
                                <textarea
                                    id="eventName"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="Add something special about this day..."
                                    className="w-full h-32 px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-black transition-all focus:border-[#009d94] focus:ring-4 focus:ring-[#009d94]/10 font-handwritten text-xl resize-none placeholder:text-gray-300"
                                    autoFocus
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-300">
                                    {eventName.length} characters
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-10 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 min-h-[120px] relative">
                             <div className="absolute top-4 left-4 text-gray-200">
                                <Edit3 className="w-8 h-8 opacity-10" />
                             </div>
                            <p className="text-2xl font-handwritten text-gray-900 text-center leading-relaxed">
                                {eventName || "No notes available for this day"}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    {!isReadOnly ? (
                        <div className="flex gap-4">
                            {initialEventName && (
                                <button
                                    onClick={handleDelete}
                                    className="px-6 h-14 rounded-2xl border-2 border-red-50 hover:bg-red-50 text-red-500 transition-all font-bold flex items-center justify-center gap-2 group"
                                >
                                    <Trash2 className="w-5 h-5 group-hover:shake" />
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={!eventName.trim() && !initialEventName}
                                className={`flex-1 h-14 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 active:scale-95 ${
                                    !eventName.trim() && !initialEventName ? "opacity-30 grayscale cursor-not-allowed" : "hover:bg-gray-900 hover:-translate-y-0.5"
                                }`}
                            >
                                <Check className="w-5 h-5" />
                                {initialEventName ? "Update" : "Save Note"}
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleClose} 
                            className="w-full h-14 rounded-2xl border-2 border-gray-100 text-gray-900 font-bold hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                @keyframes shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                    100% { transform: rotate(0deg); }
                }
                .group:hover .group-hover\:shake {
                    animation: shake 0.3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
