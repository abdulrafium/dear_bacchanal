"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    const handleSave = () => {
        onSave(eventName);
        onClose();
    };

    const handleDelete = () => {
        onSave("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                    {date.month} {date.day}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {isReadOnly
                        ? "Event details"
                        : initialEventName
                            ? "Edit or remove party name"
                            : "Add party name to this date"}
                </p>

                {/* Input */}
                {!isReadOnly && (
                    <div className="mb-6">
                        <label
                            htmlFor="eventName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Party Name
                        </label>
                        <input
                            id="eventName"
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            placeholder="e.g., Vale Fete, J'Ouvert, Tribe Lunch..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none text-black transition-all font-handwritten text-lg"
                            autoFocus
                        />
                    </div>
                )}

                {isReadOnly && (
                    <div className="mb-6">
                        <p className="text-lg font-handwritten text-gray-900">
                            {eventName || "No event scheduled"}
                        </p>
                    </div>
                )}

                {/* Actions */}
                {!isReadOnly && (
                    <div className="flex gap-3">
                        {initialEventName && (
                            <Button
                                onClick={handleDelete}
                                variant="outline"
                                className="flex-1"
                            >
                                Remove
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            variant="carnival"
                            className="flex-1"
                            disabled={!eventName.trim() && !initialEventName}
                        >
                            {initialEventName ? "Update" : "Save"}
                        </Button>
                    </div>
                )}

                {isReadOnly && (
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Close
                    </Button>
                )}
            </div>
        </div>
    );
};
