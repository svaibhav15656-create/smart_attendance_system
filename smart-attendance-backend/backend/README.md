# Smart Faculty Attendance System — Backend

## Tech Stack
- Node.js + Express
- PostgreSQL (via `pg`)
- JWT Authentication
- bcryptjs for password hashing

## Folder Structure
```
backend/
├── config/
│   └── db.js              # PostgreSQL pool + table auto-creation
├── middleware/
│   ├── auth.js            # JWT verify middleware
│   └── wifi.js            # IP/WiFi restriction middleware
├── routes/
│   ├── auth.js            # Login, Register, Face save/fetch
│   ├── attendance.js      # Mark Entry / Exit
│   └── admin.js           # Admin dashboard, reports
├── server.js              # Main Express app
├── .env                   # Your environment variables (fill this)
└── render.yaml            # One-click Render deploy config
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register faculty |
| POST | /api/auth/login | Login → returns JWT |
| GET | /api/auth/me | Get logged-in faculty info |
| POST | /api/auth/save-face | Save face image (base64) |
| GET | /api/auth/face-data | Get stored face image |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance/entry | Mark entry (WiFi check + face) |
| POST | /api/attendance/exit | Mark exit (WiFi check + face) |
| GET | /api/attendance/today | Today's status for logged-in user |
| GET | /api/attendance/my-history | My attendance history |

### Admin (admin JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Stats (total, present, late, absent) |
| GET | /api/admin/today | Today's full attendance list |
| GET | /api/admin/faculty | All faculty list |
| GET | /api/admin/report | Report by date range & department |
| GET | /api/admin/departments | List of departments |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure .env
Edit `.env` and set your `DATABASE_URL` from Supabase.

### 3. Run in development
```bash
npm run dev
```

### 4. Run in production
```bash
npm start
```

## Database
Tables are auto-created on first run:
- `faculty` — stores faculty info + face data
- `attendance` — daily entry/exit records
- `device_logs` — IP + browser logs per action

## Notes
- Set `SKIP_TIME_CHECK=true` in `.env` during development
- Leave `ALLOWED_IP_PREFIXES` empty to disable WiFi restriction locally
- To create an admin: during registration, provide `admin_key = ADMIN_SECRET_KEY`
