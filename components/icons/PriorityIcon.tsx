import React from 'react';
import { TaskPriority } from '../../types';

interface PriorityIconProps extends React.SVGProps<SVGSVGElement> {
    priority: TaskPriority;
}

export const PriorityIcon: React.FC<PriorityIconProps> = ({ priority, ...props }) => {
    const barOpacities: Record<TaskPriority, number[]> = {
        [TaskPriority.Low]: [1, 0.3, 0.3],
        [TaskPriority.Medium]: [1, 1, 0.3],
        [TaskPriority.High]: [1, 1, 1],
    };
    const opacities = barOpacities[priority];
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" {...props}>
            <rect x="6" y="14" width="3" height="5" rx="1" opacity={opacities[0]} />
            <rect x="10.5" y="10" width="3" height="9" rx="1" opacity={opacities[1]} />
            <rect x="15" y="6" width="3" height="13" rx="1" opacity={opacities[2]} />
        </svg>
    );
};
