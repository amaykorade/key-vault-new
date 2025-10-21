import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const secretFormSchema = z.object({
  name: z.string().min(1, 'Secret name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER']),
  environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long'),
  folder: z.string().min(1, 'Folder is required').max(50, 'Folder name too long'),
  value: z.string().min(1, 'Secret value is required'),
});

type SecretFormData = z.infer<typeof secretFormSchema>;

interface SecretFormProps {
  onSubmit: (data: SecretFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<SecretFormData>;
  title?: string;
}

const SECRET_TYPES = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'DATABASE_URL', label: 'Database URL' },
  { value: 'JWT_SECRET', label: 'JWT Secret' },
  { value: 'OAUTH_CLIENT_SECRET', label: 'OAuth Client Secret' },
  { value: 'WEBHOOK_SECRET', label: 'Webhook Secret' },
  { value: 'SSH_KEY', label: 'SSH Key' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'OTHER', label: 'Other' },
];

const ENVIRONMENTS = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const COMMON_FOLDERS = [
  { value: 'database', label: 'Database' },
  { value: 'auth', label: 'Authentication' },
  { value: 'payment', label: 'Payment' },
  { value: 'api', label: 'API Keys' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'external', label: 'External Services' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'third-party', label: 'Third Party' },
  { value: 'default', label: 'Default' },
];

export function SecretForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  initialData,
  title = "Create Secret"
}: SecretFormProps) {
  const [showValue, setShowValue] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SecretFormData>({
    resolver: zodResolver(secretFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'API_KEY',
      environment: initialData?.environment || 'development',
      folder: initialData?.folder || 'default',
      value: initialData?.value || '',
    },
  });

  const secretValue = watch('value');

  const handleFormSubmit = async (data: SecretFormData) => {
    await onSubmit(data);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Secret Name"
              placeholder="e.g., DATABASE_URL"
              error={errors.name?.message}
              autoComplete="off"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Secret Type</label>
              <select
                {...register('type')}
                className="flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {SECRET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-red-400">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Environment</label>
              <select
                {...register('environment')}
                className="flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
              {errors.environment && (
                <p className="text-sm text-red-400">{errors.environment.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Folder</label>
              <div className="relative">
                <input
                  {...register('folder')}
                  list="folder-suggestions"
                  placeholder="Select or type custom folder name"
                  className="flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  autoComplete="off"
                />
                <datalist id="folder-suggestions">
                  {COMMON_FOLDERS.map((folder) => (
                    <option key={folder.value} value={folder.value}>
                      {folder.label}
                    </option>
                  ))}
                </datalist>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.folder && (
                <p className="text-sm text-red-400">{errors.folder.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Choose from common folders or type a custom name (e.g., "microservices", "analytics", "third-party")
              </p>
            </div>
          </div>

          <Input
            {...register('description')}
            label="Description (Optional)"
            placeholder="Brief description of this secret"
            error={errors.description?.message}
            autoComplete="off"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Secret Value</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showValue ? 'Hide' : 'Show'}
                </button>
                {secretValue && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secretValue)}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                {...register('value')}
                placeholder="Enter the secret value..."
                className="flex min-h-[100px] w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-white"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}
              />
              {!showValue && (
                <div className="absolute inset-0 flex items-center px-4 py-3 text-sm text-gray-500 font-mono bg-gray-800/50 rounded-lg">
                  {secretValue ? '••••••••••••••••••••••••••••••••' : 'Enter the secret value...'}
                </div>
              )}
            </div>
            {errors.value && (
              <p className="text-sm text-red-400">{errors.value.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              loading={isLoading}
              disabled={isLoading}
            >
              {initialData ? 'Update Secret' : 'Create Secret'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
