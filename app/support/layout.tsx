import { Metadata } from 'next';
import { PublicNavigation } from '@/components/PublicNavigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    template: '%s - RepliFast Support',
    default: 'Support & Documentation - RepliFast Help Center'
  }
};

const navigationSections = [
  { id: 'home', title: 'Home' },
  { id: 'features', title: 'Features' },
  { id: 'pricing', title: 'Pricing' },
  { id: 'blog', title: 'Blog' },
  { id: 'contact', title: 'Contact' }
];

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavigation
        navigationSections={navigationSections}
        showScrollLinks={false}
      />
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
