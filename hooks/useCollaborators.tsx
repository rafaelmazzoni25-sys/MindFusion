import { useState, useEffect } from 'react';
import { User, Point } from '../types';

interface Collaborator extends User {
  position: Point;
}

export const useCollaborators = (users: User[]) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    // Sync collaborators with the users prop
    setCollaborators(current => {
        const userMap = new Map(users.map(u => [u.id, u]));
        const newCollaborators = users.map(user => {
            const existing = current.find(c => c.id === user.id);
            return existing || {
                ...user,
                position: { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }
            };
        });
        // Filter out deleted users
        return newCollaborators.filter(c => userMap.has(c.id));
    });
  }, [users]);


  useEffect(() => {
    const moveCollaborators = () => {
      setCollaborators(currentCollaborators =>
        currentCollaborators.map(c => ({
          ...c,
          position: {
            x: Math.random() * window.innerWidth,
            y: Math.random() * (window.innerHeight - 60) + 60 // Avoid header
          },
        }))
      );
    };

    const interval = setInterval(moveCollaborators, 4000);
    return () => clearInterval(interval);
  }, []);

  return collaborators;
};
