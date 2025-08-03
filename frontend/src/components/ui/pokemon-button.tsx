import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pokemonButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-pokemon",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pokeball: "bg-gradient-pokeball text-white hover:scale-105 transform transition-transform shadow-card",
        electric: "bg-gradient-electric text-white hover:shadow-glow transition-all duration-300",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-pokemon",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PokemonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pokemonButtonVariants> {
  asChild?: boolean
}

const PokemonButton = React.forwardRef<HTMLButtonElement, PokemonButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(pokemonButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
PokemonButton.displayName = "PokemonButton"

export { PokemonButton, pokemonButtonVariants }