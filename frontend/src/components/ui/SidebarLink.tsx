import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SidebarLinkProps {
  to: string;
  icon?: ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
  nested?: boolean;
}

export function SidebarLink({ to, icon, label, collapsed, onClick, nested = false }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center ${nested ? 'pl-8 py-2' : 'py-2'} text-sm transition-colors duration-200 ` +
        (isActive
          ? 'text-emerald-400 font-medium'
          : 'text-gray-400 hover:text-gray-200')
      }
    >
      {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}


