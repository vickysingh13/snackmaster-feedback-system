# 🍿 SnackMaster Feedback & Operations System

A full-stack vending machine feedback platform. Each machine has a unique QR code that opens a mobile-friendly form where customers can submit complaints, refund requests, feedback, suggestions, and ratings.

---

## 📁 Project Structure

```
snackmaster-system/
├── backend/               # Node.js + Express API
│   ├── db/
│   │   ├── init.sql       # Schema + 17 machine seed data
│   │   └── pool.js        # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js        # JWT auth middleware
│   ├── routes/
│   │   └── api.js         # All API routes
│   ├── server.js          # Express app entry point
│   ├── .env.example       # Environment variable template
│   └── package.json
│
├── frontend/              # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.js
│   │   ├── globals.css
│   │   ├── machine/[id]/page.js    # Customer QR page
│   │   └── admin/
│   │       ├── layout.js           # Admin sidebar layout
│   │       ├── login/page.js       # Admin login
│   │       ├── dashboard/page.js   # Overview + stats
│   │       ├── submissions/page.js # All submissions table
│   │       ├── refunds/page.js     # Refund management
│   │       ├── analytics/page.js   # Charts and trends
│   │       └── forms/page.js       # Form builder + machines
│   ├── lib/
│   │   ├── api.js          # Axios client + API helpers
│   │   └── whatsapp.js     # WhatsApp link generator
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── scripts/
    ├── generate_qrs.py     # QR code PNG generator
    └── reset_admin.js      # Admin password setup
```

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Python 3.8+ (for QR generation)
- npm or yarn

---

### 1. Database Setup

```bash
# Create the database
createdb snackmaster

# Run schema + seed data
psql postgresql://localhost/snackmaster -f backend/db/init.sql

# Or with full URL:
psql $DATABASE_URL -f backend/db/init.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/snackmaster
#   ADMIN_EMAIL=admin@snackmaster.io
#   ADMIN_PASSWORD=YourSecurePassword
#   JWT_SECRET=your-long-random-secret
#   WHATSAPP_NUMBER=9515033232
#   FRONTEND_URL=http://localhost:3000

# Start development server
npm run dev
# Backend runs on http://localhost:4000
```

#### Set Admin Password

After running `init.sql`, set your admin password properly:

```bash
node ../scripts/reset_admin.js
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:4000
#   NEXT_PUBLIC_WHATSAPP_NUMBER=9515033232

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

---

### 4. Access the App

| URL | Description |
|-----|-------------|
| `http://localhost:3000/machine/SM-2101` | Customer QR page |
| `http://localhost:3000/admin/login` | Admin login |
| `http://localhost:3000/admin/dashboard` | Dashboard |

**Default admin credentials** (set in .env):
- Email: `admin@snackmaster.io`
- Password: `SnackMaster@2024` (change this!)

---

### 5. Generate QR Codes

```bash
# Install Python dependencies
pip install qrcode[pil] pillow

# Generate QR codes for all 17 machines
python scripts/generate_qrs.py

# With custom base URL (for production)
python scripts/generate_qrs.py --base-url https://snackmaster.io

# Custom output directory
python scripts/generate_qrs.py --output-dir /path/to/print_folder
```

QR codes are saved as PNG files in `./qr_codes/`. Print and attach to machines.

---

## ☁️ Deployment

### Backend → Railway or Render

**Railway:**
1. Create new project → "Deploy from GitHub"
2. Select `backend/` as root directory
3. Add environment variables:
   ```
   DATABASE_URL=<your-postgresql-url>
   ADMIN_EMAIL=admin@snackmaster.io
   ADMIN_PASSWORD=<secure-password>
   JWT_SECRET=<random-64-char-string>
   WHATSAPP_NUMBER=9515033232
   FRONTEND_URL=https://snackmaster.io
   NODE_ENV=production
   ```
4. Railway auto-detects `package.json` and runs `npm start`
5. After deploy, run init.sql via Railway's query console or:
   ```bash
   psql $DATABASE_URL -f backend/db/init.sql
   ```

