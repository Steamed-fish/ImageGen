import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <span className="relative block">
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-line bg-white px-3 pr-10 text-sm font-medium text-ink shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
    />
  </span>
));

Select.displayName = "Select";
