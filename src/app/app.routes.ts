import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

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
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },

  // ── Layout cliente ────────────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: 'dashboard',      loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'subscription',   loadComponent: () => import('./features/subscription/subscription.component').then(m => m.SubscriptionComponent) },
      { path: 'notifications',  loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'support',        loadComponent: () => import('./features/support/support.component').then(m => m.SupportComponent) },
      { path: 'guides',         loadComponent: () => import('./features/guides/guides-home/guides-home.component').then(m => m.GuidesHomeComponent) },
      { path: 'guides/introduction', loadComponent: () => import('./features/guides/introduction-guide/introduction-guide.component').then(m => m.IntroductionGuideComponent) },
      { path: 'guides/projects',     loadComponent: () => import('./features/guides/projects-guide/projects-guide.component').then(m => m.ProjectsGuideComponent) },
      { path: 'profile',        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'consultations',  loadComponent: () => import('./features/consultations/consultations.component').then(m => m.ConsultationsComponent) },

      // Proyectos
      { path: 'projects',      loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'projects/new',  loadComponent: () => import('./features/projects/project-create/project-create.component').then(m => m.ProjectCreateComponent) },
      { path: 'projects/:id',  loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },

      // Productos (anidados en proyecto)
      {
        path: 'projects/:id/products/:productId',
        loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },

      // Etiquetas
      {
        path: 'projects/:id/products/:productId/labels/new',
        loadComponent: () => import('./features/labels/label-upload/label-upload.component').then(m => m.LabelUploadComponent)
      },
      {
        path: 'projects/:id/products/:productId/labels/:labelId',
        loadComponent: () => import('./features/labels/label-detail/label-detail.component').then(m => m.LabelDetailComponent)
      },
    ]
  },

  // ── Layout administrador ─────────────────────────────────────────────────
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

  // Fallback
  { path: '**', redirectTo: 'dashboard' }
];
