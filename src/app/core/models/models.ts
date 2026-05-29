/**
 * models.ts
 *
 * Central domain model definitions for the SIALICO platform.
 * Every interface here mirrors a Django REST Framework serializer response.
 *
 * Sections:
 *   - Authentication & Users
 *   - Catalogs (product categories, countries)
 *   - Subscriptions & Plans
 *   - Projects
 *   - Products
 *   - Labels & Label Versions
 *   - Reviews & Review Attachments
 *   - Payments
 *   - Consultations
 *   - Support Tickets
 *   - Notifications
 *   - Admin Dashboard & Audit Logs
 */

// ─── Authentication & Users ─────────────────────────────────────────────────

/**
 * Represents a system role assigned to a user account.
 * The three built-in roles are ADMIN, CLIENT, and CONSULTANT.
 */
export interface Role {
  id: number;
  /** One of the three built-in role names; the string union allows future expansion. */
  name: 'ADMIN' | 'CLIENT' | 'CONSULTANT' | string;
  description: string;
}

/**
 * Authenticated platform user. The `role` field may arrive as a full Role
 * object (detail endpoint) or as a plain string (list/summary endpoints).
 */
export interface User {
  id: number;
  email: string;
  full_name: string;
  /** Full Role object from detail endpoints; plain role-name string from summary endpoints. */
  role: Role | string;
  company_name: string;
  /** Stored with country code prefix, e.g. "+52 55 1234 5678". */
  phone: string;
  /** False means the account has been deactivated by an admin. */
  is_active?: boolean;
}

/**
 * Payload returned by the login and token endpoints.
 * Contains both JWT tokens and the resolved User object.
 */
export interface AuthResponse {
  /** Short-lived JWT access token. */
  access: string;
  /** Long-lived JWT refresh token used to obtain new access tokens. */
  refresh: string;
  user: User;
  /** Optional subscription snapshot included for performance (avoids a second round-trip). */
  subscription_summary?: Subscription;
}

// ─── Catalogs ───────────────────────────────────────────────────────────────

/**
 * Regulatory product category (e.g. "Food", "Cosmetics").
 * Used when creating or filtering products within a project.
 */
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
}

/**
 * Target export country with its ISO alpha-2 code.
 * Selected per product to determine which regulatory framework applies.
 */
export interface Country {
  id: number;
  name: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US", "MX". */
  code: string;
}

// ─── Subscriptions & Plans ──────────────────────────────────────────────────

/**
 * A subscription plan available on the platform.
 * Null limit values indicate unlimited usage for that dimension.
 */
export interface Plan {
  id: number;
  name: string;
  /**
   * Plan tier:
   * FREE — no charge, limited features.
   * PAID — standard paid tier.
   * CONSULTING — includes advisory sessions.
   * FULL — all features, custom pricing.
   */
  plan_type: 'FREE' | 'PAID' | 'CONSULTING' | 'FULL' | string;
  /** Maximum number of active projects. Null = unlimited. */
  project_limit: number | null;
  /** Maximum products per project. Null = unlimited. */
  product_limit_per_project: number | null;
  /** Maximum label versions that can be submitted. Null = unlimited. */
  label_version_limit: number | null;
  /** Maximum regulatory reviews per calendar month. Null = unlimited. */
  monthly_review_limit: number | null;
  /** Decimal string, e.g. "1500.00". */
  price: string;
  /** False means the plan is no longer offered to new subscribers. */
  is_active?: boolean;
}

/**
 * Active subscription linking a user to a Plan.
 * Lifecycle: ACTIVE → CANCELLED | EXPIRED.
 */
export interface Subscription {
  id: number;
  plan: Plan;
  /**
   * Subscription lifecycle status:
   * ACTIVE — currently in effect.
   * PENDING — awaiting payment confirmation.
   * CANCELLED — voluntarily cancelled.
   * EXPIRED — end_date passed without renewal.
   */
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | string;
  /** ISO 8601 date when the subscription period started. */
  start_date: string;
  /** ISO 8601 date when the period ends. Null for open-ended plans. */
  end_date: string | null;
  /** Number of label reviews consumed during the current calendar month. */
  monthly_reviews_used: number;
  /** Additional one-time review credits purchased outside the monthly limit. */
  extra_reviews_available: number;
}

// ─── Projects ───────────────────────────────────────────────────────────────

