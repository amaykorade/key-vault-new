# GitHub-Style RBAC Implementation (MVP)

## 🎯 Overview

We've implemented a simplified, GitHub-style access control system for the MVP.

## 📊 Access Model

### **Organization Level** (Unchanged)
```
OWNER  → Full access to all projects
ADMIN  → Full access to all projects
MEMBER → Access via project membership only
VIEWER → Read-only via project membership
```

### **Project Level** (NEW!)
```
OWNER  → Full control, can delete project
ADMIN  → Can manage members + all secrets
WRITE  → Can create/edit secrets
READ   → View only
```

## 🗄️ Database Changes

### New Models Added:

```prisma
model ProjectMember {
  id        String      @id @default(uuid())
  projectId String
  userId    String
  role      ProjectRole @default(READ)
  
  project   Project     @relation(fields: [projectId])
  user      User        @relation(fields: [userId])
  
  @@unique([projectId, userId])
}

enum ProjectRole {
  OWNER  // Full control, can delete project
  ADMIN  // Can manage members and secrets
  WRITE  // Can create/edit secrets
  READ   // View only
}
```

## 🔐 Access Rules

### Priority Order:
1. **Org OWNER/ADMIN** → Automatic full access to ALL org projects
2. **Project Member** → Access based on project role (OWNER/ADMIN/WRITE/READ)
3. **Everyone else** → No access

### Permission Matrix:

| Role | Read | Write | Delete | Manage Members | Manage Project |
|------|------|-------|--------|----------------|----------------|
| **Org OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Org ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Project OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Project ADMIN** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Project WRITE** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Project READ** | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🚀 Usage Flow

### 1. Create Organization
```
User creates org → Becomes OWNER
```

### 2. Invite Users
```
Send invitation → User joins as MEMBER
Note: MEMBER has no project access by default!
```

### 3. Create Project
```
OWNER/ADMIN creates project → Project creator becomes Project OWNER
```

### 4. Add Members to Project (GitHub-style)
```
Project OWNER/ADMIN → Add user → Select role (OWNER/ADMIN/WRITE/READ)
```

### 5. Access Secrets
```
User → Check project membership → Grant access based on role
```

## 💡 Examples

### Example 1: Small Startup
```
Organization: "Acme Corp"
├── Alice (Org OWNER) → Access to ALL projects
├── Bob (Org MEMBER) → No access yet
└── Charlie (Org MEMBER) → No access yet

Project: "Production Secrets"
├── Alice (via Org OWNER) → Full access
├── Bob (Project WRITE) → Can add/edit secrets
└── Charlie → No access (not added to project)
```

### Example 2: Large Team
```
Organization: "TechCo"
├── Admin (Org OWNER)
└── 50 Engineers (Org MEMBER)

Project: "Backend API Keys"
├── Admin (via Org OWNER)
├── Backend Team (5 users) → Project ADMIN
└── DevOps Team (3 users) → Project WRITE

Project: "Frontend Secrets"
├── Admin (via Org OWNER)
├── Frontend Team (8 users) → Project ADMIN
└── QA Team (2 users) → Project READ
```

## 🔧 API Endpoints (To Implement)

### Project Member Management:
```typescript
// Add member to project
POST /projects/:projectId/members
Body: { userId, role: 'OWNER' | 'ADMIN' | 'WRITE' | 'READ' }

// Update member role
PUT /projects/:projectId/members/:userId
Body: { role: 'OWNER' | 'ADMIN' | 'WRITE' | 'READ' }

// Remove member
DELETE /projects/:projectId/members/:userId

// List project members
GET /projects/:projectId/members
```

## 🎁 Bonus: Teams as Shortcuts

Teams can still be used to add multiple users at once:

```typescript
// Add entire team to project
POST /projects/:projectId/teams/:teamId
Body: { role: 'WRITE' }

// This creates ProjectMember entries for all team members
```

## ✅ Benefits of This Approach

1. **Simple & Familiar**: Everyone understands GitHub's model
2. **Flexible**: Fine-grained per-project control
3. **Secure by Default**: No access unless explicitly granted
4. **Scalable**: Works for both small and large teams
5. **Teams Optional**: Direct project sharing is primary, teams are convenience

## 📝 Migration Notes

- **Existing projects**: Project creator should be automatically added as OWNER
- **Org OWNER/ADMIN**: Continue to have full access (no breaking changes)
- **Org MEMBERS**: Need to be explicitly added to projects they should access

## 🔄 Next Steps (Post-MVP)

1. **Public/Private Projects**: Organization-wide visibility option
2. **Project Templates**: Pre-configured role sets
3. **Access Requests**: Users can request project access
4. **Audit Logs**: Track who accessed what
5. **Time-based Access**: Temporary permissions
6. **External Collaborators**: Non-org members with project access

---

Built with ❤️ for MVP simplicity and future scalability!

