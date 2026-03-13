import React from 'react';

interface SafeIconProps extends React.ComponentProps<'svg'> {
  icon?: React.ElementType;
  fallbackSrc: string;
  alt?: string;
}

/**
 * SafeIcon renders a primary React Icon component (e.g. from lucide-react).
 * If the icon component is not provided or fails to render (conceptually), 
 * it falls back to an image source.
 * 
 * Note: Since Lucide icons are bundled components, they don't typically "fail" like network images.
 * This component is structured to support the user's request for a "backup" mechanism,
 * allowing the codebase to easily switch between component-based icons and asset-based icons.
 */
const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, fallbackSrc, alt = "icon", className, ...props }) => {
  if (Icon) {
    return <Icon className={className} {...props} />;
  }

  return (
    <img
      src={fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

export default SafeIcon;
