import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-[1.2rem] border-[2.5px] border-[#111]", className)}
      {...props}
    />
  )
}

export { Skeleton }
