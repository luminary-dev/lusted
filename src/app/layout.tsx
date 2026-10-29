import type { Metadata, Viewport } from "next";
import { Corinthia, Montserrat, Parisienne } from "next/font/google";
import Nav from "@/components/Nav";
import ScrollRail from "@/components/ScrollRail";
import FluidCursor from "@/components/FluidCursor";
import LoadingScreen from "@/components/LoadingScreen";
import Footer from "@/components/Footer";
import BagDrawer from "@/components/shop/BagDrawer";
import BagToast from "@/components/shop/BagToast";
import SearchDialog from "@/components/SearchDialog";
import SiteAnalytics from "@/components/SiteAnalytics";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Headlines: Parisienne, a casual connecting script set large because its x-height is small (--headline in
// 01-base.css). Corinthia is the finer script used for the signature lines on the about and legal pages (--script).
// Montserrat carries everything else. Three faces, all of them used — alternates were tried and dropped.
const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
});




const script = Corinthia({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

const sans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  // absolute links for the share image and the product pages' photos (opengraph-image.png in this folder is the
  // brand card every page shares with, unless it sets its own)
  metadataBase: siteUrl,
  title: "Lusted — Lingerie that doesn’t stay on",
  description:
    "Lace that comes off with one tug, strings that barely try and silk that slides away the second a hand finds it — lingerie, swimwear and after-dark pieces for the version of you that wants to be watched, and worse. Plain box, private ordering, a real person who won’t blush.",
  openGraph: {
    title: "Lusted — Lingerie that doesn’t stay on",
    description: "Dressed to tempt. Undressed by midnight.",
    type: "website",
    siteName: "Lusted",
    locale: "en_LK",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // The bag toast and the sticky buy bar sit at the bottom of the screen, so they have to clear a phone's home
  // indicator. env(safe-area-inset-*) only reports a real inset once the page asks to draw into those areas.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#140a0c" },
  ],
};

// Applies the saved (or system) theme before first paint so there's no flash.
const themeScript = `try{var t=localStorage.getItem("lusted-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
// Skips the loading screen, before paint so it never flashes, unless the visit begins on the home page and it hasn't
// played in this tab yet. A visit that lands on any other page — a product link opened from Instagram or WhatsApp, whose
// in-app browsers start a fresh session every time — goes straight to it, and the tab is marked so that coming round
// to the home page later (or reloading it) doesn't hold the shopper up either.
const introScript = `try{if(location.pathname!=="/"||sessionStorage.getItem("lusted-intro"))document.documentElement.classList.add("intro-seen");if(location.pathname!=="/")sessionStorage.setItem("lusted-intro","1")}catch(e){}`;
// Marks browsers that can draw the 3D size tags, before first paint, so the size guide holds their room from the start
// (SizeGuide.tsx / .webgl in globals.css) and never changes height when they arrive.
const webglScript = `if(window.WebGLRenderingContext)document.documentElement.classList.add("webgl")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${parisienne.variable} ${script.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <script dangerouslySetInnerHTML={{ __html: webglScript }} />
      </head>
      <body>
        <LoadingScreen />
        <Nav />
        <ScrollRail />
        <FluidCursor />
        {children}
        <Footer />
        <BagDrawer />
        <BagToast />
        <SearchDialog />
        <SiteAnalytics />
      </body>
    </html>
  );
}
