export interface Order {
  order_no: string;
  user_uuid: string;
  user_email?: string;
  stripe_session_id?: string;
  status: string;
  product_id?: string;
  product_name?: string;
  credits: number;
  amount?: number;
  currency?: string;
  expired_at?: string;
  created_at?: Date;
  updated_at?: Date;
  paid_at?: Date;
  paid_email?: string;
  paid_detail?: string;
  order_detail?: string;
  sub_id?: string;
  sub_interval_count?: number;
  sub_cycle_anchor?: number;
  sub_period_end?: number;
  sub_period_start?: number;
  sub_times?: number;
}