// Database schema TypeScript interfaces
// Generated from Supabase database structure

export interface Profile {
  id: string; // uuid, references auth.users(id)
  email?: string;
  name?: string;
  image?: string;
  customer_id?: string;
  product_id?: string;
  has_access?: boolean;
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
  plan_id?: string;
  current_credits?: number;
}

export interface Subscription {
  id: string; // uuid
  user_id?: string; // uuid, references profiles(id)
  status?: string;
  start_date?: string; // timestamp
  end_date?: string; // timestamp
  plan_name?: string;
  creem_subscription_id?: string;
  plan_id?: string;
  credits?: number; // smallint
  created_at?: string; // timestamptz
  updated_at?: string; // timestamptz
}

export interface Credit {
  id: string; // uuid
  user_uuid?: string; // uuid, references profiles(id)
  trans_type?: string;
  trans_no?: string;
  order_no?: string;
  credits?: number; // int4
  expired_at?: string; // timestamptz
  created_at?: string; // timestamptz
  current_credits?: number; // int4
  event_type?: string;
}

export interface Order {
  id: string; // uuid
  user_id?: string; // uuid, references profiles(id)
  order_id?: string;
  product_id?: string;
  product_name?: string;
  plan_type?: string;
  amount?: number; // numeric
  currency?: string;
  status?: string;
  checkout_id?: string;
  subscription_id?: string;
  credits_granted?: number; // int4
  payment_method?: string;
  payment_date?: string; // timestamp
  created_at?: string; // timestamp
  updated_at?: string; // timestamp
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Subscription, 'id'>>;
      };
      credits: {
        Row: Credit;
        Insert: Omit<Credit, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Credit, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Order, 'id'>>;
      };
    };
  };
}

// Enums for better type safety
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum TransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  BONUS = 'bonus'
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum EventType {
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  CREDITS_PURCHASED = 'credits_purchased',
  CREDITS_USED = 'credits_used',
  CREDITS_EXPIRED = 'credits_expired'
} 