import { useState, useEffect, useRef } from 'react';
import { Search, X, FolderKanban, FileText, BookOpen, Image as ImageIcon, ArrowRight, Loader2 } from 'lucide-react';
import { Project, Article, Publication, GalleryImage } from '../types';

interface SearchResult {
  projects: Project[];
  articles: Article[];
  publications: Publication[];
  gallery: GalleryImage[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export default function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    projects: [],
    articles: [],
    publications: [],
    gallery: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ projects: [], articles: [], publications: [], gallery: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], articles: [], publications: [], gallery: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.projects.length +
    results.articles.length +
    results.publications.length +
    results.gallery.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
          <Search className="w-5 h-5 text-[#0B5D3B] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, articles, legislative works, documents..."
            className="w-full bg-transparent text-[#17211C] placeholder:text-[#66736B] outline-none text-base"
          />
          {loading && <Loader2 className="w-5 h-5 text-[#0B5D3B] animate-spin shrink-0 mr-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-sm text-[#66736B]">
              Type a keyword such as <span className="font-semibold text-[#0B5D3B]">electrification</span>,{' '}
              <span className="font-semibold text-[#0B5D3B]">education</span>, or{' '}
              <span className="font-semibold text-[#0B5D3B]">legislative</span> to search.
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="text-center py-10">
              <p className="text-base font-semibold text-[#17211C] mb-1">No matching results found</p>
              <p className="text-sm text-[#66736B]">Try refining your search terms or browsing categories directly.</p>
            </div>
          ) : (
            <>
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B5D3B] uppercase tracking-wider mb-2.5">
                    <FolderKanban className="w-4 h-4" />
                    <span>Works & Projects ({results.projects.length})</span>
                  </div>
                  <div className="space-y-2">
                    {results.projects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => {
                          onNavigate(`/projects/${proj.slug}`);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F6F9F7] hover:bg-emerald-50 border border-gray-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors">
                            {proj.title}
                          </h4>
                          <p className="text-xs text-[#66736B] mt-0.5 line-clamp-1">
                            {proj.category} · {proj.location} · {proj.date}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#0B5D3B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              {results.articles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B5D3B] uppercase tracking-wider mb-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Articles & Media ({results.articles.length})</span>
                  </div>
                  <div className="space-y-2">
                    {results.articles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          onNavigate(`/media/${art.slug}`);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F6F9F7] hover:bg-emerald-50 border border-gray-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors">
                            {art.title}
                          </h4>
                          <p className="text-xs text-[#66736B] mt-0.5 line-clamp-1">
                            {art.category} · {art.author}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#0B5D3B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {results.publications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B5D3B] uppercase tracking-wider mb-2.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Publications & Statements ({results.publications.length})</span>
                  </div>
                  <div className="space-y-2">
                    {results.publications.map((pub) => (
                      <div
                        key={pub.id}
                        onClick={() => {
                          onNavigate('/publications');
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F6F9F7] hover:bg-emerald-50 border border-gray-100 cursor-pointer transition-all group"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-[#17211C] group-hover:text-[#0B5D3B] transition-colors">
                            {pub.title}
                          </h4>
                          <p className="text-xs text-[#66736B] mt-0.5 line-clamp-1">
                            {pub.category} · {pub.fileType || 'Document'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#0B5D3B] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {results.gallery.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B5D3B] uppercase tracking-wider mb-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Photo Gallery ({results.gallery.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {results.gallery.slice(0, 4).map((img) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          onNavigate('/gallery');
                          onClose();
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F6F9F7] hover:bg-emerald-50 border border-gray-100 cursor-pointer transition-all"
                      >
                        <img
                          src={img.imageUrl}
                          alt={img.title}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=200&q=80';
                          }}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-[#17211C] truncate">{img.title}</p>
                          <p className="text-[10px] text-[#66736B] truncate">{img.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-[#66736B]">
          <span>Press ESC to exit</span>
          <span>Official Public Service Archive</span>
        </div>
      </div>
    </div>
  );
}
