"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background hover:bg-accent/40 border-input transition-all",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                    {date ? (
                        <span className="font-medium text-foreground">
                            {format(date, "dd/MM/yyyy")}
                        </span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-auto p-0 border border-border/80 shadow-2xl bg-popover rounded-xl overflow-hidden z-50" 
                align="start"
                sideOffset={6}
            >
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/50 text-xs">
                    <span className="font-medium text-foreground">
                        {date ? format(date, "EEE, dd MMM yyyy") : "Select date"}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] hover:bg-background"
                            onClick={() => {
                                setDate(new Date());
                                setIsOpen(false);
                            }}
                        >
                            Today
                        </Button>
                        {date && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                    setDate(undefined);
                                    setIsOpen(false);
                                }}
                                title="Clear date"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="p-1">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                            setDate(d);
                            setIsOpen(false);
                        }}
                        initialFocus
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
