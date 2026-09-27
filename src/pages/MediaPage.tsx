import { useState, useMemo } from 'react';
import { Newspaper, ArrowRight, Calendar, User, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';
import { formatCustomDate } from '../utils/api';

interface MediaPageProps {
  onNavigate: (path: string) => void;
}

export default function MediaPage({ onNavigate }: MediaPageProps) {
  const { articles } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['All', ...Array.from(set)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') return articles;
    return articles.filter(
      (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [articles, selectedCategory]);

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Press & Commentary"
          title="News, Articles & Media Releases"
          subtitle="Reflections on representative democracy, national public finance, rural development policy, and official press releases."
        />

        {/* Filter categories */}
        {categories.length > 2 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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
        )}

        {/* Articles List */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#17211C] mb-1">
              No articles published yet
            </p>
            <p className="text-sm text-[#66736B]">
              New statements and media articles will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => onNavigate(`/media/${article.slug}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {article.featured && (
                      <div className="absolute top-3 left-3 bg-[#0B5D3B] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        Featured Release
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0B5D3B] uppercase tracking-wider mb-2">
                      <span>{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.source}</span>
                    </div>

                    <h3 className="text-xl font-serif-title font-bold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors line-clamp-2 mb-3">
                      {article.title}
                    </h3>

                    <p className="text-sm text-[#66736B] line-clamp-3 leading-relaxed mb-4">
                      {article.summary}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#66736B]">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <Calendar className="w-3.5 h-3.5 text-[#C8A951] shrink-0" />
                    <span>{formatCustomDate(article.publishedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[#0B5D3B] font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
