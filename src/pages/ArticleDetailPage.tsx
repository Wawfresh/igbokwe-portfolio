import { ArrowLeft, Calendar, User, Tag, Share2, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCustomDate } from '../utils/api';

interface ArticleDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export default function ArticleDetailPage({ slug, onNavigate }: ArticleDetailPageProps) {
  const { articles, showToast } = useApp();
  const article = articles.find((a) => a.slug === slug || a.id === slug);

  if (!article) {
    return (
      <div className="py-24 text-center max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-serif-title font-bold text-[#063B27] mb-2">
          Article Not Found
        </h2>
        <p className="text-sm text-[#66736B] mb-6">
          The requested media article could not be found or has not been published yet.
        </p>
        <button
          onClick={() => onNavigate('/media')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B5D3B] text-white text-sm font-semibold hover:bg-[#063B27] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Media Articles</span>
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article link copied to clipboard.');
    }
  };

  return (
    <div className="py-12 sm:py-16 space-y-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => onNavigate('/media')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B5D3B] hover:text-[#063B27] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Media</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-[#17211C] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Article</span>
          </button>
        </div>

        {/* Title Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B5D3B] uppercase tracking-wider">
            <span>{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>{article.source}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-title font-bold text-[#063B27] tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-lg text-[#66736B] leading-relaxed italic border-l-2 border-[#C8A951] pl-4">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-3 text-xs sm:text-sm text-[#66736B] border-t border-b border-gray-100 py-3">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#C8A951]" />
              <span className="font-medium text-[#17211C]">{article.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#C8A951]" />
              <span>Published: {formatCustomDate(article.publishedAt)}</span>
            </div>
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#0B5D3B] font-semibold hover:underline"
              >
                <span>Original Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Cover Image */}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-lg bg-gray-100 mb-10">
          <img
            src={article.coverImage}
            alt={article.title}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80';
            }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm">
          <div className="prose-editorial whitespace-pre-line text-[#17211C]">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}
