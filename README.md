# 🎁 GiftLink – Responsible Community Donation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)

GiftLink is a full-stack web application that enables people to donate items they no longer need to individuals who genuinely cannot afford them.  
This platform focuses on responsible giving, preventing misuse, and ensuring fair access for needy users through verification, points, and anti-abuse systems.

---

## 🚀 Core Idea

GiftLink is NOT a marketplace like OLX.  
It is a **need-based donation ecosystem** where:

- People donate items for free  
- Verified needy users can request items  
- Donors approve who receives their items  
- A Gift Points system ensures fairness  
- Ratings + reports + limits prevent misuse  

---

## 🧩 Features (MVP + Future Features)

### ✅ MVP Features (You will build now)
- User Signup/Login (JWT authentication)
- Donor can add items (with images via Cloudinary)
- List all available items
- Item details page  
- Request item (with reason)
- Donor approves request
- Status Flow: Available → Requested → Completed
- Role-based authentication: Donor & Receiver
- My Donations dashboard (for donors)
- My Requests dashboard (for receivers)
- Image upload with Cloudinary integration

### ⭐ Phase 2 Features (Completed)
- ✅ **Gift Points System**
  - Users start with 100 points
  - -10 points deducted when requesting an item
  - +5 reward points when request is approved
  - +10 refund points when request is rejected
  - Points history tracking with timestamps
  - Auto-refund on failed requests
  
- ✅ **Monthly Request Limits**
  - 5 requests per month per user
  - Automatic reset on 1st of every month (cron job at 00:01)
  - Manual reset endpoint for admin testing
  
- ✅ **Admin Dashboard**
  - User management with role-based filters
  - Platform statistics (users, items, donations, reports)
  - Block/Unblock users
  - Soft delete items
  - View and resolve reports
  - Admin-only protected routes
  
- ✅ **Ratings & Reporting System**
  - Star ratings (1-5) for completed donations
  - Written reviews and comments
  - Average rating calculation
  - Report users with 7 predefined reasons
  - Report status workflow (OPEN/RESOLVED)
  - Admin report management
  
- ✅ **Legacy Items Support**
  - Display items from legacy gifts collection
  - Automatic migration on first request
  - Backward compatibility maintained

### 🚧 Phase 3 Features (In Progress)
- ⏳ Rating/Report UI Integration
- ⏳ Enhanced verification with document upload
- ⏳ Email notifications system
- ⏳ Advanced search and filters
- ⏳ Dashboard analytics with charts

### 🌍 Future Features
- Chat between donor & receiver
- Pickup OTP verification
- NGO verification
- Map view (Leaflet)
- AI auto-description for items
- Fraud detection rules
- Environment impact meter

