import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard, ShoppingBag, FileText, CreditCard, FolderLock, MessageCircle, Bell,
  CalendarDays, LifeBuoy, ShieldCheck, UserRound, LogOut, Menu, X, Search, Receipt,
  Users, Settings, BarChart3, ClipboardList, Star, History, BookOpen, ChevronRight,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { cn, initials } from '../../lib/utils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const studentNav = [
  { section: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/dashboard/quotations', label: 'Quotations', icon: FileText },
    { to: '/dashboard/payments', label: 'Payments & Receipts', icon: CreditCard },
  ]},
  { section: 'Workspace', items: [
    { to: '/dashboard/documents', label: 'Documents', icon: FolderLock },
    { to: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
    { to: '/dashboard/consultations', label: 'Consultations', icon: CalendarDays },
    { to: '/dashboard/support', label: 'Support Tickets', icon: LifeBuoy },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/privacy', label: 'Privacy Center', icon: ShieldCheck },
    { to: '/dashboard/profile', label: 'Profile & Settings', icon: UserRound },
  ]},
];

const adminNav = [
  { section: 'Business', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders & Requests', icon: ClipboardList },
    { to: '/admin/quotations', label: 'Quotations', icon: FileText },
    { to: '/admin/payments', label: 'Payments & Refunds', icon: Receipt },
    { to: '/admin/students', label: 'Students', icon: Users },
  ]},
  { section: 'Operations', items: [
    { to: '/admin/calendar', label: 'Deadline Calendar', icon: CalendarDays },
    { to: '/admin/support', label: 'Support Inbox', icon: LifeBuoy },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/services', label: 'Services & Pricing', icon: BookOpen },
    { to: '/admin/team', label: 'Team & Workload', icon: Users },
  ]},
  { section: 'Governance', items: [
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/privacy', label: 'Privacy Requests', icon: ShieldCheck },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ]},
];

export function DashboardLayout({ area = 'student' }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const adminOnly = ['/admin/students', '/admin/reports', '/admin/audit-logs', '/admin/settings', '/admin/privacy', '/admin/services', '/admin/team'];
  const nav = (area === 'admin' ? adminNav : studentNav)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !(adminOnly.includes(item.to) && !['admin', 'owner'].includes(user?.role))),
    }))
    .filter((group) => group.items.length);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="grid size-8 place-items-center rounded-lg text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X className="size-4.5" aria-hidden />
        </button>
      </div>
      <nav aria-label={area === 'admin' ? 'Admin' : 'Student'} className="flex-1 overflow-y-auto px-3 pb-4">
        {nav.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn('group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors',
                        isActive ? 'bg-forest text-white' : 'text-muted hover:bg-mint hover:text-forest')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('size-4 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-forest')} aria-hidden />
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto size-3.5 opacity-70" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-canvas px-2.5 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-forest text-[11px] font-bold text-white">{initials(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-[10.5px] text-muted capitalize">{user?.role}</p>
          </div>
          <button onClick={async () => { await logout(); navigate('/'); }} aria-label="Sign out" className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-danger">
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">{SidebarContent}</aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-white lg:hidden"
              initial={reduced ? { opacity: 0 } : { x: -300 }} animate={{ x: 0, opacity: 1 }} exit={reduced ? { opacity: 0 } : { x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-line bg-white lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 sm:flex">
            <Search className="size-4 text-slate-400" aria-hidden />
            <Link to={area === 'admin' ? '/admin/orders' : '/services'} className="text-[13px] text-muted hover:text-ink">
              {area === 'admin' ? 'Search orders' : 'Browse services'}
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Link to="/services" className="hidden text-[13px] font-semibold text-muted hover:text-forest sm:block">Public site</Link>
            <NotificationBell />
            <Link to={area === 'admin' ? '/admin/settings' : '/dashboard/profile'} aria-label="Account settings" className="grid size-10 place-items-center rounded-xl bg-forest text-[12px] font-bold text-white">
              {initials(user?.name)}
            </Link>
          </div>
        </header>

        <main id="main" className="px-4 py-6 pb-16 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
