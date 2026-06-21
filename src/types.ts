export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Lead {
  id: string;
  business_name: string;
  category: string;
  city: 'Hyderabad' | 'Bangalore' | 'Mumbai';
  locality: string;
  phone: string;
  email: string;
  has_website: boolean;
  has_social_media: boolean;
  business_age_years: number;
  google_review_count: number;
  google_review_responses: number;
  competitor_count_nearby: number;
  score: number;
  score_breakdown: {
    no_website: number;
    no_social: number;
    business_age: number;
    phone_available: number;
    zero_responses: number;
    competitor_density: number;
  };
  pressure_signal: string;
  strike_timing: 'NOW' | 'SOON' | 'WAIT';
  created_at: string;
}

export interface SavedList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  lead_id: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Discarded';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ScoringConfig {
  criterion: string;
  weight: number;
  description: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  category: string;
  city: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  channel: 'email' | 'telegram';
  message: string;
  status: 'delivered' | 'failed';
  created_at: string;
}

export interface CopilotSession {
  id: string;
  user_id: string;
  lead_id: string;
  transcript: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  readiness_score: number;
  feedback: {
    strong_points: string[];
    weak_points: string[];
    missed_points: string[];
    tips: string[];
  };
  created_at: string;
}
