import type { Metadata, Viewport } from "next";
import { Corinthia, Fraunces, Montserrat, Parisienne, Petit_Formal_Script, Playfair_Display } from "next/font/google";
import Nav from "@/components/Nav";
import ScrollRail from "@/components/ScrollRail";
import FluidCursor from "@/components/FluidCursor";
import LoadingScreen from "@/components/LoadingScreen";
import Footer from "@/components/Footer";
import BagDrawer from "@/components/shop/BagDrawer";
import SearchDialog from "@/components/SearchDialog";
import "./globals.css";

// Headlines: Parisienne (a casual connecting script — set ~1.5× the Petit Formal Script sizes, its x-height is small).
// Alternatives kept unloaded until used — switch --headline in globals.css:
// Petit Formal Script (formal copperplate), Fraunces (soft serif), Playfair Display (closest free match to the logo)
// or Corinthia (fine script).
const parisienne = Parisienne({
  variable: "--font-parisienne",
  subsets: ["latin"],
  weight: "400",
});

const formal = Petit_Formal_Script({
  variable: "--font-formal",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  preload: false,
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  preload: false,
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
  title: "Lusted — Lingerie for every version of you",
  description:
    "Barely-there lace, sun-kissed strings and midnight silk — lingerie, swimwear and after-dark pieces for the version of you that never asks permission. Discreet packaging, private ordering and personal sizing support.",
  openGraph: {
    title: "Lusted — Lingerie for every version of you",
    description: "Dressed to tempt. Made to be undone.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#140a0c" },
  ],
};

// Applies the saved (or system) theme before first paint so there's no flash.
const themeScript = `try{var t=localStorage.getItem("lusted-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
// Skips the loading screen if it has already played in this tab, before paint so it never flashes.
const introScript = `try{if(sessionStorage.getItem("lusted-intro"))document.documentElement.classList.add("intro-seen")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${parisienne.variable} ${formal.variable} ${fraunces.variable} ${serif.variable} ${script.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <LoadingScreen />
        <Nav />
        <ScrollRail />
        <FluidCursor />
        {children}
        <Footer />
        <BagDrawer />
        <SearchDialog />
      </body>
    </html>
  );
}
