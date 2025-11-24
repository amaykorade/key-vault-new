# .env File Import Feature - Implementation Plan

## Overview
Allow users to bulk import secrets from `.env` files instead of manually typing each key-value pair. This will significantly improve UX for users with many secrets.

---

## 1. File Format Support

### Supported Formats:
- **Standard .env**: `KEY=value`
- **Quoted values**: `KEY="value"` or `KEY='value'`
- **Multi-line values**: `KEY="line1\nline2"` (for certificates, SSH keys)
- **Comments**: Lines starting with `#` (ignored)
- **Empty lines**: Ignored
- **Whitespace**: Trimmed from keys and values

### Example .env file:
```env
# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/db
DB_HOST=localhost
DB_PORT=5432

# API Keys
STRIPE_API_KEY=sk_live_1234567890
GITHUB_TOKEN=ghp_abcdefghijklmnop

# Multi-line secret (certificate)
SSL_CERT="-----BEGIN CERTIFICATE-----
MIIF...
-----END CERTIFICATE-----"
```

---

## 2. User Experience Flow

### Step 1: Upload/Import Button
- Location: In `FolderPage.tsx`, next to "Create Secret" button
- Button: "Import from .env File" or "Bulk Import"
- Icon: Upload/File icon

### Step 2: File Selection
- **Option A**: File input (click to browse)
- **Option B**: Drag & drop zone
- **Option C**: Paste text directly (for quick testing)
- File size limit: 1MB (prevent huge files)
- Accepted formats: `.env`, `.env.local`, `.env.production`, `.txt` (or any text file)

### Step 3: Preview & Validation
- Parse the file immediately after selection
- Show preview table with:
  - ✅ Valid secrets (ready to import)
  - ⚠️ Conflicts (secrets that already exist)
  - ❌ Errors (invalid format, empty values, etc.)
- Allow user to:
  - Review all secrets before importing
  - Toggle individual secrets on/off
  - Choose conflict resolution: **Skip** or **Overwrite**

### Step 4: Import Configuration
- **Environment & Folder**: Automatically uses the current folder page context
  - If user is on `/projects/:id/environments/development/folders/api`
  - Secrets will import into: `development` environment + `api` folder
  - No selection needed - uses current page context
- **Default Secret Type**: Auto-detect or default to "API_KEY"
- **Conflict Resolution**: 
  - Skip existing secrets (default)
  - Overwrite existing secrets
  - Show conflicts for manual review

### Step 5: Import Execution
- Show progress indicator (X of Y secrets imported)
- Process in batches (e.g., 10 at a time) to avoid overwhelming the server
- Show real-time feedback for each secret

### Step 6: Results Summary
- Success: "✅ 45 secrets imported successfully"
- Skipped: "⚠️ 3 secrets skipped (already exist)"
- Errors: "❌ 2 secrets failed: [list errors]"
- Option to retry failed imports

---

## 3. Backend Implementation

### 3.1 New API Endpoint
**POST** `/api/projects/:projectId/secrets/import`

**Request Body:**
```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "value": "postgresql://...",
      "type": "DATABASE_URL",  // Auto-detected or default
      "description": "Optional description"
    },
    // ... more secrets
  ],
  "environment": "development",
  "folder": "default",
  "conflictResolution": "skip" | "overwrite"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 50,
    "imported": 45,
    "skipped": 3,
    "failed": 2,
    "errors": [
      {
        "name": "INVALID_KEY",
        "error": "Secret name is too long"
      }
    ]
  },
  "importedSecrets": [...],
  "skippedSecrets": [...],
  "failedSecrets": [...]
}
```

### 3.2 Backend Service Method
**Location**: `Backend/src/services/secret.ts`

```typescript
static async importSecrets(
  projectId: string,
  userId: string,
  secrets: Array<{
    name: string;
    value: string;
    type?: SecretType;
    description?: string;
  }>,
  environment: string,
  folder: string,
  conflictResolution: 'skip' | 'overwrite'
): Promise<ImportResult>
```

**Logic:**
1. Validate user has WRITE access
2. Ensure folder exists (use `FolderService.ensureFolderRecord`)
3. For each secret:
   - Check if exists (same name + environment + folder)
   - If exists and `conflictResolution === 'skip'`: skip
   - If exists and `conflictResolution === 'overwrite'`: update
   - If doesn't exist: create
