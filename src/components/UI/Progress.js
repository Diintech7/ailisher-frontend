import * as React from "react";

const Progress = React.forwardRef(({ 
  className, 
  value = 0, 
  max = 100, 
  indicatorClassName,
  ...props 
}, ref) => {
  const percentage = value != null ? Math.min(Math.max(value, 0), max) : 0;
  
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={percentage}
      className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className={`h-full w-full flex-1 transition-all ${indicatorClassName || "bg-purple-600"}`}
        style={{ width: `${(percentage / max) * 100}%` }}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress };