import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  UserRound,
  Bell,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { LanguageSelect } from "../ui/LanguageSelect";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn, initials } from "../../lib/utils";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";

const links = [
  { to: "/", key: "home" },
  { to: "/about", key: "about" },
  { to: "/services", key: "services" },
  { to: "/how-it-works", key: "howItWorks" },
  { to: "/pricing", key: "pricing" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const { user, logout } = useAuth();
  const { t } = useI18n(); // <-- ADD THIS LINE
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { isDark } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dashboardPath =
    user && ["admin", "owner", "consultant", "support"].includes(user.role)
      ? "/admin"
      : "/dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line/80 bg-canvas/85 backdrop-blur-xl"
          : "border-b border-transparent bg-canvas/60 backdrop-blur-sm",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                  isActive ? "text-forest" : "text-muted hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(`nav.${l.key}`)}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-emerald"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 34 }
                      }
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <LanguageSelect />
          {user ? (
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pr-2.5 pl-1.5 text-sm font-semibold text-ink transition-colors hover:border-forest/30"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-forest text-[11px] font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="max-w-24 truncate">
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted transition-transform",
                    menu && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    role="menu"
                    initial={
                      reduced
                        ? { opacity: 0 }
                        : { opacity: 0, y: 8, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      reduced
                        ? { opacity: 0 }
                        : { opacity: 0, y: 6, scale: 0.98 }
                    }
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_24px_48px_-20px_rgba(20,83,45,0.4)]"
                  >
                    <div className="border-b border-line px-2.5 pt-1 pb-2.5">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {user.name}
                      </p>
                      <p className="truncate text-[11.5px] text-muted">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to={dashboardPath}
                      role="menuitem"
                      className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink hover:bg-mint"
                    >
                      <LayoutDashboard
                        className="size-4 text-forest"
                        aria-hidden
                      />{" "}
                      {t("common.dashboard")}
                    </Link>
                    <Link
                      to={
                        user.role === "student"
                          ? "/dashboard/profile"
                          : "/admin/settings"
                      }
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink hover:bg-mint"
                    >
                      <UserRound className="size-4 text-forest" aria-hidden />{" "}
                      {t("common.profileSettings")}
                    </Link>
                    <button
                      role="menuitem"
                      onClick={async () => {
                        await logout();
                        navigate("/");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-danger hover:bg-red-50"
                    >
                      <LogOut className="size-4" aria-hidden />{" "}
                      {t("common.signOut")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Button to="/login" variant="ghost" size="sm">
                {t("common.login")}
              </Button>
              <Button to="/register" size="sm" iconRight={undefined}>
                {t("common.getStarted")}
              </Button>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden"
            aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={open}
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-canvas lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="container-page flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto py-4"
            >
              {links.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={reduced ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-xl px-3 py-2.5 text-sm font-semibold",
                        isActive
                          ? "bg-mint text-forest"
                          : "text-ink hover:bg-white",
                      )
                    }
                  >
                    {t(`nav.${l.key}`)}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5">
                <span className="text-[13px] font-semibold text-ink">
                  {t("common.appearance")}
                </span>
                <span className="text-[12px] text-muted">
                  {t(isDark ? "common.darkMode" : "common.lightMode")}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5">
                <span className="text-[13px] font-semibold text-ink">
                  {t("language.label")}
                </span>
                <LanguageSelect label={false} className="max-w-[150px]" />
              </div>
              <div className="mt-3 grid gap-2 border-t border-line pt-4">
                {user ? (
                  <>
                    <Button to={dashboardPath} variant="primary">
                      {t("common.goToDashboard")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await logout();
                        navigate("/");
                      }}
                      icon={LogOut}
                    >
                      {t("common.signOut")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button to="/register">{t("common.getStarted")}</Button>
                    <Button to="/login" variant="secondary">
                      {t("common.login")}
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
