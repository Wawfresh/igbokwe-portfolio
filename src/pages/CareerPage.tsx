import { Landmark, Calendar, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';

export default function CareerPage() {
  const { career } = useApp();

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Parliamentary Record"
          title="Political & Legislative Career"
          subtitle="A chronological record of democratic service in the National Assembly of Nigeria and the Imo State Legislature."
        />

        {/* Public Record Attestation Notice */}
        <div className="mb-12 p-4 rounded-xl bg-emerald-50/70 border border-emerald-900/10 text-xs sm:text-sm text-[#063B27] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0B5D3B] shrink-0" />
          <p>
            <strong>Official Record Notice:</strong> All tenures, committee appointments, and parliamentary roles presented here are grounded in verifiable Nigerian public gazettes and National Assembly proceedings.
          </p>
        </div>

        {/* Career Timeline */}
        <div className="relative border-l-2 border-[#0B5D3B]/30 ml-4 sm:ml-8 space-y-12">
          {career.map((item, index) => (
            <div key={item.id} className="relative pl-6 sm:pl-10 group">
              {/* Timeline marker */}
              <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-white border-4 border-[#0B5D3B] flex items-center justify-center shadow">
                <span className="w-2 h-2 rounded-full bg-[#C8A951]"></span>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:border-[#0B5D3B]/40 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-emerald-100/70 text-[#063B27] text-xs font-bold uppercase tracking-wider">
                      {item.year}
                    </span>
                    <span className="text-xs text-[#66736B]">Legislative Phase #{career.length - index}</span>
                  </div>

                  {item.sourceLink && (
                    <a
                      href={item.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B5D3B] hover:underline"
                    >
                      <span>Public Gazette / NASS Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <h3 className="text-2xl font-serif-title font-bold text-[#17211C] mb-1">
                  {item.title}
                </h3>
                <p className="text-sm font-semibold text-[#0B5D3B] mb-4">
                  {item.institution}
                </p>

                <p className="text-base text-[#66736B] leading-relaxed mb-6">
                  {item.description}
                </p>

                {item.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden max-h-64 max-w-lg shadow-sm border border-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
