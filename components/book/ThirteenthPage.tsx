"use client";
import React, { useState, useEffect } from "react";
import { kalufira } from "./Font";
import Image from "next/image";
import { CalendarEventModal } from "@/components/ui/CalendarEventModal";
import { useBookData } from "./BookDataContext";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";

interface CalendarEvent {
  day: number;
  month: string;
  eventName: string;
}

const ThirteenthPage = () => {
  const { data, isReadOnly } = useBookData();
  const { user, isAuthenticated, getToken } = useAuth();
  const { openModal } = useAuthModal();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: string } | null>(null);

  // Load events from context or fetch from API
  useEffect(() => {
    if (data.textData && data.textData['calendar-events']) {
      try {
        const savedEvents = JSON.parse(data.textData['calendar-events']);
        setEvents(savedEvents);
      } catch (error) {
        console.error('Error parsing calendar events:', error);
      }
    } else if (!isReadOnly) {
      const fetchEvents = async () => {
        try {
          const response = await fetch('/api/book-data');
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data['calendar-events']) {
              const savedEvents = JSON.parse(result.data['calendar-events']);
              setEvents(savedEvents);
            }
          }
        } catch (error) {
          console.error('Error fetching calendar events:', error);
        }
      };
      fetchEvents();
    }
  }, [data.textData, isReadOnly]);

  const handleDateClick = (day: number, month: string) => {
    if (!isAuthenticated && !isReadOnly) {
      openModal("signin");
      return;
    }

    setSelectedDate({ day, month });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventName: string) => {
    if (!selectedDate || isReadOnly) return;

    const newEvents = events.filter(
      (e) => !(e.day === selectedDate.day && e.month === selectedDate.month)
    );

    if (eventName.trim()) {
      newEvents.push({
        day: selectedDate.day,
        month: selectedDate.month,
        eventName: eventName.trim(),
      });
    }

    setEvents(newEvents);

    // Save to database
    try {
      const token = await getToken(true);
      const response = await fetch('/api/book-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('fb_token') || ""}`,
          'x-user-email': localStorage.getItem('fb_user_email') || "",
          'x-user-id': localStorage.getItem('fb_user_id') || ""
        },
        body: JSON.stringify({
          fieldId: 'calendar-events',
          value: JSON.stringify(newEvents),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event. Please try again.');
    }
  };

  const getEventForDate = (day: number, month: string) => {
    return events.find((e) => e.day === day && e.month === month);
  };

  const renderCalendarDay = (day: number, month: string, isSpecial?: boolean, specialLabel?: string) => {
    const event = getEventForDate(day, month);
    const hasEvent = !!event;

    return (
      <div
        className={`rounded-xl flex flex-col items-center p-1.5 transition-all duration-300 relative group overflow-hidden ${
          !isReadOnly 
            ? 'cursor-pointer hover:bg-white/20 active:scale-95' 
            : hasEvent ? 'cursor-pointer hover:bg-white/10' : ''
        }`}
        style={{ minHeight: '4.5rem' }}
        onClick={() => handleDateClick(day, month)}
      >
        <div className="flex flex-col items-center w-full">
          <span className={`text-2xl font-black leading-none mb-1 ${isSpecial ? 'text-white' : 'text-black/80'} group-hover:text-black transition-colors`}>
            {day}
          </span>
          
          {hasEvent && (
            <div className="w-full flex flex-col items-center gap-1 mt-1">
               <div className="w-4 h-0.5 bg-black/10 rounded-full" />
               <span className="text-[9px] leading-[1.1] text-white bg-black/60 backdrop-blur-md rounded-md px-2 py-1 font-handwritten text-center break-words w-full line-clamp-2">
                {event.eventName}
              </span>
            </div>
          )}
        </div>

        {hasEvent && (
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d22e56] rounded-full border border-white shadow-sm animate-pulse" />
        )}
        
        {isSpecial && specialLabel && (
          <div className="flex flex-col items-center mt-auto pb-1 scale-90 sm:scale-100 origin-bottom">
             <span
              className={`${kalufira.className} text-white text-[11px] sm:text-[13px] font-black leading-none`}
              style={{ WebkitTextStroke: "1px black" }}
            >
              {specialLabel.split(' ')[0]}
            </span>
            <span
              className={`${kalufira.className} text-white text-[11px] sm:text-[13px] font-black leading-none`}
              style={{ WebkitTextStroke: "1px black" }}
            >
              {specialLabel.split(' ')[1]}
            </span>
          </div>
        )}
      </div>
    );
  };

  const currentEvent = selectedDate ? getEventForDate(selectedDate.day, selectedDate.month) : null;
  
  return (
    <>
      <section className="min-h-screen relative w-full bg-[#009d94] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <Image
          src="/assets/layer-17.png"
          alt="Overlay"
          fill
          className="object-cover absolute pointer-events-none opacity-80"
          priority
        />
        
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-16">
            <h1
              className={`${kalufira.className} text-5xl md:text-8xl font-black text-black mb-2 tracking-tight drop-shadow-sm`}
            >
              CARNIVAL CALENDAR
            </h1>
            <div className="h-1.5 w-32 bg-black mx-auto rounded-full opacity-20" />
          </div>

          {/* Calendar Grid */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* January */}
            <div className="relative group/month">
              <h2
                className={`${kalufira.className} text-4xl sm:text-5xl font-black text-black mb-8 text-center group-hover/month:scale-110 transition-transform duration-500`}
              >
                JANUARY
              </h2>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-handwritten font-black text-black/40 text-sm uppercase tracking-widest"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-x-1 gap-y-3 sm:gap-4">
                {/* Week 1 padding */}
                <div className="h-16"></div>
                <div className="h-16"></div>
                <div className="h-16"></div>
                <div className="h-16"></div>
                {renderCalendarDay(1, "January")}
                {renderCalendarDay(2, "January")}
                {renderCalendarDay(3, "January")}

                {/* Remaining Weeks */}
                {Array.from({ length: 28 }, (_, i) => renderCalendarDay(i + 4, "January"))}
              </div>
            </div>

            {/* February */}
            <div className="relative group/month">
              <h2
                className={`${kalufira.className} text-4xl sm:text-5xl font-black text-black mb-8 text-center group-hover/month:scale-110 transition-transform duration-500`}
              >
                FEBRUARY
              </h2>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-handwritten font-black text-black/40 text-sm uppercase tracking-widest"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-x-1 gap-y-3 sm:gap-4">
                {/* February 1-15 */}
                {Array.from({ length: 15 }, (_, i) => renderCalendarDay(i + 1, "February"))}
                
                {/* Carnival Monday & Tuesday */}
                {renderCalendarDay(16, "February", true, "Carnival Monday")}
                {renderCalendarDay(17, "February", true, "Carnival Tuesday")}
                
                {/* February 18-28 */}
                {Array.from({ length: 11 }, (_, i) => renderCalendarDay(i + 18, "February"))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Event Modal */}
        {selectedDate && (
          <CalendarEventModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            date={selectedDate}
            initialEventName={currentEvent?.eventName || ""}
            onSave={handleSaveEvent}
            isReadOnly={isReadOnly}
          />
        )}
      </section>
      
      <style jsx>{`
        section {
            background: linear-gradient(135deg, #009d94 0%, #00857d 100%);
        }
      `}</style>
    </>
  );
};

export default ThirteenthPage;
