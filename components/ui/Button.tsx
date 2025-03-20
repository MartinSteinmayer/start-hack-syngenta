"use client";

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    // Variant styles
    const variantStyles = {
        primary: 'bg-green-600 hover:bg-green-700 text-white',
        secondary: 'bg-blue-600 hover:bg-blue-700 text-white',
        outline: 'bg-transparent border border-green-600 text-green-600 hover:bg-green-50',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
    };

    // Size styles
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`rounded-md font-medium transition-colors focus:outline-none 
        focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
