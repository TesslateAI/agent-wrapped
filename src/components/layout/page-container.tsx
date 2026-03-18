import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16",
        className
      )}
    >
      {children}
    </section>
  );
}
