interface SpecialDay {
  day: number;
  label: string;
  rotate: number;
}

interface CalendarMonthProps {
  month: number; // 0-11
  year: number;
  specialDays: SpecialDay[];
}

export function CalendarMonth({ month, year, specialDays }: CalendarMonthProps) {
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDay = new Date(year, month, 1).getDay();
  
  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of day objects
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push({ type: 'empty', day: null });
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const specialDay = specialDays.find(sd => sd.day === day);
    days.push({ 
      type: specialDay ? 'special' : 'normal', 
      day, 
      specialDay 
    });
  }

  return (
    <div className="rounded-3xl p-6 shadow-2xl border-4 border-black">
      <h2 className="text-4xl font-black text-black mb-6 text-center">
        {monthNames[month]}
      </h2>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center font-bold text-black text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((dayData, index) => {
          if (dayData.type === 'empty') {
            return <div key={`empty-${index}`} className="h-16"></div>;
          }

          if (dayData.type === 'special' && dayData.specialDay) {
            const lines = dayData.specialDay.label.split('\n');
            return (
              <div
                key={`day-${dayData.day}`}
                className={`bg-yellow-400 rounded-lg flex flex-col items-center justify-center h-16 border-4 border-black shadow-lg transform rotate-${dayData.specialDay.rotate}`}
                style={{ transform: `rotate(${dayData.specialDay.rotate}deg)` }}
              >
                {lines.map((line, i) => (
                  <span
                    key={i}
                    className="text-xs font-black text-black uppercase leading-tight"
                  >
                    {line}
                  </span>
                ))}
              </div>
            );
          }

          return (
            <div
              key={`day-${dayData.day}`}
              className="rounded-lg flex items-center justify-center h-16 border-2 border-black"
            >
              <span className="text-2xl font-bold text-black">
                {dayData.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}