import { metadata as profileMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = profileMetadata;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}