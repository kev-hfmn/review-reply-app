import { metadata as helpMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = helpMetadata;

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}