// ─── Autenticación y Usuarios ──────────────────────────────────────────────

export interface Role {
  id: number;
  name: 'ADMIN' | 'CLIENT' | 'CONSULTANT' | string;
  description: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role | string;
  company_name: string;
  phone: string;
  is_active?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  subscription_summary?: Subscription;
}

// ─── Catálogos ──────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

// ─── Suscripciones y Planes ─────────────────────────────────────────────────

export interface Plan {
  id: number;
  name: string;
  plan_type: 'FREE' | 'PAID' | 'CONSULTING' | 'FULL' | string;
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
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | string;
  start_date: string;
  end_date: string | null;
  monthly_reviews_used: number;
  extra_reviews_available: number;
}

// ─── Proyectos ──────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED' | string;
  created_at: string;
  updated_at: string;
  owner: number;
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

// ─── Productos ──────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  project: number;
  name: string;
  category: ProductCategory | number | null;
  target_country: Country | number | null;
  description: string;
  ingredients: string;
  claims: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | string;
}

// ─── Etiquetas ──────────────────────────────────────────────────────────────

export type LabelStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUIRED'
  | string;

/** Entidad raíz — contenedor de versiones de etiqueta para un producto */
export interface Label {
  product_name?: string;
  id: number;
  product: number;
  current_status: LabelStatus;
  current_version_number: number;
  created_at: string;
  updated_at: string;
}

/** Documento físico almacenado (archivo subido al backend) */
export interface UploadedDocument {
  id: number;
  file: string;
  original_filename: string;
  file_type: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DOCX' | 'TXT' | 'SCAN' | 'OTHER' | string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

/** Una versión concreta de la etiqueta, referencia un Document */
export interface LabelVersion {
  id: number;
  label: number;
  document: number;
  document_url?: string;
  version_number: number;
  submitted_by: number;
  status: LabelStatus;
  notes: string;
  submitted_at: string;
}

// ─── Revisiones ─────────────────────────────────────────────────────────────

export interface LabelReview {
  id: number;
  label_version: number;
  reviewer: number | null;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | string;
  summary: string;
  observations: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReviewAttachment {
  id: number;
  review: number;
  document: number;
  document_url?: string;
  attachment_type: 'OBSERVATION_DOC' | 'MARKED_LABEL' | 'REFERENCE_IMAGE' | string;
  created_at: string;
}

// ─── Pagos ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: number;
  user: number;
  user_email?: string;
  plan: number | null;
  concept: 'SUBSCRIPTION' | 'PACKAGE' | 'EXTRA_REVIEW' | 'CONSULTATION' | string;
  amount: string;
  currency: string;
  method: 'MANUAL' | 'CARD' | 'TRANSFER' | 'API' | string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | string;
  external_reference?: string;
  created_at: string;
  confirmed_at?: string | null;
}

// ─── Consultorías ───────────────────────────────────────────────────────────

export interface Consultation {
  id: number;
  user: number;
  payment: number | null;
  topic: string;
  description: string;
  status:
    | 'REQUESTED'
    | 'PENDING_PAYMENT'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | string;
  scheduled_at: string | null;
  assigned_to: number | null;
}

// ─── Tickets ────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket: number;
  sender: number;
  sender_name?: string;
  is_admin?: boolean;
  message: string;
  created_at: string;
}

// ─── Notificaciones ─────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type:
    | 'LABEL_REVIEW'
    | 'PAYMENT'
    | 'TICKET'
    | 'CONSULTATION'
    | 'LIMIT'
    | 'PROJECT'
    | string;
  is_read: boolean;
  related_entity: string;
  related_id: number;
  created_at: string;
}

// ─── Panel Administrador ────────────────────────────────────────────────────

export interface AdminDashboardStats {
  pending_labels: number;
  open_tickets: number;
  total_users: number;
  active_users: number;
  pending_purchases: number;
  labels_reviewed_this_month: number;
}

export interface AdminUser extends User {
  subscription?: Subscription;
  created_at?: string;
}

// ─── Auditoría ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  actor: number | null;
  actor_email?: string;
  action: string;
  entity_name: string;
  entity_id: number | null;
  metadata: Record<string, any>;
  ip_address: string;
  created_at: string;
}