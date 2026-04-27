# Auth Flow Improvements Plan

## Context
Current auth flow has security issues identified via code review:
1. **CRITICAL**: Timing attack on email detection
2. **HIGH**: DB hit every request in JwtAuthGuard
3. **MEDIUM**: No refresh token mechanism
4. **MEDIUM**: Role hardcoded as 'customer'
5. **LOW**: Race condition on email uniqueness (no DB constraint)
6. **LOW**: Missing JwtAuthGuard on logout endpoint

User requested: Add a Role table for role management.

## Goals
1. Fix critical security vulnerabilities
2. Implement proper role-based access control (RBAC)
3. Add DB-level unique constraint on email
4. Reduce DB load from auth guard
5. Improve logout security

---

## Phase 1: Entity & Migration Updates

### 1.1 Create Role Entity
```typescript
// backend/src/modules/roles/role.entity.ts
@Entity()
export class Role {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string', unique: true })
  name!: string; // 'admin' | 'customer' | 'manager'

  @Property({ type: 'string' })
  description!: string;

  @ManyToMany(() => CustomerAccount, (customer) => customer.roles)
  customers = new Collection<CustomerAccount>(this);
}
```

### 1.2 Update CustomerAccount Entity
```typescript
// Add roles relationship
@ManyToMany(() => Role, (role) => role.customers)
roles = new Collection<Role>(this);

// Remove hardcoded status enum, use Role instead
```

### 1.3 Add Unique Constraint on Email
```typescript
@Property({ type: 'string' })
@Unique()
email!: string;
```

### 1.4 Create Migration
```bash
pnpm mikroorm migration:create --initial
```

---

## Phase 2: Fix Timing Attack Vulnerability

### Problem
```typescript
// Current flow - leaks admin email existence
const adminMatchesEmail = this.bootstrapAdminService.matchesEmail(email); // FIRST
const customer = adminMatchesEmail ? null : await this.customersService.findByEmail(email);
```

### Fix - Verify Password First
```typescript
// New flow - always check password to prevent timing leak
async login(dto: LoginRequestDto): Promise<AuthSession> {
  const email = dto.email.trim().toLowerCase();

  // 1. Try admin first, fallback to customer
  const adminEmail = this.bootstrapAdminService.getAdmin().email;
  const isAdminEmail = email === adminEmail;

  let user: AuthenticatedPrincipal | null = null;

  if (isAdminEmail) {
    const valid = await this.bootstrapAdminService.verifyPassword(dto.password);
    if (valid) {
      user = this.bootstrapAdminService.getAdmin();
    }
  } else {
    const customer = await this.customersService.findByEmail(email);
    if (customer) {
      const valid = await this.passwordService.verify(dto.password, customer.passwordHash);
      if (valid) {
        if (customer.status === 'disabled') {
          throw new UnauthorizedException('Account is disabled');
        }
        user = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: customer.roles.first()?.name ?? 'customer',
        };
      }
    }
  }

  // 2. Always run dummy hash to maintain constant time
  await this.passwordService.verify(dto.password, DUMMY_PASSWORD_HASH);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  return this.jwtAuthService.signSession(user);
}
```

---

## Phase 3: Optimize JwtAuthGuard (Reduce DB Hits)

### Option A: Cache customer in JWT
- Add customer status and role to JWT payload
- Only verify token signature, trust payload data
- Periodic DB refresh (e.g., every 5 minutes) or on demand

### Option B: Add short-lived cache
- Cache customer data in memory (with TTL)
- Use `JwtAuthService` cache for customer lookups

### Recommended: Option A (JWT contains more info)
```typescript
// New JwtPayload
interface JwtPayload {
  sub: string;
  jti: string;
  role: string;
  email: string;
  name: string;
  // Add status to avoid DB check for disabled accounts
  status?: 'active' | 'disabled';
}

// JwtAuthGuard - verify only, no DB hit unless token expired/invalid
async canActivate(context: ExecutionContext): Promise<boolean> {
  // ... token extraction ...

  const payload = this.jwtAuthService.verifyToken(token);
  if (!payload) {
    throw new UnauthorizedException('Invalid or expired token');
  }

  // If admin or active customer, trust the token
  if (payload.role === 'admin') {
    request.user = this.bootstrapAdminService.getAdmin();
    return true;
  }

  // For customers, still validate DB for status changes
  if (payload.status === 'disabled') {
    throw new UnauthorizedException('Account is disabled');
  }

  request.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
  return true;
}
```

---

## Phase 4: Add Refresh Token (Future)
Skip for now - adds complexity. Consider JWT refresh middleware.

---

## Phase 5: Secure Logout Endpoint

```typescript
@UseGuards(JwtAuthGuard)  // Add guard
@Post('logout')
@ApiCookieAuth('access_token')
@ApiResponse({ status: 200, description: 'Logged out successfully' })
async logout(
  @Req() request: Request,
  @Res({ passthrough: true }) res: Response,
) {
  // Optionally: Blacklist token (future enhancement)
  this.authCookieService.clearSessionCookie(res);
  return { message: 'Logged out successfully' };
}
```

---

## Implementation Order

1. **Create Role entity + migration** - User requested
2. **Add unique constraint on email** - Race condition fix
3. **Fix timing attack** - Critical security fix
4. **Optimize JwtAuthGuard** - High performance improvement
5. **Secure logout** - Low priority

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `backend/src/modules/roles/role.entity.ts` | Create |
| `backend/src/modules/roles/roles.module.ts` | Create |
| `backend/src/modules/customers/customer-account.entity.ts` | Update |
| `backend/src/modules/customers/customers.module.ts` | Update |
| `backend/src/modules/auth/auth.service.ts` | Update |
| `backend/src/modules/auth/auth.controller.ts` | Update |
| `backend/src/common/jwt/jwt-auth.guard.ts` | Update |
| `backend/src/common/jwt/jwt-auth.service.ts` | Update |
| `backend/src/common/jwt/jwt-auth.service.ts` | Update |
| `backend/src/modules/auth/auth-session.entity.ts` | Update |

---

## Rollback Plan
- Keep backup of entity files before migration
- Migration can be rolled back via `pnpm mikroorm migration:down`
