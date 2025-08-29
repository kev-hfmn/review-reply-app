import { metadata as loginMetadata } from './metadata';

export const metadata = loginMetadata;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}