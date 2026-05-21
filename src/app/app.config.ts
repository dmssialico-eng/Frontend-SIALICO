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
  HelpCircle, Layers, Activity
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authTokenInterceptor, errorInterceptor])
    ),
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
        HelpCircle, Layers, Activity
      })
    ),
  ]
};