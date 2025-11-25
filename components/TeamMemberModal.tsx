import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TeamMemberModalProps {
  member: User | null;
  onClose: () => void;
  onSave: (member: User) => void;
  onDelete?: (memberId: string) => void;
  onSendInvite?: (email: string, role: string) => void;
}

const USER_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24', '#f472b6', '#818cf8', '#c084fc'];

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, onClose, onSave, onDelete, onSendInvite }) => {
  const isNew = member === null;

  // For invites (new members)
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.Editor);

  // For editing existing members
  const [name, setName] = useState(member?.name || '');
  const [initials, setInitials] = useState(member?.initials || '');
  const [color, setColor] = useState(member?.color || USER_COLORS[0]);
  const [role, setRole] = useState(member?.role || UserRole.Editor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Auto-generate initials from name
    if (name && !member?.initials) { // only if creating new or name changes
      const parts = name.trim().split(' ');
      if (parts.length > 1) {
        setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
      } else if (parts[0].length > 1) {
        setInitials(parts[0].substring(0, 2).toUpperCase());
      } else {
        setInitials(parts[0].toUpperCase());
      }
    }
  }, [name, member?.initials]);

  const handleSave = () => {
    if (!name.trim() || !initials.trim()) {
      alert('Name and initials are required.');
      return;
    }
    onSave({
      id: member?.id || crypto.randomUUID(),
      name,
      initials,
      color,
      role,
    });
  };

  const handleSendInvite = () => {
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    if (onSendInvite) {
      onSendInvite(email, inviteRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{isNew ? 'Invite Team Member' : 'Edit Team Member'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><XIcon className="w-6 h-6 text-gray-500" /></button>
        </header>
        <main className="p-6 space-y-4">
          {isNew ? (
            // Invite mode: Email + Role
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">An invitation will be sent to this email</p>
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          ) : (
            // Edit mode: Name, Initials, Role, Color
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label htmlFor="initials" className="block text-sm font-medium text-gray-700 mb-1">Initials</label>
                <input id="initials" type="text" value={initials} onChange={e => setInitials(e.target.value)} maxLength={2} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md bg-white">
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {USER_COLORS.map(c => (
                    <button
                      key={c}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
        <footer className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg">
          {!isNew && onDelete ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-md hover:bg-red-100">
              <TrashIcon className="w-5 h-5" /> Delete
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Cancel</button>
            <button
              onClick={isNew ? handleSendInvite : handleSave}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
            >
              {isNew ? 'Send Invite' : 'Save Changes'}
            </button>
          </div>
        </footer>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Remove Member</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove {name}? They will be unassigned from all tasks and bugs. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (member && onDelete) {
                      onDelete(member.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
