import React, { JSX, ReactNode } from 'react';

interface TitleProps {
  children: ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const Title: React.FC<TitleProps> = ({ 
  children, 
  className = '', 
  level = 1 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const baseClasses = 'font-bold text-gray-800';
  const levelClasses = {
    1: 'text-3xl mb-6',
    2: 'text-2xl mb-4',
    3: 'text-xl mb-3',
    4: 'text-lg mb-2',
    5: 'text-base mb-1',
    6: 'text-sm mb-1',
  };

  return (
    <Tag className={`${baseClasses} ${levelClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
};

export default Title;