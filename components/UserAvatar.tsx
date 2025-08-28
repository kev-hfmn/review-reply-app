'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/Avatar';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className }: UserAvatarProps) {
  const { user, userAvatarUrl } = useAuth();

  if (!user) {
    return null;
  }

  // Generate fallback initials from user's name or email
  const generateInitials = () => {
    const fullName = user.user_metadata?.full_name;
    if (fullName) {
      // Extract initials from full name (e.g., "John Doe" -> "JD")
      const names = fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    
    // Fallback to first letter of email
    return user.email?.[0].toUpperCase() || '?';
  };

  const displayName = user.user_metadata?.full_name || user.email || 'User';
  
  return (
    <div className="relative">
      {userAvatarUrl ? (
        <Avatar
          src={userAvatarUrl}
          alt={`${displayName}'s avatar`}
          size={size}
          className={className}
        />
      ) : (
        // Fallback to initials when no avatar URL
        <div className={`
          ${size === 'sm' ? 'h-6 w-6 text-xs' : 
            size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'}
          bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium
          ${className || ''}
        `}>
          {generateInitials()}
        </div>
      )}
    </div>
  );
}