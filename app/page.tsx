"use client";

import { useEffect, useRef, useState } from "react";

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.1 + 0.02,
      opacity: Math.random(),
      td: Math.random() * 0.012 + 0.003,
      tdir: Math.random() > 0.5 ? 1 : -1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.opacity += s.td * s.tdir;
        if (s.opacity > 1 || s.opacity < 0.05) s.tdir *= -1;
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// Typewriter hook
function useTypewriter(texts: string[], speed = 60, pause = 2200) {
  const [display, setDisplay] = useState("");
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, speed);
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx >= 0) {
      timeout = setTimeout(() => {
        setDisplay(current.slice(0, charIdx));
        setCharIdx((c) => c - 1);
      }, speed / 2);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- existing typewriter cycle
      setDeleting(false);
      setTextIdx((i) => (i + 1) % texts.length);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, textIdx, texts, speed, pause]);

  return display;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const typed = useTypewriter([
    "Turn tokenized RWAs into borrowing power",
    "Deposit treasuries. Borrow USDC. Stay in control",
    "Real-world collateral. On-chain credit. Built on Stellar",
    "One vault. One health factor. Capital that actually works",
  ]);

  // Fade-in hero on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Exo+2:wght@300;400;600;700;800&family=Rajdhani:wght@400;600;700&display=swap');

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.08; }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(255,255,255,0.2)); }
          50%       { filter: drop-shadow(0 0 42px rgba(255,255,255,0.6)); }
        }
        @keyframes badge-flicker {
          0%,94%,100% { opacity: 1; }
          95%  { opacity: 0.6; }
          96%  { opacity: 1; }
          98%  { opacity: 0.7; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes btn-pulse {
          0%, 100% { box-shadow: 0 0 0px rgba(255,255,255,0); }
          50%       { box-shadow: 0 0 18px rgba(255,255,255,0.35), 0 0 40px rgba(255,255,255,0.12); }
        }
        @keyframes scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; }
        body { background: #000; -webkit-font-smoothing: antialiased; }
        ::selection { background: #fff; color: #000; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); }

        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-exo      { font-family: 'Exo 2', sans-serif; }
        .font-raj      { font-family: 'Rajdhani', sans-serif; }

        /* shimmer text */
        .shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.5) 0%, #fff 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.3) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        /* github btn */
        .github-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(9px, 1.2vw, 12px);
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 22px;
          text-decoration: none;
          transition: border-color 0.25s, color 0.25s, background 0.25s;
          white-space: nowrap;
        }
        .github-btn:hover {
          border-color: #fff;
          color: #000;
          background: #fff;
        }
        .github-btn:hover .shimmer-text {
          animation: none;
          background: none;
          -webkit-text-fill-color: #000;
          color: #000;
        }

        /* notify btn */
        .notify-btn {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }
        .notify-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }
        .notify-btn:hover::after { transform: translateX(100%); }

        /* footer link */
        .footer-link { color: rgba(255,255,255,0.55); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: #fff; }

        /* cursor blink */
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1.1em;
          background: #fff;
          margin-left: 3px;
          vertical-align: middle;
          animation: cursor-blink 0.8s infinite;
        }

        /* fade slide up helper */
        .fade-up { opacity: 0; }
        .fade-up.visible {
          animation: fadeSlideUp 0.7s ease forwards;
        }

        /* ── Responsive ── */
        .nav-wrap       { padding: 18px 20px; }
        .nav-brand-text { font-size: 13px; }
        .hero-logo      { width: 110px; height: 110px; }
        .hero-brand     { font-size: 11px; letter-spacing: 0.45em; }
        .coming-badge   { font-size: 15px; letter-spacing: 0.28em; padding: 11px 20px; }
        .tagline-wrap   { font-size: 13px; max-width: 310px; min-height: 52px; }
        .email-form     { max-width: 320px; }
        .email-input    { font-size: 12px; padding: 14px 14px; }
        .notify-btn     { font-size: 11px; padding: 14px 16px; }
        .footer-wrap    { padding: 18px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
        .footer-links   { gap: 20px; font-size: 13px; }
        .footer-copy    { font-size: 11px; }
        .footer-logo    { width: 20px; height: 20px; }

        @media (min-width: 640px) {
          .nav-wrap       { padding: 22px 36px; }
          .nav-brand-text { font-size: 15px; }
          .hero-logo      { width: 140px; height: 140px; }
          .hero-brand     { font-size: 13px; }
          .coming-badge   { font-size: 20px; letter-spacing: 0.4em; padding: 13px 30px; }
          .tagline-wrap   { font-size: 16px; max-width: 430px; min-height: 58px; }
          .email-form     { max-width: 420px; }
          .email-input    { font-size: 14px; padding: 16px 20px; }
          .notify-btn     { font-size: 12px; padding: 16px 22px; }
          .footer-wrap    { padding: 20px 36px; flex-direction: row; align-items: center; }
          .footer-links   { gap: 28px; font-size: 15px; }
          .footer-copy    { font-size: 12px; }
          .footer-logo    { width: 24px; height: 24px; }
        }

        @media (min-width: 1024px) {
          .nav-wrap       { padding: 28px 60px; }
          .nav-brand-text { font-size: 17px; }
          .hero-logo      { width: 170px; height: 170px; }
          .hero-brand     { font-size: 15px; letter-spacing: 0.55em; }
          .coming-badge   { font-size: 26px; letter-spacing: 0.48em; padding: 16px 44px; }
          .tagline-wrap   { font-size: 18px; max-width: 540px; min-height: 64px; }
          .email-form     { max-width: 520px; }
          .email-input    { font-size: 15px; padding: 18px 22px; }
          .notify-btn     { font-size: 13px; padding: 18px 28px; }
          .footer-wrap    { padding: 24px 60px; }
          .footer-links   { gap: 36px; font-size: 16px; }
          .footer-copy    { font-size: 13px; }
          .footer-logo    { width: 28px; height: 28px; }
        }
      `}</style>

      <div className="font-orbitron" style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        <Starfield />

        {/* Scanlines */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.055) 2px,rgba(0,0,0,0.055) 4px)" }} />

        {/* Scan line sweep */}
        <div style={{ position: "fixed", left: 0, top: 0, width: "100%", height: "3px", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)", pointerEvents: "none", zIndex: 2, animation: "scan 8s linear infinite" }} />

        {/* ══ NAV ══ */}
        <nav className="nav-wrap" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Alien-Protocol_2.png" alt="Alien Protocol Logo" width={40} height={40} style={{ display: "block", mixBlendMode: "screen" }} />
            <span className="nav-brand-text font-orbitron shimmer-text" style={{ fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Alien Protocol
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/app" className="github-btn">
              <span className="shimmer-text">Launch App</span>
            </a>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <main style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>

          {/* Logo */}
          <div
            className={`fade-up${visible ? " visible" : ""}`}
            style={{ marginBottom: 32, animation: visible ? "fadeSlideUp 0.6s ease forwards, glow-pulse 3s ease-in-out 0.6s infinite" : undefined }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Alien-Protocol_2.png" alt="Alien Protocol" className="hero-logo" style={{ display: "block", mixBlendMode: "screen" }} />
          </div>

          {/* Brand name */}
          <p
            className={`hero-brand font-raj fade-up${visible ? " visible" : ""}`}
            style={{ fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 24, animationDelay: "0.15s" }}
          >
            Alien Protocol
          </p>

          {/* COMING SOON */}
          <div
            className={`coming-badge font-orbitron fade-up${visible ? " visible" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 14, border: "2px solid rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.04)", marginBottom: 36, animationDelay: "0.28s", animation: visible ? "fadeSlideUp 0.7s 0.28s ease forwards, badge-flicker 8s 1s infinite" : undefined }}
          >
            <span style={{ width: 9, height: 9, backgroundColor: "#fff", display: "inline-block", borderRadius: "50%", animation: "blink 1.4s infinite" }} />
            <span style={{ fontWeight: 900, textTransform: "uppercase", color: "#fff" }}>Coming Soon</span>
            <span style={{ width: 9, height: 9, backgroundColor: "#fff", display: "inline-block", borderRadius: "50%", animation: "blink 1.4s infinite 0.7s" }} />
          </div>

          {/* Typewriter tagline */}
          <div
            className={`tagline-wrap font-exo fade-up${visible ? " visible" : ""}`}
            style={{ fontWeight: 500, color: "rgba(255,255,255,0.78)", lineHeight: 1.85, marginBottom: 44, letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", animationDelay: "0.42s" }}
          >
            <span>{typed}</span>
            <span className="cursor" />
          </div>

          {/* Email form */}
          {!submitted ? (
            <form
              className={`email-form fade-up${visible ? " visible" : ""}`}
              onSubmit={handleSubmit}
              style={{ display: "flex", border: "1.5px solid rgba(255,255,255,0.32)", width: "100%", animationDelay: "0.55s", animation: visible ? `fadeSlideUp 0.7s 0.55s ease forwards, btn-pulse 2.5s 1.5s ease-in-out infinite` : undefined }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input font-exo"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", letterSpacing: "0.06em", fontWeight: 500, minWidth: 0 }}
              />
              <button
                type="submit"
                className="notify-btn"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  background: btnHover ? "rgba(255,255,255,0.88)" : "#fff",
                  color: "#000",
                  animation: "btn-pulse 2.5s 1.5s ease-in-out infinite",
                }}
              >
                {loading ? "SENDING..." : "Notify Me"}
              </button>
              {error && (
                <p className="font-exo" style={{ marginTop: 10, fontSize: 13, color: "rgba(255,100,100,0.85)", letterSpacing: "0.06em" }}>
                  ⚠ {error}
                </p>
              )}
            </form>

          ) : (
            <div className="font-orbitron" style={{ border: "1.5px solid rgba(255,255,255,0.32)", padding: "18px 36px", fontSize: "clamp(12px, 2vw, 15px)", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", animation: "fadeSlideUp 0.5s ease forwards" }}>
              ✓ &nbsp; You&apos;re on the list
            </div>
          )}

          <p
            className={`font-raj fade-up${visible ? " visible" : ""}`}
            style={{ marginTop: 14, fontSize: "clamp(11px, 1.5vw, 14px)", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", animationDelay: "0.65s" }}
          >
            No spam. Launch announcement only.
          </p>
        </main>

        {/* ══ FOOTER ══ */}
        <footer className="footer-wrap" style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.09)", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Alien-Protocol.png" alt="logo" className="footer-logo" style={{ mixBlendMode: "screen", opacity: 0.85 }} />
            <span className="footer-copy font-orbitron" style={{ fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              Alien Protocol © 2026
            </span>
          </div>

          <div className="footer-links font-raj" style={{ display: "flex", alignItems: "center", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", flexWrap: "wrap" }}>
            <a href="https://github.com/Alien-Protocol" target="_blank" rel="noreferrer" className="footer-link">GitHub</a>
            <span>Built on Stellar</span>
          </div>
        </footer>
      </div>
    </>
  );
}