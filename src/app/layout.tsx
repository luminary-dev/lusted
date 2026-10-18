import type { Metadata, Viewport } from "next";
import { Corinthia, Fraunces, Montserrat, Petit_Formal_Script, Playfair_Display } from "next/font/google";
import Nav from "@/components/Nav";
import ScrollRail from "@/components/ScrollRail";
import CursorTrail from "@/components/CursorTrail";
import Footer from "@/components/Footer";
import BagDrawer from "@/components/shop/BagDrawer";
import SearchDialog from "@/components/SearchDialog";
import "./globals.css";

// Headlines: Petit Formal Script (formal copperplate — fancy but easy to read).
// Alternatives kept unloaded until used — switch --headline in globals.css:
// Fraunces (soft serif), Playfair Display (closest free match to the logo) or Corinthia (fine script).
const formal = Petit_Formal_Script({
  variable: "--font-formal",
  subsets: ["latin"],
  weight: "400",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${formal.variable} ${fraunces.variable} ${serif.variable} ${script.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Nav />
        <ScrollRail />
        <CursorTrail />
        {children}
        <Footer />
        <BagDrawer />
        <SearchDialog />
      </body>
    </html>
  );
}
