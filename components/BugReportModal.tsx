import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BugReport, User, BugStatus, BugType, TaskPriority, Label, Attachment } from '../types';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';

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

// --- LabelPopover (reused from TaskBoard for consistency) ---
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
    <div ref={popoverRef} className="absolute z-30 mt-2 w-64 bg-white rounded-md shadow-lg border p-3 right-0">
      <h4 className="text-sm font-semibold text-gray-700 text-center mb-2">Labels</h4>
      <div className="space-y-1 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
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


interface BugReportModalProps {
    bugReport: BugReport | null;
    users: User[];
    allLabels: Label[];
    onClose: () => void;
    onSave: (bug: BugReport) => void;
    onDelete: (bugId: string) => void;
    nextBugId: string;
    defaultReporterId: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ bugReport, users, allLabels, onClose, onSave, onDelete, nextBugId, defaultReporterId }) => {
    const isNew = bugReport === null;
    
    const [summary, setSummary] = useState(bugReport?.summary || '');
    const [description, setDescription] = useState(bugReport?.description || '');
    const [status, setStatus] = useState(bugReport?.status || BugStatus.Open);
    const [priority, setPriority] = useState(bugReport?.priority || TaskPriority.Medium);
    const [assigneeId, setAssigneeId] = useState(bugReport?.assigneeId || '');
    const [reporterId, setReporterId] = useState(bugReport?.reporterId || defaultReporterId);
    const [type, setType] = useState(bugReport?.type || BugType.Bug);
    const [labels, setLabels] = useState<Label[]>(bugReport?.labels || []);
    const [attachments, setAttachments] = useState<Attachment[]>(bugReport?.attachments || []);
    
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
    
    const labelButtonRef = useRef<HTMLButtonElement>(null);
    const priorityPopoverRef = useRef<HTMLDivElement>(null);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number; right: number } | null>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isLabelPopoverOpen) {
                    setIsLabelPopoverOpen(false);
                } else if (isPriorityPopoverOpen) {
                    setIsPriorityPopoverOpen(false);
                }
                else {
                    onClose();
                }
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (priorityPopoverRef.current && !priorityPopoverRef.current.contains(event.target as Node)) {
                setIsPriorityPopoverOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        if (isPriorityPopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, isLabelPopoverOpen, isPriorityPopoverOpen]);

    const handleLabelButtonClick = () => {
        if (isLabelPopoverOpen) {
            setIsLabelPopoverOpen(false);
            return;
        }
        if (labelButtonRef.current) {
            const rect = labelButtonRef.current.getBoundingClientRect();
            setPopoverPosition({
                top: rect.bottom + 4, // 4px gap below button
                right: window.innerWidth - rect.right,
            });
            setIsLabelPopoverOpen(true);
        }
    };

    const handleSave = () => {
        if (!summary.trim() || !reporterId) {
            // Basic validation
            alert('Summary and Reporter are required.');
            return;
        }

        const newBugReport: BugReport = {
            id: bugReport?.id || nextBugId,
            summary,
            description,
            reporterId,
            assigneeId: assigneeId || undefined,
            status,
            priority,
            type,
            createdAt: bugReport?.createdAt || new Date().toISOString(),
            labels,
            attachments,
        };

        onSave(newBugReport);
        onClose();
    };
    
    const handleToggleLabel = (label: Label) => {
      const newLabels = labels.some(l => l.id === label.id)
        ? labels.filter(l => l.id !== label.id)
        : [...labels, label];
      setLabels(newLabels);
    };

    const handleCreateLabel = (text: string, color: string) => {
      const newLabel: Label = { id: crypto.randomUUID(), text, color };
      // Also add to the main list immediately for better UX
      setLabels([...labels, newLabel]);
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
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const deleteAttachment = (attachmentId: string) => {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    };


    const handleDelete = () => {
        if (bugReport && window.confirm(`Are you sure you want to delete this report: "${bugReport.summary}"?`)) {
            onDelete(bugReport.id);
            onClose();
        }
    };
    
    const renderUserOption = (user: User) => (
        <option key={user.id} value={user.id} className="text-black bg-white">
            {user.name}
        </option>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">{isNew ? 'Report an Issue' : `Edit: ${bugReport?.id}`}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <XIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>
                <main className="flex-grow p-6 space-y-4 custom-scrollbar overflow-y-auto">
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                        <input
                            id="summary"
                            type="text"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="A brief summary of the issue"
                            className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide a detailed description of the bug, including steps to reproduce."
                            rows={6}
                            className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                        <div className="space-y-2">
                             {attachments.map(attachment => (
                                <div key={attachment.id} className="flex items-center bg-gray-100 p-2 rounded-md group">
                                    <a href={attachment.url} download={attachment.name} className="flex-grow text-sm font-medium text-indigo-600 hover:underline truncate">{attachment.name}</a>
                                    <span className="text-xs text-gray-500 mx-2">{(attachment.size / 1024).toFixed(1)} KB</span>
                                    <button onClick={() => deleteAttachment(attachment.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium cursor-pointer border-2 border-dashed border-gray-300">
                                <PaperclipIcon className="w-5 h-5"/> Upload File
                                <input type="file" className="hidden" onChange={handleAttachmentUpload} />
                            </label>
                        </div>
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                        <div className="flex flex-wrap gap-2 items-center p-2 border rounded-md bg-white">
                            {labels.map(label => (
                                <span key={label.id} style={{backgroundColor: label.color}} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getContrastYIQ(label.color)}`}>
                                    {label.text}
                                </span>
                            ))}
                            <button ref={labelButtonRef} onClick={handleLabelButtonClick} className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                                <PlusIcon className="w-4 h-4 text-gray-600"/>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                            <select id="assignee" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400">
                                <option value="" className="text-black bg-white">Unassigned</option>
                                {users.map(renderUserOption)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reporter" className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                            <select id="reporter" value={reporterId} onChange={e => setReporterId(e.target.value)} className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400">
                                {users.map(renderUserOption)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="status" value={status} onChange={e => setStatus(e.target.value as BugStatus)} className="w-full p-2 border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400">
                                {Object.values(BugStatus).map(s => <option key={s} value={s} className="text-black bg-white">{s}</option>)}
                            </select>
                        </div>
                         <div className="relative" ref={priorityPopoverRef}>
                            <label htmlFor="priority-btn" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <button 
                                id="priority-btn"
                                onClick={() => setIsPriorityPopoverOpen(p => !p)} 
                                className="w-full p-2 border rounded-md bg-white text-left capitalize text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 flex justify-between items-center"
                            >
                                <span>{priority}</span>
                                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                            {isPriorityPopoverOpen && (
                                <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border">
                                    <div className="p-1 space-y-1">
                                        {(Object.values(TaskPriority) as TaskPriority[]).map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => { setPriority(p); setIsPriorityPopoverOpen(false); }} 
                                                className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium capitalize hover:bg-gray-100 ${priority === p ? 'bg-indigo-100 text-indigo-700' : 'text-gray-800'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg">
                    {!isNew ? (
                        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-md hover:bg-red-100 transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                            Delete
                        </button>
                    ) : <div />}
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors">
                            {isNew ? 'Submit Issue' : 'Save Changes'}
                        </button>
                    </div>
                </footer>
            </div>
            {isLabelPopoverOpen && popoverPosition && (
                <div
                    className="fixed"
                    style={{ top: `${popoverPosition.top}px`, right: `${popoverPosition.right}px`, zIndex: 50 }}
                >
                    <div className="relative">
                        <LabelPopover
                            allLabels={allLabels}
                            assignedLabels={labels}
                            onToggleLabel={handleToggleLabel}
                            onCreateLabel={handleCreateLabel}
                            onClose={() => setIsLabelPopoverOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};