4. Return summary with imported/skipped/failed counts
5. Log audit events for all imports

### 3.3 .env File Parser
**Location**: `Backend/src/lib/env-parser.ts` (new file)

```typescript
export interface ParsedSecret {
  name: string;
  value: string;
  lineNumber: number;
  rawLine: string;
}

export function parseEnvFile(content: string): {
  secrets: ParsedSecret[];
  errors: Array<{ line: number; error: string }>;
}
```

**Parser Rules:**
- Ignore lines starting with `#` (comments)
- Ignore empty lines
- Parse `KEY=value` format
- Handle quoted values (single and double quotes)
- Handle escaped characters (`\n`, `\t`, etc.)
- Validate key names (alphanumeric + underscore, max 100 chars)
- Validate values (not empty, max reasonable length)

---

## 4. Frontend Implementation

### 4.1 New Component: `EnvImportModal`
**Location**: `frontend/src/components/EnvImportModal.tsx`

**Features:**
- File input with drag & drop
- Text paste option
- Preview table
- Conflict resolution UI
- Environment/Folder selection
- Progress indicator
- Results summary

**Props:**
```typescript
interface EnvImportModalProps {
  projectId: string;
  environment: string;  // From current page context
  folder: string;       // From current page context
  onClose: () => void;
  onSuccess: () => void; // Refresh secrets list
}
```

**State Management:**
```typescript
interface EnvImportState {
  file: File | null;
  content: string;
  parsedSecrets: ParsedSecret[];
  conflicts: Conflict[];
  errors: ParseError[];
  conflictResolution: 'skip' | 'overwrite';
  isImporting: boolean;
  importResult: ImportResult | null;
  // environment and folder come from props, not state
}
```

### 4.2 Integration in FolderPage
- Add "Import from .env" button next to "Create Secret"
- Open `EnvImportModal` on click
- **Pass current environment and folder as props** (from URL params)
- Modal automatically uses these values (no user selection needed)
- Refresh secrets list after successful import
- Show toast notifications for import status

### 4.3 API Service Method
**Location**: `frontend/src/services/api.ts`

```typescript
async importSecretsFromEnv(
  projectId: string,
  secrets: Array<{ name: string; value: string; type?: string }>,
  environment: string,
  folder: string,
  conflictResolution: 'skip' | 'overwrite'
): Promise<ImportResult>
```

---

## 5. Security Considerations

### 5.1 File Size Limits
- **Max file size**: 1MB (prevent DoS)
- **Max secrets per import**: 500 (reasonable limit)
- **Rate limiting**: Max 10 imports per hour per user

### 5.2 Validation
- Validate secret names (alphanumeric + underscore, max 100 chars)
- Validate secret values (not empty, reasonable max length)
- Sanitize input (prevent injection attacks)
- Validate environment and folder names

### 5.3 Audit Logging
- Log bulk import events
- Include: user, project, environment, folder, count of secrets imported
- Track which secrets were imported (names only, not values)
- Log conflict resolution choices

### 5.4 Error Handling
- Don't expose sensitive data in error messages
- Validate file format before processing
- Handle partial failures gracefully (some succeed, some fail)

---

## 6. Auto-Detection Features

### 6.1 Secret Type Detection
Auto-detect secret type based on key name patterns:

```typescript
function detectSecretType(keyName: string, value: string): SecretType {
  const lowerKey = keyName.toLowerCase();
  
  if (lowerKey.includes('database') || lowerKey.includes('db_url')) {
    return 'DATABASE_URL';
  }
  if (lowerKey.includes('jwt') || lowerKey.includes('token')) {
    return 'JWT_SECRET';
  }
  if (lowerKey.includes('oauth') || lowerKey.includes('client_secret')) {
    return 'OAUTH_CLIENT_SECRET';
  }
  if (lowerKey.includes('webhook')) {
    return 'WEBHOOK_SECRET';
  }
  if (lowerKey.includes('ssh') || lowerKey.includes('private_key')) {
    return 'SSH_KEY';
  }
  if (lowerKey.includes('cert') || lowerKey.includes('ssl')) {
    return 'CERTIFICATE';
  }
  if (lowerKey.includes('password') || lowerKey.includes('pass')) {
    return 'PASSWORD';
  }
  if (lowerKey.includes('api_key') || lowerKey.includes('apikey')) {
    return 'API_KEY';
  }
  
  return 'API_KEY'; // Default
}
```

