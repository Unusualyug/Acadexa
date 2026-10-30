import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";
import logoLightUrl from "../../assets/acadexa-logo.png";
import logoDarkUrl from "../../assets/acadexa-logo-dark.png";

/**
 * Acadexa brand mark — graduation cap over an open book.
 *
 * Two artworks: the brand-green mark for light surfaces and a light mint
 * variant for dark ones. Swapping the source (rather than filtering one image)
 * keeps both crisp and lets either file be replaced independently.
 *
 * To supply official artwork: drop the light file in as `acadexa-logo.png` and
 * the dark-surface file as `acadexa-logo-dark.png` — nothing else changes.
 */
export function LogoMark({ className, alt = "", forceTheme }) {
  const { isDark } = useTheme();
  const dark = forceTheme ? forceTheme === "dark" : isDark;
  return (
    <span
      className={cn("inline-grid place-items-center", className)}
      aria-hidden={alt ? undefined : true}
    >
      <img
        src={dark ? logoDarkUrl : logoLightUrl}
        alt={alt}
        className="size-full object-contain"
        draggable="false"
      />
    </span>
  );
}

export function Logo({
  compact = false,
  to = "/",
  className,
  theme = "light",
}) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Acadexa home"
    >
      <LogoMark className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-3" />
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              "block font-display text-[17px] font-extrabold tracking-tight",
              theme === "dark" ? "text-white" : "text-forest",
            )}
          >
            Acadexa
          </span>
          <span
            className={cn(
              "mt-0.5 block text-[10px] font-medium tracking-[0.14em] uppercase",
              theme === "dark" ? "text-white/60" : "text-muted",
            )}
          >
            Consultancy Services
          </span>
        </span>
      )}
    </Link>
  );
}
