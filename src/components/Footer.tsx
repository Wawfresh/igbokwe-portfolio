import { MapPin, Phone, Mail, ArrowUpRight, Shield, Globe, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { siteSettings, socialLinks } = useApp();
  const currentYear = new Date().getFullYear();

  const handleNav = (path: string) => {
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#063B27] text-white pt-16 pb-10 border-t-4 border-[#C8A951]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-emerald-800/60">
          {/* Col 1: Bio blurb */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8A951]"></span>
              <h3 className="font-serif-title text-xl sm:text-2xl font-bold tracking-tight text-white">
                {siteSettings?.fullName || 'HON. NNANNA RAPHAEL IGBOKWE'}
              </h3>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              PUBLIC SERVICE • LEGISLATIVE EXPERIENCE • COMMUNITY
            </p>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              {siteSettings?.footerText ||
                'Official digital public service portfolio dedicated to transparent governance, legislative oversight, and community infrastructure across Imo State and Nigeria.'}
            </p>

            {/* Social Icons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.platform}
                  className="w-9 h-9 rounded-lg bg-emerald-900/80 hover:bg-[#C8A951] hover:text-[#063B27] text-white flex items-center justify-center transition-all"
                >
                  <Globe className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8A951]">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-emerald-100/80">
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  About Hon. Igbokwe
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/career')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Legislative Career
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/achievements')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Works & Achievements
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/projects')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Community Projects
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/gallery')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Photo Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/media')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  News & Articles
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/publications')}
                  className="hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Publications & Statements
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Focus Areas */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8A951]">
              Core Pillars
            </h4>
            <ul className="space-y-2 text-xs text-emerald-200/80">
              <li>Rural Electrification</li>
              <li>Tertiary Scholarships</li>
              <li>Maternal Health Centres</li>
              <li>Youth Skill Acquisition</li>
              <li>Legislative Oversight</li>
              <li>Community Road Grids</li>
            </ul>
          </div>

          {/* Col 4: Contact & Liaison Offices */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8A951]">
              Liaison & Contact
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-100/90 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C8A951] shrink-0 mt-0.5" />
                <span>{siteSettings?.address || 'Constituency Liaison Office, Ahiazu Mbaise / Abuja'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C8A951] shrink-0" />
                <span>{siteSettings?.phone || '+234 803 000 1234'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C8A951] shrink-0" />
                <span>{siteSettings?.email || 'contact@nnannaigbokwe.org'}</span>
              </div>
            </div>
            <button
              onClick={() => handleNav('/contact')}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B5D3B] hover:bg-[#C8A951] hover:text-[#063B27] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Send an Official Message
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/70">
          <p>
            {siteSettings?.copyright ||
              `© ${currentYear} Hon. Raphael Nnanna Igbokwe. All Rights Reserved.`}
          </p>

          <div className="flex items-center gap-6">
            <span className="text-emerald-300/60">Official Constituency Record</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
