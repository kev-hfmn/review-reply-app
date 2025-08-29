import { metadata as payMetadata } from './metadata';

export const metadata = payMetadata;

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}