### 🌍 Optional Advanced Features
- NGO verification
- Map view (Leaflet)
- AI auto-description for items
- Fraud detection rules

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Cloudinary account (for image uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/giftlink.git
cd giftlink
```

### 2. Backend Setup

Navigate to backend directory:
```bash
cd giftlink-backend
npm install
```

Create `.env` file from template:
```bash
cp .env.example .env
```

Configure your `.env` file with:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3060
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Start the backend server:
```bash
npm start
```
Server runs on `http://localhost:3060`

### 3. Frontend Setup

Navigate to frontend directory:
```bash
cd giftlink-frontend
npm install
```

Create `.env` file from template:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
REACT_APP_URL_CONFIG=http://localhost:3060
```

Start the development server:
```bash
npm start
```
App runs on `http://localhost:3000`

### 4. Cloudinary Configuration
For detailed Cloudinary setup instructions, see **[CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)**

### 5. Create Admin User

Option 1 - Using MongoDB Shell:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

Option 2 - Using the create-admin script:
```bash
cd giftlink-backend
node create-admin.js
```

### 6. Import Legacy Data (Optional)
If you have legacy gift data:
```bash
cd giftlink-backend/util/import-mongo
npm install
node index.js
```

---

## 📚 Documentation

- **[Gift Points System](./GIFT_POINTS_IMPLEMENTATION.md)** - Complete points flow documentation
- **[Admin Dashboard Guide](./ADMIN_DASHBOARD.md)** - Admin features and API reference
- **[Cloudinary Setup](./CLOUDINARY_SETUP.md)** - Image upload configuration
- **[Project Instructions](./.github/instructions/giftlink.instructions.md)** - Development guidelines

---

## 🔐 Admin Dashboard

**Access:** Navigate to `/app/admin` after logging in as admin

**Admin Features:**
- View platform statistics (users, items, donations, reports)
- Manage users (view, block/unblock, verify)
- Manage items (view, soft delete)
- Manage reports (view, resolve)
- Filter and search capabilities

**Admin API Endpoints:**
```
GET    /api/admin/users              # List all users with filters
GET    /api/admin/stats              # Platform statistics
PATCH  /api/admin/users/:id/block    # Block a user
PATCH  /api/admin/users/:id/unblock  # Unblock a user
PATCH  /api/admin/users/:id/verify   # Verify a user
GET    /api/admin/items              # List all items
DELETE /api/admin/items/:id          # Soft delete item
GET    /api/admin/reports            # List all reports
PATCH  /api/admin/reports/:id/resolve # Resolve a report
```

All admin endpoints require authentication and admin role.

---

---

## 🏗️ Project Structure

```
giftlink/
├── giftlink-backend/          # Node.js + Express backend
│   ├── config/               # Cloudinary config
│   ├── middleware/           # Auth, admin, validation
│   ├── models/               # MongoDB models (Item, Request, etc.)
│   ├── routes/               # API routes
│   │   ├── authRoutes.js    # Authentication
│   │   ├── itemRoutes.js    # Items CRUD
│   │   ├── requestRoutes.js # Request management
│   │   ├── ratingRoutes.js  # Ratings & reports
│   │   └── adminRoutes.js   # Admin operations
│   ├── services/            # Business logic (cron jobs)
│   ├── util/                # Utilities (import scripts)
│   ├── app.js               # Express app setup
│   └── .env.example         # Environment template
│
├── giftlink-frontend/        # React frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # Reusable components
│   │   │   ├── AddItem/
│   │   │   ├── DetailsPage/
│   │   │   ├── MainPage/
│   │   │   ├── MyDonations/
│   │   │   ├── MyRequests/
│   │   │   ├── Navbar/
│   │   │   ├── Profile/
│   │   │   ├── RatingModal/
│   │   │   ├── ReportModal/
│   │   │   └── Toast/
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   │   └── admin/      # Admin dashboard pages
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── .env.example        # Environment template
│
└── Documentation/           # Project documentation
    ├── README.md
    ├── GIFT_POINTS_IMPLEMENTATION.md
    ├── ADMIN_DASHBOARD.md
    ├── CLOUDINARY_SETUP.md
    └── .github/instructions/
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Items
- `GET /api/items` - List available items (pagination, filters)
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create new item (donor only)
- `PATCH /api/items/:id` - Update item (donor only)
- `DELETE /api/items/:id` - Delete item (donor only)
- `GET /api/items/donor/me` - Get my donations (donor only)

### Requests
- `POST /api/items/:id/request` - Request an item (receiver only)
- `GET /api/requests/me` - Get my requests (receiver only)
- `PATCH /api/items/:id/approve` - Approve request (donor only)
- `PATCH /api/items/:id/reject` - Reject request (donor only)
- `PATCH /api/items/:id/complete` - Mark as completed (donor only)

### Ratings & Reports
- `POST /api/ratings` - Create rating
- `GET /api/ratings/user/:userId` - Get user's ratings
- `GET /api/ratings/my-ratings` - Get my received ratings
- `POST /api/ratings/report` - Report a user

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Platform statistics
- `PATCH /api/admin/users/:id/block` - Block user
- `PATCH /api/admin/users/:id/unblock` - Unblock user
- `PATCH /api/admin/users/:id/verify` - Verify user
- `GET /api/admin/items` - List all items
- `DELETE /api/admin/items/:id` - Delete item
- `GET /api/admin/reports` - List all reports
- `PATCH /api/admin/reports/:id/resolve` - Resolve report
- `POST /api/admin/reset-monthly` - Manual monthly reset

---

## 🎯 Key Features Breakdown

### Gift Points System
- **Starting Balance:** 100 points
- **Request Cost:** -10 points
- **Approval Reward:** +5 points
- **Rejection Refund:** +10 points
- **Monthly Limit:** 5 requests/month
- **Auto-Reset:** 1st of every month at 00:01
- **History Tracking:** All transactions logged with timestamps

### Item Lifecycle
```
AVAILABLE → REQUESTED → APPROVED → COMPLETED
     ↓
  REJECTED (returns to AVAILABLE)
```

### User Roles
- **Donor:** Can list items, approve/reject requests, mark completed
- **Receiver:** Can request items, view request status
- **Admin:** Full access to user/item/report management

### Anti-Abuse Measures
- Monthly request limits
- Gift points system
- User verification flags
- Reporting system
- Admin monitoring
- Account blocking capability

---

## 🧪 Testing

### Backend Testing
```bash
cd giftlink-backend
npm test
```

### Frontend Testing
```bash
cd giftlink-frontend
npm test
```

---

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables in platform dashboard
2. Deploy from GitHub repository
3. Run database migrations if needed

### Frontend Deployment (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Charmi Seera** - *Initial work* - [Charmiseera](https://github.com/Charmiseera)

---

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Cloudinary for image storage
- React community for amazing tools
- All contributors who help improve this project

---

## 📧 Support

For support, email charmiseera07@gmail.com or open an issue in the repository.

---

**Made with ❤️ for the community**
```

