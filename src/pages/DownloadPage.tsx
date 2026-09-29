import { useState } from 'react';
import { Download, CheckCircle2, ShieldCheck, FileCode, FolderArchive, ArrowRight, Sparkles } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

export default function DownloadPage() {
  const [downloading, setDownloading] = useState<'source' | 'full' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = async (type: 'source' | 'full', filename: string, url: string) => {
    setDownloading(type);
    setDownloadSuccess(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      setDownloadSuccess(filename);
    } catch (err: any) {
      // Fallback: Direct window location
      window.location.href = url;
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Deployment Center"
          title="Download Project Code & Assets"
          subtitle="One-click direct downloads for updating your GitHub repository and deploying live to Netlify."
        />

        {downloadSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0B5D3B] shrink-0" />
            <p>
              <strong>Download Complete!</strong> Successfully saved <code>{downloadSuccess}</code> to your computer.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Lightweight Source Code ZIP */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#0B5D3B] shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
                <FileCode className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0B5D3B] text-[11px] font-bold">
                Recommended • Fast (627 KB)
              </div>
              <h3 className="text-xl font-serif-title font-bold text-[#17211C]">
                Source Code & Update Package
              </h3>
              <p className="text-sm text-[#66736B] leading-relaxed">
                Contains all updated code files, trimmed 4-slide hero carousel, cleaned gallery without category filters, Career timeline manager, and synchronized data.
              </p>
            </div>

            <button
              onClick={() => handleDownload('source', 'hon-igbokwe-source-update.zip', '/source-code.zip')}
              disabled={downloading === 'source'}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {downloading === 'source' ? (
                <span>Downloading (627 KB)...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Source ZIP (627 KB)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Full Production Archive (with all raw photos) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                Full Bundle (~39 MB)
              </div>
              <h3 className="text-xl font-serif-title font-bold text-[#17211C]">
                Complete Bundle with Photos
              </h3>
              <p className="text-sm text-[#66736B] leading-relaxed">
                Contains the entire project archive including all 57 raw camera photographs in <code>public/uploads/</code>.
              </p>
            </div>

            <button
              onClick={() => handleDownload('full', 'hon-igbokwe-full-project.zip', '/api/download-zip')}
              disabled={downloading === 'full'}
              className="w-full py-3.5 px-4 rounded-xl bg-gray-800 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {downloading === 'full' ? (
                <span>Downloading (38 MB)...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Full Bundle (38 MB)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-[#F6F9F7] rounded-2xl p-6 border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 text-[#063B27] font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#0B5D3B]" />
            <span>3-Step Deployment Guide for GitHub & Netlify:</span>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#17211C] leading-relaxed">
            <li>Extract the downloaded <code>.zip</code> file into your project folder.</li>
            <li>In your terminal / VS Code, commit and push to GitHub:
              <pre className="mt-1.5 p-3 rounded-lg bg-gray-900 text-emerald-400 font-mono text-xs overflow-x-auto">
git add .
git commit -m "Update site layout and images"
git push origin main
              </pre>
            </li>
            <li>Netlify will automatically build and deploy the changes to your live domain!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
