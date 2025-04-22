import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Label: React.FC<LabelProps> = ({
  className = '',
  required = false,
  disabled = false,
  children,
  ...props
}) => {
  const baseClasses = 'block text-sm font-medium';
  const stateClasses = disabled ? 'text-gray-400' : 'text-gray-700';

  return (
    <label
      className={`${baseClasses} ${stateClasses} ${className}`}
      aria-disabled={disabled}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
};

export default Label;