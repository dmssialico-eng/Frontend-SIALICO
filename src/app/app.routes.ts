/**
 * app.routes.ts
 *
 * Defines the three top-level route groups for the SIALICO application:
 *
 * 1. Public routes (/login, /register, /verify-email, /onboarding)
 *    Protected by guestGuard (redirects authenticated users to their dashboard)
 *    or authGuard (/onboarding requires login).
 *
 * 2. Client layout routes (nested under DashboardLayout)
 *    Protected by authGuard. Available to CLIENT and CONSULTANT users.
 *
 * 3. Admin layout routes (/admin/*)
 *    Protected by authGuard + roleGuard(ADMIN). Only accessible to ADMIN users.
 *
 * All components use lazy-loaded standalone components (loadComponent) to
 * keep the initial bundle small.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  // Redirect bare root to /login for unauthenticated entry.
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ── Public routes (guestGuard redirects logged-in users away) ────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    // Onboarding is post-registration; requires a valid session but no layout shell.
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./features/client/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  // ── Client layout (DashboardLayout wraps sidebar + top bar) ─────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: 'dashboard',      loadComponent: () => import('./features/client/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'subscription',   loadComponent: () => import('./features/client/subscription/subscription.component').then(m => m.SubscriptionComponent) },
      { path: 'notifications',  loadComponent: () => import('./features/client/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'support',        loadComponent: () => import('./features/client/support/support.component').then(m => m.SupportComponent) },
      { path: 'guides',         loadComponent: () => import('./features/client/guides/guides-home/guides-home.component').then(m => m.GuidesHomeComponent) },
      { path: 'guides/introduction', loadComponent: () => import('./features/client/guides/introduction-guide/introduction-guide.component').then(m => m.IntroductionGuideComponent) },
      { path: 'guides/projects',     loadComponent: () => import('./features/client/guides/projects-guide/projects-guide.component').then(m => m.ProjectsGuideComponent) },
      { path: 'profile',        loadComponent: () => import('./features/client/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'consultations',  loadComponent: () => import('./features/client/consultations/consultations.component').then(m => m.ConsultationsComponent) },

      // Project routes
      { path: 'projects',      loadComponent: () => import('./features/client/projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'projects/new',  loadComponent: () => import('./features/client/projects/project-create/project-create.component').then(m => m.ProjectCreateComponent) },
      { path: 'projects/:id',  loadComponent: () => import('./features/client/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },

      // Product detail nested under its parent project
      {
        path: 'projects/:id/products/:productId',
        loadComponent: () => import('./features/client/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },

      // Label upload and label detail, nested under product
      {
        path: 'projects/:id/products/:productId/labels/new',
        loadComponent: () => import('./features/client/labels/label-upload/label-upload.component').then(m => m.LabelUploadComponent)
      },
      {
        path: 'projects/:id/products/:productId/labels/:labelId',
        loadComponent: () => import('./features/client/labels/label-detail/label-detail.component').then(m => m.LabelDetailComponent)
      },
    ]
  },

  // ── Admin layout (requires ADMIN role, enforced by roleGuard) ────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { expectedRole: 'ADMIN' },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'labels',
        loadComponent: () => import('./features/admin/admin-labels/admin-labels.component').then(m => m.AdminLabelsComponent)
      },
      {
        path: 'labels/:id',
        loadComponent: () => import('./features/admin/admin-label-review/admin-label-review.component').then(m => m.AdminLabelReviewComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/admin/admin-tickets/admin-tickets.component').then(m => m.AdminTicketsComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./features/admin/admin-ticket-detail/admin-ticket-detail.component').then(m => m.AdminTicketDetailComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/admin/admin-payments/admin-payments.component').then(m => m.AdminPaymentsComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/admin/admin-audit/admin-audit.component').then(m => m.AdminAuditComponent)
      },
    ]
  },

  // Wildcard fallback — unrecognized paths land on the dashboard.
  { path: '**', redirectTo: 'dashboard' }
];
