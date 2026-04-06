# Finance Data Processing and Access Control Backend

A clean, well-structured REST API for a finance dashboard system with role-based access control.

Built with **Node.js + Express** and **sql.js** (in-memory SQLite — no database setup required).

---

## Quick Start

```bash
npm install
npm start          # http://localhost:3000
npm test           # run all 53 tests
npm run seed       # print demo credentials (in-memory only)
```

> **Note:** sql.js is a pure-JavaScript SQLite engine. The database is in-memory and resets on each restart. This was chosen for zero-setup portability — see [Assumptions](#assumptions) for rationale.

---

## Project Structure

```
src/
├── app.js                  # Express app (routes, middleware wiring)
├── server.js               # Entry point — boots DB then starts HTTP server
├── config/
│   ├── database.js         # sql.js init, schema migrations, query helpers
│   └── constants.js        # Roles, permissions matrix, allowed values
├── middleware/
│   ├── auth.js             # JWT sign / verify, authenticate & authorize middleware
│   └── errorHandler.js     # validateRequest, global errorHandler, 404 handler
├── models/
│   ├── user.model.js       # User CRUD + password hashing
│   └── record.model.js     # Financial record CRUD + aggregation queries
├── routes/
│   ├── auth.routes.js      # POST /register, POST /login, GET /me
│   ├── user.routes.js      # /api/users — CRUD, admin-gated
│   ├── record.routes.js    # /api/records — CRUD with filters
│   └── dashboard.routes.js # /api/dashboard — summary, categories, trends
├── services/
│   ├── auth.service.js     # Business logic for register / login
│   ├── user.service.js     # Business logic for user management
│   ├── record.service.js   # Business logic for financial records
│   └── dashboard.service.js# Business logic for analytics / aggregations
├── validators/
│   ├── auth.validator.js   # express-validator rules for auth endpoints
│   ├── user.validator.js   # express-validator rules for user endpoints
│   └── record.validator.js # express-validator rules for record endpoints
└── scripts/
    └── seed.js             # Populates demo data and prints credentials
tests/
├── helpers.js              # Shared test utilities (registerUser, loginUser)
├── auth.test.js            # 10 tests — registration, login, /me
├── users.test.js           # 13 tests — all user management scenarios
├── records.test.js         # 20 tests — full CRUD + validation + access control
└── dashboard.test.js       # 10 tests — summary, categories, trends, recent
```

---

## Roles & Permission Matrix

| Action              | Viewer | Analyst | Admin |
|---------------------|:------:|:-------:|:-----:|
| Register / Login    | ✅     | ✅      | ✅    |
| View own profile    | ✅     | ✅      | ✅    |
| List all users      | ❌     | ❌      | ✅    |
| Create / update / delete users | ❌ | ❌ | ✅ |
| View financial records | ✅  | ✅      | ✅    |
| Create / update / delete records | ❌ | ❌ | ✅ |
| Dashboard summary   | ✅     | ✅      | ✅    |
| Recent activity     | ✅     | ✅      | ✅    |
| Category breakdown  | ❌     | ✅      | ✅    |
| Monthly trends      | ❌     | ✅      | ✅    |

Permissions are declared centrally in `src/config/constants.js` and enforced by the `authorize(action)` middleware factory in `src/middleware/auth.js`.

---

## API Reference

All protected endpoints require: `Authorization: Bearer <token>`

### Auth

| Method | Path                  | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| POST   | `/api/auth/register`  | No   | Create account, receive JWT        |
| POST   | `/api/auth/login`     | No   | Login, receive JWT                 |
| GET    | `/api/auth/me`        | Any  | Get own profile                    |

**Register / Login body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "password123", "role": "viewer" }
```

**Response:**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Alice", "email": "...", "role": "viewer" } }
```

---

### Users  `/api/users`

| Method | Path            | Role  | Description                        |
|--------|-----------------|-------|------------------------------------|
| GET    | `/`             | Admin | List all users (paginated)         |
| GET    | `/:id`          | Any*  | Get user by ID (*own profile only for non-admin) |
| POST   | `/`             | Admin | Create user with explicit role     |
| PATCH  | `/:id`          | Admin | Update name / role / status        |
| DELETE | `/:id`          | Admin | Delete user (cannot self-delete)   |

**Query params for GET /:** `?status=active|inactive&page=1&limit=20`

**PATCH body (all fields optional):**
```json
{ "name": "New Name", "role": "analyst", "status": "inactive" }
```

---

### Financial Records  `/api/records`

