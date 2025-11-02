import { HTMLAttributes } from 'react';

export function Table({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`bg-gray-800/40 ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b border-gray-800/70 hover:bg-gray-800/30 ${className}`} {...props} />;
}

export function TableHead({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-2 ${className}`} {...props} />
  );
}

export function TableCell({ className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />;
}


