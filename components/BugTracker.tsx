import React, { useMemo, useRef, useEffect } from 'react';
import { BugReport, User, BugStatus, TaskPriority, Label } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { BugIcon } from './icons/BugIcon';
import { PriorityIcon } from './icons/PriorityIcon';

// --- Contrast Helper ---
function getContrastYIQ(hexcolor: string) {
  if (hexcolor.startsWith('#')) {
    hexcolor = hexcolor.slice(1);
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'text-black' : 'text-white';
}

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  const colors = [
    'bg-red-200 text-red-800', 'bg-blue-200 text-blue-800', 'bg-green-200 text-green-800',
    'bg-yellow-200 text-yellow-800', 'bg-purple-200 text-purple-800', 'bg-indigo-200 text-indigo-800',
  ];
  const color = colors[user.name.charCodeAt(0) % colors.length];
  
  return (
    <div title={user.name} className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${color}`}>
      {user.initials}
    </div>
  );
};

interface BugTrackerProps {
  bugReports: BugReport[];
  users: User[];
  onOpenModal: (bug: BugReport | 'new') => void;
  highlightedBugId: string | null;
  clearHighlightedBug: () => void;
}

const BugTracker: React.FC<BugTrackerProps> = ({ bugReports, users, onOpenModal, highlightedBugId, clearHighlightedBug }) => {
  const usersMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (highlightedBugId && rowRefs.current[highlightedBugId]) {
      rowRefs.current[highlightedBugId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      const timer = setTimeout(() => {
        clearHighlightedBug();
      }, 2000); // Clear highlight after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedBugId, clearHighlightedBug]);


  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case BugStatus.Open: return 'bg-red-100 text-red-800';
      case BugStatus.InProgress: return 'bg-blue-100 text-blue-800';
      case BugStatus.Resolved: return 'bg-purple-100 text-purple-800';
      case BugStatus.Closed: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const priorityIconClasses: Record<TaskPriority, string> = {
    [TaskPriority.High]: 'text-red-500',
    [TaskPriority.Medium]: 'text-yellow-500',
    [TaskPriority.Low]: 'text-blue-500',
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 p-4">
      <header className="flex-shrink-0 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Work Items</h2>
        <button
          onClick={() => onOpenModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Report Bug
        </button>
      </header>

      <main className="flex-grow bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-full w-full overflow-auto custom-scrollbar">
          <table className="w-full table-auto" style={{minWidth: 1024}}>
            <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
              <tr>
                {['Type', 'Key', 'Summary', 'Labels', 'Assignee', 'Reporter', 'Priority', 'Status'].map(header => (
                  <th key={header} className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bugReports.map(bug => {
                const assignee = bug.assigneeId ? usersMap.get(bug.assigneeId) : null;
                const reporter = usersMap.get(bug.reporterId);
                return (
                  <tr 
                    key={bug.id}
                    ref={el => rowRefs.current[bug.id] = el}
                    onClick={() => onOpenModal(bug)} 
                    className={`transition-colors ${highlightedBugId === bug.id ? 'bg-indigo-100 animate-pulse-once' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5" title={bug.type}>
                          <BugIcon className="w-4 h-4 text-red-500" />
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600 font-medium">{bug.id}</td>
                    <td className="p-3 text-sm text-gray-800 font-medium">{bug.summary}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                          {bug.labels?.map(label => (
                              <span key={label.id} style={{backgroundColor: label.color}} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getContrastYIQ(label.color)}`}>
                                  {label.text}
                              </span>
                          ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={assignee} />
                          <span className="text-sm font-medium text-gray-800">{assignee.name}</span>
                        </div>
                      ) : <span className="text-sm text-gray-400">Unassigned</span>}
                    </td>
                    <td className="p-3">
                      {reporter && (
                          <div className="flex items-center gap-2">
                              <UserAvatar user={reporter} />
                              <span className="text-sm font-medium text-gray-800">{reporter.name}</span>
                          </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5" title={`${bug.priority} priority`}>
                        <PriorityIcon priority={bug.priority} className={`w-4 h-4 ${priorityIconClasses[bug.priority]}`} />
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(bug.status)}`}>
                        {bug.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {bugReports.length === 0 && (
            <div className="text-center text-gray-500 p-8">
              <BugIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-semibold">No bugs here!</h3>
              <p>Report a new bug to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BugTracker;