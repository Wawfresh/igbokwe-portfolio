import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, Globe, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SectionHeader from '../components/SectionHeader';

export default function ContactPage() {
  const { siteSettings, socialLinks, showToast } = useApp();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast('Please fill out the name, email, and message fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      showToast('Your message has been sent successfully.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Public Inquiries & Engagement"
          title="Constituency & Liaison Contact"
          subtitle="Reach the administrative office of Hon. Raphael Nnanna Igbokwe for official consultations, community development proposals, and public communications."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details & Office Locations */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                Official Liaison Offices
              </h3>

              <div className="space-y-5 text-sm text-[#17211C]">
                {/* Office 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#C8A951]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17211C]">Constituency & State Office</h4>
                    <p className="text-xs text-[#66736B] mt-0.5 leading-relaxed">
                      {siteSettings?.address || 'Ahiazu Mbaise / Owerri Liaison Complex, Imo State, Nigeria'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#C8A951]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17211C]">Official Email</h4>
                    <a
                      href={`mailto:${siteSettings?.email || 'contact@nnannaigbokwe.org'}`}
                      className="text-xs text-[#0B5D3B] font-semibold hover:underline block mt-0.5"
                    >
                      {siteSettings?.email || 'contact@nnannaigbokwe.org'}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#C8A951]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#17211C]">Phone Line</h4>
                    <p className="text-xs text-[#66736B] mt-0.5">
                      {siteSettings?.phone || '+234 803 000 1234'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#063B27] mb-3">
                  Verified Online Channels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-[#0B5D3B] hover:text-white text-xs font-medium text-[#17211C] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{link.platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-serif-title font-bold text-[#063B27] mb-2">
                Send an Official Message
              </h3>
              <p className="text-sm text-[#66736B] mb-8">
                Inquiries are reviewed by the office of Hon. Raphael Nnanna Igbokwe and routed appropriately.
              </p>

              {submitted ? (
                <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-900/10 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#0B5D3B] mx-auto" />
                  <h4 className="text-lg font-bold text-[#063B27]">Message Received</h4>
                  <p className="text-sm text-[#66736B] max-w-md mx-auto">
                    Thank you. Your message has been logged securely into the administrative registry. The office will respond promptly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#0B5D3B] text-white text-xs font-semibold hover:bg-[#063B27] transition-colors cursor-pointer"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Chief John Okafor"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. john@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="e.g. Community Electrification Inquiry"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Write your note or inquiry clearly here..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting Securely...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
