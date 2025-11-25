import React from 'react';

export const CylinderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <ellipse cx="12" cy="7" rx="6" ry="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7v10c0 1.657 2.686 3 6 3s6-1.343 6-3V7" />
    </svg>
);