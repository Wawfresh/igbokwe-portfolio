import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-[#0B5D3B] text-white border-[#063B27]',
    error: 'bg-red-800 text-white border-red-900',
    info: 'bg-[#17211C] text-white border-neutral-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#C8A951] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#C8A951] shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl border ${bgColors[toast.type]}`}
      >
        {icons[toast.type]}
        <div className="text-sm font-medium leading-snug flex-1">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
