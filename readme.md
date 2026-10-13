
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=transparent&height=300&color=gradient&text=RUHUL%20PLUS%20GYM&textBg=false&fontAlign=50&fontColor=6366f1&desc=Next-Gen%20Gym%20Management%20Ecosystem&descAlignY=64" alt="Ruhul Plus Header" width="100%">

<a href="https://github.com/">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=34&pause=1000&color=6366F1&center=true&vCenter=true&width=900&lines=RUHUL+PLUS+GYM+MANAGEMENT+SYSTEM;Desktop+App+%E2%80%A2+Admin+Portal+%E2%80%A2+Android+Native;Engineered+for+Modern+Fitness+Centers" alt="Typing SVG" />
</a>

<br>

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Android%20%7C%20Web-blue?style=for-the-badge&logo=windows)
![Framework](https://img.shields.io/badge/Stack-React%2019%20%7C%20Vite%20%7C%20Electron%20%7C%20Expo-61dafb?style=for-the-badge&logo=react)
![Database](https://img.shields.io/badge/Backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase)
![Barcode](https://img.shields.io/badge/Scanner-Code39%20(4%20Chars)-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=open-source-initiative&logoColor=white)
![Developer](https://img.shields.io/badge/Developer-Sanad%20Khazalih-000000?style=for-the-badge&logo=github)

<br>

<b>"Managing a gym shouldn't be complicated — it should be seamless, fast, and unified."</b>

<p>
<b>Ruhul Plus Gym</b> is an open-source, full-stack gym management ecosystem featuring a <b>Standalone Windows Desktop Application (.exe)</b> for gym admins/receptionists and a <b>Native Android Mobile Application (.apk)</b> for gym members. Powered by Supabase, React 19, Electron, and React Native (Expo).
</p>

[💎 Features](#-features) •
[🗄️ Database Schema](#️-database-schema-supabase-sql) •
[⚙️ Configuration](#️-environment-configuration) •
[🖥️ Desktop Build Guide](#️-how-to-build-windows-app-exe) •
[📱 Android App](#-android-mobile-app-apk)

</div>

---

## 💎 Features

### 🖥️ Windows Desktop App & Admin Portal (Reception & Management)
- **Role-Based Access Control (RBAC):**
  - **Admin / Receptionist:** Complete system administration (members, billing, plans, staff accounts, system settings).
  - **Coach Account:** Restricted training portal focused strictly on member fitness data without access to financial or subscription records.
- **Hands-Free Barcode Scanner Integration:**
  - Automated check-in terminal tuned for **Code39 (4 characters)** barcode scanners.
  - Enforces a strict **one-entry-per-day** rule per member with instant visual and audio feedback.
  - Live check-in log stream showing active members and time of entry.
- **Advanced Subscription & Billing Architecture:**
  - Members can hold **multiple subscriptions** (queued or active).
  - Flexible start dates: Activate **immediately** or schedule for a **custom future date**.
  - Dynamic pricing and duration management for all gym packages and offers.
  - Member card printing with embedded barcode generation.
- **Staff & User Management:**
  - Built-in portal to create, configure, and manage receptionist and coach accounts directly from the UI.
- **Coach Dedicated Workspace:**
  - Direct search by Member ID (Barcode) or Full Name.
  - Read-only subscription verification (Active/Expired status without financial details).
  - Physical body metric tracker: Live height, weight updates, and coach observations.
  - Customizable Workout Planner: Exercise name, sets, and rep ranges organized by workout day.
  - Diet Plan Builder: Nutrition regimes and calorie targets attached directly to the member profile.

---

### 📱 Android Native Mobile App (Member Experience)
- **Zero-Password First-Time Onboarding:**
  - Members log in using only their **registered gym phone number**.
  - On first login, the app verifies database registration and prompts the member to set their personal password.
- **Digital Membership Pass:**
  - Displays dynamic **Code39 Barcode** right on the mobile display for direct scanning at the reception gate.
- **Membership Status Tracker:**
  - Real-time countdown of remaining days and expiration date.
- **Personal Fitness Companion:**
  - Direct access to assigned workout splits (exercises, target sets, and rep schemes).
  - Complete dietary guidelines and meal schedules set by the gym coach.
  - Progress metric monitor (recorded weight, height, and trainer feedback).

---

## 🗄️ Database Schema (Supabase SQL)

Run the following SQL migration script in your **Supabase SQL Editor** to initialize the database schema:

```sql
-- 1. Create System Users Table (Admin & Coaches)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COACH')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Gym Membership Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_days INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Gym Members Table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_number TEXT UNIQUE NOT NULL, -- 4-character Code39 ID
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    height NUMERIC(5, 2),
    weight NUMERIC(5, 2),
    coach_notes TEXT,
    app_password TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Member Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'QUEUED', 'EXPIRED', 'CANCELLED')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    price_paid NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Check-in Logs Table
CREATE TABLE IF NOT EXISTS check_in_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ DEFAULT now(),
    date_only DATE DEFAULT CURRENT_DATE,
    CONSTRAINT unique_checkin_per_day UNIQUE (member_id, date_only)
);

-- 6. Create Workout Split Plans Table
CREATE TABLE IF NOT EXISTS member_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    day_name TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps TEXT NOT NULL DEFAULT '10-12',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Diet Plans Table
CREATE TABLE IF NOT EXISTS member_diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Disable RLS for Local Development Mode
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_diet_plans DISABLE ROW LEVEL SECURITY;

-- 9. Insert Default Administrator Account
INSERT INTO app_users (username, password_hash, full_name, role)
VALUES ('admin', 'admin123', 'مدير النظام / الاستقبال', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

```

---

## ⚙️ Environment Configuration

### 1. Configure Web & Desktop App (`ruhulpanel`)

Create a `.env` file in the root of the `ruhulpanel` directory:

```env
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key-here

```

Ensure `src/supabaseClient.js` reads these variables:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

```

### 2. Configure Android App (`RuhulApp`)

Open `RuhulApp/supabase.js` and input your project credentials:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '[https://your-project-id.supabase.co](https://your-project-id.supabase.co)';
const supabaseAnonKey = 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

```

---

## 🖥️ How to Build Windows App (.exe)

Follow these exact steps to build the standalone desktop installer:

### 1. Verify `vite.config.js`

Relative paths are mandatory for Electron production bundling:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Essential for Electron production builds
});

```

### 2. Verify `package.json` Setup

Ensure your `package.json` in `ruhulpanel` contains the `overrides` and build target configurations:

```json
{
  "name": "ruhul-plus-gym",
  "version": "1.0.0",
  "main": "electron.cjs",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently -k \"vite\" \"wait-on -t 10000 http-get://127.0.0.1:5173 && electron .\"",
    "dist:win": "vite build && electron-builder --win"
  },
  "overrides": {
    "@noble/hashes": "1.3.3"
  },
  "build": {
    "appId": "com.ruhul.app",
    "productName": "Ruhul Plus Gym",
    "publish": null,
    "files": [
      "dist/**/*",
      "electron.cjs"
    ],
    "directories": {
      "output": "release"
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "differentialPackage": false
    }
  }
}

```

### 3. Generate the Installer

Execute the build script in PowerShell:

```powershell
npm run dist:win

```

The compiled setup installer will be generated at:
`release/Ruhul Plus Gym Setup 1.0.0.exe`

---

## 📱 Android Mobile App (.apk)

The mobile client is built with React Native and Expo, and packages directly into an APK using EAS cloud builds without local Android SDK dependencies:

### 1. Run Development Server

```powershell
cd RuhulApp
npm install
npx expo start

```

### 2. Build Standalone APK

Ensure your `eas.json` is configured for APK output:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}

```

Trigger the cloud build:

```powershell
eas build -p android --profile preview

```

Download the resulting `.apk` file and install it directly on any Android device.

---

<b><i>"Built for gym owners, coaches, and athletes."</i></b>
<br><br>

<a href="https://alkhazalih.xyz"><img src="https://img.shields.io/badge/©%202026-Sanad%20Khazalih-000000?style=for-the-badge"><a> 