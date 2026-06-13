"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarIndicator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-indicator"
      className={cn(
        "absolute flex items-center justify-center",
        className
      )}
      {...props}
    />
  )
}

const avatarStatusVariants = cva("rounded-full ring-2 ring-background", {
  variants: {
    variant: {
      online: "bg-emerald-500",
      offline: "bg-muted-foreground/40",
      busy: "bg-destructive",
      away: "bg-amber-500",
    },
  },
  defaultVariants: {
    variant: "offline",
  },
})

function AvatarStatus({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof avatarStatusVariants>) {
  return (
    <span
      data-slot="avatar-status"
      className={cn(avatarStatusVariants({ variant }), className)}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarIndicator,
  AvatarStatus,
  avatarStatusVariants,
}
