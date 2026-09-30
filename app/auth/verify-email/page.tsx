import Navbar from '@/components/Navbar';
import VerifyEmailForm from '@/components/VerifyEmailForm';

export default function VerifyEmailPage({ searchParams }: { searchParams: { email?: string; verified?: string } }) {
  return <main className="min-h-screen bg-[#FAFAFA]"><Navbar /><div className="flex justify-center px-4 py-16"><VerifyEmailForm email={searchParams.email ?? ''} verified={searchParams.verified} /></div></main>;
}