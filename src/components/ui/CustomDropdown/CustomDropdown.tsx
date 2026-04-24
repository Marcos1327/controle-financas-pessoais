import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckSquare, Square, Check } from 'lucide-react';
import './CustomDropdown.css';

interface Option {
  id: string;
  label: string;
}

interface CustomDropdownProps {
  label?: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  isMulti?: boolean;
  placeholder?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  isMulti = false,
  placeholder = 'Selecione...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (!isMulti) {
      onChange([val]);
      setIsOpen(false);
      return;
    }

    if (val === 'all') {
      if (selectedValues.length === options.length) {
        onChange([]);
      } else {
        onChange(options.map(o => o.id));
      }
      return;
    }

    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const getTriggerLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (!isMulti) return options.find(o => o.id === selectedValues[0])?.label || placeholder;
    if (selectedValues.length === options.length) return 'Todos';
    if (selectedValues.length === 1) return options.find(o => o.id === selectedValues[0])?.label || placeholder;
    return `${selectedValues.length} Selecionados`;
  };

  return (
    <div className="filter-group" ref={dropdownRef}>
      {label && <label className="filter-label">{label}</label>}
      <div className="custom-dropdown">
        <button 
          className={`dropdown-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{getTriggerLabel()}</span>
          <ChevronDown size={14} />
        </button>
        
        {isOpen && (
          <div className="dropdown-menu active">
            {isMulti && (
              <div 
                className={`dropdown-item ${selectedValues.length === options.length ? 'selected' : ''}`}
                onClick={() => handleSelect('all')}
              >
                {selectedValues.length === options.length ? <CheckSquare size={14} /> : <Square size={14} />}
                Selecionar Tudo
              </div>
            )}
            
            {options.map(option => (
              <div 
                key={option.id}
                className={`dropdown-item ${selectedValues.includes(option.id) ? 'selected' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                {isMulti ? (
                  selectedValues.includes(option.id) ? <CheckSquare size={14} /> : <Square size={14} />
                ) : (
                  selectedValues.includes(option.id) && <Check size={14} />
                )}
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
