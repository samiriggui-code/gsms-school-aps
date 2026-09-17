import { cn } from "@/lib/utils";

export function CustomBadge({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("py-1 text-primary font-semibold border-b-2 border-primary mb-1.5", className)}>
			{children}
		</div>
	);
}