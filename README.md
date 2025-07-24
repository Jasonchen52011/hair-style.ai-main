# Hairstyle AI - AI-Powered Hairstyle Generator

Last deployment: 2025-07-24

## 🚀 Features

- **AI Hairstyle Generation**: Transform your look with 60+ hairstyles
- **Google Authentication**: Secure login with Google OAuth
- **Supabase Backend**: Modern PostgreSQL database with real-time features
- **Creem Payment Integration**: Flexible payment options (one-time, monthly, yearly)
- **Credit System**: Usage-based billing with credit tracking
- **Subscription Management**: Monthly and yearly subscription plans

## 🔧 Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase PostgreSQL
- **Payment**: Creem Payment Platform
- **Styling**: Tailwind CSS with DaisyUI
- **AI**: Custom AI API for hairstyle generation

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/hair-style-ai.git
cd hair-style-ai

# Install dependencies
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (configured in Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Creem Payment
API_KEY=your_creem_api_key
CREEM_API_KEY=your_creem_api_key

# AI Service
AILABAPI_API_KEY=your_ai_api_key
GOOGLE_API_KEY=your_google_gemini_api_key

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🗄️ Database Setup

### Supabase Tables

1. **profiles** - User profiles and credits
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0,
  last_order TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **subscriptions** - User subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  creem_subscription_id TEXT,
  credits TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

Enable RLS on both tables:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

## 💳 Payment Integration

### Creem Product IDs

Configure these product IDs in your Creem dashboard and update them in `config.ts`:

- **One-time Purchase**: Check `config.creem.products.oneTime.id` in config.ts
- **Monthly Subscription**: Check `config.creem.products.monthly.id` in config.ts  
- **Yearly Subscription**: Check `config.creem.products.yearly.id` in config.ts

All product IDs are now centrally managed in the `config.ts` file to avoid duplication.

### Credit System

- **One-time**: 500 credits (requires active monthly/yearly subscription)
- **Monthly**: 1000 credits/month
- **Yearly**: 1500 credits each month for 12 months

#### Credit Expiration Logic

The system implements automatic credit expiration based on subscription type:

- **One-time Purchase**: 
  - For monthly subscribers: Credits expire when the monthly subscription expires
  - For yearly subscribers: Credits expire at the end of the current month (1st of next month)
- **Monthly Subscription**: Credits expire at the next billing cycle (1 month from purchase)
- **Yearly Subscription**: Each monthly distribution of 1500 credits expires after 1 month

#### Cron Jobs Required

**1. Monthly Credits Distribution** (for yearly subscriptions)
```bash
POST /api/creem/monthly-credits-distribution
Authorization: Bearer YOUR_CRON_SECRET
```

**2. Expired Credits Cleanup** (recommended daily)
```bash
POST /api/creem/cleanup-expired-credits
Authorization: Bearer YOUR_CRON_SECRET
```

Add `CRON_SECRET` to your environment variables for security.

## 🔄 API Endpoints

### Authentication
- `GET /api/auth/callback` - Supabase auth callback

### User Management
- `GET /api/creem/user-credits` - Get user credits and subscription info
- `POST /api/creem/user-credits` - Consume credits

### Payment
- `GET /api/creem/buy-product` - Create Creem checkout
- `POST /api/creem/update-user-meta` - Update user after payment

### AI Generation
- `POST /api/submit` - Submit hairstyle generation request
- `GET /api/submit?taskId=...` - Check generation status

### Debug and Diagnosis
- `GET /api/debug/supabase-test` - Test database connectivity
- `GET /api/debug/profile-diagnosis` - Diagnose user profile issues
- `GET /api/test-auth` - Check authentication status

## 🐛 Troubleshooting

### Problem: User Login But No Profile Data

**Symptoms**: User can login successfully but profile data is missing, causing errors in the application.

**Diagnosis Steps**:

1. **Check Authentication Status**:
```bash
curl -X GET http://localhost:3000/api/test-auth
```

2. **Run Profile Diagnosis**:
```bash
curl -X GET http://localhost:3000/api/debug/profile-diagnosis
```

3. **Check Database Tables**:
```bash
curl -X GET http://localhost:3000/api/debug/supabase-test
```

**Common Causes & Solutions**:

| Issue | Cause | Solution |
|-------|-------|----------|
| Profile not created | Auth callback failed | Check `/api/auth/callback` logs |
| Foreign key constraint | Auth user doesn't exist | Verify user logged in properly |
| Time format error | Wrong created_at format | Use consistent time format |
| Permission denied | RLS policy issue | Check table policies |

**Auto-Fix**: The `/api/debug/profile-diagnosis` endpoint will attempt to automatically create missing profiles.

**Manual Fix** (if auto-fix fails):
```sql
-- Connect to Supabase SQL Editor and run:
INSERT INTO profiles (
  id,
  email,
  name,
  has_access,
  created_at,
  updated_at
) VALUES (
  'USER_ID_HERE',
  'user@example.com', 
  'User Name',
  false,
  NOW()::TIME,
  NOW()::TIME
);
```

### Problem: Purchase Successful But No Credits

**Diagnosis**:
```bash
curl -X GET http://localhost:3000/api/creem/user-credits
```

**Check Webhook Logs**: Verify `/api/creem/webhook` processed the payment correctly.

## 🎨 Usage

1. **Sign In**: Users sign in with Google OAuth
2. **Choose Plan**: Select from one-time, monthly, or yearly plans
3. **Generate Hairstyles**: Upload photo and generate AI hairstyles
4. **Credit Management**: Track usage and top up credits (subscribers only)

## 🔐 Security Features

- **Row Level Security**: Database-level security with Supabase RLS
- **Payment Verification**: Creem checkout validation
- **Rate Limiting**: IP-based daily limits for free users
- **Secure API Keys**: Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS for styling
- DaisyUI components
- Optimized for all devices

## 🚀 Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## 📊 Monitoring

- **Performance**: Built-in performance monitoring
- **Error Tracking**: Console logging for debugging
- **Payment Webhooks**: Creem webhook integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email hello@hair-style.ai or create an issue in the GitHub repository.
