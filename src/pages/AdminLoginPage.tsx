import { useState, FormEvent } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Loader2, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export default function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { setCurrentUser, setToken, showToast } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forced password change modal state
  const [showForceChangeModal, setShowForceChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [activeUserToken, setActiveUserToken] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const text = await res.text();
        throw new Error(text.includes('<!doctype') || text.includes('<html') ? 'Server error or Vite dev server restarting. Please try again in a moment.' : text);
      }

      if (!res.ok || !data) {
        throw new Error(data?.error || `Login failed (Status ${res.status}).`);
      }

      setToken(data.token);
      setCurrentUser(data.user);

      if (data.user.mustChangePassword) {
        setActiveUserToken(data.token);
        setShowForceChangeModal(true);
        showToast('First login detected: Please update your initial password for security.', 'info');
      } else {
        showToast('Signed in successfully.');
        onNavigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeUserToken}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      showToast('Password updated securely. Welcome to the portal.');
      setShowForceChangeModal(false);
      onNavigate('/admin');
    } catch (err: any) {
      setChangeError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#063B27] text-[#C8A951] mx-auto flex items-center justify-center shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif-title font-bold text-[#063B27] tracking-tight">
            HON. NNANNA IGBOKWE
          </h2>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#0B5D3B]">
            Administration Portal
          </p>
          <p className="text-xs text-[#66736B] pt-1">
            Restricted access for website content management & archives.
          </p>
        </div>

        {/* Development credential reminder note */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-900/10 text-xs text-[#063B27] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#0B5D3B]" />
            Development Access Credentials:
          </p>
          <p className="text-emerald-950 font-mono text-[11px]">
            Username: <span className="font-bold">Osama</span> · Password:{' '}
            <span className="font-bold">Osama123</span>
          </p>
          <p className="text-[10px] text-emerald-800 italic">
            *Encrypted via bcrypt. You will be prompted to update upon first entry.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-[#17211C] focus:outline-none focus:border-[#0B5D3B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-[#66736B] hover:text-[#0B5D3B] underline cursor-pointer"
          >
            Return to Public Website
          </button>
        </div>
      </div>

      {/* Force Change Initial Password Modal */}
      {showForceChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-4 mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-center text-[#17211C] mb-2">
              Update Initial Password
            </h3>
            <p className="text-xs text-center text-[#66736B] mb-6 leading-relaxed">
              For security compliance, initial development passwords must be changed before accessing the public servant administration portal.
            </p>

            {changeError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForceChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1">
                  New Password (min 8 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Set New Password & Enter</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
