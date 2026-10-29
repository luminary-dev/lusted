import QRCode from "qrcode";
import { emailLink, instagramLink, site, whatsappLink } from "@/lib/site";
import { Clock, Instagram, LongArrow, Mail, WhatsApp } from "./icons";

const askLink = whatsappLink("Hi Lusted! I’d like to ask about a piece.");

const channels = [
  { icon: WhatsApp, label: "WhatsApp", value: "Message us", href: askLink },
  { icon: Instagram, label: "Instagram", value: `@${site.instagramHandle}`, href: instagramLink },
  { icon: Mail, label: "Email", value: site.email, href: emailLink },
  { icon: Clock, label: "Hours", value: site.hours },
];

// QR code for the WhatsApp chat, drawn as one crisp SVG path (built at render time — no image to maintain).
function WhatsAppQr() {
  const { modules } = QRCode.create(askLink, { errorCorrectionLevel: "M" });
  let d = "";
  for (let y = 0; y < modules.size; y++)
    for (let x = 0; x < modules.size; x++) if (modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg viewBox={`0 0 ${modules.size} ${modules.size}`} shapeRendering="crispEdges" role="img" aria-label="QR code that opens our WhatsApp chat">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="section contact" data-wa-source="contact">
      <div className="container contact-wrap">
        <div className="contact-copy" data-reveal>
          <p className="eyebrow">Don’t be shy</p>
          <h2 className="h1 contact-title">
            Tell us <em>what you’re aching for</em>
          </h2>
          <p className="lede contact-lede">
            Send the piece that’s been on your mind all week — a name, a screenshot, a breathless “this one” — and we’ll come back with your size, the price, and how discreetly we can get it into your hands.
          </p>

          <div className="contact-actions">
            <a className="text-link accent" href={askLink} target="_blank" rel="noopener noreferrer">
              Slide into our WhatsApp <LongArrow />
            </a>
            <a className="text-link" href={emailLink}>
              Or write us something steamy
            </a>
          </div>

          <div className="contact-qr">
            <WhatsAppQr />
            <p>
              <span className="contact-qr-tease">
                Scan me. <em>I dare you.</em>
              </span>
              Our chat opens before you can change your mind — and whatever you confess in it stays between us and the sheets.
            </p>
          </div>
        </div>

        <div className="contact-side" data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
          <ul className="contact-list">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <li key={label}>
                <Icon />
                <span className="contact-key">{label} —</span>
                {href ? (
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {value}
                  </a>
                ) : (
                  <span className="contact-value">{value}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="contact-note">
            {site.responseTime} If a link doesn’t open in your browser, search for @{site.instagramHandle} on Instagram or message {site.whatsappDisplay} on
            WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
