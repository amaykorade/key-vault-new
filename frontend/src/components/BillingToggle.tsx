interface BillingToggleProps {
  value: 'MONTHLY' | 'YEARLY';
  onChange: (value: 'MONTHLY' | 'YEARLY') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <span className={`text-sm font-medium transition-colors ${value === 'MONTHLY' ? 'text-white' : 'text-gray-500'}`}>
        Monthly
      </span>
      <button
        type="button"
        onClick={() => onChange(value === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
        className="relative inline-flex h-11 w-20 items-center rounded-full bg-gray-800 border border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        role="switch"
        aria-checked={value === 'YEARLY'}
        aria-label="Toggle billing cycle"
      >
        <span
          className={`inline-block h-9 w-9 transform rounded-full bg-emerald-500 shadow-lg transition-transform duration-200 ease-in-out ${
            value === 'YEARLY' ? 'translate-x-10' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium transition-colors ${value === 'YEARLY' ? 'text-white' : 'text-gray-500'}`}>
          Yearly
        </span>
        {value === 'YEARLY' && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300">
            Save 25%
          </span>
        )}
      </div>
    </div>
  );
}

