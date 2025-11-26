import React, { useState, useRef, useEffect } from 'react';
import { View, WorkspaceInvite } from '../types';
import { MindMapIcon } from './icons/MindMapIcon';
import { TrelloIcon } from './icons/TrelloIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { BellIcon } from './icons/BellIcon';
import { BugIcon } from './icons/BugIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SearchIcon } from './icons/SearchIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { UserIcon } from './icons/UserIcon';
import InvitesDropdown from './InvitesDropdown';

interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
}

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onRequestNotifications: () => void;
  notificationPermission: NotificationPermission;
  user: DiscordUser | null;
  onLogout: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenSearch: () => void;
  onOpenWorkspaceSelector?: () => void;
  currentWorkspaceName?: string;
  invites?: WorkspaceInvite[];
  onAcceptInvite?: (inviteId: string) => void;
  onRejectInvite?: (inviteId: string) => void;
  onOpenProfile?: () => void;
}

const UserMenu: React.FC<{
  user: DiscordUser,
  onLogout: () => void,
  onRequestNotifications: () => void,
  notificationPermission: NotificationPermission,
  onExport: () => void,
  onImport: (file: File) => void,
  onOpenProfile?: () => void,
}> = ({ user, onLogout, onRequestNotifications, notificationPermission, onExport, onImport, onOpenProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationButtonDetails = () => {
    switch (notificationPermission) {
      case 'granted':
        return {
          title: 'Notifications enabled',
          className: 'text-green-600',
          disabled: true,
        };
      case 'denied':
        return {
          title: 'Notifications blocked',
          className: 'text-red-600',
          disabled: true,
        };
      default:
        return {
          title: 'Enable due date notifications',
          className: 'text-gray-700',
          disabled: false,
        };
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    setIsOpen(false);
  };

  const notifButton = getNotificationButtonDetails();

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 transition-colors">
        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
        <span className="font-semibold text-gray-700 hidden sm:block">{user.username}</span>
        <svg className={`w - 5 h - 5 text - gray - 500 transition - transform ${isOpen ? 'rotate-180' : ''} `} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-20 animate-fade-in-scale-up">
          <div className="p-2 border-b">
            <p className="text-sm font-medium text-gray-800">{user.username}</p>
            <p className="text-xs text-gray-600">Logged in via Discord</p>
          </div>
          <div className="p-1">
            {onOpenProfile && (
              <button onClick={() => { onOpenProfile(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <UserIcon className="w-5 h-5" />
                Meu Perfil
              </button>
            )}
            <button
              onClick={onRequestNotifications}
              disabled={notifButton.disabled}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BellIcon className={`w - 5 h - 5 ${notifButton.className} `} />
              <span>{notifButton.title}</span>
            </button>
          </div>
          <div className="p-1 border-t">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button onClick={handleImportClick} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <UploadIcon className="w-5 h-5" />
              Import Project
            </button>
            <button onClick={onExport} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <DownloadIcon className="w-5 h-5" />
              Export Project
            </button>
          </div>
          <div className="p-1 border-t">
            <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onRequestNotifications, notificationPermission, user, onLogout, onExport, onImport, onOpenSearch, onOpenWorkspaceSelector, currentWorkspaceName, invites, onAcceptInvite, onRejectInvite, onOpenProfile }) => {
  const baseButtonClass = "relative flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-md font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-10";
  const activeButtonClass = "text-white";
  const inactiveButtonClass = "text-gray-700 hover:text-gray-900";

  const navRef = useRef<HTMLElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({});

  useEffect(() => {
    const calculateSlider = () => {
      const viewMap = { [View.MindMap]: 0, [View.TaskBoard]: 1, [View.Timeline]: 2, [View.BugTracker]: 3, [View.Calendar]: 4, [View.Team]: 5 };
      const currentIndex = viewMap[currentView] ?? 0;
      const currentButton = buttonsRef.current[currentIndex];
      const nav = navRef.current;

      if (currentButton && nav) {
        const navRect = nav.getBoundingClientRect();
        const buttonRect = currentButton.getBoundingClientRect();

        setSliderStyle({
          width: `${buttonRect.width} px`,
          transform: `translateX(${buttonRect.left - navRect.left}px)`,
        });
      }
    };

    // Calculate on mount and view change
    calculateSlider();

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(calculateSlider);
    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      if (navRef.current) {
        resizeObserver.unobserve(navRef.current);
      }
    }
  }, [currentView]);


  return (
    <header className="flex flex-wrap items-center justify-between p-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-30 flex-shrink-0 gap-y-3">
      <div className="flex items-center gap-3">
        <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 20C9 21.1046 8.10457 22 7 22C5.89543 22 5 21.1046 5 20C5 18.8954 5.89543 18 7 18C8.10457 18 9 18.8954 9 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 20L9 16V8L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 8C19 9.10457 18.1046 10 17 10C15.8954 10 15 9.10457 15 8C15 6.89543 15.8954 6 17 6C18.1046 6 19 6.89543 19 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mind-Task Fusion</h1>
          {onOpenWorkspaceSelector && (
            <button
              onClick={onOpenWorkspaceSelector}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors mt-0.5"
              title="Switch workspace"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{currentWorkspaceName || 'My Workspace'}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className='flex items-center gap-2 sm:gap-4'>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 p-2 rounded-md bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 text-sm"
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5" />
          <span className="hidden md:block flex-grow text-left">Search...</span>
          <kbd className="hidden md:block font-sans bg-gray-200 rounded px-1.5 py-0.5 text-xs">⌘K</kbd>
        </button>
        <nav ref={navRef} className="relative flex items-center p-1 bg-gray-100 rounded-lg">
          <div
            className="absolute top-1 bottom-1 bg-indigo-500 rounded-md shadow-md transition-transform duration-300 ease-in-out"
            style={sliderStyle}
          ></div>
          <button
            ref={el => { buttonsRef.current[0] = el; }}
            onClick={() => onViewChange(View.MindMap)}
            className={`${baseButtonClass} ${currentView === View.MindMap ? activeButtonClass : inactiveButtonClass} `}
          >
            <MindMapIcon className="w-5 h-5" />
            <span className="hidden md:inline">Mind Map</span>
          </button>
          <button
            ref={el => { buttonsRef.current[1] = el; }}
            onClick={() => onViewChange(View.TaskBoard)}
            className={`${baseButtonClass} ${currentView === View.TaskBoard ? activeButtonClass : inactiveButtonClass} `}
          >
            <TrelloIcon className="w-5 h-5" />
            <span className="hidden md:inline">Task Board</span>
          </button>
          <button
            ref={el => { buttonsRef.current[2] = el; }}
            onClick={() => onViewChange(View.Timeline)}
            className={`${baseButtonClass} ${currentView === View.Timeline ? activeButtonClass : inactiveButtonClass} `}
          >
            <TimelineIcon className="w-5 h-5" />
            <span className="hidden md:inline">Gantt</span>
          </button>
          <button
            ref={el => { buttonsRef.current[3] = el; }}
            onClick={() => onViewChange(View.BugTracker)}
            className={`${baseButtonClass} ${currentView === View.BugTracker ? activeButtonClass : inactiveButtonClass} `}
          >
            <BugIcon className="w-5 h-5" />
            <span className="hidden md:inline">Bugs</span>
          </button>
          <button
            ref={el => { buttonsRef.current[4] = el; }}
            onClick={() => onViewChange(View.Calendar)}
            className={`${baseButtonClass} ${currentView === View.Calendar ? activeButtonClass : inactiveButtonClass} `}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="hidden md:inline">Calendar</span>
          </button>
          <button
            ref={el => { buttonsRef.current[5] = el; }}
            onClick={() => onViewChange(View.Team)}
            className={`${baseButtonClass} ${currentView === View.Team ? activeButtonClass : inactiveButtonClass} `}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="hidden md:inline">Team</span>
          </button>
        </nav>
        {invites && onAcceptInvite && onRejectInvite && (
          <InvitesDropdown
            invites={invites}
            onAcceptInvite={onAcceptInvite}
            onRejectInvite={onRejectInvite}
          />
        )}
        {user && (
          <UserMenu
            user={user}
            onLogout={onLogout}
            onRequestNotifications={onRequestNotifications}
            notificationPermission={notificationPermission}
            onExport={onExport}
            onImport={onImport}
            onOpenProfile={onOpenProfile}
          />
        )}
      </div>
    </header>
  );
};

export default Header;