
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TaskColumn, TaskCard, User, Point } from '../types';

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div title={user.name} className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs border-2 border-white`} style={{ backgroundColor: user.color || '#64748b'}}>
      {user.initials}
    </div>
  );
};

interface TimelineProps {
  columns: TaskColumn[];
  users: User[];
  onTaskClick: (card: TaskCard, columnId: string) => void;
}

const DAY_WIDTH = 40; // width of a single day cell in pixels
const ROW_HEIGHT = 48; // height of a row for a task

const dateDiffInDays = (a: Date, b: Date) => {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

const Timeline: React.FC<TimelineProps> = ({ columns, users, onTaskClick }) => {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  
  const { allTasks, startDate, endDate, totalDays } = useMemo(() => {
    const tasks: { card: TaskCard; columnId: string }[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.startDate && card.dueDate) {
          tasks.push({ card, columnId: column.id });
          const start = new Date(card.startDate);
          const end = new Date(card.dueDate);
          if (!minDate || start < minDate) minDate = start;
          if (!maxDate || end > maxDate) maxDate = end;
        }
      });
    });

    if (!minDate || !maxDate) {
      minDate = new Date();
      maxDate = new Date();
      maxDate.setDate(minDate.getDate() + 30);
    }
    
    const startDate = new Date(minDate);
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 7); // Add some padding
    const endDate = new Date(maxDate);
    endDate.setUTCHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 7); // Add some padding

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return { allTasks: tasks, startDate, endDate, totalDays };
  }, [columns]);
  
  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  
  // 1. Group tasks into rows to avoid overlaps
  const taskRows = useMemo(() => {
    const rows: { card: TaskCard; columnId: string }[][] = [];
    const sortedTasks = allTasks
        .filter(t => t.card.startDate && t.card.dueDate)
        .sort((a, b) => new Date(a.card.startDate!).getTime() - new Date(b.card.startDate!).getTime());

    sortedTasks.forEach(task => {
        let placed = false;
        const taskStart = new Date(task.card.startDate!);
        
        for (let i = 0; i < rows.length; i++) {
            const lastTaskInRow = rows[i][rows[i].length - 1];
            if (new Date(lastTaskInRow.card.dueDate!) < taskStart) {
                rows[i].push(task);
                placed = true;
                break;
            }
        }

        if (!placed) {
            rows.push([task]);
        }
    });
    return rows;
  }, [allTasks]);
    
  // 2. Calculate pixel positions for each task based on its row
  const taskPositions = useMemo(() => {
    const positions = new Map<string, { top: number, left: number, width: number }>();
    taskRows.forEach((row, rowIndex) => {
      row.forEach(({ card }) => {
        if (!card.startDate || !card.dueDate) return;
        const taskStart = new Date(card.startDate);
        const taskEnd = new Date(card.dueDate);
        const leftOffsetDays = dateDiffInDays(startDate, taskStart);
        const durationDays = dateDiffInDays(taskStart, taskEnd) + 1;
        positions.set(card.id, {
          top: rowIndex * ROW_HEIGHT + 4,
          left: leftOffsetDays * DAY_WIDTH,
          width: durationDays * DAY_WIDTH,
        });
      });
    });
    return positions;
  }, [taskRows, startDate]);


  useEffect(() => {
    // Scroll to today's date on initial load
    if (timelineContainerRef.current) {
        const today = new Date();
        if (today >= startDate && today <= endDate) {
            const offsetDays = dateDiffInDays(startDate, today);
            const scrollLeft = offsetDays * DAY_WIDTH - (timelineContainerRef.current.clientWidth / 2);
            timelineContainerRef.current.scrollLeft = scrollLeft;
        }
    }
  }, [startDate, endDate]);


  const renderHeader = () => {
    const months: { name: string, days: number, year: number }[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const effectiveEndDate = lastDayOfMonth > endDate ? endDate : lastDayOfMonth;
      const daysInMonth = effectiveEndDate.getDate() - currentDate.getDate() + 1;


      months.push({ name: `${monthName} ${year}`, days: daysInMonth, year });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }
    
    return (
        <div className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm">
            <div className="flex" style={{ width: totalDays * DAY_WIDTH }}>
                {months.map((month, index) => (
                    <div key={index} className="text-center font-semibold text-gray-700 border-b border-r border-gray-200 py-1" style={{ width: month.days * DAY_WIDTH }}>
                        {month.name}
                    </div>
                ))}
            </div>
            <div className="flex" style={{ width: totalDays * DAY_WIDTH }}>
                {Array.from({ length: totalDays }).map((_, i) => {
                    const day = new Date(startDate);
                    day.setDate(startDate.getDate() + i);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`flex-shrink-0 text-center text-sm py-1 border-r border-gray-200 ${isToday ? 'bg-indigo-100 font-semibold' : ''}`} style={{ width: DAY_WIDTH }}>
                            <span className={`${isToday ? 'text-indigo-600' : 'text-gray-600'} text-xs`}>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            <br />
                            <span className={`${isToday ? 'text-indigo-800' : 'text-gray-900'}`}>{day.getDate()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="w-full h-full overflow-auto custom-scrollbar bg-white" ref={timelineContainerRef}>
      <div className="relative" style={{ height: (taskRows.length + 1) * ROW_HEIGHT }}>
        {renderHeader()}
        <div className="relative" style={{ width: totalDays * DAY_WIDTH, height: taskRows.length * ROW_HEIGHT }}>
          {/* Grid lines */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
                <div key={i} className={`absolute top-0 bottom-0 border-r border-gray-200 ${isToday ? 'bg-indigo-50' : ''}`} style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }} />
            );
          })}

          {/* Task bars */}
          {taskRows.map((row) => (
            row.map(({ card, columnId }) => {
              const pos = taskPositions.get(card.id);
              if (!pos) return null;
              
              const assignedUsers = (card.assignedUserIds || []).map(id => usersMap.get(id)).filter(Boolean) as User[];
              
              const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && (card.checklist?.some(c => !c.completed) || !card.checklist || card.checklist.length === 0);
              const isComplete = card.checklist && card.checklist.length > 0 && card.checklist.every(c => c.completed);
              
              let bgColor = 'bg-blue-500';
              if (isComplete) bgColor = 'bg-green-500';
              else if (isOverdue) bgColor = 'bg-red-500';

              return (
                <div
                  key={card.id}
                  className={`absolute h-10 rounded-md text-white text-sm flex items-center px-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 shadow-sm hover:shadow-lg ${bgColor}`}
                  style={{ top: pos.top, left: pos.left, width: pos.width - 4 /* small gap */ }}
                  onClick={() => onTaskClick(card, columnId)}
                >
                  <span className="truncate font-medium">{card.content}</span>
                  {assignedUsers.length > 0 && (
                      <div className="flex -space-x-2 ml-auto pl-2">
                          {assignedUsers.map(user => <UserAvatar key={user.id} user={user}/>)}
                      </div>
                  )}
                </div>
              );
            })
          ))}

          {/* Dependency lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="0"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>
            {allTasks.map(({ card }) => {
              if (!card.dependencies || card.dependencies.length === 0) return null;

              const toPos = taskPositions.get(card.id);
              if (!toPos) return null;

              return card.dependencies.map(depId => {
                const fromPos = taskPositions.get(depId);
                if (!fromPos) return null;

                const startX = fromPos.left + fromPos.width;
                const startY = fromPos.top + 20; // Mid-height of the bar
                const endX = toPos.left;
                const endY = toPos.top + 20;

                const midX = startX + 20; // Control point for curve

                const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX - 10} ${endY}`;
                
                return (
                  <path
                    key={`${depId}-${card.id}`}
                    d={pathData}
                    stroke="#64748b"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                );
              });
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
