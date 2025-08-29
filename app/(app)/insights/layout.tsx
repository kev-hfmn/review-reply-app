import { metadata as insightsMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = insightsMetadata;

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}