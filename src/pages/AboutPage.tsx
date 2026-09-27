import { GraduationCap, Award, Landmark, MapPin, CheckCircle2, BookOpen, HeartHandshake } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';

export default function AboutPage() {
  const { biography, education, hero } = useApp();

  return (
    <div className="py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* Page Title Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Public Stewardship Biography"
          title={`About ${biography?.fullName || 'Hon. Raphael Nnanna Igbokwe'}`}
          subtitle="A comprehensive profile of legislative stewardship, administrative leadership, and community commitment in Imo State and Nigeria."
        />

        {/* Bio Overview Box */}
        <div className="bg-white rounded-2xl p-5 sm:p-10 border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-md bg-emerald-950">
              <img
                src={biography?.imageUrl || hero?.imageUrl || '/hon-igbokwe-constituency.jpg'}
                alt={biography?.fullName || 'Hon. Raphael Nnanna Igbokwe'}
                onError={(e) => {
                  e.currentTarget.src = '/hon-igbokwe-constituency.jpg';
                }}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Origin & Official Details */}
            <div className="bg-[#F6F9F7] rounded-xl p-5 border border-gray-100 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0B5D3B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#17211C] block">Place of Origin:</span>
                  <span className="text-[#66736B]">{biography?.placeOfOrigin || 'Information to be updated.'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Landmark className="w-4 h-4 text-[#0B5D3B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#17211C] block">Federal Constituency:</span>
                  <span className="text-[#66736B]">{biography?.constituency || 'Ahiazu Mbaise / Ezinihitte, Imo State'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#0B5D3B] uppercase tracking-wider">
                Executive Profile
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#063B27] mt-1 mb-4">
                {biography?.fullName || 'Hon. Raphael Nnanna Igbokwe'}
              </h3>
              <p className="text-base text-[#66736B] font-medium leading-relaxed mb-6">
                {biography?.shortBio || 'Distinguished Nigerian public administrator and former federal lawmaker.'}
              </p>
            </div>

            <div className="prose-editorial whitespace-pre-line text-[#17211C]">
              {biography?.fullBio || 'Information to be updated.'}
            </div>
          </div>
        </div>
      </div>

      {/* Core Dimensions of Service */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Dimensions of Leadership"
          title="Track Record & Public Experience"
          subtitle="Verified domains of parliamentary governance, institutional oversight, and constituency development."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legislative Experience */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
              Legislative Experience
            </h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              {biography?.legislativeExperience || 'Information to be updated.'}
            </p>
          </div>

          {/* Public Service Experience */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
              Public-Service Experience
            </h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              {biography?.publicServiceExperience || 'Information to be updated.'}
            </p>
          </div>

          {/* Professional Background */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
              Professional Background
            </h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              {biography?.professionalBackground || 'Information to be updated.'}
            </p>
          </div>

          {/* Community Involvement */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
              Community Involvement
            </h3>
            <p className="text-sm text-[#66736B] leading-relaxed">
              {biography?.communityInvolvement || 'Information to be updated.'}
            </p>
          </div>
        </div>
      </div>

      {/* 7. EDUCATION SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Academic Credentials"
          title="Educational Background"
          subtitle="Tertiary training, professional parliamentary governance workshops, and certifications."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {education.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#0B5D3B]/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#0B5D3B]">
                    {item.year}
                  </span>
                </div>

                <h3 className="text-lg font-serif-title font-bold text-[#17211C] mb-1">
                  {item.qualification}
                </h3>
                <p className="text-xs font-semibold text-[#063B27] mb-3">
                  {item.institution}
                </p>
                <p className="text-xs text-[#66736B] font-medium mb-3">
                  Field: {item.field}
                </p>
                <p className="text-sm text-[#66736B] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#0B5D3B] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Public Record</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
