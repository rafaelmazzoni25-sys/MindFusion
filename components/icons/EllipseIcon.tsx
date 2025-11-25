import React from 'react';

export const EllipseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <ellipse cx="12" cy="12" rx="9" ry="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);