---

## 7. Implementation Steps

### Phase 1: Backend Foundation
1. ✅ Create `.env` file parser (`Backend/src/lib/env-parser.ts`)
2. ✅ Add `importSecrets` method to `SecretService`
3. ✅ Create bulk import API endpoint
4. ✅ Add validation and error handling
5. ✅ Add audit logging for bulk imports

### Phase 2: Frontend UI
1. ✅ Create `EnvImportModal` component
2. ✅ Add file upload/drag-drop functionality
3. ✅ Implement preview table with conflict detection
4. ✅ Add environment/folder selection
5. ✅ Add conflict resolution UI
6. ✅ Integrate with `FolderPage`

### Phase 3: Testing & Polish
1. ✅ Test with various .env file formats
2. ✅ Test conflict resolution (skip/overwrite)
3. ✅ Test error handling (invalid files, network errors)
4. ✅ Add loading states and progress indicators
5. ✅ Add success/error toast notifications
6. ✅ Test with large files (50+ secrets)

---

## 8. Edge Cases to Handle

1. **Empty values**: `KEY=` → Skip or show warning?
2. **Duplicate keys in file**: Use last occurrence or show error?
3. **Invalid key names**: Show error, skip, or sanitize?
4. **Very long values**: Multi-line certificates, SSH keys
5. **Special characters**: Quotes, newlines, escape sequences
6. **File encoding**: UTF-8, handle BOM if present
7. **Partial failures**: Some secrets succeed, some fail
8. **Network timeouts**: For large imports, show progress

---

## 9. Future Enhancements

1. **Export to .env**: Allow users to export secrets as .env file
2. **Template library**: Pre-built .env templates for common stacks
3. **Validation rules**: Custom validation per secret type
4. **Bulk edit**: Edit multiple secrets at once
5. **Import from other formats**: JSON, YAML, TOML
6. **Import from URL**: Fetch .env from URL (with auth)
7. **Scheduled imports**: Auto-import from external sources

---

## 10. UI Mockup Concept

```
┌─────────────────────────────────────────┐
│  Import Secrets from .env File          │
├─────────────────────────────────────────┤
│                                         │
│  [📁 Choose File] or drag & drop here   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Preview (50 secrets found)         │ │
│  ├───────────────────────────────────┤ │
│  │ ✅ DATABASE_URL                   │ │
│  │ ✅ STRIPE_API_KEY                 │ │
│  │ ⚠️  GITHUB_TOKEN (exists)         │ │
│  │ ✅ AWS_ACCESS_KEY                 │ │
│  │ ...                               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Importing to: Development / api       │
│  (Current folder context)               │
│                                         │
│  Conflict Resolution:                   │
│  ○ Skip existing secrets (recommended)  │
│  ● Overwrite existing secrets           │
│                                         │
│  [Cancel]  [Import 50 Secrets]          │
└─────────────────────────────────────────┘
```

---

## 11. Success Criteria

- ✅ Users can import 50+ secrets in < 30 seconds
- ✅ Clear feedback on conflicts and errors
- ✅ No data loss during import
- ✅ All imports are audited
- ✅ Works with standard .env file formats
- ✅ Handles edge cases gracefully
- ✅ Mobile-friendly (if needed)

---

## Questions to Consider

1. **Should we support multi-environment imports?** (Parse `.env.development`, `.env.production` from one file?)
2. **Should we allow importing to multiple folders at once?** (Probably not in MVP)
3. **Should we show a diff view for overwrites?** (Show old vs new value)
4. **Should we support importing from clipboard only?** (No file upload)
5. **Should we validate secret values?** (Check if API key format is valid, etc.)

---

## Estimated Implementation Time

- **Backend**: 4-6 hours
- **Frontend**: 6-8 hours
- **Testing & Polish**: 2-3 hours
- **Total**: ~12-17 hours

---

This plan provides a comprehensive approach to implementing .env file import while maintaining security, usability, and scalability.

