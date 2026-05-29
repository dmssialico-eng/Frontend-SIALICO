/**
 * app.config.ts
 *
 * Root application configuration for Angular's standalone bootstrap API.
 * Registers global providers for routing, HTTP, and icon libraries.
 *
 * Providers:
 *   - provideRouter          — registers the application routes from app.routes.ts.
 *   - provideHttpClient      — enables the Angular HTTP client.
 *     - authTokenInterceptor — attaches the JWT Bearer token to every request.
 *     - errorInterceptor     — handles 401s with silent token refresh.
 *   - LucideAngularModule    — tree-shakeable SVG icon library; only the icons
 *                              listed here are included in the bundle.
 */
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { LucideAngularModule } from 'lucide-angular';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  ShieldCheck, CheckCircle2, Globe2, Zap, Check, Info,
  LayoutDashboard, Bell, User, LogOut, Settings, ChevronDown,
  ChevronRight, ChevronLeft, Plus, Trash2, Edit, Upload, Download,
  FileText, Folder, Tag, Package, CreditCard, MessageSquare,
  TicketCheck, BarChart2, Users, Shield, ClipboardList,
  ArrowLeft, ArrowRight, Search, Filter, X, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle, Star, Send,
  Paperclip, ExternalLink, Copy, Menu, Home, BookOpen,
  HelpCircle, Layers, Activity, Briefcase
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // Application router using hash-free HTML5 history API.
    provideRouter(routes),
    // HTTP client with functional interceptors applied in declaration order.
    provideHttpClient(
      withInterceptors([authTokenInterceptor, errorInterceptor])
    ),
    // Icon subset — only selected icons are bundled to minimize payload size.
    importProvidersFrom(
      LucideAngularModule.pick({
        Mail, Lock, Eye, EyeOff, AlertCircle,
        ShieldCheck, CheckCircle2, Globe2, Zap, Check, Info,
        LayoutDashboard, Bell, User, LogOut, Settings, ChevronDown,
        ChevronRight, ChevronLeft, Plus, Trash2, Edit, Upload, Download,
        FileText, Folder, Tag, Package, CreditCard, MessageSquare,
        TicketCheck, BarChart2, Users, Shield, ClipboardList,
        ArrowLeft, ArrowRight, Search, Filter, X, RefreshCw,
        CheckCircle, XCircle, Clock, AlertTriangle, Star, Send,
        Paperclip, ExternalLink, Copy, Menu, Home, BookOpen,
        HelpCircle, Layers, Activity, Briefcase
      })
    ),
  ]
};