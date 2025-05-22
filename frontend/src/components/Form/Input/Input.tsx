import React, { useState, useEffect, useRef } from 'react';

type InputType = 
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'search';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  customOnChange?: (value: string) => void; // <- nome diferente para evitar conflito
  type?: InputType;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  mask?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const applyMask = (value: string, mask: string): string => {
  if (!mask || !value) return value;

  let maskedValue = '';
  let valueIndex = 0;

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === '#') {
      if (/\d/.test(value[valueIndex])) {
        maskedValue += value[valueIndex++];
      }
    } else if (mask[i] === 'A') {
      if (/[a-zA-Z]/.test(value[valueIndex])) {
        maskedValue += value[valueIndex++];
      }
    } else if (mask[i] === '*') {
      maskedValue += value[valueIndex++];
    } else {
      maskedValue += mask[i];
    }
  }

  return maskedValue;
};

const Input: React.FC<InputProps> = ({
  value = '',
  customOnChange = () => {},
  type = 'text',
  placeholder = '',
  disabled = false,
  error = false,
  helperText = '',
  mask = '',
  required = false,
  className = '',
  style,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<string>(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (mask) {
      newValue = applyMask(newValue.replace(/\D/g, ''), mask);
    }

    setInternalValue(newValue);
    customOnChange(newValue); // <- valor limpo para quem quiser usar diretamente
    props.onChange?.(e);      // <- evento padrão nativo
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const baseClasses = `block w-full p-2 rounded-md border shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 ${
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
  }`;

  const stateClasses = error
    ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-green-500 focus:ring-green-500';

  return (
    <div className={className} style={style}>
      <div className="relative rounded-md shadow-sm">
      <input
        ref={inputRef}
        type={type}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText ? `${props.id}-helper-text` : undefined}
        className={`${baseClasses} ${stateClasses}`}
        {...props}
      />

      </div>

      {(error || helperText) && (
        <p
          id={`${props.id}-helper-text`}
          className={`mt-1 text-sm ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
