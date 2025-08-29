export interface User {
  uuid?: string;
  email?: string;
  name?: string;
  image?: string;
  invite_code?: string;
  invited_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCredits {
  left_credits: number;
  is_pro?: boolean;
  is_recharged?: boolean;
}