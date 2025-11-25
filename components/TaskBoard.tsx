import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TaskColumn, TaskCard, ChecklistItem, Label, TaskPriority, User, Attachment } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XIcon } from './icons/XIcon';
import { DescriptionIcon } from './icons/DescriptionIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ChecklistIcon } from './icons/ChecklistIcon';
import { FlagIcon } from './icons/FlagIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { TagIcon } from './icons/TagIcon';
import { PriorityIcon } from './icons/PriorityIcon';
import { ImageIcon } from './icons/ImageIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { DependencyIcon } from './icons/DependencyIcon';
import { StarIcon } from './icons/StarIcon';

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

// --- UserAvatar ---
const UserAvatar: React.FC<{ user: User, size?: 'small' | 'medium', isResponsible?: boolean }> = ({ user, size = 'medium', isResponsible = false }) => {
  const sizeClass = size === 'small' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const responsibleClass = isResponsible ? 'ring-2 ring-yellow-400 ring-offset-1' : '';

  return (
    <div title={`${user.name}${isResponsible ? ' (Responsible)' : ''}`} className={`relative rounded-full flex items-center justify-center font-bold text-white ${sizeClass} ${responsibleClass}`} style={{backgroundColor: user.color || '#64748b'}}>
      {user.initials}
      {isResponsible && (
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-px">
              <StarIcon className="w-2.5 h-2.5 text-white" />
          </div>
      )}
    </div>
  );
};

// --- AssigneePopover ---
interface AssigneePopoverProps {
  allUsers: User[];
  assignedUserIds: string[];
  responsibleUserId?: string;
  onToggleAssignee: (userId: string) => void;
  onSetResponsible: (userId: string) => void;
  onClose: () => void;
}
const AssigneePopover: React.FC<AssigneePopoverProps> = ({ allUsers, assignedUserIds, responsibleUserId, onToggleAssignee, onSetResponsible, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={popoverRef} className="absolute z-20 w-64 bg-white rounded-md shadow-lg border p-3 right-0">
       <h4 className="text-sm font-semibold text-gray-700 text-center mb-2">Assign users</h4>
       <div className="space-y-1">
        {allUsers.map(user => (
          <div key={user.id} className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-100">
            <div onClick={() => onToggleAssignee(user.id)} className="flex items-center gap-3 cursor-pointer flex-grow">
                <input type="checkbox" readOnly checked={assignedUserIds.includes(user.id)} className="w-4 h-4 accent-indigo-500 pointer-events-none" />
                <UserAvatar user={user} />
                <span className="text-sm font-medium">{user.name}</span>
            </div>
             <button 
                onClick={() => onSetResponsible(user.id)} 
                disabled={!assignedUserIds.includes(user.id)}
                title={responsibleUserId === user.id ? "Remove responsibility" : "Make responsible"}
                className="p-1 rounded-full disabled:opacity-20 disabled:cursor-not-allowed hover:bg-yellow-200"
            >
                <StarIcon className={`w-5 h-5 transition-colors ${responsibleUserId === user.id ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`} />
            </button>
          </div>
        ))}
       </div>
    </div>
  );
};

// --- LabelPopover ---
interface LabelPopoverProps {
  allLabels: Label[];
  assignedLabels: Label[];
  onToggleLabel: (label: Label) => void;
  onCreateLabel: (text: string, color: string) => void;
  onClose: () => void;
}

const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

