import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, TaskCard, BugReport } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { XIcon } from './icons/XIcon';
import { TeamMemberModal } from './TeamMemberModal';
import { teamAPI, TeamInvite } from '../services/api';

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div title={user.name} className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl mb-3`} style={{ backgroundColor: user.color || '#64748b' }}>
            {user.initials}
        </div>
    );
};

interface TeamViewProps {
    users: User[];
    allTasks: TaskCard[];
    bugReports: BugReport[];
    onAddUser: (user: User) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ users, allTasks, bugReports, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [selectedMember, setSelectedMember] = useState<User | null | 'new'>(null);
    const [memberToDelete, setMemberToDelete] = useState<User | null>(null);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);

    // Load invites on mount
    useEffect(() => {
        loadInvites();
    }, []);

    const loadInvites = async () => {
        try {
            setLoadingInvites(true);
            const data = await teamAPI.getInvites();
            setInvites(data);
        } catch (error) {
            console.error('Failed to load invites:', error);
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleSendInvite = async (email: string, role: string) => {
        try {
            const newInvite = await teamAPI.sendInvite(email, role);
            setInvites(prev => [newInvite, ...prev]);
            setSelectedMember(null);
            alert(`Invite sent to ${email}!`);
        } catch (error: any) {
            alert(error.message || 'Failed to send invite');
        }
    };

    const handleCancelInvite = async (inviteId: number) => {
        if (!confirm('Are you sure you want to cancel this invite?')) return;
        try {
            await teamAPI.cancelInvite(inviteId);
            setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        } catch (error: any) {
            alert(error.message || 'Failed to cancel invite');
        }
    };

    const userStats = useMemo(() => {
        const stats = new Map<string, { assignedTasks: number; reportedBugs: number }>();
        users.forEach(u => stats.set(u.id, { assignedTasks: 0, reportedBugs: 0 }));

        allTasks.forEach(task => {
            task.assignedUserIds?.forEach(userId => {
                if (stats.has(userId)) {
                    stats.get(userId)!.assignedTasks++;
                }
            });
        });

        bugReports.forEach(bug => {
            if (stats.has(bug.reporterId)) {
                stats.get(bug.reporterId)!.reportedBugs++;
            }
        });

        return stats;
    }, [users, allTasks, bugReports]);

    const handleSaveMember = (member: User) => {
        if (users.some(u => u.id === member.id)) {
            onUpdateUser(member);
        } else {
            onAddUser(member);
        }
        setSelectedMember(null);
    };

    const handleDeleteConfirm = () => {
        if (memberToDelete) {
            onDeleteUser(memberToDelete.id);
            setMemberToDelete(null);
        }
    };

    const getRoleStyles = (role?: UserRole) => {
        switch (role) {
            case UserRole.Admin:
                return 'bg-indigo-100 text-indigo-800';
            case UserRole.Editor:
                return 'bg-blue-100 text-blue-800';
            case UserRole.Viewer:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto custom-scrollbar">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Team Management</h1>
                <button onClick={() => setSelectedMember('new')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 shadow-sm">
                    <PlusIcon className="w-5 h-5" /> Add Member
                </button>
            </header>

            {/* Pending Invites Section */}
            {invites.length > 0 && (
                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Pending Invites</h2>
                    <div className="space-y-2">
                        {invites.map(invite => (
                            <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{invite.email}</p>
                                    <p className="text-xs text-gray-500">Role: {invite.role} • Sent by {invite.invited_by || 'You'} • {new Date(invite.created_at).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleCancelInvite(invite.id)}
                                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Cancel invite"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {users.map(user => {
                    const stats = userStats.get(user.id) || { assignedTasks: 0, reportedBugs: 0 };
                    return (
                        <div key={user.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center transition-transform hover:-translate-y-1 relative group">
                            <button onClick={() => setSelectedMember(user)} className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity">
                                <PencilIcon className="w-4 h-4 text-gray-600" />
                            </button>
                            <UserAvatar user={user} />
                            <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                            <p className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 mb-3 ${getRoleStyles(user.role)}`}>{user.role || 'Member'}</p>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{stats.assignedTasks} task{stats.assignedTasks !== 1 ? 's' : ''} assigned</p>
                                <p>{stats.reportedBugs} bug{stats.reportedBugs !== 1 ? 's' : ''} reported</p>
                            </div>
                            {users.length > 1 && (
                                <button onClick={() => setMemberToDelete(user)} className="mt-4 text-xs text-red-500 hover:text-red-700 hover:underline">
                                    Remove
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedMember && (
                <TeamMemberModal
                    member={selectedMember === 'new' ? null : selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onSave={handleSaveMember}
                    onDelete={(memberId) => {
                        const member = users.find(u => u.id === memberId);
                        if (member) setMemberToDelete(member);
                    }}
                    onSendInvite={handleSendInvite}
                />
            )}

            {memberToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in-scale-up" onClick={() => setMemberToDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Remove Member</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove {memberToDelete.name}? They will be unassigned from all tasks and bugs. This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 rounded-md font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamView;
