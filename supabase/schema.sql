-- ====================================================================
-- AutoCare - Vehicle Ownership Management Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS) & Storage Setup
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
-- Holds custom preferences such as preferred currency, odometer unit (km/mi), volume unit (L/gal)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  distance_unit TEXT NOT NULL DEFAULT 'km', -- 'km' or 'miles'
  volume_unit TEXT NOT NULL DEFAULT 'litres', -- 'litres' or 'gallons'
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'car', -- 'car', 'motorcycle', 'scooter', 'truck', 'van'
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT,
  vin TEXT,
  fuel_type TEXT NOT NULL DEFAULT 'Petrol', -- 'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'
  current_odometer NUMERIC NOT NULL DEFAULT 0,
  photo_url TEXT,
  insurance_provider TEXT,
  insurance_policy_no TEXT,
  insurance_expiry DATE,
  puc_number TEXT,
  puc_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);

-- 4. Service Records Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer NUMERIC,
  service_type TEXT NOT NULL, -- e.g. "Periodic Maintenance", "Oil & Filter Change", "Brake Service", "Tire Replacement", etc.
  garage TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  next_due_date DATE,
  next_due_odometer NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_vehicle_id ON public.services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_date ON public.services(date DESC);

-- 5. Maintenance Schedules / Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'service', -- 'service', 'insurance', 'puc', 'inspection', 'tax', 'other'
  due_date DATE,
  due_odometer NUMERIC,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON public.reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);

-- 6. Fuel Logs Table
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer NUMERIC NOT NULL,
  litres NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  price_per_litre NUMERIC GENERATED ALWAYS AS (
    CASE WHEN litres > 0 THEN ROUND((total_cost / litres)::numeric, 3) ELSE 0 END
  ) STORED,
  is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
  missed_previous_fill BOOLEAN NOT NULL DEFAULT FALSE,
  fuel_brand TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_id ON public.fuel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_odometer ON public.fuel_logs(odometer ASC);

-- 7. Expenses Table (Unified expense tracking, linked to fuel/service or standalone)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'Fuel', 'Service', 'Insurance', 'PUC / Inspection', 'Tolls & Parking', 'Wash & Detailing', 'Parts & Accessories', 'Fine / Legal', 'Other'
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  description TEXT,
  reference_type TEXT NOT NULL DEFAULT 'standalone', -- 'standalone', 'fuel', 'service'
  reference_id UUID, -- points to fuel_logs(id) or services(id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  -- Unique constraint prevents duplicate expense entries when recording fuel or services
  CONSTRAINT unique_reference_expense UNIQUE(reference_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON public.expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- 8. Vehicle Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Registration Certificate (RC)', 'Insurance Policy', 'Pollution Certificate (PUC)', 'Driving License', 'Service Invoice', 'Warranty', 'Road Tax Receipt', 'Other'
  file_path TEXT NOT NULL, -- Stored inside private bucket: 'vehicle-documents/{user_id}/{vehicle_id}/{filename}'
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON public.documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: users can ONLY access rows where user_id = auth.uid()
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Vehicles Policies
CREATE POLICY "Users can view own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- Services Policies
CREATE POLICY "Users can view own services"
  ON public.services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON public.services FOR DELETE
  USING (auth.uid() = user_id);

-- Reminders Policies
CREATE POLICY "Users can view own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Fuel Logs Policies
CREATE POLICY "Users can view own fuel logs"
  ON public.fuel_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel logs"
  ON public.fuel_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel logs"
  ON public.fuel_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel logs"
  ON public.fuel_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Documents Policies
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own uploaded vehicle documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload vehicle documents to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own vehicle documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own vehicle documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ====================================================================
-- AUTO-CONFIRM TRIGGER & PRE-SEEDED TEST ACCOUNT
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Auto-confirm any pending unconfirmed users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Automatically mark all newly registered users as email-confirmed
-- so email sending rate limits never block authentication
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_confirm_user();

-- Automatically create public.profiles entry whenever a new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Seed pre-confirmed live driver account into Supabase auth
-- Email: driver@autocare.app
-- Password: Password123!
DO $$
DECLARE
  new_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'driver@autocare.app') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'driver@autocare.app',
      crypt('Password123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Mercer"}'::jsonb,
      now(),
      now()
    );

    INSERT INTO public.profiles (id, email, full_name, currency, distance_unit, volume_unit)
    VALUES (new_user_id, 'driver@autocare.app', 'Alex Mercer', 'USD', 'km', 'litres')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

