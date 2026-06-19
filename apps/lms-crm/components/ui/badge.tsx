import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        primary:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        info:
          "border-transparent bg-sky-600 text-white [a&]:hover:bg-sky-600/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-green-600 text-white [a&]:hover:bg-green-600/90",
        warning:
          "border-transparent bg-amber-500 text-white [a&]:hover:bg-amber-500/90",
      },
      size: {
        xs: "rounded-sm px-1 py-0 text-[0.625rem]",
        sm: "rounded-sm px-1.5 py-0 text-[0.6875rem]",
        md: "text-xs",
        lg: "rounded-md px-2 py-1 text-sm",
      },
      appearance: {
        default: "",
        light: "",
        outline: "bg-background",
        ghost: "border-transparent bg-transparent",
      },
    },
    compoundVariants: [
      {
        variant: "success",
        appearance: "light",
        className:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
      },
      {
        variant: "primary",
        appearance: "light",
        className:
          "border-transparent bg-primary/10 text-primary dark:bg-primary/20",
      },
      {
        variant: "info",
        appearance: "light",
        className:
          "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400",
      },
      {
        variant: "destructive",
        appearance: "light",
        className:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
      },
      {
        variant: "warning",
        appearance: "light",
        className:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      appearance: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  appearance,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, appearance }), className)}
      {...props}
    />
  )
}

function BadgeDot({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full bg-primary", className)}
      {...props}
    />
  );
}

function BadgeButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Badge, BadgeDot, BadgeButton, badgeVariants }
export type BadgeProps = React.ComponentProps<typeof Badge> &
  VariantProps<typeof badgeVariants>
