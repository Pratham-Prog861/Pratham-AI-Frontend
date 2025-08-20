import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';
import { useEffect, useState } from 'react';

interface UserAvatarProps {
  username: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ username, size = 40, className = '' }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState('');
  const displayName = username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const generateAvatar = async () => {
      try {
        // Create avatar with initials
        const avatar = createAvatar(initials, {
          seed: displayName,
          size: size,
          radius: 50,
          scale: 100,
          translateY: 3,
          backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
          textColor: ['black'],
          fontFamily: ['Arial', 'sans-serif'],
          fontSize: size * 1.3,
          fontWeight: 600,
        });

        // Convert to data URL
        const dataUrl = avatar.toDataUri();
        setAvatarUrl(dataUrl);
      } catch (error) {
        console.error('Error generating avatar:', error);
        setAvatarUrl('');
      }
    };

    generateAvatar();
  }, [displayName, size]);

  // Fallback to a simple colored div with initial if avatar fails to load
  if (!avatarUrl) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center bg-blue-500 text-white ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${Math.max(12, size / 2)}px`,
          fontWeight: 'bold'
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <div 
      className={`rounded-full overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
    >
      <img 
        src={avatarUrl}
        alt={displayName}
        className="w-full h-full object-cover"
        onError={() => setAvatarUrl('')} // Fallback to initial if image fails to load
      />
    </div>
  );
}