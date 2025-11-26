import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceInvite, UserRole } from '../types';
import { BellIcon } from './icons/BellIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface InvitesDropdownProps {
    invites: WorkspaceInvite[];
    onAcceptInvite: (inviteId: string) => void;
    onRejectInvite: (inviteId: string) => void;
}

const InvitesDropdown: React.FC<InvitesDropdownProps> = ({ invites, onAcceptInvite, onRejectInvite }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const pendingInvites = invites.filter(invite => invite.status === 'pending');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.Admin:
                return 'bg-red-100 text-red-800';
            case UserRole.Editor:
                return 'bg-blue-100 text-blue-800';
            case UserRole.Viewer:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Convites"
            >
                <BellIcon className="w-6 h-6" />
                {pendingInvites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingInvites.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <h3 className="font-bold text-gray-900 text-lg">Convites</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {pendingInvites.length === 0
                                ? 'Você não tem convites pendentes'
                                : `${pendingInvites.length} convite${pendingInvites.length > 1 ? 's' : ''} pendente${pendingInvites.length > 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {pendingInvites.length === 0 ? (
                        <div className="p-8 text-center">
                            <BellIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Nenhum convite no momento</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {pendingInvites.map((invite) => (
                                <div key={invite.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{invite.workspaceName}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Convidado por <span className="font-medium">{invite.inviterName}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(invite.role)}`}>
                                                    {invite.role}
                                                </span>
                                                <span className="text-xs text-gray-500">{formatDate(invite.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                onAcceptInvite(invite.id);
                                                setIsOpen(false);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                            Aceitar
                                        </button>
                                        <button
                                            onClick={() => {
                                                onRejectInvite(invite.id);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                                        >
                                            <XIcon className="w-4 h-4" />
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvitesDropdown;
