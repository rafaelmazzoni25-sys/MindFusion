import React, { useState, useEffect } from 'react';
import { api, WorkspaceInvite, Role } from '../services/api';
import usePermissions from '../hooks/usePermissions';
import PermissionBadge from './PermissionBadge';

interface ShareWorkspaceModalProps {
    workspaceId: number;
    workspaceName: string;
    onClose: () => void;
}

interface WorkspaceMember {
    id: string;
    name: string;
    email?: string;
    role: Role;
    color?: string;
    initials?: string;
    created_at: string;
}

export const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = ({
    workspaceId,
    workspaceName,
    onClose,
}) => {
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>('Editor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { can } = usePermissions(workspaceId);

    useEffect(() => {
        loadData();
    }, [workspaceId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [membersData, invitesData] = await Promise.all([
                api.workspaces.listMembers(workspaceId),
                can('manage_members') ? api.invites.listForWorkspace(workspaceId) : Promise.resolve([]),
            ]);
            setMembers(membersData);
            setInvites(invitesData);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        try {
            setLoading(true);
            setError(null);
            await api.invites.send(workspaceId, inviteEmail.trim(), inviteRole);
            setInviteEmail('');
            setInviteRole('Editor');
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInvite = async (inviteId: number) => {
        if (!confirm('Cancel this invitation?')) return;

        try {
            await api.invites.cancel(inviteId);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to cancel invitation');
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: Role) => {
        try {
            await api.workspaces.updateMemberRole(workspaceId, memberId, newRole);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from this workspace?`)) return;

        try {
            await api.workspaces.removeMember(workspaceId, memberId);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to remove member');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Share Workspace</h2>
                        <p className="text-sm text-gray-600 mt-1">{workspaceName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Invite Form */}
                    {can('manage_members') && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Invite New Member</h3>
                            <form onSubmit={handleSendInvite} className="flex gap-2">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as Role)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={loading || !inviteEmail.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Invite
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Current Members */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Members ({members.length})
                        </h3>
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {member.initials ? (
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                style={{ backgroundColor: member.color }}
                                            >
                                                {member.initials}
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            {member.email && (
                                                <p className="text-sm text-gray-600">{member.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {member.role === 'Owner' ? (
                                            <PermissionBadge role="Owner" />
                                        ) : can('manage_members') ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleUpdateRole(member.id, e.target.value as Role)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="Editor">Editor</option>
                                                    <option value="Viewer">Viewer</option>
                                                </select>
                                                <button
                                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <PermissionBadge role={member.role} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Invites */}
                    {can('manage_members') && invites.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Pending Invitations ({invites.length})
                            </h3>
                            <div className="space-y-2">
                                {invites.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{invite.invited_email}</p>
                                            <p className="text-sm text-gray-600">
                                                Invited by {invite.invited_by_name} • Expires{' '}
                                                {new Date(invite.expires_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <PermissionBadge role={invite.role} />
                                            <button
                                                onClick={() => handleCancelInvite(invite.id)}
                                                className="text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareWorkspaceModal;
