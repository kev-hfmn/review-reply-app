import { metadata as settingsMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = settingsMetadata;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}