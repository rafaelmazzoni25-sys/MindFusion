import React from 'react';

export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-.615-6.228l-6.401-1.601a3.75 3.75 0 00-4.686 4.686l-1.601 6.402a3.75 3.75 0 003.098 4.544z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 12.75L19.5 6m-6.75 6.75L9 15.75m3.75-3.75L6 19.5m6.75-6.75L19.5 19.5" />
    </svg>
);