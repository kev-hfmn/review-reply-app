import { PublicNavigation } from '@/components/PublicNavigation';
import { Footer } from '@/components/Footer';
import { publicNavigationSections } from '@/config/navigation';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavigation navigationSections={publicNavigationSections} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
