import { ArrowLeft, MapPin, Calendar, Tag, ShieldCheck, FileText, ExternalLink, Share2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenLightbox: (item: any) => void;
}

export default function ProjectDetailPage({
  slug,
  onNavigate,
  onOpenLightbox,
}: ProjectDetailPageProps) {
  const { projects, showToast } = useApp();
  const project = projects.find((p) => p.slug === slug || p.id === slug);

  if (!project) {
    return (
      <div className="py-24 text-center max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-serif-title font-bold text-[#063B27] mb-2">
          Project Record Not Found
        </h2>
        <p className="text-sm text-[#66736B] mb-6">
          The requested public service record could not be found or may have been relocated.
        </p>
        <button
          onClick={() => onNavigate('/projects')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B5D3B] text-white text-sm font-semibold hover:bg-[#063B27] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Projects List</span>
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Project link copied to clipboard.');
    }
  };

  const allImages = [
    project.coverImage,
    ...(project.additionalImages || []),
  ].filter(Boolean);

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => onNavigate('/projects')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5D3B] hover:text-[#063B27] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Works & Projects</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#17211C] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Record</span>
          </button>
        </div>

        {/* Header Title & Metadata */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B5D3B] uppercase tracking-wider">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>Status: {project.status}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-title font-bold text-[#063B27] tracking-tight leading-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-[#66736B] border-t border-b border-gray-100 py-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C8A951]" />
              <span className="font-medium text-[#17211C]">{project.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#C8A951]" />
              <span>Execution / Tenure: {project.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#0B5D3B] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Public Service Record</span>
            </div>
          </div>
        </div>

        {/* Hero Cover Image */}
        <div
          onClick={() =>
            onOpenLightbox({
              url: project.coverImage,
              title: project.title,
              category: project.category,
              location: project.location,
              date: project.date,
              description: project.description,
            })
          }
          className="aspect-[16/9] rounded-2xl overflow-hidden shadow-lg bg-gray-100 mb-10 cursor-pointer group relative"
        >
          <img
            src={project.coverImage}
            alt={project.title}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold">
            Click to view in fullscreen
          </div>
        </div>

        {/* Main Content & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Description */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-xl font-serif-title font-bold text-[#063B27]">
                Project Scope & Overview
              </h2>
              <div className="prose-editorial whitespace-pre-line text-[#17211C]">
                {project.description}
              </div>
            </div>

            {/* Public Service Context */}
            {project.publicServiceContext && (
              <div className="bg-[#F6F9F7] rounded-2xl p-6 border border-emerald-900/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0B5D3B] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#C8A951]" />
                  <span>Public-Service Context & Attribution</span>
                </div>
                <p className="text-sm text-[#17211C] leading-relaxed">
                  {project.publicServiceContext}
                </p>
              </div>
            )}

            {/* Photo Gallery Grid with Lightbox */}
            {allImages.length > 1 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-serif-title font-bold text-[#063B27]">
                  Archival Project Photographs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        onOpenLightbox({
                          url: imgUrl,
                          title: `${project.title} (Photo #${idx + 1})`,
                          category: project.category,
                          location: project.location,
                          date: project.date,
                        })
                      }
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                    >
                      <img
                        src={imgUrl}
                        alt={`${project.title} photo ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Documents & Metadata */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-[#17211C] uppercase tracking-wider">
                Record Specifications
              </h3>

              <div className="space-y-3 text-xs text-[#66736B]">
                <div>
                  <span className="font-semibold text-[#17211C] block">Category:</span>
                  <span>{project.category}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#17211C] block">Target Community:</span>
                  <span>{project.location}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#17211C] block">Execution Era:</span>
                  <span>{project.date}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#17211C] block">Current Status:</span>
                  <span className="text-[#0B5D3B] font-semibold">{project.status}</span>
                </div>
              </div>

              {/* Related Documents */}
              {project.documents && project.documents.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <span className="font-semibold text-xs text-[#17211C] block">
                    Associated Documents:
                  </span>
                  {project.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-emerald-50 text-xs text-[#0B5D3B] font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Source Link */}
              {project.sourceUrl && (
                <div className="pt-4 border-t border-gray-100">
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B5D3B] hover:underline"
                  >
                    <span>External Legislative Registry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