| Method | Path   | Role        | Description                              |
|--------|--------|-------------|------------------------------------------|
| GET    | `/`    | Any         | List records with filters + pagination   |
| GET    | `/:id` | Any         | Get single record                        |
| POST   | `/`    | Admin       | Create record                            |
| PATCH  | `/:id` | Admin       | Partial update                           |
| DELETE | `/:id` | Admin       | Soft delete (sets `deleted_at`)          |

**POST / PATCH body:**
```json
{
  "amount":   1500.00,
  "type":     "income",
  "category": "Salary",
  "date":     "2024-03-01",
  "notes":    "March salary"
}
```

**GET query filters:**
```
?type=income|expense
?category=Salary
?dateFrom=2024-01-01&dateTo=2024-03-31
?page=1&limit=20
?sortBy=date|amount|category&order=ASC|DESC
```

**Paginated response:**
```json
{ "data": [...], "total": 42, "page": 1, "limit": 20 }
```

---

### Dashboard  `/api/dashboard`

| Method | Path           | Role           | Description                       |
|--------|----------------|----------------|-----------------------------------|
| GET    | `/summary`     | Any            | Income, expenses, net, count      |
| GET    | `/recent`      | Any            | Recent N records (`?limit=10`)    |
| GET    | `/categories`  | Analyst, Admin | Totals grouped by category + type |
| GET    | `/trends`      | Analyst, Admin | Monthly income vs expense         |

**Summary response:**
```json
{
  "summary": {
    "total_income":   37500,
    "total_expenses": 5400,
    "net_balance":    32100,
    "record_count":   15
  }
}
```

**Trends response:**
```json
{
  "trends": [
    { "month": "2024-01", "income": 15500, "expenses": 950, "net": 14550 },
    { "month": "2024-02", "income": 13700, "expenses": 1390, "net": 12310 }
  ]
}
```

---

## Error Responses

All errors follow a consistent shape:

```json
{ "error": "Human-readable message." }
```

Validation errors (422) include field-level detail:
```json
{
  "error": "Validation failed.",
  "details": [
    { "field": "amount", "message": "Amount must be a positive number." }
  ]
}
```

| Status | Meaning                                 |
|--------|-----------------------------------------|
| 400    | Invalid business operation              |
| 401    | Missing or invalid JWT                  |
| 403    | Authenticated but insufficient role     |
| 404    | Resource not found                      |
| 409    | Conflict (e.g. duplicate email)         |
| 422    | Validation failed                       |
| 500    | Unexpected server error                 |

---

## Design Decisions

### Layered Architecture
Each concern has a dedicated layer: **Routes** handle HTTP, **Services** contain business logic, **Models** own data access. This keeps each file small and makes unit testing straightforward.

### Centralised Permission Matrix
Rather than scattering role checks across files, all permissions are declared once in `constants.js`. The `authorize('ACTION')` middleware reads from that matrix. Adding a new permission means one change in one place.

### Soft Deletes for Records
Financial records use `deleted_at` instead of hard deletion. This preserves audit history (financial data should never truly disappear) and makes accidental-deletion recovery trivial.

### SQL Injection Prevention
All query parameters are passed as parameterised values (`?` placeholders). Sort column names are validated against a whitelist before interpolation — the only place string interpolation is used in SQL.

### Consistent Error Flow
Services throw plain `Error` objects with a `.status` property. A single global `errorHandler` in Express translates these to HTTP responses. Routes only contain `try/catch → next(err)`.

---

## Assumptions

1. **In-memory storage** was chosen for zero-setup portability. Swapping to persistent SQLite requires only changing `new SQL.Database()` to `new SQL.Database(fs.readFileSync('finance.db'))` and adding a periodic `fs.writeFileSync` flush. The schema and query layer are identical.

2. **Registration is open** (no invite code) to make the API explorable. In production, direct registration would be admin-only and the first admin seeded via migration.

3. **Password reset** and email verification are out of scope per the assignment brief.

4. **Amounts are stored as floats.** In a production system, monetary values should be stored as integers (minor currency units) to avoid floating-point rounding. This is noted as a known tradeoff.

5. **Soft delete applies to records only**, not users. Deleting a user is an explicit admin action with intentional permanence (though `ON DELETE CASCADE` would be added if records referenced users in production).

---

## Running Tests

```bash
npm test
```

53 tests across 4 suites covering:
- Registration, login, token validation
- Role-based access control (viewer / analyst / admin)
- Full CRUD for users and records
- Input validation (bad types, missing fields, invalid dates)
- Dashboard aggregation endpoints
- Soft delete behaviour and 404 consistency