const LabelPopover: React.FC<LabelPopoverProps> = ({ allLabels, assignedLabels, onToggleLabel, onCreateLabel, onClose }) => {
  const [newLabelText, setNewLabelText] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCreate = () => {
    if (newLabelText.trim()) {
      onCreateLabel(newLabelText.trim(), selectedColor);
      setNewLabelText('');
    }
  };

  const isLabelAssigned = (labelId: string) => assignedLabels.some(l => l.id === labelId);

  return (
    <div ref={popoverRef} className="absolute z-10 w-64 bg-white rounded-md shadow-lg border p-3 right-0">
      <h4 className="text-sm font-semibold text-gray-700 text-center mb-2">Labels</h4>
      <div className="space-y-1 mb-3">
        {allLabels.map(label => (
          <div key={label.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100" onClick={() => onToggleLabel(label)}>
            <input type="checkbox" readOnly checked={isLabelAssigned(label.id)} className="w-4 h-4 accent-indigo-500 pointer-events-none"/>
            <span style={{ backgroundColor: label.color }} className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-grow text-center ${getContrastYIQ(label.color)}`}>
              {label.text}
            </span>
          </div>
        ))}
      </div>
      <hr className="my-2" />
      <h5 className="text-sm font-semibold text-gray-700 mb-2">Create a new label</h5>
      <input
        type="text"
        value={newLabelText}
        onChange={(e) => setNewLabelText(e.target.value)}
        placeholder="Label name"
        className="w-full p-1.5 border rounded-md text-sm mb-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
      />
      <div className="grid grid-cols-8 gap-1 mb-2">
        {LABEL_COLORS.map(color => (
          <button
            key={color}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
          />
        ))}
      </div>
      <button onClick={handleCreate} className="w-full bg-indigo-500 text-white rounded-md py-1.5 text-sm font-semibold hover:bg-indigo-600">
        Create
      </button>
    </div>
  );
};


// --- TaskDetailsModal ---
export interface TaskDetailsModalProps {
    card: TaskCard;
    columnId: string;
    columns: TaskColumn[];
    users: User[];
    allTasks: TaskCard[];
    onClose: () => void;
    onUpdate: (cardId: string, columnId: string, updatedProperties: Partial<TaskCard>) => void;
    onDelete: (cardId: string) => void;
    onMove: (cardId: string, fromColumnId: string, toColumnId: string, destinationIndex: number) => void;
}

const SidebarButton: React.FC<{
    icon: React.ReactNode,
    children: React.ReactNode,
    onClick?: (e?: React.MouseEvent) => void,
    className?: string
}> = ({ icon, children, onClick, className = '' }) => {
    const commonClasses = `w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-700 ${className}`;
    
    return (
        <button onClick={onClick} className={commonClasses}>
            {icon}
            {children}
        </button>
    );
};


export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ card, columnId, columns, users, allTasks, onClose, onUpdate, onDelete, onMove }) => {
    const [content, setContent] = useState(card.content);
    const [description, setDescription] = useState(card.description || '');
    const [startDate, setStartDate] = useState(() => {
        if (!card.startDate) return '';
        const d = new Date(card.startDate);
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [dueDate, setDueDate] = useState(() => {
        if (!card.dueDate) return '';
        const d = new Date(card.dueDate);
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist || []);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    
    const [activePopover, setActivePopover] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const columnName = useMemo(() => columns.find(c => c.id === columnId)?.title || '', [columns, columnId]);

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return null;
        const parts = dateString.split('-').map(p => parseInt(p, 10));
        const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return utcDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        });
    };

    const startDateForDisplay = useMemo(() => formatDateForDisplay(startDate), [startDate]);
    const dueDateForDisplay = useMemo(() => formatDateForDisplay(dueDate), [dueDate]);
    
    const allLabels = useMemo(() => {
        const labelMap = new Map<string, Label>();
        columns.forEach(col => {
            col.cards.forEach(card => {
                card.labels?.forEach(label => {
                    if (!labelMap.has(label.id)) {
                        labelMap.set(label.id, label);
                    }
                });
            });
        });
        return Array.from(labelMap.values());
    }, [columns]);

    const assignedUsers = useMemo(() => {
        return (card.assignedUserIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
    }, [card.assignedUserIds, users]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setActivePopover(null);
          }
        };
        if (activePopover) {
          document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [activePopover]);

    const handleUpdate = (updatedProperties: Partial<TaskCard>) => {
        onUpdate(card.id, columnId, updatedProperties);
    };

    const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpdate({ coverImageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };
    
    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment: Attachment = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    url: event.target?.result as string,
                    type: file.type,
                    size: file.size,
                };
                const newAttachments = [...(card.attachments || []), newAttachment];
                handleUpdate({ attachments: newAttachments });
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const deleteAttachment = (attachmentId: string) => {
        const newAttachments = (card.attachments || []).filter(a => a.id !== attachmentId);
        handleUpdate({ attachments: newAttachments });
    };

    const handleChecklistChange = (itemId: string, newText: string) => {
        const updated = checklist.map(item => item.id === itemId ? { ...item, text: newText } : item);
        setChecklist(updated);
        handleUpdate({ checklist: updated });
    };
    
    const handleChecklistToggle = (itemId: string) => {
        const updated = checklist.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
        setChecklist(updated);
        handleUpdate({ checklist: updated });
    };
    
    const addChecklistItem = () => {
        if (newChecklistItem.trim() === '') return;
        const newItem: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItem.trim(), completed: false };
        const updated = [...checklist, newItem];
        setChecklist(updated);
        handleUpdate({ checklist: updated });
        setNewChecklistItem('');
    };

    const deleteChecklistItem = (itemId: string) => {
        const updated = checklist.filter(item => item.id !== itemId);
        setChecklist(updated);
        handleUpdate({ checklist: updated });
    };

    const handleToggleLabel = (label: Label) => {
      const newLabels = card.labels.some(l => l.id === label.id)
        ? card.labels.filter(l => l.id !== label.id)
        : [...card.labels, label];
      handleUpdate({ labels: newLabels });
    };

    const handleCreateLabel = (text: string, color: string) => {
      const newLabel: Label = { id: crypto.randomUUID(), text, color };
      handleUpdate({ labels: [...card.labels, newLabel] });
    };

    const handleToggleAssignee = (userId: string) => {
        const currentIds = card.assignedUserIds || [];
        const newUserIds = currentIds.includes(userId)
            ? currentIds.filter(id => id !== userId)
            : [...currentIds, userId];

        let newResponsibleId = card.responsibleUserId;
        // If unassigning the responsible user, also remove their responsibility
        if (newResponsibleId === userId && !newUserIds.includes(userId)) {
            newResponsibleId = undefined;
        }

        handleUpdate({ assignedUserIds: newUserIds, responsibleUserId: newResponsibleId });
    };
    
    const handleSetResponsible = (userId: string) => {
        const newResponsibleId = card.responsibleUserId === userId ? undefined : userId;
        
        const currentAssignedIds = card.assignedUserIds || [];
        const newAssignedIds = [...currentAssignedIds];
        if (newResponsibleId && !newAssignedIds.includes(newResponsibleId)) {
            newAssignedIds.push(newResponsibleId);
        }
        
        handleUpdate({
            responsibleUserId: newResponsibleId,
            assignedUserIds: newAssignedIds,
        });
    };

    const handleAddDependency = (dependencyId: string) => {
        if (dependencyId) {
            const newDependencies = [...(card.dependencies || []), dependencyId];
            handleUpdate({ dependencies: newDependencies });
        }
    };
    
    const handleRemoveDependency = (dependencyId: string) => {
        const newDependencies = (card.dependencies || []).filter(id => id !== dependencyId);
        handleUpdate({ dependencies: newDependencies });
    };


    const handleMoveCard = (newColumnId: string) => {
        if (newColumnId !== columnId) {
            const toColumn = columns.find(c => c.id === newColumnId);
            const destinationIndex = toColumn ? toColumn.cards.length : 0;
            onMove(card.id, columnId, newColumnId, destinationIndex);
            onClose();
        }
    };

    const handleDateChange = (dateValue: string, field: 'startDate' | 'dueDate') => {
        const setDate = field === 'startDate' ? setStartDate : setDueDate;
        setDate(dateValue);
        if (dateValue) {
            const parts = dateValue.split('-').map(p => parseInt(p, 10));
            const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            handleUpdate({ [field]: utcDate.toISOString() });
        } else {
            handleUpdate({ [field]: undefined });
        }
    };
    
    const handleClearDate = (e: React.MouseEvent, field: 'startDate' | 'dueDate') => {
        e.preventDefault();
        e.stopPropagation();
        const setDate = field === 'startDate' ? setStartDate : setDueDate;
        setDate('');
        handleUpdate({ [field]: undefined });
    };
    

    const handleDeleteCard = () => {
        onDelete(card.id);
    };
    
    const progress = checklist.length > 0 ? (checklist.filter(i => i.completed).length / checklist.length) * 100 : 0;
    const progressText = `${Math.round(progress)}%`;

    const availableDependencies = allTasks.filter(t => t.id !== card.id && !(card.dependencies || []).includes(t.id));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
            <div ref={modalRef} className="bg-gray-50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b bg-white rounded-t-lg relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={() => handleUpdate({ content })}
                        className="w-full text-2xl font-bold text-gray-800 border-transparent focus:ring-2 focus:ring-indigo-400 rounded-md p-2 -m-2 resize-none bg-transparent"
                        rows={1}
                    />
                    <p className="text-sm text-gray-600 mt-1 ml-0.5">in list <span className="font-semibold underline">{columnName}</span></p>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors"><XIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {card.coverImageUrl && (
                        <div className="relative group">
                            <img src={card.coverImageUrl} alt={card.content} className="w-full h-48 object-cover" />
                             <button 
                                onClick={() => handleUpdate({ coverImageUrl: undefined })}
                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-8">
                        {/* Main Content */}
                        <div className="w-full lg:w-2/3 space-y-8">
                            {/* Metadata Section */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                                {assignedUsers.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assignees</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {assignedUsers.map(user => <UserAvatar key={user.id} user={user} isResponsible={user.id === card.responsibleUserId} />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {card.labels.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Labels</h3>
                                        <div className="flex flex-wrap gap-1 items-center">
                                            {card.labels.map(label => (
                                                <span key={label.id} style={{backgroundColor: label.color}} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getContrastYIQ(label.color)}`}>
                                                    {label.text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description Section */}
                            <div className="flex items-start gap-5">
                                <DescriptionIcon className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0" />
                                <div className='w-full'>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onBlur={() => handleUpdate({ description })}
                                        placeholder="Add a more detailed description..."
                                        className="w-full p-2 border bg-white rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                                        rows={4}
                                    />
                                </div>
                            </div>
                            {/* Attachments Section */}
                             {(card.attachments && card.attachments.length > 0) && (
                                <div className="flex items-start gap-5">
                                    <PaperclipIcon className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0" />
                                    <div className="w-full">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Attachments</h3>
                                        <div className="space-y-2">
                                            {card.attachments.map(attachment => (
                                                <div key={attachment.id} className="flex items-center bg-gray-100 p-2 rounded-md group">
                                                    <a href={attachment.url} download={attachment.name} className="flex-grow text-sm font-medium text-indigo-600 hover:underline truncate">{attachment.name}</a>
                                                    <span className="text-xs text-gray-500 mx-2">{(attachment.size / 1024).toFixed(1)} KB</span>
                                                    <button onClick={() => deleteAttachment(attachment.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* Dependencies Section */}
                            {(card.dependencies && card.dependencies.length > 0) && (
                                <div className="flex items-start gap-5">
                                    <DependencyIcon className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0" />
                                    <div className="w-full">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Dependencies</h3>
                                        <div className="space-y-2">
                                            {card.dependencies.map(depId => {
                                                const depTask = allTasks.find(t => t.id === depId);
                                                return (
                                                    <div key={depId} className="flex items-center bg-gray-100 p-2 rounded-md group">
                                                        <p className="flex-grow text-sm font-medium text-gray-700 truncate">{depTask ? depTask.content : 'Unknown Task'}</p>
                                                        <button onClick={() => handleRemoveDependency(depId)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Checklist Section */}
                            <div className="flex items-start gap-5">
                                <ChecklistIcon className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0" />
                                <div className='w-full'>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">Checklist</h3>
                                        <span className="text-sm font-medium text-gray-500">{progressText}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                        {checklist.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 group bg-white p-1.5 rounded-md hover:bg-gray-100">
                                                <input type="checkbox" checked={item.completed} onChange={() => handleChecklistToggle(item.id)} className="w-5 h-5 accent-indigo-500"/>
                                                <input
                                                    type="text"
                                                    value={item.text}
                                                    onChange={(e) => handleChecklistChange(item.id, e.target.value)}
                                                    className={`flex-grow p-1 rounded-md bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-400 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                                                />
                                                <button onClick={() => deleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                            placeholder="Add an item"
                                            className="w-full p-2 border bg-white rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                                        />
                                        <button onClick={addChecklistItem} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors">Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-1/3 space-y-6" ref={popoverRef}>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add to card</h3>
                                <div className="space-y-2">
                                <div className="relative">
                                        <SidebarButton icon={<UserPlusIcon className="w-5 h-5"/>} onClick={() => setActivePopover(p => p === 'assignees' ? null : 'assignees')}>Assignees</SidebarButton>
                                        {activePopover === 'assignees' && (
                                            <AssigneePopover allUsers={users} assignedUserIds={card.assignedUserIds || []} responsibleUserId={card.responsibleUserId} onToggleAssignee={handleToggleAssignee} onSetResponsible={handleSetResponsible} onClose={() => setActivePopover(null)} />
                                        )}
                                    </div>
                                    <div className="relative">
                                        <SidebarButton icon={<TagIcon className="w-5 h-5"/>} onClick={() => setActivePopover(p => p === 'labels' ? null : 'labels')}>Labels</SidebarButton>
                                        {activePopover === 'labels' && (
                                            <LabelPopover allLabels={allLabels} assignedLabels={card.labels} onToggleLabel={handleToggleLabel} onCreateLabel={handleCreateLabel} onClose={() => setActivePopover(null)} />
                                        )}
                                    </div>
                                    <label className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-700 cursor-pointer">
                                        <ImageIcon className="w-5 h-5"/>
                                        Cover
                                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                                    </label>
                                    <label className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-700 cursor-pointer">
                                        <PaperclipIcon className="w-5 h-5"/>
                                        Attachment
                                        <input type="file" className="hidden" onChange={handleAttachmentUpload} />
                                    </label>
                                    <div className="relative group">
                                        <div className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 group-hover:bg-gray-200 transition-colors text-gray-700">
                                            <ClockIcon className="w-5 h-5"/>
                                            <div className="flex items-center justify-between w-full">
                                                <span>Start Date</span>
                                                {startDateForDisplay && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                            {startDateForDisplay}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => handleClearDate(e, 'startDate')}
                                                            className="relative z-20 p-0.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-400 hover:text-white transition-all"
                                                            title="Remove start date"
                                                        >
                                                            <XIcon className="w-3 h-3"/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => handleDateChange(e.target.value, 'startDate')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            title="Set start date"
                                            aria-label="Set start date"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 group-hover:bg-gray-200 transition-colors text-gray-700">
                                            <ClockIcon className="w-5 h-5"/>
                                            <div className="flex items-center justify-between w-full">
                                                <span>Due Date</span>
                                                {dueDateForDisplay && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                            {dueDateForDisplay}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => handleClearDate(e, 'dueDate')}
                                                            className="relative z-20 p-0.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-400 hover:text-white transition-all"
                                                            title="Remove due date"
                                                        >
                                                            <XIcon className="w-3 h-3"/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => handleDateChange(e.target.value, 'dueDate')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            title="Set due date"
                                            aria-label="Set due date"
                                        />
                                    </div>
                                    <div className="relative">
                                        <SidebarButton icon={<FlagIcon className="w-5 h-5"/>} onClick={() => setActivePopover(p => p === 'priority' ? null : 'priority')}>Priority</SidebarButton>
                                        {activePopover === 'priority' && (
                                            <div className="absolute z-10 right-0 bg-white w-full rounded-md shadow-lg border p-2 space-y-1">
                                                {(Object.values(TaskPriority) as TaskPriority[]).map(p => (
                                                    <button key={p} onClick={() => { handleUpdate({ priority: card.priority === p ? undefined : p }); setActivePopover(null); }} className={`w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 text-sm font-medium capitalize ${card.priority === p ? 'bg-indigo-100 text-indigo-700' : ''}`}>{p}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <SidebarButton icon={<DependencyIcon className="w-5 h-5"/>} onClick={() => setActivePopover(p => p === 'dependencies' ? null : 'dependencies')}>Dependencies</SidebarButton>
                                        {activePopover === 'dependencies' && (
                                            <div className="absolute z-10 right-0 bg-white w-full rounded-md shadow-lg border p-2">
                                                <select
                                                  onChange={(e) => handleAddDependency(e.target.value)}
                                                  className="w-full p-2 border rounded-md"
                                                  value=""
                                                >
                                                    <option value="" disabled>Add a dependency...</option>
                                                    {availableDependencies.map(t => (
                                                        <option key={t.id} value={t.id}>{t.content}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Actions</h3>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <SidebarButton icon={<ArrowRightIcon className="w-5 h-5"/>} onClick={() => setActivePopover(p => p === 'move' ? null : 'move')}>Move</SidebarButton>
                                        {activePopover === 'move' && (
                                            <div className="absolute z-10 right-0 bg-white w-full rounded-md shadow-lg border p-2 space-y-1">
                                                {columns.map(col => (
                                                    <button key={col.id} onClick={() => {handleMoveCard(col.id); setActivePopover(null);}} className="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={col.id === columnId}>{col.title}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <SidebarButton icon={<TrashIcon className="w-5 h-5"/>} onClick={handleDeleteCard} className="!bg-red-50 hover:!bg-red-100 !text-red-700">Delete</SidebarButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- TaskCardComponent ---
interface TaskCardProps {
    card: TaskCard;
    columnId: string;
    users: User[];
    isHighlighted: boolean;
    isJustUpdated: boolean;
    isDeleting: boolean;
    onOpenDetails: (card: TaskCard, columnId: string) => void;
    onDragStart: (e: React.DragEvent, cardId: string, fromColumnId: string) => void;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({ card, columnId, users, isHighlighted, isJustUpdated, isDeleting, onOpenDetails, onDragStart }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isHighlighted]);

    const completedItems = card.checklist?.filter(item => item.completed).length || 0;
    const totalItems = card.checklist?.length || 0;

    const { responsibleUser, otherAssignedUsers } = useMemo(() => {
        const responsible = card.responsibleUserId ? users.find(u => u.id === card.responsibleUserId) : null;
        const others = (card.assignedUserIds || [])
            .filter(id => id !== card.responsibleUserId)
            .map(id => users.find(u => u.id === id))
            .filter(Boolean) as User[];
        return { responsibleUser: responsible, otherAssignedUsers: others };
    }, [card.assignedUserIds, card.responsibleUserId, users]);
    
    const getDueDateStatus = () => {
        if (!card.dueDate) return { className: '', text: '' };
        
        const isComplete = totalItems > 0 && completedItems === totalItems;
        if (isComplete) return { className: 'bg-green-100 text-green-800', text: 'Complete' };

        const today = new Date();
        const todayUtcMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const due = new Date(card.dueDate);

        const diffTime = due.getTime() - todayUtcMidnight.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const dateText = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

        if (diffDays < 0) return { className: 'bg-red-100 text-red-800', text: dateText };
        if (diffDays < 2) return { className: 'bg-yellow-200 text-yellow-900', text: dateText };
        return { className: 'bg-gray-100 text-gray-700', text: dateText };
    };

    const dueDateStatus = getDueDateStatus();

    const priorityIconClasses: Record<TaskPriority, string> = {
        [TaskPriority.High]: 'text-red-500',
        [TaskPriority.Medium]: 'text-yellow-500',
        [TaskPriority.Low]: 'text-blue-500',
    };

    return (
        <div
            ref={cardRef}
            draggable
            onDragStart={(e) => onDragStart(e, card.id, columnId)}
            onClick={() => onOpenDetails(card, columnId)}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg cursor-pointer border border-transparent transition-all duration-200 ease-in-out hover:-translate-y-1 overflow-hidden
            ${isHighlighted ? 'border-indigo-500 ring-2 ring-indigo-500/50 animate-pulse-once' : ''}
            ${isJustUpdated ? 'animate-pulse-update' : ''}
            ${isDeleting ? 'animate-fade-out-shrink' : 'animate-fade-in-scale-up'}
            `}
        >
            {card.coverImageUrl && (
                <img src={card.coverImageUrl} alt={card.content} className="w-full h-24 object-cover" />
            )}
            <div className="p-3">
                {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map(label => (
                            <span key={label.id} style={{backgroundColor: label.color}} className={`px-2 py-0.5 text-xs font-bold rounded-full ${getContrastYIQ(label.color)}`}>
                                {label.text}
                            </span>
                        ))}
                    </div>
                )}
                <p className="mb-3 text-gray-800 font-medium">{card.content}</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                        {card.priority && (
                            <span title={`${card.priority.charAt(0).toUpperCase() + card.priority.slice(1)} Priority`}>
                                <PriorityIcon priority={card.priority} className={`w-4 h-4 ${priorityIconClasses[card.priority]}`} />
                            </span>
                        )}
                        {card.description && <span title="Has description"><DescriptionIcon className="w-4 h-4" /></span>}
                        {card.attachments && card.attachments.length > 0 && (
                            <div className="flex items-center gap-1" title={`${card.attachments.length} attachment(s)`}>
                                <PaperclipIcon className="w-4 h-4"/>
                                <span className="text-xs font-semibold">{card.attachments.length}</span>
                            </div>
                        )}
                        {card.dependencies && card.dependencies.length > 0 && (
                            <div className="flex items-center gap-1" title={`${card.dependencies.length} dependenc${card.dependencies.length > 1 ? 'ies' : 'y'}`}>
                                <DependencyIcon className="w-4 h-4"/>
                                <span className="text-xs font-semibold">{card.dependencies.length}</span>
                            </div>
                        )}
                        {card.dueDate && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${dueDateStatus.className}`}>
                                <ClockIcon className="w-3 h-3"/> 
                                <span>{dueDateStatus.text}</span>
                            </div>
                        )}
                        {totalItems > 0 && (
                            <div className={`flex items-center gap-1 ${completedItems === totalItems ? 'text-green-600' : ''}`} title={`${completedItems} of ${totalItems} complete`}>
                                <ChecklistIcon className="w-4 h-4"/> 
                                <span className="text-xs font-semibold">{completedItems}/{totalItems}</span>
                            </div>
                        )}
                    </div>
                    {(responsibleUser || otherAssignedUsers.length > 0) && (
                        <div className="flex -space-x-2">
                            {responsibleUser && <UserAvatar key={responsibleUser.id} user={responsibleUser} size="small" isResponsible />}
                            {otherAssignedUsers.map(user => <UserAvatar key={user.id} user={user} size="small"/>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ColumnComponent ---
interface ColumnProps {
    column: TaskColumn;
    columnIndex: number;
    users: User[];
    highlightedTaskId: string | null;
    justUpdatedCardId: string | null;
    deletingCardId: string | null;
    onUpdateTitle: (columnId: string, newTitle: string) => void;
    onDelete: (columnId:string) => void;
    onAddCard: (columnId: string, content: string) => void;
    onOpenDetails: (card: TaskCard, columnId: string) => void;
    onCardDragStart: (e: React.DragEvent, cardId: string, fromColumnId: string) => void;
    onCardDrop: (e: React.DragEvent, toColumnId: string) => void;
    onColumnDragStart: (e: React.DragEvent, columnIndex: number) => void;
    onColumnDrop: (e: React.DragEvent, columnIndex: number) => void;
}

const ColumnComponent: React.FC<ColumnProps> = ({ column, columnIndex, users, highlightedTaskId, justUpdatedCardId, deletingCardId, onUpdateTitle, onDelete, onAddCard, onOpenDetails, onCardDragStart, onCardDrop, onColumnDragStart, onColumnDrop }) => {
    const [title, setTitle] = useState(column.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newCardContent, setNewCardContent] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const handleAddCard = () => {
        if(newCardContent.trim()) {
            onAddCard(column.id, newCardContent.trim());
            setNewCardContent('');
            setIsAddingCard(false);
        }
    };
    
    const handleDelete = () => {
        onDelete(column.id);
    };

    return (
        <div 
            draggable
            onDragStart={(e) => onColumnDragStart(e, columnIndex)}
            onDrop={(e) => {
                e.stopPropagation();
                onColumnDrop(e, columnIndex);
                setIsDragOver(false);
            }}
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className="flex-shrink-0 w-80 bg-gray-100 rounded-xl flex flex-col h-full max-h-full"
        >
            <div className="flex justify-between items-center px-4 pt-3 pb-1 cursor-grab">
                <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => { onUpdateTitle(column.id, title); setIsEditingTitle(false); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateTitle(column.id, title); setIsEditingTitle(false); } }}
                            className="font-semibold text-lg p-1 rounded-md border-2 border-indigo-400 bg-white w-full"
                            autoFocus
                        />
                    ) : (
                         <h2 onDoubleClick={() => setIsEditingTitle(true)} className="font-semibold text-lg text-slate-800 p-1 flex items-center">
                          {column.title}
                          <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">{column.cards.length}</span>
                        </h2>
                    )}
                </div>
                <button onClick={handleDelete} title="Delete column" aria-label="Delete column" className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
            </div>
            <div 
                className={`flex-grow overflow-y-auto space-y-3 p-3 transition-colors custom-scrollbar m-1 rounded-lg ${isDragOver ? 'bg-indigo-100 border-2 border-dashed border-indigo-400' : 'border-2 border-transparent'}`}
                onDrop={(e) => {
                  e.stopPropagation();
                  onCardDrop(e, column.id);
                  setIsDragOver(false);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDragLeave={() => setIsDragOver(false)}
            >
                {column.cards.map(card => (
                    <TaskCardComponent
                        key={card.id}
                        card={card}
                        columnId={column.id}
                        users={users}
                        isHighlighted={highlightedTaskId === card.id}
                        isJustUpdated={justUpdatedCardId === card.id}
                        isDeleting={deletingCardId === card.id}
                        onOpenDetails={onOpenDetails}
                        onDragStart={onCardDragStart}
                    />
                ))}
            </div>
             {isAddingCard ? (
                <div className="p-3">
                    <textarea 
                        value={newCardContent}
                        onChange={(e) => setNewCardContent(e.target.value)}
                        placeholder="Enter a title for this card..."
                        className="w-full p-2 rounded-md border shadow-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                        autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <button onClick={handleAddCard} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors">Add Card</button>
                        <button onClick={() => setIsAddingCard(false)} className="p-2 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-600"/></button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAddingCard(true)} className="flex items-center justify-center gap-2 w-full p-3 rounded-b-xl text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors font-medium">
                    <PlusIcon className="w-5 h-5"/> Add a card
                </button>
            )}
        </div>
    )
}


// --- TaskBoard ---
interface TaskBoardProps {
    columns: TaskColumn[];
    users: User[];
    allTasks: TaskCard[];
    moveTaskCard: (cardId: string, fromColumnId: string, toColumnId: string, destinationIndex: number) => void;
    updateTaskDetails: (cardId: string, columnId: string, updatedProperties: Partial<TaskCard>) => void;
    deleteTaskCard: (cardId: string) => void;
    addCard: (columnId: string, content: string) => void;
    addColumn: (title: string) => void;
    deleteColumn: (columnId: string) => void;
    updateColumnTitle: (columnId: string, newTitle: string) => void;
    reorderColumns: (startIndex: number, endIndex: number) => void;
    highlightedTaskId: string | null;
    clearHighlightedTask: () => void;
    openTaskDetails: (card: TaskCard, columnId: string) => void;
    justUpdatedCardId: string | null;
    deletingCardId: string | null;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ columns, users, allTasks, moveTaskCard, updateTaskDetails, deleteTaskCard, addCard, addColumn, deleteColumn, updateColumnTitle, reorderColumns, highlightedTaskId, clearHighlightedTask, openTaskDetails, justUpdatedCardId, deletingCardId }) => {
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [columnToDeleteId, setColumnToDeleteId] = useState<string | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (highlightedTaskId) {
            const timer = setTimeout(() => {
                clearHighlightedTask();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedTaskId, clearHighlightedTask]);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                board.scrollLeft += e.deltaY;
            }
        };

        board.addEventListener('wheel', handleWheel);
        return () => board.removeEventListener('wheel', handleWheel);
    }, []);
    
    const handleAddColumn = () => {
        if(newColumnTitle.trim()) {
            addColumn(newColumnTitle.trim());
            setNewColumnTitle('');
            setIsAddingColumn(false);
        }
    };

    const handleCardDragStart = (e: React.DragEvent, cardId: string, fromColumnId: string) => {
      e.dataTransfer.setData('application/card', JSON.stringify({ cardId, fromColumnId }));
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleCardDrop = (e: React.DragEvent, toColumnId: string) => {
      const data = e.dataTransfer.getData('application/card');
      if (data) {
        const { cardId, fromColumnId } = JSON.parse(data);
        
        const toColumn = columns.find(c => c.id === toColumnId);
        const destinationIndex = toColumn?.cards.length || 0;

        if (cardId && fromColumnId && toColumnId) {
            moveTaskCard(cardId, fromColumnId, toColumnId, destinationIndex);
        }
      }
    };

    const handleColumnDragStart = (e: React.DragEvent, columnIndex: number) => {
        e.dataTransfer.setData('application/column', columnIndex.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleColumnDrop = (e: React.DragEvent, dropIndex: number) => {
        const startIndexStr = e.dataTransfer.getData('application/column');
        if (startIndexStr) {
            const startIndex = parseInt(startIndexStr, 10);
            reorderColumns(startIndex, dropIndex);
        }
    };

    const handleDeleteColumnConfirm = () => {
        if (columnToDeleteId) {
            deleteColumn(columnToDeleteId);
            setColumnToDeleteId(null);
        }
    };

    return (
        <div ref={boardRef} className="w-full h-full p-4 flex gap-4 overflow-x-auto bg-gray-50 custom-scrollbar">
            {columns.map((column, index) => (
                <ColumnComponent 
                    key={column.id} 
                    column={column} 
                    columnIndex={index}
                    users={users}
                    highlightedTaskId={highlightedTaskId}
                    justUpdatedCardId={justUpdatedCardId}
                    deletingCardId={deletingCardId}
                    onUpdateTitle={updateColumnTitle}
                    onDelete={setColumnToDeleteId}
                    onAddCard={addCard}
                    onOpenDetails={openTaskDetails}
                    onCardDragStart={handleCardDragStart}
                    onCardDrop={handleCardDrop}
                    onColumnDragStart={handleColumnDragStart}
                    onColumnDrop={handleColumnDrop}
                />
            ))}
            <div className="flex-shrink-0 w-80">
                {isAddingColumn ? (
                    <div className="bg-gray-200 p-3 rounded-xl">
                        <input
                            type="text"
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            placeholder="Enter column title..."
                            className="w-full p-2 rounded-md border shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={handleAddColumn} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors">Add Column</button>
                            <button onClick={() => setIsAddingColumn(false)} className="p-2 rounded-full hover:bg-gray-300/50"><XIcon className="w-5 h-5 text-gray-600"/></button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingColumn(true)} className="flex items-center gap-2 w-full h-12 px-4 rounded-xl text-slate-600 font-medium bg-gray-200/50 hover:bg-gray-200 hover:text-slate-800 transition-colors">
                        <PlusIcon className="w-5 h-5"/> Add another column
                    </button>
                )}
            </div>

            {columnToDeleteId && (() => {
                const column = columns.find(c => c.id === columnToDeleteId);
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in-scale-up" onClick={() => setColumnToDeleteId(null)}>
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Column</h2>
                            <p className="text-gray-600 mb-6">Are you sure you want to delete the "{column?.title}" column? All of its tasks will also be deleted. This action cannot be undone.</p>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setColumnToDeleteId(null)} className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteColumnConfirm} className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default TaskBoard;