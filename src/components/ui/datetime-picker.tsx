"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

const COMMON_TIMES = [
    { label: "00:00 (Day Start)", value: "00:00" },
    { label: "06:00 (Morning)", value: "06:00" },
    { label: "08:00", value: "08:00" },
    { label: "09:00 (Tour Start)", value: "09:00" },
    { label: "12:00 (Noon)", value: "12:00" },
    { label: "14:00", value: "14:00" },
    { label: "18:00 (Tour Return)", value: "18:00" },
    { label: "20:00", value: "20:00" },
    { label: "23:59 (Day End / 24:00)", value: "23:59" },
];

export function DateTimePicker({
    date,
    setDate,
    placeholder = "Pick date",
    className,
}: DateTimePickerProps) {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const [isTimeMenuOpen, setIsTimeMenuOpen] = React.useState(false);

    // Safe date parsing
    const parsedDate = React.useMemo(() => {
        if (!date) return undefined;
        const d = new Date(date);
        return isNaN(d.getTime()) ? undefined : d;
    }, [date]);

    // Format current time HH:mm
    const currentTime = React.useMemo(() => {
        if (!parsedDate) return "00:00";
        const h = parsedDate.getHours().toString().padStart(2, "0");
        const m = parsedDate.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
    }, [parsedDate]);

    // Handle date selection from calendar
    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            setIsCalendarOpen(false);
            return;
        }

        const newDate = new Date(selectedDate);
        if (parsedDate) {
            newDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        } else {
            newDate.setHours(0, 0, 0, 0);
        }
        setDate(newDate);
        setIsCalendarOpen(false); // Seamless UX: picking date closes the calendar immediately
    };

    // Handle time change from input or presets
    const handleTimeChange = (timeStr: string) => {
        if (!timeStr) return;
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;

        const baseDate = parsedDate ? new Date(parsedDate) : new Date();
        baseDate.setHours(hours, minutes, 0, 0);
        setDate(baseDate);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* 1. Date Field (Button with Calendar Popover) */}
            <div className="flex-1 min-w-0">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal bg-background hover:bg-accent/40 border-input h-10 px-3 transition-colors",
                                !parsedDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                            <span className="truncate font-medium text-foreground">
                                {parsedDate ? format(parsedDate, "dd/MM/yyyy") : placeholder}
                            </span>
                            {parsedDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDate(undefined);
                                    }}
                                    className="ml-auto text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                                    title="Clear date"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0 border border-border/80 shadow-2xl bg-popover rounded-xl overflow-hidden z-50"
                        align="start"
                        sideOffset={6}
                    >
                        <div className="p-1">
                            <Calendar
                                mode="single"
                                selected={parsedDate}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-t border-border/40 text-xs">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[11px] font-medium"
                                onClick={() => {
                                    const today = new Date();
                                    if (parsedDate) {
                                        today.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
                                    } else {
                                        today.setHours(0, 0, 0, 0);
                                    }
                                    setDate(today);
                                    setIsCalendarOpen(false);
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="h-6 px-3 text-[11px] font-semibold"
                                onClick={() => setIsCalendarOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* 2. Time Field (Clean Input + Quick Presets Dropdown) */}
            <div className="w-[145px] shrink-0 flex items-center">
                <div className="relative flex-1 flex items-center">
                    <Clock className="absolute left-2.5 h-4 w-4 text-primary pointer-events-none" />
                    <input
                        type="time"
                        value={currentTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="w-full h-10 pl-8 pr-1 bg-background border border-input rounded-l-md text-sm font-medium text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono cursor-pointer"
                        title="Enter time"
                    />
                </div>

                {/* Quick Presets Menu Trigger */}
                <Popover open={isTimeMenuOpen} onOpenChange={setIsTimeMenuOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-1.5 border-l-0 rounded-l-none bg-muted/40 hover:bg-muted text-muted-foreground"
                            title="Quick time presets"
                        >
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-48 p-1 border border-border/80 shadow-xl bg-popover rounded-lg z-50"
                        align="end"
                        sideOffset={4}
                    >
                        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                            Common Times
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                            {COMMON_TIMES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => {
                                        handleTimeChange(t.value);
                                        setIsTimeMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 text-xs rounded font-medium flex items-center justify-between transition-colors",
                                        currentTime === t.value
                                            ? "bg-primary text-primary-foreground font-semibold"
                                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <span>{t.label}</span>
                                    <span className="font-mono text-[11px] opacity-80">{t.value}</span>
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
