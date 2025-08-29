import { metadata as cookiesMetadata } from './metadata';

export const metadata = cookiesMetadata;

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}