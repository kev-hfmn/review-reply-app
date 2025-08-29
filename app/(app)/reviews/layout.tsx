import { metadata as reviewsMetadata } from './metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = reviewsMetadata;

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}