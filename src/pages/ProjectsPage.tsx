import { FolderKanban } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';
import ProjectCard from '../components/ProjectCard';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
  titleOverride?: string;
  badgeOverride?: string;
}

export default function ProjectsPage({
  onNavigate,
  titleOverride,
  badgeOverride,
}: ProjectsPageProps) {
  const { projects } = useApp();

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={badgeOverride || 'Track Record of Delivery'}
          title={titleOverride || 'Works & Community Projects'}
          subtitle="Documented constituency interventions in rural electrification, educational support, healthcare rehabilitation, and youth empowerment."
        />

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#17211C] mb-1">
              No matching records found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={(slug) => onNavigate(`/projects/${slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
