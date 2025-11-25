import React, { useState, useMemo } from 'react';
import { TaskColumn, TaskCard } from '../types';

interface CalendarViewProps {
  columns: TaskColumn[];
  onTaskClick: (card: TaskCard, columnId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ columns, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const allTasks = useMemo(() => {
    const tasks: { card: TaskCard; columnId: string }[] = [];
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.startDate) {
          tasks.push({ card, columnId: column.id });
        }
      });
    });
    return tasks;
  }, [columns]);

  const { month, year } = {
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDay = (day: number) => {
    const date = new Date(year, month, day);
    date.setUTCHours(0, 0, 0, 0);
    const dateString = date.toISOString().split('T')[0];

    return allTasks.filter(({ card }) => {
        if (!card.startDate) return false;
        const startDate = new Date(card.startDate).toISOString().split('T')[0];
        if (card.dueDate) {
            const dueDate = new Date(card.dueDate).toISOString().split('T')[0];
            return dateString >= startDate && dateString <= dueDate;
        }
        return dateString === startDate;
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-white">
      <header className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
            <button onClick={handleGoToToday} className="px-3 py-1.5 text-sm font-semibold border rounded-md hover:bg-gray-100">Today</button>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-7 flex-grow gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm py-2 bg-gray-50 text-gray-600">{day}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-start-${i}`} className="bg-gray-50"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
          const day = dayIndex + 1;
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          const tasksForDay = getTasksForDay(day);

          return (
            <div key={day} className="relative bg-white p-2 min-h-[120px] overflow-hidden">
              <span className={`absolute top-2 right-2 text-sm font-semibold ${isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="mt-8 space-y-1">
                {tasksForDay.slice(0, 3).map(({ card, columnId }) => (
                  <div
                    key={card.id}
                    onClick={() => onTaskClick(card, columnId)}
                    className="p-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-semibold cursor-pointer hover:bg-indigo-200 truncate"
                  >
                    {card.content}
                  </div>
                ))}
                {tasksForDay.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium cursor-pointer hover:underline">
                        +{tasksForDay.length - 3} more
                    </div>
                )}
              </div>
            </div>
          );
        })}
        {Array.from({ length: (7 - (firstDayOfMonth + daysInMonth) % 7) % 7 }).map((_, i) => (
          <div key={`empty-end-${i}`} className="bg-gray-50"></div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
