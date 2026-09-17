import { cn } from "@/lib/utils";

/** Mot/segment mis en avant dans le style Hero (serif italique, accent primary). */
export function CustomTitleAccent({ children }: { children: React.ReactNode }) {
	return <span className="font-landing-serif italic font-normal text-primary">{children}</span>;
}

export function CustomTitle({
	children,
	accent,
	className,
}: {
	children?: React.ReactNode;
	/** Segment final affiché dans le style Hero (serif italique, accent primary). */
	accent?: React.ReactNode;
	className?: string;
}) {
	return (
		<h2 className={cn("leading-6 text-3xl md:text-5xl font-bold tracking-tight text-foreground", className)}>
			{children}
			{children && accent ? ' ' : null}
			{accent ? <CustomTitleAccent>{accent}</CustomTitleAccent> : null}
		</h2>
	);
}
