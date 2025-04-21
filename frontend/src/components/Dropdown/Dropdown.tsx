import React, { useState, useRef, useEffect } from 'react';
import { DropdownProps } from './Dropdown.types';
import './Dropdown.css';

export const Select: React.FC<DropdownProps> = ({
  options = [],
  value = '',
  onChange = () => {},
  placeholder = 'Selecione...',
  disabled = false,
  multiple = false,
  searchable = false,
  className = '',
  style = {},
  closeOnSelect = true,
  noOptionsMessage = 'Sem opções disponíveis',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  // Obter o label da opção selecionada
  const getSelectedLabel = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      return value.map(v => {
        const option = options.find(opt => opt.value === v);
        return option ? option.label : '';
      }).join(', ');
    }
    
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  // Verificar se uma opção está selecionada
  const isOptionSelected = (optionValue: string | number) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Lidar com a seleção de uma opção
  const handleOptionSelect = (optionValue: string | number) => {
    if (disabled) return;
    
    if (multiple && Array.isArray(value)) {
      if (value.includes(optionValue)) {
        onChange(value.filter(v => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
    
    if (closeOnSelect && !multiple) {
      setIsOpen(false);
    }
    
    if (searchable) {
      setSearchTerm('');
    }
  };

  // Focar no input de busca quando o dropdown abrir
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className={`select-container ${className}`} 
      style={style} 
      ref={selectRef}
      data-testid="select-container"
    >
      <div 
        className={`select-header ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        role="combobox"
        aria-disabled={disabled}
      >
        <div className="select-value">{getSelectedLabel()}</div>
        <div className="select-arrow">{isOpen ? '▲' : '▼'}</div>
      </div>
      
      {isOpen && (
        <div className="select-dropdown" role="listbox">
          {searchable && (
            <div className="select-search">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                onClick={(e) => e.stopPropagation()}
                data-testid="select-search-input"
              />
            </div>
          )}
          
          {filteredOptions.length > 0 ? (
            <ul className="select-options">
              {filteredOptions.map((option, index) => (
                <li
                  key={`${option.value}-${index}`}
                  className={`select-option ${isOptionSelected(option.value) ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option.value)}
                  aria-selected={isOptionSelected(option.value)}
                  role="option"
                  data-testid={`select-option-${option.value}`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="select-no-options" data-testid="no-options-message">
              {noOptionsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;