**Render:**
1. New Web Service → connect GitHub
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add same environment variables as above

---

### Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `frontend/` directory:
   ```bash
   vercel
   ```
3. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_WHATSAPP_NUMBER=9515033232
   ```
4. Deploy: `vercel --prod`

**Or deploy via Vercel dashboard:**
1. Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variables
4. Deploy

---

### Custom Domain (snackmaster.io)

1. Add domain in Vercel: `snackmaster.io`
2. Point DNS A record to Vercel's IP
3. Vercel handles SSL automatically

---

## 🗺️ URL Structure

| URL | Description |
|-----|-------------|
| `/machine/:id` | Customer feedback page (`:id` = machine code like `SM-2101`) |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Overview & recent submissions |
| `/admin/submissions` | All submissions with filters |
| `/admin/refunds` | Refund management panel |
| `/admin/analytics` | Stats & trends |
| `/admin/forms` | Form builder & machine management |

---

## 🔌 API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/machine/:code` | Get machine info + active forms |
| `POST` | `/api/submissions` | Submit a form |

### Admin Endpoints (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/login` | Get JWT token |
| `GET` | `/api/admin/submissions` | List submissions (filterable) |
| `PATCH` | `/api/admin/submissions/:id` | Update status/WA status |
| `GET` | `/api/admin/machines` | List machines |
| `POST` | `/api/admin/machines` | Add machine |
| `PATCH` | `/api/admin/machines/:id` | Update machine |
| `GET` | `/api/admin/form-configs` | Get form configurations |
| `PATCH` | `/api/admin/form-configs/:id` | Toggle/edit form |
| `GET` | `/api/admin/weekly-config` | Get active weekly config |
| `PUT` | `/api/admin/weekly-config` | Update weekly config |
| `GET` | `/api/admin/analytics` | Get analytics data |

---

## 📱 WhatsApp Integration

Refund submissions automatically generate a pre-filled WhatsApp message:

```
https://wa.me/9515033232?text=*SnackMaster — Refund Request*
📍 Machine: SM-2101 — Hitech City Metro Station
...
(Please attach payment screenshot)
```

---

## 🛡️ Security Features

- JWT authentication (24h expiry) for admin routes
- Rate limiting: 10 submissions per 15 min per IP
- Helmet.js security headers
- Input sanitization on all fields
- CORS restricted to allowed origins
- SQL injection prevention via parameterized queries

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `ADMIN_EMAIL` | Admin login email | `admin@snackmaster.io` |
| `ADMIN_PASSWORD` | Admin login password | `SecurePass@2024` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `super-secret-random-string` |
| `WHATSAPP_NUMBER` | WhatsApp number (no +) | `9515033232` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://snackmaster.io` |
| `PORT` | Server port | `4000` |

### Frontend (`.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.snackmaster.io` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number | `9515033232` |

---

## 🤝 Machine List (Seeded)

| Code | Location |
|------|----------|
| SM-2101 | Hitech City Metro Station - Gate 1 |
| SM-2102 | Madhapur Bus Stop - Bay 3 |
| SM-2103 | Gachibowli Stadium Entrance |
| SM-2104 | Kondapur Junction - Reliance Fresh |
| SM-2105 | Raidurg Metro Station - Exit B |
| SM-2106 | DLF Cybercity Building 5 Lobby |
| SM-2107 | Mindspace IT Park - Food Court |
| SM-2108 | Jubilee Hills Road No. 36 - Forum Mall |
| SM-2109 | Banjara Hills Road 10 - KFC Corner |
| SM-2110 | Ameerpet Metro Station - Platform 2 |
| SM-2111 | Kukatpally Housing Board - Main Gate |
| SM-2112 | JNTU Hyderabad - Main Block Corridor |
| SM-2113 | Nallagandla Outer Ring Road - Petrol Pump |
| SM-2114 | Manikonda Village Main Road |
| SM-2115 | Financial District - Building 12 Lobby |
| SM-2116 | Kokapet Growth Corridor - Parking Block A |
| SM-2117 | Nanakramguda IT Hub - Reception |

---

## 📄 License

MIT — SnackMaster Operations System
