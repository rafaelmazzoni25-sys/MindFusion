import React from 'react';

export const RoundedRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <rect x="3" y="6" width="18" height="12" rx="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);