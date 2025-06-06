import React from 'react';

// Utility functions embedded directly in the Badge component file
// This is a simplified version of clsx/classnames utility
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Simple tailwind class merge function
function twMerge(...classLists) {
  // This is a simplified version that doesn't handle all Tailwind conflicts
  // In a real implementation, you would use the actual tailwind-merge package
  const classObj = {};
  
  const allClasses = classLists.join(' ').split(' ').filter(Boolean);
  
  // Process classes from right to left for proper overriding
  for (let i = allClasses.length - 1; i >= 0; i--) {
    const cls = allClasses[i];
    
    // Extract prefix (e.g., "bg-" from "bg-blue-500")
    const prefix = cls.match(/^([a-z]+(-[a-z]+)*)-/);
    
    if (prefix) {
      const key = prefix[0];
      if (!classObj[key]) {
        classObj[key] = cls;
      }
    } else {
      classObj[cls] = cls;
    }
  }
  
  return Object.values(classObj).join(' ');
}

// Combined cn utility function
function cn(...inputs) {
  return twMerge(classNames(...inputs));
}

// Simplified cva implementation
function cva(base, config) {
  return function({ variant, size, className } = {}) {
    const variants = config.variants || {};
    const defaultVariants = config.defaultVariants || {};
    
    const variantClasses = [];
    variantClasses.push(base);
    
    // Apply variant classes
    if (variants.variant) {
      const selectedVariant = variant || defaultVariants.variant;
      if (selectedVariant && variants.variant[selectedVariant]) {
        variantClasses.push(variants.variant[selectedVariant]);
      }
    }
    
    // Apply size classes
    if (variants.size) {
      const selectedSize = size || defaultVariants.size;
      if (selectedSize && variants.size[selectedSize]) {
        variantClasses.push(variants.size[selectedSize]);
      }
    }
    
    return classNames(base, ...variantClasses, className);
  };
}

// Define badge variants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-800 text-white hover:bg-gray-700",
        secondary: "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-gray-800 border-gray-300",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600"
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Badge({ className, variant, size, children, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };