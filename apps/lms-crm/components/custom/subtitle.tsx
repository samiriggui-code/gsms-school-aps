import { cn } from "@/lib/utils";

export function CustomSubtitle({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<p className={cn("text-base md:text-lg font-medium text-muted-foreground max-w-2xl mx-auto", className)}>
			{children}
		</p>
	);
}