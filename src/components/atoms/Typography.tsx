import { cn } from '../ui/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

export function AdvisoryHeadline({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-[24px] font-semibold leading-tight", className)}>
      {children}
    </h2>
  );
}

export function AdvisorySubheading({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("text-[18px] font-medium leading-relaxed", className)}>
      {children}
    </h3>
  );
}

export function AdvisoryBody({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-[16px] leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function AdvisoryCaption({ children, className }: TypographyProps) {
  return (
    <span className={cn("text-[12px] text-muted-foreground", className)}>
      {children}
    </span>
  );
}