/**
 * A regulatory compliance project owned by a client.
 * Contains one or more Products, each with its own label submissions.
 */
export interface Project {
  id: number;
  name: string;
  description: string;
  /**
   * Project lifecycle status:
   * ACTIVE — work in progress.
   * PAUSED — temporarily halted.
   * CLOSED — completed or finished.
   * ARCHIVED — soft-deleted; hidden from the main list.
   */
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED' | string;
  /** ISO 8601 timestamp. */
  created_at: string;
  /** ISO 8601 timestamp of the last modification. */
  updated_at: string;
  /** Foreign key reference to the owning User. */
  owner: number;
}

/**
 * Aggregated project statistics returned by GET /api/projects/stats/.
 * Used by DashboardComponent to render the summary cards.
 */
export interface DashboardStats {
  active_projects: number;
  paused_projects: number;
  closed_projects: number;
  archived_projects: number;
  total_projects: number;
  /** Tasks requiring user action (submitted labels, open tickets, etc.). */
  pending_tasks: number;
  /** The most recently updated projects, pre-sliced by the backend. */
  recent_projects: Project[];
}

// ─── Products ───────────────────────────────────────────────────────────────

/**
 * A specific food or consumer product within a Project.
 * Its status reflects the current regulatory review state.
 */
export interface Product {
  id: number;
  /** Foreign key to the parent Project. */
  project: number;
  name: string;
  /** Full category object or just its ID, depending on the endpoint. */
  category: ProductCategory | number | null;
  /** Full country object or just its ID, depending on the endpoint. */
  target_country: Country | number | null;
  description: string;
  ingredients: string;
  /** Regulatory claims, e.g. "Gluten-free", "No added sugar". */
  claims: string;
  /**
   * Product review status:
   * DRAFT — not yet submitted.
   * IN_REVIEW — label version under review.
   * APPROVED — latest label version approved.
   * CHANGES_REQUIRED — reviewer requested modifications.
   */
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | string;
}

// ─── Labels ─────────────────────────────────────────────────────────────────

/**
 * Union type for all possible label lifecycle states.
 * DRAFT → SUBMITTED → IN_REVIEW → APPROVED | CHANGES_REQUIRED
 */
export type LabelStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUIRED'
  | string;

/**
 * Root label entity — a container that groups all versions of a product label.
 * One product may have at most one Label; that Label accumulates versions over time.
 */
export interface Label {
  /** Denormalized product name included by the backend for display purposes. */
  product_name?: string;
  id: number;
  /** Foreign key to the parent Product. */
  product: number;
  /** Status derived from the most recently active LabelVersion. */
  current_status: LabelStatus;
  /** The latest version number under this Label. */
  current_version_number: number;
  /** ISO 8601 timestamp. */
  created_at: string;
  /** ISO 8601 timestamp. */
  updated_at: string;
}

/**
 * A physical uploaded file stored by the backend document service.
 * Referenced by LabelVersion and ReviewAttachment.
 */
export interface UploadedDocument {
  id: number;
  /** Server-side storage URL for the file. */
  file: string;
  original_filename: string;
  /** Normalized file-type enum stored alongside the raw MIME. */
  file_type: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'DOCX' | 'TXT' | 'SCAN' | 'OTHER' | string;
  mime_type: string;
  size_bytes: number;
  /** ISO 8601 timestamp. */
  uploaded_at: string;
}

/**
 * A specific version of a label document submitted for regulatory review.
 * A Label can have multiple LabelVersions; only one should be IN_REVIEW at a time.
 */
