import Link from "next/link";
import Image from "next/image";
import { FaGithub } from "react-icons/fa";

const productLinks = [
  {
    label: "AI Food Logger",
    href: "/nutrition/",
  },
  {
    label: "Macro Tracker",
    href: "/blog/best-macro-calculator",
  },
  {
    label: "TDEE Calculator",
    href: "/settings",
  },
  {
    label: "Calorie Tracker",
    href: "/dashboard",
  },
  {
    label: "Progress Dashboard",
    href: "/progress",
  },
];

const resourceLinks = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  {
    label: "Calorie Tracking for Beginners",
    href: "/blog/calorie-tracking-for-beginners",
  },
  { label: "Best Macro Calculator Guide", href: "/blog/best-macro-calculator" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      role="contentinfo"
      className="relative z-10 pt-16 pb-8 backdrop-blur-sm border-t border-border/30">
      {/* Structured data: entity signal for search engines, unrelated to the visible layout */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "CalStory",
            url: "https://calstory.app",
            logo: "https://calstory.app/light.png",
            email: "support@calstory.app",
            sameAs: ["https://github.com/tanishenigma"],
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Top: brand pinned left, nav columns grouped and pinned right */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-16">
          {/* Brand + description + contact */}
          <div className="md:max-w-xs shrink-0">
            <Link
              href="/"
              aria-label="CalStory home"
              className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center transition-transform group-hover:scale-110 overflow-hidden">
                <Image
                  src="/dark.png"
                  alt="CalStory logo"
                  width={28}
                  height={28}
                  loading="lazy"
                  className="w-7 h-7 object-contain block"
                />
              </div>
              <p className="font-bold text-xl tracking-tight font-heading">
                CalStory
              </p>
            </Link>

            <p className="mt-4 text-sm text-muted-foreground/80 leading-relaxed max-w-xs">
              CalStory is the free AI-powered calorie and macro tracker built
              for lifters and runners. Log meals in plain English, hit your
              macros, and track workouts in one place.
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-sm font-heading">Contact</h3>
              <a
                href="mailto:support@calstory.app"
                className="mt-2 inline-block text-sm text-muted-foreground/80 hover:text-foreground transition-colors">
                support@calstory.app
              </a>
            </div>
          </div>

          {/* Grouped nav columns, pinned together on the right */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            {/* Product */}
            <nav aria-label="Product links">
              <h3 className="font-semibold text-sm font-heading">Product</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resource links">
              <h3 className="font-semibold text-sm font-heading">Resources</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal links">
              <h3 className="font-semibold text-sm font-heading">Legal</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground/80 list-none">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar: copyright + GitHub */}
        <div className="mt-12 pt-6 border-t border-border/30 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-[11px] font-medium text-muted-foreground/80">
          <span>&copy;{year} CalStory. All rights reserved.</span>
          <a
            href="https://github.com/tanishenigma"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CalStory on GitHub (opens in a new tab)"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FaGithub size={12} aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
