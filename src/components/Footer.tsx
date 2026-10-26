import Image from "next/image";
import Link from "next/link";
import footerImg from "@/assets/images/footer.webp";
import wordmark from "@/assets/brand/wordmark-dark.png";
import { collectionName } from "@/lib/products";
import { emailLink, instagramLink, whatsappLink } from "@/lib/site";
import Newsletter from "./Newsletter";
import Year from "./Year";
import { ArrowUpRight, Instagram, Mail, WhatsApp } from "./icons";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/products" },
      { label: collectionName("lingerie"), href: "/products?cat=lingerie" },
      { label: collectionName("swim"), href: "/products?cat=swim" },
      { label: collectionName("after-dark"), href: "/products?cat=after-dark" },
      { label: "Sale", href: "/products?sale=1" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Size guide", href: "/#size-guide" },
      { label: "How ordering works", href: "/#ordering" },
      { label: "Delivery, returns & FAQ", href: "/help" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
    ],
  },
];

const social = [
  { label: "Instagram", icon: Instagram, href: instagramLink },
  { label: "WhatsApp", icon: WhatsApp, href: whatsappLink() },
  { label: "Email", icon: Mail, href: emailLink },
];


export default function Footer() {
  return (
    <footer className="footer">
      <Image quality={90} src={footerImg} alt="" fill placeholder="blur" sizes="(max-width: 700px) 1500px, (max-width: 1100px) 1130px, 100vw" className="footer-img" />
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Image src={wordmark} alt="Lusted Lingerie" className="footer-logo" sizes="160px" />
            <p>Lingerie for every version of you. Join the inner circle for new drops and private offers.</p>
            <Newsletter />
          </div>
          <div className="footer-cols">
            {columns.map((col) => (
              <div key={col.title} className="footer-col">
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="footer-col">
              <h3>Social</h3>
              <ul>
                {social.map(({ label, icon: Icon, href }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <Icon /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © <Year /> Lusted. Designed for every version of you.
          </span>
          <span className="footer-credit">
            Designed by the Luminary team
            <a href="https://luminary-dev.xyz" target="_blank" rel="noopener" className="credit-pill">
              luminary-dev.xyz <ArrowUpRight />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
