import { metadata as privacyMetadata } from './metadata';

export const metadata = privacyMetadata;

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}