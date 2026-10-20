"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 bg-card rounded-md select-none", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-3",
                month_caption: "flex justify-center pt-1 relative items-center h-8",
                caption_label: "text-sm font-semibold tracking-tight text-foreground",
                nav: "flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "h-7 w-7 bg-background p-0 opacity-70 hover:opacity-100 absolute left-1 z-10 hover:bg-accent"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "h-7 w-7 bg-background p-0 opacity-70 hover:opacity-100 absolute right-1 z-10 hover:bg-accent"
                ),
                month_grid: "w-full border-collapse space-y-1 mt-2",
                weekdays: "flex w-full justify-between pb-1 border-b border-border/40 mb-1",
                weekday:
                    "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] text-center flex items-center justify-center",
                week: "flex w-full mt-1 justify-between",
                day: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center focus-within:relative focus-within:z-20",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 p-0 font-normal rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "[&>.rdp-day_button]:!bg-primary [&>.rdp-day_button]:!text-primary-foreground [&>.rdp-day_button]:font-semibold [&>.rdp-day_button]:shadow-sm rounded-md",
                today: "[&>.rdp-day_button]:bg-accent [&>.rdp-day_button]:text-accent-foreground [&>.rdp-day_button]:font-bold border border-primary/40 rounded-md",
                outside:
                    "text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                disabled: "text-muted-foreground opacity-20 cursor-not-allowed pointer-events-none",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className={cn("h-4 w-4", chevronClass)} {...chevronProps} />
                    }
                    return <ChevronRight className={cn("h-4 w-4", chevronClass)} {...chevronProps} />
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
