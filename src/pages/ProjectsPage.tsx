import { useState, useMemo } from 'react';
import { Search, Filter, FolderKanban } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';
import ProjectCard from '../components/ProjectCard';

interface ProjectsPageProps {
  onNavigate: (path: string) => void;
  titleOverride?: string;
  badgeOverride?: string;
}

const CATEGORIES = [
  'All',
  'Infrastructure',
  'Education',
  'Health',
  'Youth Development',
  'Community Development',
  'Legislative Work',
  'Empowerment',
  'Social Development',
];

export default function ProjectsPage({
  onNavigate,
  titleOverride,
  badgeOverride,
}: ProjectsPageProps) {
  const { projects } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchesCategory =
        selectedCategory === 'All' || proj.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        proj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchTerm]);

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={badgeOverride || 'Track Record of Delivery'}
          title={titleOverride || 'Works & Community Projects'}
          subtitle="Documented constituency interventions in rural electrification, educational support, healthcare rehabilitation, and youth empowerment."
        />

        {/* Filter and Search Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-4 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search works by title, community, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] placeholder:text-gray-400 focus:outline-none focus:border-[#0B5D3B]"
              />
            </div>

            {/* Total count */}
            <div className="text-xs text-[#66736B] font-medium">
              Showing {filteredProjects.length} of {projects.length} recorded items
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#17211C] mb-1">
              No matching records found
            </p>
            <p className="text-sm text-[#66736B]">
              Try adjusting your category selection or clear your search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
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
