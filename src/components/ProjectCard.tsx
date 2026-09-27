import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onSelect: (slug: string) => void;
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <div
      onClick={() => onSelect(project.slug)}
      className="bg-white rounded-2xl overflow-hidden border border-emerald-950/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={project.coverImage}
          alt={project.title}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {project.featured && (
          <div className="absolute top-3 left-3 bg-[#0B5D3B] text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded shadow">
            Featured Record
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-pill metadata line with typographic separator */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B5D3B] uppercase tracking-wider mb-2">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.status}</span>
          </div>

          <h3 className="text-xl font-serif-title font-bold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors line-clamp-2 mb-3">
            {project.title}
          </h3>

          <p className="text-sm text-[#66736B] line-clamp-3 leading-relaxed mb-4">
            {project.description}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-[#66736B]">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <MapPin className="w-3.5 h-3.5 text-[#C8A951] shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>

          <div className="flex items-center gap-1 text-[#0B5D3B] font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
