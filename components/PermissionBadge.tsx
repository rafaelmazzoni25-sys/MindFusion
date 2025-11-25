import React from 'react';
import { Role } from '../services/api';

interface PermissionBadgeProps {
    role: Role | null;
}

/**
 * Displays user's role badge with appropriate styling
 */
export const PermissionBadge: React.FC<PermissionBadgeProps> = ({ role }) => {
    if (!role) return null;

    const colors = {
        Owner: 'bg-purple-100 text-purple-800 border-purple-300',
        Admin: 'bg-blue-100 text-blue-800 border-blue-300',
        Editor: 'bg-green-100 text-green-800 border-green-300',
        Viewer: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    const icons = {
        Owner: '👑',
        Admin: '⚡',
        Editor: '✏️',
        Viewer: '👁️',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${colors[role]}`}>
            <span>{icons[role]}</span>
            {role}
        </span>
    );
};

export default PermissionBadge;
