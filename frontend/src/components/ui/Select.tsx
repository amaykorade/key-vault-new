import * as React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  const { open, setOpen } = context;

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`w-full flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors text-left focus:outline-none focus:border-emerald-500 ${className}`}
    >
      {children}
      <svg
        className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  const { value } = context;
  
  return <span className={value ? 'text-gray-200' : 'text-gray-500'}>{value || placeholder}</span>;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  const { open, setOpen } = context;
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const { value: selectedValue, onValueChange, setOpen } = context;
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-700 focus:outline-none ${
        isSelected ? 'bg-gray-700/50 text-emerald-400' : 'text-gray-300'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {isSelected && (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

