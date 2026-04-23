import React from 'react';

export const ChromaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="17.36 -11.81 221.29 141.62"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g transform="matrix(0.86440678,0,0,0.86440678,17.355932,-11.812063)">
      <ellipse fill="#ffde2d" cx="170.66679" cy="81.919838" rx="85.333206" ry="81.919838" />
      <ellipse fill="#327eff" cx="85.333206" cy="81.919838" rx="85.333206" ry="81.919838" />
      <path d="m 170.66679,81.919964 c 0,45.243426 -38.20536,81.919196 -85.333713,81.919196 V 81.919964 Z M 85.333205,81.919836 C 85.333205,36.676791 123.53819,8.9599821e-5 170.66679,8.9599821e-5 V 81.919836 Z" fill="#ff6446" />
    </g>
  </svg>
);

export const QwenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Stylized swirl/Q shape for Qwen */}
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C14.24 22 16.32 21.25 18 20L21.5 23.5L23 22L19.5 18.5C21.05 16.8 22 14.5 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 14.28 19.04 16.34 17.5 17.8L16.2 16.5C17.3 15.3 18 13.7 18 12C18 8.69 15.31 6 12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C13.7 18 15.3 17.3 16.5 16.2L17.8 17.5C16.34 19.04 14.28 20 12 20Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// We can use Lucide icons for other things, or add more custom SVGs here if needed.
