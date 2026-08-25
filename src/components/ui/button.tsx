import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#f6d326] text-[#111] border-2 border-[#111] hover:bg-[#ffe14a] hover:text-[#111] hover:border-[#111]",
        outline:
          "border-2 border-[#111] bg-transparent text-[#111] hover:bg-[#f6d326]",
        secondary:
          "bg-[#111] text-[#f6d326] hover:bg-[#222]",
        ghost: "hover:bg-[#f6d326] hover:text-[#111]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "text-foreground underline-offset-4 hover:text-accent hover:underline px-0",
        gradient: "btn-gradient",
      },
      size: {
        default: "h-10 gap-2 px-5 text-xs",
        xs: "h-8 gap-1 px-3 text-[0.65rem]",
        sm: "h-9 gap-1.5 px-4 text-[0.65rem]",
        lg: "h-12 gap-2 px-8 text-xs",
        icon: "size-10",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
