import { metadata as dashboardMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = dashboardMetadata;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}