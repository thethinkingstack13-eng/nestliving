import { redirect } from 'next/navigation';
import { User as UserIcon, Bell, ShieldAlert, KeyRound } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';
import LogoutButton from '@/components/LogoutButton';
import AccountSettingsForm from '@/components/AccountSettingsForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import NotificationsForm from '@/components/NotificationsForm';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      emailOnBookingRequests: true,
      emailOnRoommateMatches: true,
      emailOnProductAnnouncements: true,
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-10 lg:px-10">
        <h1 className="font-display text-3xl font-bold leading-tight">Settings</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Manage your account and preferences.
        </p>

        {/* Account information -- now editable */}
        <section className="mt-8 border border-black bg-white">
          <div className="flex items-center gap-2 border-b border-black p-5">
            <UserIcon size={16} strokeWidth={2} />
            <h2 className="font-display text-base font-bold">Account Information</h2>
          </div>
          <AccountSettingsForm
            initialName={user.name ?? ''}
            email={user.email}
            role={user.role}
          />
        </section>

        {/* Change password -- now editable */}
        <section className="mt-8 border border-black bg-white">
          <div className="flex items-center gap-2 border-b border-black p-5">
            <KeyRound size={16} strokeWidth={2} />
            <h2 className="font-display text-base font-bold">Change Password</h2>
          </div>
          <ChangePasswordForm />
        </section>

        {/* Notification preferences -- now real */}
        <section className="mt-8 border border-black bg-white">
          <div className="flex items-center gap-2 border-b border-black p-5">
            <Bell size={16} strokeWidth={2} />
            <h2 className="font-display text-base font-bold">Notifications</h2>
          </div>
          <NotificationsForm
            initialPreferences={{
              emailOnBookingRequests: user.emailOnBookingRequests,
              emailOnRoommateMatches: user.emailOnRoommateMatches,
              emailOnProductAnnouncements: user.emailOnProductAnnouncements,
            }}
          />
        </section>

        {/* Danger zone */}
        <section className="mt-8 border border-black bg-white">
          <div className="flex items-center gap-2 border-b border-black p-5">
            <ShieldAlert size={16} strokeWidth={2} />
            <h2 className="font-display text-base font-bold">Session</h2>
          </div>
          <div className="flex items-center justify-between p-5">
            <p className="text-sm text-neutral-600">Sign out of NestLiving on this device.</p>
            <LogoutButton />
          </div>
        </section>
      </div>
    </main>
  );
}
