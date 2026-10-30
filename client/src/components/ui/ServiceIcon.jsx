import {
  GraduationCap, BookOpen, FileText, Microscope, Code, Presentation, ClipboardCheck, MessageCircle,
  ShieldCheck, Clock, CreditCard, UserRound, LayoutDashboard, Settings, CircleHelp, CheckCircle, Bell, Download, CalendarDays,
} from 'lucide-react';

const map = {
  GraduationCap, BookOpen, FileText, Microscope, Code, Presentation, ClipboardCheck, MessageCircle,
  ShieldCheck, Clock, CreditCard, UserRound, LayoutDashboard, Settings, CircleHelp, CheckCircle, Bell, Download, CalendarDays,
};

export function ServiceIcon({ name, className = 'size-5' }) {
  const Icon = map[name] || BookOpen;
  return <Icon className={className} aria-hidden />;
}
