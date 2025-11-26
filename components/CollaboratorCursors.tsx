import React from 'react';
import { User } from '../types';
import { useCollaborators } from '../hooks/useCollaborators';
import { CursorIcon } from './icons/CursorIcon';

interface CollaboratorCursorsProps {
    users: User[];
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({ users }) => {
    const collaborators = useCollaborators(users);

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
            {collaborators.map(user => (
                <div
                    key={user.id}
                    className="absolute transition-transform duration-[2000ms] ease-linear"
                    style={{ transform: `translate(${user.position.x}px, ${user.position.y}px)` }}
                >
                    <CursorIcon className="w-6 h-6 -ml-1 -mt-1" style={{ color: user.color }} />
                    <span
                        className="text-white text-sm font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
                        style={{ backgroundColor: user.color }}
                    >
                        {user.name}
                    </span>
                </div>
            ))}
        </div>
    );
};
