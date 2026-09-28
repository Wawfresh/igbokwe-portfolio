import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Award,
  Landmark,
  Users,
  BookOpen,
  ExternalLink,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';
import ProjectCard from '../components/ProjectCard';
import HeroSlider from '../components/HeroSlider';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenLightbox: (item: any) => void;
}

export default function HomePage({ onNavigate, onOpenLightbox }: HomePageProps) {
  const { hero, biography, career, featuredProjects, gallery, articles, publications } = useApp();

  return (
    <div className="pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F6F9F7] to-[#F6F9F7] pt-8 sm:pt-14 pb-3 sm:pb-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              {/* Institutional badge */}
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#0B5D3B] uppercase">
                <span className="w-8 h-[2px] bg-[#C8A951]"></span>
                <span>Public Service & Legislative Leadership</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-title font-bold text-[#063B27] tracking-tight leading-[1.15]">
                {hero?.title || 'HON. RAPHAEL NNANNA IGBOKWE'}
              </h1>

              <p className="text-base sm:text-xl font-medium text-[#0B5D3B] tracking-wide">
                {hero?.subtitle || 'Public Service • Legislative Experience • Community Development'}
              </p>

              <p className="text-sm sm:text-lg text-[#66736B] leading-relaxed max-w-2xl">
                {hero?.description ||
                  'An official digital portfolio chronicling over a decade of dedicated public stewardship, legislative representation in the National Assembly, grassroots empowerment, and developmental advocacy for Imo State and Nigeria.'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => onNavigate(hero?.buttonOneLink || '/career')}
                  className="px-6 py-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{hero?.buttonOneText || 'Explore His Journey'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate(hero?.buttonTwoLink || '/projects')}
                  className="px-6 py-3.5 rounded-xl border-2 border-[#0B5D3B] text-[#0B5D3B] hover:bg-[#0B5D3B] hover:text-white font-semibold text-sm transition-all text-center cursor-pointer"
                >
                  {hero?.buttonTwoText || 'View Works'}
                </button>
              </div>

              {/* Verified Nigerian Legislative Credentials strip */}
              <div className="pt-6 border-t border-gray-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs text-[#17211C]">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#C8A951] shrink-0" />
                  <span className="font-semibold">National Assembly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C8A951] shrink-0" />
                  <span className="font-semibold">Two-Term Lawmaker</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8A951] shrink-0" />
                  <span className="font-semibold">Grassroots Advocate</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Portrait */}
            <div className="lg:col-span-5 relative flex justify-center">
              {/* Decorative institutional green & gold accents */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#0B5D3B]/20 via-transparent to-[#C8A951]/20 rounded-3xl blur-xl -z-10"></div>

              <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-emerald-950">
                <img
                  src={hero?.imageUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'}
                  alt="Hon. Raphael Nnanna Igbokwe"
                  onError={(e) => {
                    const fallback = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />

                {/* Subtle caption banner */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#063B27] via-[#063B27]/80 to-transparent p-5 text-white pointer-events-none">
                  <p className="text-xs uppercase tracking-wider text-[#C8A951] font-semibold">
                    Public Steward
                  </p>
                  <p className="text-base font-serif-title font-bold">
                    Hon. Raphael Nnanna Igbokwe
                  </p>
                  <p className="text-xs text-emerald-200">
                    Ahiazu Mbaise / Ezinihitte Federal Constituency
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sliding Images Carousel (8 Slides of Hon. Raphael Nnanna Igbokwe) */}
          <div className="mt-12 sm:mt-16">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B5D3B]">
                  Pictorial Showcase • Hon. Raphael Nnanna Igbokwe
                </span>
                <h2 className="text-lg sm:text-xl font-serif-title font-bold text-[#17211C]">
                  Moments of Stewardship, Legislation & Community Impact
                </h2>
              </div>
              <p className="text-xs text-[#66736B]">
                Swipe or click thumbnails to explore leadership slides
              </p>
            </div>

            <HeroSlider
              slides={hero?.slides}
              onOpenLightbox={onOpenLightbox}
              onNavigate={onNavigate}
            />
          </div>

          {/* Scroll Down Indicator */}
          <div className="mt-4 sm:mt-5 mb-0 text-center">
            <button
              onClick={() => {
                const target = document.getElementById('record-overview');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#66736B] hover:text-[#0B5D3B] transition-colors cursor-pointer group"
            >
              <span>{hero?.scrollIndicatorText || 'Scroll to discover leadership & service'}</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-[#0B5D3B]" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN SECTIONS CONTAINER */}
      <div className="mt-4 sm:mt-6 space-y-20 sm:space-y-24">
        {/* 2. RECORD OVERVIEW STATS (Zero-pill discipline) */}
        <section id="record-overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-3xl sm:text-5xl font-serif-title font-bold text-[#0B5D3B]">12+</p>
              <p className="text-xs sm:text-sm font-medium text-[#66736B] uppercase tracking-wider mt-2">
                Years of Public Service
              </p>
            </div>
            <div className="text-center md:border-l md:border-gray-100 md:pl-6">
              <p className="text-3xl sm:text-5xl font-serif-title font-bold text-[#063B27]">7th & 8th</p>
              <p className="text-xs sm:text-sm font-medium text-[#66736B] uppercase tracking-wider mt-2">
                National Assemblies
              </p>
            </div>
            <div className="text-center md:border-l md:border-gray-100 md:pl-6">
              <p className="text-3xl sm:text-5xl font-serif-title font-bold text-[#0B5D3B]">50+</p>
              <p className="text-xs sm:text-sm font-medium text-[#66736B] uppercase tracking-wider mt-2">
                Rural Power & Water Grids
              </p>
            </div>
            <div className="text-center md:border-l md:border-gray-100 md:pl-6">
              <p className="text-3xl sm:text-5xl font-serif-title font-bold text-[#063B27]">500+</p>
              <p className="text-xs sm:text-sm font-medium text-[#66736B] uppercase tracking-wider mt-2">
                Educational Bursaries Conferred
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT HON. IGBOKWE TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <SectionHeader
              badge="Public Steward Profile"
              title="A Commitment to Representation, Governance, and Development"
              subtitle="Driven by the belief that legislative democracy must reflect directly in the quality of daily community life."
            />

            <p className="text-base text-[#17211C] leading-relaxed">
              {biography?.shortBio ||
                'Hon. Raphael Nnanna Igbokwe has distinguished himself as a principled public servant who represented Ahiazu Mbaise / Ezinihitte Federal Constituency with transparency and legislative distinction.'}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0B5D3B] shrink-0 mt-0.5" />
                <p className="text-sm text-[#66736B]">
                  <strong className="text-[#17211C]">Origin & Representation:</strong> Proud son of Ahiazu Mbaise Local Government Area, consistently championing federal equity for Imo State.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0B5D3B] shrink-0 mt-0.5" />
                <p className="text-sm text-[#66736B]">
                  <strong className="text-[#17211C]">Legislative Governance:</strong> Rigorous oversight of public expenditure, capital market legislation, and critical petroleum downstream deliberations.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0B5D3B] shrink-0 mt-0.5" />
                <p className="text-sm text-[#66736B]">
                  <strong className="text-[#17211C]">Human Capital Focus:</strong> Sustained investment in youth polytechnic/university bursaries and community health clinics.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('/about')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5D3B] hover:text-[#063B27] group cursor-pointer"
              >
                <span>Read Full Biography & Background</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative">
              <div className="w-12 h-1 bg-[#C8A951] mb-6"></div>
              <blockquote className="text-xl sm:text-2xl font-serif-title text-[#063B27] leading-snug italic mb-6">
                “True public leadership is judged not merely by speeches delivered on the parliamentary floor, but by the tangible schools, power transformers, health centres, and livelihoods empowered in our villages.”
              </blockquote>
              <div className="flex items-center justify-between text-xs text-[#66736B] pt-4 border-t border-gray-100">
                <div>
                  <p className="font-semibold text-[#17211C]">Hon. Raphael Nnanna Igbokwe</p>
                  <p>Former Member, House of Representatives of Nigeria</p>
                </div>
                <div className="text-right font-medium text-[#0B5D3B]">
                  Official Public Record
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LEGISLATIVE JOURNEY TIMELINE PREVIEW */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <SectionHeader
              badge="Parliamentary Service"
              title="Legislative Journey & Milestones"
              subtitle="Chronological track record of elected public service across state and federal institutions."
              className="mb-0"
            />
            <button
              onClick={() => onNavigate('/career')}
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B5D3B] hover:underline cursor-pointer shrink-0"
            >
              <span>View Full Legislative Record</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {career.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="bg-[#F6F9F7] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between hover:border-[#0B5D3B]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#0B5D3B] tracking-wider uppercase">
                      Tenure {item.year}
                    </span>
                    <span className="text-xs text-[#66736B]">Milestone {index + 1}</span>
                  </div>
                  <h3 className="text-lg font-serif-title font-bold text-[#17211C] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#063B27] mb-3">
                    {item.institution}
                  </p>
                  <p className="text-sm text-[#66736B] line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.sourceLink && (
                  <div className="pt-4 mt-4 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <span className="text-[#66736B]">Public Documentation</span>
                    <a
                      href={item.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0B5D3B] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Verify Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED WORKS & ACHIEVEMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionHeader
            badge="Constituency Impact"
            title="Featured Works & Achievements"
            subtitle="Verified community infrastructure, health centres, electrification, and human capital programmes."
            className="mb-0"
          />
          <button
            onClick={() => onNavigate('/achievements')}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B5D3B] hover:underline cursor-pointer shrink-0"
          >
            <span>Explore All Achievements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.slice(0, 3).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={(slug) => onNavigate(`/projects/${slug}`)}
            />
          ))}
        </div>
      </section>

      {/* 6. PHOTO GALLERY PREVIEW */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <SectionHeader
              badge="Visual Archives"
              title="Community & Public Service Gallery"
              subtitle="Photographic record of town halls, legislative sessions, project commissioning, and civic visits."
              className="mb-0"
            />
            <button
              onClick={() => onNavigate('/gallery')}
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B5D3B] hover:underline cursor-pointer shrink-0"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.slice(0, 4).map((img) => (
              <div
                key={img.id}
                onClick={() => onOpenLightbox(img)}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                  <p className="text-xs uppercase tracking-wider text-[#C8A951] font-semibold">
                    {img.category}
                  </p>
                  <p className="text-sm font-serif-title font-bold line-clamp-1">{img.title}</p>
                  <p className="text-[11px] text-white/80 mt-0.5">{img.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. LATEST MEDIA & ARTICLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionHeader
            badge="News & Commentary"
            title="Latest Media & Statements"
            subtitle="Public policy reflections, legislative speeches, and official media releases."
            className="mb-0"
          />
          <button
            onClick={() => onNavigate('/media')}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B5D3B] hover:underline cursor-pointer shrink-0"
          >
            <span>Browse All Media</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.id}
              onClick={() => onNavigate(`/media/${article.slug}`)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#0B5D3B] font-semibold uppercase tracking-wider mb-2">
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.source}</span>
                  </div>
                  <h3 className="text-lg font-serif-title font-bold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#66736B] line-clamp-3 leading-relaxed mb-4">
                    {article.summary}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-[#66736B]">
                  <span>{article.author}</span>
                  <div className="flex items-center gap-1 text-[#0B5D3B] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. PUBLICATIONS CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#063B27] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="text-xs font-bold tracking-widest text-[#C8A951] uppercase">
              Official Documentation
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-title font-bold tracking-tight">
              Access Legislative Reports & Public Records
            </h2>
            <p className="text-base text-emerald-100/90 leading-relaxed">
              Explore downloadable policy briefs, constituency intervention assessments, and parliamentary stewardship reports documenting achievements and public finance transparency.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('/publications')}
                className="px-6 py-3 rounded-xl bg-[#C8A951] text-[#063B27] hover:bg-white font-semibold text-sm transition-colors cursor-pointer"
              >
                View Publications & Reports
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="px-6 py-3 rounded-xl border border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Contact Liaison Office
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