export interface LabelVersion {
  id: number;
  /** Foreign key to the parent Label. */
  label: number;
  /** Foreign key to the associated UploadedDocument. */
  document: number;
  /** Pre-signed or public URL for direct file download (optional, may be absent in list views). */
  document_url?: string;
  /** Sequential counter within this Label (1, 2, 3…). */
  version_number: number;
  /** Foreign key to the User who submitted this version. */
  submitted_by: number;
  /** Current lifecycle status; see LabelStatus for values and transitions. */
  status: LabelStatus;
  /** Optional reviewer or submitter notes attached to this version. */
  notes: string;
  /** ISO 8601 timestamp of submission. */
  submitted_at: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

/**
 * A regulatory review record created by an admin for a specific LabelVersion.
 * Completed via POST /api/reviews/{id}/complete/ with APPROVED or CHANGES_REQUIRED.
 */
export interface LabelReview {
  id: number;
  /** Foreign key to the LabelVersion being reviewed. */
  label_version: number;
  /** Foreign key to the admin User performing the review. Null if unassigned. */
  reviewer: number | null;
  /**
   * Review outcome:
   * PENDING — created but not yet started.
   * IN_REVIEW — actively being reviewed.
   * APPROVED — label meets regulatory requirements.
   * CHANGES_REQUIRED — client must upload a corrected version.
   */
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | string;
  /** Short executive summary of the review outcome. */
  summary: string;
  /** Detailed observations; required when status is CHANGES_REQUIRED. */
  observations: string;
  /** ISO 8601 timestamp of when the review was completed. Null if still in progress. */
  reviewed_at: string | null;
  /** ISO 8601 creation timestamp. */
  created_at: string;
}

/**
 * A file attached to a LabelReview by the reviewer as supporting evidence
 * or annotated reference material.
 */
export interface ReviewAttachment {
  id: number;
  /** Foreign key to the parent LabelReview. */
  review: number;
  /** Foreign key to the UploadedDocument record. */
  document: number;
  /** Pre-signed or public URL for direct file download. */
  document_url?: string;
  /**
   * Classifies the purpose of the attachment:
   * OBSERVATION_DOC — written observations document.
   * MARKED_LABEL — annotated version of the label image.
   * REFERENCE_IMAGE — regulatory reference for comparison.
   */
  attachment_type: 'OBSERVATION_DOC' | 'MARKED_LABEL' | 'REFERENCE_IMAGE' | string;
  /** ISO 8601 creation timestamp. */
  created_at: string;
}

// ─── Payments ───────────────────────────────────────────────────────────────

/**
 * A payment record tracking a financial transaction on the platform.
 * Payments can be for subscriptions, review packages, or consultations.
 */
export interface Payment {
  id: number;
  /** Foreign key to the paying User. */
  user: number;
  /** Denormalized email for display in admin views. */
  user_email?: string;
  /** Foreign key to the Plan being purchased. Null for non-subscription payments. */
  plan: number | null;
  /**
   * What the payment covers:
   * SUBSCRIPTION — recurring plan fee.
   * PACKAGE — one-time review bundle.
   * EXTRA_REVIEW — additional reviews beyond the monthly limit.
   * CONSULTATION — advisory session fee.
   */
  concept: 'SUBSCRIPTION' | 'PACKAGE' | 'EXTRA_REVIEW' | 'CONSULTATION' | string;
  /** Decimal string amount, e.g. "1500.00". */
  amount: string;
  /** ISO 4217 currency code, e.g. "MXN", "USD". */
  currency: string;
  /**
   * Payment method used:
   * MANUAL — bank transfer confirmed manually by admin.
   * CARD — online card payment.
   * TRANSFER — electronic transfer.
   * API — automated payment gateway.
   */
  method: 'MANUAL' | 'CARD' | 'TRANSFER' | 'API' | string;
  /**
   * Payment lifecycle status:
   * PENDING — awaiting confirmation.
   * CONFIRMED — payment verified, access granted.
   * REJECTED — payment declined or cancelled by admin.
   * CANCELLED — voided before processing.
   */
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | string;
  /** Optional gateway or bank reference number for reconciliation. */
  external_reference?: string;
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 timestamp of admin confirmation. Null while still pending. */
  confirmed_at?: string | null;
}

// ─── Consultations ──────────────────────────────────────────────────────────

/**
 * A regulatory consulting session requested by a client.
 * Lifecycle: REQUESTED → PENDING_PAYMENT → SCHEDULED → IN_PROGRESS → COMPLETED | CANCELLED
 */
export interface Consultation {
  id: number;
  /** Foreign key to the requesting User. */
  user: number;
  /** Foreign key to the associated Payment. Null until payment is confirmed. */
  payment: number | null;
  /** High-level subject of the consulting session. */
  topic: string;
  description: string;
  /**
   * Consultation lifecycle:
   * REQUESTED — client has submitted the request.
   * PENDING_PAYMENT — awaiting payment confirmation before scheduling.
   * SCHEDULED — date and time confirmed with the consultant.
   * IN_PROGRESS — session is currently active.
   * COMPLETED — session finished successfully.
   * CANCELLED — cancelled by client or admin.
   */
  status:
    | 'REQUESTED'
    | 'PENDING_PAYMENT'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | string;
  /** ISO 8601 datetime of the scheduled session. Null until confirmed. */
  scheduled_at: string | null;
  /** Foreign key to the consultant User. Null until assigned. */
  assigned_to: number | null;
}

// ─── Support Tickets ────────────────────────────────────────────────────────

/**
 * A client support request tracked through a messaging thread.
 * Status lifecycle: OPEN → IN_PROGRESS → ANSWERED → CLOSED
 */
export interface Ticket {
  id: number;
  subject: string;
  description: string;
  /**
   * Ticket status:
   * OPEN — received, not yet assigned.
   * IN_PROGRESS — being handled by support.
   * ANSWERED — support has replied; awaiting client feedback.
   * CLOSED — resolved or abandoned.
   */
  status: 'OPEN' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED' | string;
  /**
   * Priority level affects response time SLA:
   * LOW → MEDIUM → HIGH → CRITICAL
   */
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 timestamp of the last status change or message. */
  updated_at: string;
}

/**
 * A single message within a Ticket's conversation thread.
 * Both clients and admins can post messages; is_admin distinguishes the sender type.
 */
export interface TicketMessage {
  id: number;
  /** Foreign key to the parent Ticket. */
  ticket: number;
  /** Foreign key to the User who sent the message. */
  sender: number;
  /** Denormalized display name for the sender. */
  sender_name?: string;
  /** True when the message was sent by a SIALICO support agent. */
  is_admin?: boolean;
  message: string;
  /** ISO 8601 creation timestamp. */
  created_at: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────

/**
 * A platform notification delivered to a user.
 * Linked to a domain entity via related_entity + related_id for deep-linking.
 */
export interface Notification {
  id: number;
  title: string;
  message: string;
  /**
   * Category that drives routing and UI icon:
   * LABEL_REVIEW — a label was reviewed or needs attention.
   * PAYMENT — a payment was confirmed or rejected.
   * TICKET — a support ticket was updated.
   * CONSULTATION — a consulting session changed status.
   * LIMIT — the user is approaching or has reached a plan limit.
   * PROJECT — a project-level event occurred.
   */
  notification_type:
    | 'LABEL_REVIEW'
    | 'PAYMENT'
    | 'TICKET'
    | 'CONSULTATION'
    | 'LIMIT'
    | 'PROJECT'
    | string;
  /** False until the user explicitly marks the notification as read. */
  is_read: boolean;
  /** Lowercase name of the related model, e.g. "label", "ticket", "project". */
  related_entity: string;
  /** Primary key of the related entity instance. */
  related_id: number;
  /** ISO 8601 creation timestamp. */
  created_at: string;
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────

/**
 * Aggregated counters displayed on the admin dashboard home page.
 * Assembled from multiple API calls via forkJoin in AdminService.
 */
export interface AdminDashboardStats {
  /** Labels with status SUBMITTED awaiting an admin review. */
  pending_labels: number;
  /** Support tickets with status OPEN. */
  open_tickets: number;
  total_users: number;
  /** Users whose is_active flag is true. */
  active_users: number;
  /** Payments with status PENDING awaiting admin confirmation. */
  pending_purchases: number;
  /** Labels whose review was completed during the current calendar month. */
  labels_reviewed_this_month: number;
}

/**
 * Extended User shape used in admin user management views.
 * Includes the user's current subscription and account creation date.
 */
export interface AdminUser extends User {
  /** The user's active subscription, if any. */
  subscription?: Subscription;
  /** ISO 8601 timestamp of account creation. */
  created_at?: string;
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────

/**
 * An immutable record of a state-changing action performed on the platform.
 * Written by the backend on every create/update/delete operation.
 */
export interface AuditLog {
  id: number;
  /** Foreign key to the User who triggered the action. Null for system-generated entries. */
  actor: number | null;
  /** Denormalized actor email for display without a separate user lookup. */
  actor_email?: string;
  /** Human-readable description of the action, e.g. "LABEL_REVIEWED". */
  action: string;
  /** Name of the affected model, e.g. "LabelVersion", "Ticket". */
  entity_name: string;
  /** Primary key of the affected entity. Null for bulk or non-entity actions. */
  entity_id: number | null;
  /** Arbitrary JSON payload with before/after values or context details. */
  metadata: Record<string, any>;
  /** IP address of the client that initiated the request. */
  ip_address: string;
  /** ISO 8601 timestamp. */
  created_at: string;
}