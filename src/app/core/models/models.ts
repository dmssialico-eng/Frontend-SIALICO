export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  company_name: string;
  phone: string;
  is_active?: boolean;
}

export interface Plan {
  id: number;
  name: string;
  plan_type: string;
  project_limit: number | null;
  product_limit_per_project: number | null;
  label_version_limit: number | null;
  monthly_review_limit: number | null;
  price: string;
  is_active?: boolean;
}

export interface Subscription {
  id: number;
  plan: Plan;
  status: string;
  start_date: string;
  end_date: string | null;
  monthly_reviews_used: number;
  extra_reviews_available: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  subscription_summary?: Subscription;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner: number;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface Product {
  id: number;
  project: number;
  name: string;
  category: ProductCategory | number;
  target_country: Country | number;
  description: string;
  ingredients: string;
  claims: string;
  status: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_entity: string;
  related_id: number;
  created_at: string;
}

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket: number;
  sender: number;
  message: string;
  created_at: string;
}

export interface DashboardStats {
  active_projects: number;
  paused_projects: number;
  closed_projects: number;
  archived_projects: number;
  total_projects: number;
  pending_tasks: number;
  recent_projects: Project[];
}
