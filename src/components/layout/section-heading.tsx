import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  text: string;
  gradient?: string;
  className?: string;
}

export function SectionHeading({
  text,
  gradient = "from-purple-400 to-pink-500",
  className,
}: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-6xl",
        gradient,
        className
      )}
    >
      {text}
    </h2>
  );
}
