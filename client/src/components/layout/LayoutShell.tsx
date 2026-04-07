'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && <Navbar />}
      <main className={isDashboard ? '' : 'page-wrapper'}>
        {children}
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <BottomNav />}
    </>
  );
}
