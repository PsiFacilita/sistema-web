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
  
  const baseClasses = 'font-light text-sage-800';
  const levelClasses = {
    1: 'text-4xl mb-8 tracking-tight',
    2: 'text-3xl mb-6',
    3: 'text-2xl mb-4',
    4: 'text-xl mb-3',
    5: 'text-lg mb-2',
    6: 'text-base mb-1',
  };

  return (
    <Tag className={`${baseClasses} ${levelClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
};

export default Title;