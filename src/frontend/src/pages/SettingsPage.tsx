import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_email: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [notifEmail, setNotifEmail] = useState(true);

  useEffect(() => {
    api.get<{ profile: Profile }>('/api/settings/profile')
      .then(res => {
        setProfile(res.profile);
        setDisplayName(res.profile.display_name ?? res.profile.name ?? '');
        setBio(res.profile.bio ?? '');
        setNotifEmail(res.profile.notification_email);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.put<{ profile: Profile }>('/api/settings/profile', {
        display_name: displayName,
        bio,
        notification_email: notifEmail,
      });
      setProfile(res.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/settings/account');
      logout();
    } catch {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? '?';

  if (loading) {
    return (
      <div className="px-6 py-[60px] max-w-[720px] mx-auto w-full">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-9 w-40 rounded bg-[#dbdbd2]" />
          <div className="h-[300px] rounded-[12px] bg-[#ffffff] border border-[#0000001f]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-[60px] max-w-[720px] mx-auto w-full">
      <h1
        className="text-[32px] font-medium text-[#292929] tracking-[-0.32px] mb-10"
        style={{ fontFamily: 'var(--font-switzer)' }}
      >
        Settings
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded-[12px] border border-[#e84040]/20 bg-[#e84040]/5">
          <p className="text-[14px] text-[#e84040]">{error}</p>
        </div>
      )}

      {/* Profile section */}
      <section
        className="rounded-[12px] border border-[#0000001f] p-[32px] mb-6"
        style={{ backgroundColor: 'var(--color-frosted-white)' }}
      >
        <h2 className="text-[19px] font-medium text-[#292929] mb-6" style={{ fontFamily: 'var(--font-switzer)' }}>
          Profile
        </h2>

        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-medium text-[#ffffff] shrink-0"
            style={{ backgroundColor: '#141414', borderRadius: 'var(--radius-avatars)' }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[16px] font-medium text-[#292929]">{profile?.name ?? profile?.email}</p>
            <p className="text-[14px] text-[#6f6f6e]">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Display name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="display_name" className="text-[14px] font-medium text-[#292929]">
              Display name
            </label>
            <input
              id="display_name"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={profile?.name ?? 'Your name'}
              maxLength={60}
              className="px-4 h-[44px] rounded-[8px] border border-[#0000001f] bg-[#edede8] text-[15px] text-[#292929] placeholder-[#8f8f8e] focus:outline-none focus:border-[#141414] transition-colors"
              style={{ fontFamily: 'var(--font-switzer)' }}
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-[14px] font-medium text-[#292929]">
              Bio <span className="text-[#8f8f8e] font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A sentence about how you think…"
              maxLength={200}
              rows={3}
              className="px-4 py-3 rounded-[8px] border border-[#0000001f] bg-[#edede8] text-[15px] text-[#292929] placeholder-[#8f8f8e] focus:outline-none focus:border-[#141414] transition-colors resize-none"
              style={{ fontFamily: 'var(--font-switzer)' }}
            />
            <p className="text-[12px] text-[#8f8f8e] text-right">{bio.length}/200</p>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between py-4 border-t border-[#0000001f]">
            <div>
              <p className="text-[14px] font-medium text-[#292929]">Email notifications</p>
              <p className="text-[13px] text-[#6f6f6e]">Receive product updates and important notices</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifEmail}
              onClick={() => setNotifEmail(v => !v)}
              className={`relative w-[44px] h-[24px] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2 ${
                notifEmail ? 'bg-[#141414]' : 'bg-[#c0c0c0]'
              }`}
            >
              <span
                className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm ${
                  notifEmail ? 'translate-x-[23px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </div>

          {/* Save */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#141414] text-[#ffffff] px-[24px] h-[44px] rounded-[200px] text-[15px] font-medium hover:bg-[#292929] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && (
              <span className="text-[14px] text-[#6f6f6e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#4cc02b]">check_circle</span>
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Danger zone */}
      <section
        className="rounded-[12px] border border-[#e84040]/20 p-[32px]"
        style={{ backgroundColor: 'var(--color-frosted-white)' }}
      >
        <h2 className="text-[19px] font-medium text-[#292929] mb-2" style={{ fontFamily: 'var(--font-switzer)' }}>
          Danger zone
        </h2>
        <p className="text-[14px] text-[#6f6f6e] mb-6">
          Permanently delete your account and all associated workspaces. This action is irreversible.
        </p>

        {confirmDelete ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-[14px] text-[#e84040]">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[#e84040] text-white px-[18px] h-[40px] rounded-[200px] text-[14px] font-medium hover:bg-[#c73030] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e84040]"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-[18px] h-[40px] rounded-[200px] text-[14px] text-[#353535] border border-[#0000001f] hover:bg-[#edede8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-[18px] h-[40px] rounded-[200px] text-[14px] text-[#e84040] border border-[#e84040]/30 hover:bg-[#e84040]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e84040]"
          >
            Delete account
          </button>
        )}
      </section>
    </div>
  );
}
