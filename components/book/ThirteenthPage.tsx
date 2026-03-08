"use client";
import React, { useState, useEffect } from "react";
import { kalufira } from "./Font";
import Image from "next/image";
import { CalendarEventModal } from "@/components/ui/CalendarEventModal";
import { useBookData } from "./BookDataContext";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/hooks/useAuthModal";

interface CalendarEvent {
  day: number;
  month: string;
  eventName: string;
}

const ThirteenthPage = () => {
  const { data, isReadOnly } = useBookData();
  const { data: session } = useSession();
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
    if (!session) {
      openModal("signin");
      return;
    }

    setSelectedDate({ day, month });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventName: string) => {
    if (!selectedDate) return;

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
      const response = await fetch('/api/book-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        className={`rounded-lg flex flex-col items-center justify-center h-16 ${!isReadOnly ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
          } relative group`}
        onClick={() => handleDateClick(day, month)}
      >
        <span className="text-2xl text-black">{day}</span>
        {hasEvent && (
          <span className="text-[10px] sm:text-xs text-black font-handwritten font-bold truncate max-w-full px-1">
            {event.eventName}
          </span>
        )}
        {isSpecial && specialLabel && (
          <span
            className={`${kalufira.className} text-white text-[15px] sm:text-lg font-black block -mt-1`}
            style={{ WebkitTextStroke: "1px black" }}
          >
            {specialLabel}
          </span>
        )}
      </div>
    );
  };

  const currentEvent = selectedDate ? getEventForDate(selectedDate.day, selectedDate.month) : null;
  return (
    <>
      {/* Thirteenth Page */}
      <section className="min-h-screen relative w-full bg-[#009d94] p-8 overflow-hidden">
        <Image
          src="/assets/layer-17.png"
          alt="Overlay"
          fill
          className="object-cover absolute pointer-events-none"
          priority
        />
        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-12 ">
            <h1
              className={`${kalufira.className} text-5xl md:text-7xl font-black text-black mb-2 tracking-tight z-50 `}
            >
              CARNIVAL CALENDAR
            </h1>
          </div>

          {/* Calendar Grid */}
          <div className="grid lg:grid-cols-2 gap-8 ">
            {/* January */}
            <div className=" rounded-3xl p-6  ">
              <h2
                className={`${kalufira.className} text-4xl font-black text-black mb-6 text-center`}
              >
                JANUARY
              </h2>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-handwritten font-bold text-black text-2xl"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Week 1 */}
                <div className="h-16"></div>
                <div className="h-16"></div>
                <div className="h-16"></div>
                <div className="h-16"></div>
                {renderCalendarDay(1, "January")}
                {renderCalendarDay(2, "January")}
                {renderCalendarDay(3, "January")}

                {/* Week 2 */}
                {renderCalendarDay(4, "January")}
                {renderCalendarDay(5, "January")}
                {renderCalendarDay(6, "January")}
                {renderCalendarDay(7, "January")}
                {renderCalendarDay(8, "January")}
                {renderCalendarDay(9, "January")}
                {renderCalendarDay(10, "January")}

                {/* Week 3 */}
                {renderCalendarDay(11, "January")}
                {renderCalendarDay(12, "January")}
                {renderCalendarDay(13, "January")}
                {renderCalendarDay(14, "January")}
                {renderCalendarDay(15, "January")}
                {renderCalendarDay(16, "January")}
                {renderCalendarDay(17, "January")}

                {/* Week 4 */}
                {renderCalendarDay(18, "January")}
                {renderCalendarDay(19, "January")}
                {renderCalendarDay(20, "January")}
                {renderCalendarDay(21, "January")}
                {renderCalendarDay(22, "January")}
                {renderCalendarDay(23, "January")}
                {renderCalendarDay(24, "January")}

                {/* Week 5 */}
                {renderCalendarDay(25, "January")}
                {renderCalendarDay(26, "January")}
                {renderCalendarDay(27, "January")}
                {renderCalendarDay(28, "January")}
                {renderCalendarDay(29, "January")}
                {renderCalendarDay(30, "January")}
                {renderCalendarDay(31, "January")}
              </div>
            </div>

            {/* February */}
            <div className=" rounded-3xl p-6  ">
              <h2
                className={`${kalufira.className} text-4xl font-black text-black mb-6 text-center`}
              >
                FEBRUARY
              </h2>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-black text-black text-2xl font-handwritten"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Week 1 */}
                {renderCalendarDay(1, "February")}
                {renderCalendarDay(2, "February")}
                {renderCalendarDay(3, "February")}
                {renderCalendarDay(4, "February")}
                {renderCalendarDay(5, "February")}
                {renderCalendarDay(6, "February")}
                {renderCalendarDay(7, "February")}

                {/* Week 2 */}
                {renderCalendarDay(8, "February")}
                {renderCalendarDay(9, "February")}
                {renderCalendarDay(10, "February")}
                {renderCalendarDay(11, "February")}
                {renderCalendarDay(12, "February")}
                {renderCalendarDay(13, "February")}
                {renderCalendarDay(14, "February")}

                {/* Week 3 - Carnival Days */}
                {renderCalendarDay(15, "February")}
                <div className=" rotate-[-8deg] ">
                  <span
                    className={`${kalufira.className} text-white hidden sm:block text-[15px] sm:text-lg font-black `}
                    style={{ WebkitTextStroke: "1px black" }}
                  >
                    Carnival
                  </span>
                  <span
                    className={`${kalufira.className} text-white text-[15px] sm:text-lg font-black block -mt-1`}
                    style={{ WebkitTextStroke: "1px black" }}
                  >
                    Monday
                  </span>
                </div>

                <div className=" rotate-[-8deg] ">
                  <span
                    className={`${kalufira.className} text-white text-[15px] sm:text-lg font-black hidden sm:block `}
                    style={{ WebkitTextStroke: "1px black" }}
                  >
                    Carnival
                  </span>
                  <span
                    className={`${kalufira.className} text-white text-[15px] sm:text-lg font-black block -mt-1 relative top-5 sm:top-0`}
                    style={{ WebkitTextStroke: "1px black" }}
                  >
                    Tuseday
                  </span>
                </div>
                {renderCalendarDay(18, "February")}
                {renderCalendarDay(19, "February")}
                {renderCalendarDay(20, "February")}
                {renderCalendarDay(21, "February")}

                {/* Week 4 */}
                {renderCalendarDay(22, "February")}
                {renderCalendarDay(23, "February")}
                {renderCalendarDay(24, "February")}
                {renderCalendarDay(25, "February")}
                {renderCalendarDay(26, "February")}
                {renderCalendarDay(27, "February")}
                {renderCalendarDay(28, "February")}
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
    </>
  );
};

export default ThirteenthPage;
