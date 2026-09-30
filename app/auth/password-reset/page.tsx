import Navbar from '@/components/Navbar';
import PasswordResetForm from '@/components/PasswordResetForm';

export default function PasswordResetPage({ searchParams }: { searchParams: { token?: string } }) {
  return <main className="min-h-screen bg-[#FAFAFA]"><Navbar /><div className="flex justify-center px-4 py-16"><PasswordResetForm token={searchParams.token} /></div></main>;
}