import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';

interface GalleryPageProps {
  onOpenLightbox: (item: any) => void;
}

export default function GalleryPage({ onOpenLightbox }: GalleryPageProps) {
  const { gallery } = useApp();

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Visual Archive"
          title="Photo Gallery & Visual Records"
          subtitle="Documenting grassroots engagements, community development milestones, and parliamentary events across Imo State and Nigeria."
        />

        {/* Gallery Grid */}
        {gallery.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#17211C] mb-1">
              No images in gallery yet
            </p>
            <p className="text-sm text-[#66736B]">
              New archival photographs can be added by the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((img) => (
              <div
                key={img.id}
                onClick={() =>
                  onOpenLightbox({
                    url: img.imageUrl,
                    title: img.title,
                    description: img.description,
                    category: img.category,
                    location: img.location,
                    date: img.date,
                  })
                }
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-[#063B27]/85 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                    {img.category}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-serif-title font-bold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors line-clamp-1 mb-1.5">
                      {img.title}
                    </h3>
                    {img.description && (
                      <p className="text-xs text-[#66736B] line-clamp-2 leading-relaxed mb-3">
                        {img.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#66736B]">
                    <span className="flex items-center gap-1 truncate mr-2">
                      <MapPin className="w-3 h-3 text-[#C8A951] shrink-0" />
                      <span className="truncate">{img.location}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-[#C8A951]" />
                      <span>{img.date}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
