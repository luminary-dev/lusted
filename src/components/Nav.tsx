"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import wordmarkLight from "@/assets/brand/wordmark-light.png";
import wordmarkDark from "@/assets/brand/wordmark-dark.png";
import { bag, useBag } from "@/lib/bag";
import { useFavourites } from "@/lib/favourites";
import { navLinks, whatsappLink } from "@/lib/site";
import { setSearchOpen } from "./SearchDialog";
import ThemeToggle from "./ThemeToggle";
import { Bag, Close, Heart, Menu, Search, WhatsApp } from "./icons";

export default function Nav() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [spy, setSpy] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { count } = useBag();
  const favCount = useFavourites().length;

  // Frosted bar once past the top; hide while scrolling down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (y > 240 && y > last + 4) setHidden(true);
      if (y < last - 4 || y < 240) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the home page, underline the link for whichever section fills the middle of the viewport.
  useEffect(() => {
    if (!home) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSpy(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [home]);

  const isActive = (href: string) => (href.startsWith("/#") ? home && spy === href.slice(2) : pathname.startsWith(href));
  // Transparent only while sitting over the home hero.
  const solid = scrolled || open || !home;

  return (
    <header className={`nav ${solid ? "is-solid" : ""} ${hidden && !open ? "is-hidden" : ""} ${open ? "is-open" : ""}`}>
      <div className="container">
        <div className="nav-bar">
          <Link href="/" className="nav-logo" aria-label="Lusted — home" onClick={() => setOpen(false)}>
            {/* Champagne mark over the hero / in dark mode, wine mark on the light frosted bar. */}
            <Image src={wordmarkDark} alt="" className="logo-champagne" sizes="140px" preload />
            <Image src={wordmarkLight} alt="" className="logo-wine" sizes="140px" />
          </Link>
          <nav className="nav-links" aria-label="Main">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "is-active" : ""} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <a className="btn btn-wine nav-menu-whatsapp" href={whatsappLink("Hi Lusted! I'd love some help with an order.")} target="_blank" rel="noopener noreferrer">
              <WhatsApp /> Message us on WhatsApp
            </a>
            <div className="nav-menu-theme">
              <span>Dark mode</span>
              <ThemeToggle />
            </div>
          </nav>
          <div className="nav-actions">
            <a
              className="btn btn-wine nav-whatsapp"
              href={whatsappLink("Hi Lusted! I'd love some help with an order.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message us on WhatsApp"
            >
              <WhatsApp /> <span>Message us</span>
            </a>
            <button className="icon-btn" aria-label="Search" title="Search (⌘K)" onClick={() => setSearchOpen(true)}>
              <Search />
            </button>
            <Link href="/favourites" className={`icon-btn ${pathname === "/favourites" ? "is-active" : ""}`} aria-label={`Favourites, ${favCount} saved`} onClick={() => setOpen(false)}>
              <Heart />
              {favCount > 0 && <span className="bag-count">{favCount}</span>}
            </Link>
            <button className="icon-btn" aria-label={`Open bag, ${count} items`} onClick={() => bag.setOpen(true)}>
              <Bag />
              {count > 0 && <span className="bag-count">{count}</span>}
            </button>
            <span className="nav-theme">
              <ThemeToggle />
            </span>
            <button className="nav-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
