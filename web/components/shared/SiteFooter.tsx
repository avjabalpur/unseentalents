import Link from "next/link";
import { AtSign, Camera, PlayCircle, ThumbsUp } from "lucide-react";
import { Brand } from "@/components/shared/Brand";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Upload" },
  { href: "/pages/whats-new", label: "What's New" },
  { href: "/pages/about-us", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

const EXPLORE_LINKS = [
  { href: "/pages/performers", label: "Performers" },
  { href: "/pages/talent-lovers", label: "Talent Lovers" },
  { href: "/pages/upcoming-events", label: "Upcoming Events" },
];

const SOCIALS = [
  { href: "https://www.facebook.com/utdotcom", label: "Facebook", icon: ThumbsUp },
  { href: "https://twitter.com/unseentalents", label: "Twitter", icon: AtSign },
  { href: "https://www.instagram.com/unseentalentsdotcom/", label: "Instagram", icon: Camera },
  {
    href: "https://www.youtube.com/channel/UCTeFJbM1MzFKzr82y4R471w/featured",
    label: "YouTube",
    icon: PlayCircle,
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-[1600px] px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              A stage for talented people everywhere — upload your performance, rally your
              supporters, and vote your way to the top.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-white">Explore</h3>
            <ul className="mt-4 space-y-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-white">Connect</h3>
            <div className="mt-4 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-primary hover:text-primary"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SecretWhiz. All rights reserved.</p>
          <p>Show your talent. Get discovered.</p>
        </div>
      </div>
    </footer>
  );
}
