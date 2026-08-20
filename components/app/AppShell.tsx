"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import { PauseBanner } from "@/components/app/PauseBanner";
import { SpaceFx } from "@/components/app/Starfield";
import { ToastStack } from "@/components/app/ToastStack";
import { TxModal } from "@/components/app/TxModal";
import { cn } from "@/lib/cn";
import { useState, type ReactNode } from "react";

const PRIMARY_NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/markets", label: "Markets" },
  { href: "/app/vault", label: "Vault" },
  { href: "/app/lend", label: "Lend" },
  { href: "/app/borrow", label: "Borrow" },
  { href: "/app/liquidate", label: "Liquidate" },
];

const MORE_NAV = [
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/activity", label: "Activity" },
  { href: "/app/admin", label: "Admin" },
];

const ALL_NAV = [...PRIMARY_NAV, ...MORE_NAV];

function isActive(path: string, href: string) {
  return href === "/app" ? path === "/app" : path.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_NAV.some((item) => isActive(path, item.href));

  return (
    <div className="app-root relative min-h-screen text-white">
      <SpaceFx />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
          <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center gap-6 px-4 sm:h-20 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Alien-Protocol_2.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 mix-blend-screen sm:h-10 sm:w-10"
                style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
              />
              <span className="hidden font-orbitron text-[18px] font-extrabold uppercase tracking-[0.2em] shimmer-text sm:inline">
                Alien Protocol
              </span>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 xl:gap-8 lg:flex">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive(path, item.href)}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}
              <div className="relative">
                <button
                  type="button"
                  data-active={moreActive}
                  className="nav-link"
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  More
                </button>
                {moreOpen ? (
                  <div className="absolute left-1/2 top-full z-50 mt-2 min-w-[10rem] -translate-x-1/2 border border-white/20 bg-black py-1">
                    {MORE_NAV.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-active={isActive(path, item.href)}
                        className="nav-link !block px-4 py-2.5 text-left"
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ConnectWalletButton />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center border border-white/30 lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="sr-only">Menu</span>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  {menuOpen ? (
                    <path d="M4 4l10 10M14 4L4 14" stroke="white" strokeWidth="1.8" />
                  ) : (
                    <path d="M3 5h12M3 9h12M3 13h12" stroke="white" strokeWidth="1.8" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen ? (
            <div className="border-t border-white/10 bg-black px-4 py-2 lg:hidden">
              {ALL_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive(path, item.href)}
                  onClick={() => setMenuOpen(false)}
                  className={cn("nav-link !block py-3")}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 pb-6 pt-24 sm:px-6 sm:pb-8 sm:pt-[6.25rem] lg:px-8">
          <PauseBanner />
          <main className="app-fade flex-1">{children}</main>
        </div>
        <footer className="border-t border-white/10 px-4 py-5 sm:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Alien-Protocol.png"
                alt=""
                width={22}
                height={22}
                className="mix-blend-screen opacity-85"
              />
              <span className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Alien Protocol © 2026
              </span>
            </div>
            <p className="font-raj text-[13px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Dummy frontend · Built on Stellar
            </p>
          </div>
        </footer>
      </div>
      <TxModal />
      <ToastStack />
    </div>
  );
}
