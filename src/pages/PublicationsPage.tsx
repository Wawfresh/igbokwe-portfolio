import { useState, useMemo } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  Calendar,
  FileText,
  Search,
  Edit3,
  Plus,
  X,
  FileCheck,
  Share2,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';
import { formatCustomDate, apiFetch } from '../utils/api';
import { Publication } from '../types';

interface PublicationsPageProps {
  onNavigate?: (path: string) => void;
}

export default function PublicationsPage({ onNavigate }: PublicationsPageProps) {
  const { publications, showToast, currentUser, refreshSiteData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewPub, setPreviewPub] = useState<Publication | null>(null);
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    publications.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [publications]);

  // Filtered publications
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      const matchesCategory =
        selectedCategory === 'All' || pub.category === selectedCategory;
      const matchesSearch =
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [publications, selectedCategory, searchQuery]);

  const handleDownload = (fileUrl: string, title: string) => {
    if (!fileUrl || fileUrl === '#') {
      showToast('Document file is archived. Contact parliamentary liaison office for verified docket.', 'info');
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading: ${title}`);
  };

  const handleView = (fileUrl: string, title: string) => {
    if (!fileUrl || fileUrl === '#') {
      const found = publications.find((p) => p.title === title);
      if (found) setPreviewPub(found);
      return;
    }
    window.open(fileUrl, '_blank');
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPub) return;
    if (!editingPub.title?.trim()) {
      showToast('Publication title is required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch(`/api/admin/publications/${editingPub.id}`, {
        method: 'PUT',
        body: editingPub,
      });
      showToast('Publication updated successfully.');
      setEditingPub(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update publication', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = (pub: Publication) => {
    if (navigator.share) {
      navigator.share({
        title: pub.title,
        text: pub.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('Publication page link copied to clipboard.');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="py-12 sm:py-16 space-y-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Policy & Parliamentary Archive"
          title="Publications & Official Document Reports"
          subtitle="Official legislative scorecards, rural development impact assessments, policy blueprints, and public stewardship briefs."
        />

        {/* Toolbar: Search, Category Filters, and Admin Upload Button */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports, gazettes, blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]/20 focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Admin Upload Trigger */}
          {currentUser && (
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('/admin');
                } else {
                  window.location.href = '/admin';
                }
              }}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D3B] border border-[#0B5D3B]/20 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
              title="Manage and upload publications in the Admin CMS"
            >
              <Plus className="w-4 h-4" />
              <span>Admin: Upload / Manage</span>
            </button>
          )}
        </div>

        {/* Publications Grid */}
        {filteredPublications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-serif-title font-bold text-[#17211C] mb-1">
              {searchQuery || selectedCategory !== 'All'
                ? 'No matching publications found'
                : 'No publications recorded yet'}
            </p>
            <p className="text-sm text-[#66736B] max-w-md mx-auto mb-4">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try revising your keywords or switching category filters to view other parliamentary reports.'
                : 'New documents and legislative briefs will be uploaded to the official repository.'}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPublications.map((pub) => (
              <div
                key={pub.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail / Header */}
                  <div
                    onClick={() => setPreviewPub(pub)}
                    className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-950 to-gray-900 cursor-pointer"
                  >
                    {pub.coverImage ? (
                      <img
                        src={pub.coverImage}
                        alt={pub.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-6 text-center">
                        <FileText className="w-12 h-12 text-[#C8A951] mb-2" />
                        <span className="text-xs font-semibold uppercase tracking-wider">{pub.category}</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-[#063B27]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {pub.category}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-[#063B27] text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">
                      {pub.fileType || 'PDF Document'}
                    </div>

                    {/* Admin Edit overlay indicator badge */}
                    {currentUser && (
                      <div className="absolute top-3 right-3 bg-[#0B5D3B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        <span>Editable</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3
                      onClick={() => setPreviewPub(pub)}
                      className="text-lg font-serif-title font-bold text-[#17211C] mb-2.5 leading-snug line-clamp-2 hover:text-[#0B5D3B] cursor-pointer transition-colors"
                    >
                      {pub.title}
                    </h3>

                    <p className="text-xs text-[#66736B] leading-relaxed line-clamp-3 mb-4">
                      {pub.description}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#66736B] pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C8A951]" />
                      <span>{formatCustomDate(pub.publishedAt)}</span>
                    </span>
                    <span className="font-semibold text-[#063B27]">{pub.fileSize || 'Official PDF'}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setPreviewPub(pub)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#17211C] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0B5D3B]" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleDownload(pub.fileUrl, pub.title)}
                      className="px-3 py-2 rounded-xl bg-[#0B5D3B] text-white hover:bg-[#063B27] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C8A951]" />
                      <span>Download</span>
                    </button>
                  </div>

                  {/* If authenticated admin: Direct Edit button */}
                  {currentUser && (
                    <button
                      onClick={() => setEditingPub(pub)}
                      className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D3B] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#0B5D3B]/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit This Publication</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: DOCUMENT PREVIEW & OVERVIEW */}
      {/* ==================================================== */}
      {previewPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#0B5D3B] uppercase tracking-wider">
                  {previewPub.category}
                </span>
                <h2 className="text-2xl font-serif-title font-bold text-[#17211C] mt-1 leading-snug">
                  {previewPub.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewPub(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewPub.coverImage && (
              <div className="rounded-xl overflow-hidden aspect-[16/9] bg-gray-100">
                <img
                  src={previewPub.coverImage}
                  alt={previewPub.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl text-center text-xs">
              <div>
                <p className="text-gray-500 font-medium">Format</p>
                <p className="font-bold text-[#17211C] mt-0.5">{previewPub.fileType || 'PDF Document'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">File Size</p>
                <p className="font-bold text-[#17211C] mt-0.5">{previewPub.fileSize || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Published Date</p>
                <p className="font-bold text-[#17211C] mt-0.5">{formatCustomDate(previewPub.publishedAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Executive Overview & Content
              </h4>
              <p className="text-sm text-[#17211C] leading-relaxed whitespace-pre-line">
                {previewPub.description}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleShare(previewPub)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied' : 'Share Document'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentUser && (
                  <button
                    onClick={() => {
                      const pubToEdit = previewPub;
                      setPreviewPub(null);
                      setEditingPub(pubToEdit);
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D3B] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Document</span>
                  </button>
                )}

                {previewPub.fileUrl && previewPub.fileUrl !== '#' && (
                  <button
                    onClick={() => handleView(previewPub.fileUrl, previewPub.title)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-[#17211C] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-[#0B5D3B]" />
                    <span>Open in New Tab</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownload(previewPub.fileUrl, previewPub.title)}
                  className="px-5 py-2 bg-[#0B5D3B] hover:bg-[#063B27] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#C8A951]" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DIRECT QUICK EDIT (FOR LOGGED-IN ADMIN) */}
      {/* ==================================================== */}
      {editingPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                  Edit Publication Details
                </h3>
                <p className="text-xs text-[#66736B]">
                  Update title, category, file attachment, or executive summary.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPub(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  Publication Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingPub.title || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Category</label>
                  <select
                    value={editingPub.category || 'Legislative Report'}
                    onChange={(e) => setEditingPub({ ...editingPub, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  >
                    <option value="Legislative Report">Legislative Report</option>
                    <option value="Policy Brief">Policy Brief</option>
                    <option value="Development Assessment">Development Assessment</option>
                    <option value="Constituency Blueprint">Constituency Blueprint</option>
                    <option value="Parliamentary Gazette">Parliamentary Gazette</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Document Format</label>
                  <input
                    type="text"
                    value={editingPub.fileType || 'PDF Document'}
                    onChange={(e) => setEditingPub({ ...editingPub, fileType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  File Size / Extent
                </label>
                <input
                  type="text"
                  value={editingPub.fileSize || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, fileSize: e.target.value })}
                  placeholder="e.g. 4.2 MB or 28 Pages"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  Document File URL / Link
                </label>
                <input
                  type="text"
                  value={editingPub.fileUrl || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, fileUrl: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  Executive Summary / Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingPub.description || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm leading-relaxed focus:bg-white"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPub(null);
                    if (onNavigate) onNavigate('/admin');
                  }}
                  className="text-xs text-[#0B5D3B] hover:underline font-semibold"
                >
                  Open Full CMS Editor →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPub(null)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
