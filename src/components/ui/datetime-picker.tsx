"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock, X, Check, Sparkles } from "lucide-react";
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

const TIME_PRESETS = [
    { label: "00:00 (Start)", time: "00:00" },
    { label: "06:00 (Morning)", time: "06:00" },
    { label: "09:00", time: "09:00" },
    { label: "12:00 (Noon)", time: "12:00" },
    { label: "18:00 (Evening)", time: "18:00" },
    { label: "23:59 (End / 24:00)", time: "23:59" },
];

export function DateTimePicker({ date, setDate, placeholder = "Pick a date & time", className }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const timeListRef = React.useRef<HTMLDivElement>(null);
    const activeTimeRef = React.useRef<HTMLButtonElement>(null);

    // Safe date parsing
    const parsedDate = React.useMemo(() => {
        if (!date) return undefined;
        const d = new Date(date);
        return isNaN(d.getTime()) ? undefined : d;
    }, [date]);

    // Initial time string (HH:mm)
    const currentTime = React.useMemo(() => {
        if (!parsedDate) return "00:00";
        return `${parsedDate.getHours().toString().padStart(2, "0")}:${parsedDate.getMinutes().toString().padStart(2, "0")}`;
    }, [parsedDate]);

    // Auto-scroll to selected time when popover opens
    React.useEffect(() => {
        if (isOpen && activeTimeRef.current && timeListRef.current) {
            setTimeout(() => {
                activeTimeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 100);
        }
    }, [isOpen]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            return;
        }

        const newDate = new Date(selectedDate);
        if (parsedDate) {
            newDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        } else {
            newDate.setHours(0, 0, 0, 0);
        }
        setDate(newDate);
    };

    const handleTimeChange = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        const baseDate = parsedDate ? new Date(parsedDate) : new Date();
        baseDate.setHours(hours, minutes, 0, 0);
        setDate(baseDate);
    };

    const handleSetToday = () => {
        const today = new Date();
        if (parsedDate) {
            today.setHours(parsedDate.getHours(), parsedDate.getMinutes(), 0, 0);
        } else {
            today.setHours(0, 0, 0, 0);
        }
        setDate(today);
    };

    // Generate 15-minute time slots (00:00 to 23:45, plus 23:59 end-of-day)
    const timeSlots = React.useMemo(() => {
        const slots: string[] = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                slots.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
            }
        }
        slots.push("23:59");
        return slots;
    }, []);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background hover:bg-accent/40 border-input transition-all",
                        !parsedDate && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                    {parsedDate ? (
                        <span className="font-medium text-foreground">
                            {format(parsedDate, "dd/MM/yyyy HH:mm")}
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
                {/* Header bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border/50 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{parsedDate ? format(parsedDate, "EEE, dd MMM yyyy • HH:mm") : "Select date & time"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] hover:bg-background"
                            onClick={handleSetToday}
                        >
                            Today
                        </Button>
                        {parsedDate && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDate(undefined)}
                                title="Clear date"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Picker Content: Left = Calendar, Right = Time Picker */}
                <div className="flex flex-col sm:flex-row">
                    {/* Calendar Section */}
                    <div className="p-1 sm:border-r border-border/60">
                        <Calendar
                            mode="single"
                            selected={parsedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </div>

                    {/* Time Section */}
                    <div className="flex flex-col p-3 w-full sm:w-[170px] bg-muted/15 border-t sm:border-t-0 border-border/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span>Time</span>
                            </div>
                            {/* Manual Time Input */}
                            <input
                                type="time"
                                value={currentTime}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="h-6 w-20 text-[11px] px-1 bg-background border border-input rounded text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-2 gap-1 mb-2.5 pb-2 border-b border-border/40">
                            {TIME_PRESETS.map((preset) => (
                                <button
                                    key={preset.time}
                                    type="button"
                                    onClick={() => handleTimeChange(preset.time)}
                                    className={cn(
                                        "text-[10px] py-1 px-1.5 rounded border text-left truncate transition-colors",
                                        currentTime === preset.time
                                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                                            : "bg-background border-border/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    title={preset.label}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* 15-min increments scroll list */}
                        <div 
                            ref={timeListRef}
                            className="h-[200px] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar"
                        >
                            {timeSlots.map((time) => {
                                const isSelected = currentTime === time;
                                return (
                                    <button
                                        key={time}
                                        ref={isSelected ? activeTimeRef : undefined}
                                        type="button"
                                        onClick={() => handleTimeChange(time)}
                                        className={cn(
                                            "w-full text-left px-2.5 py-1 text-xs rounded-md font-mono flex items-center justify-between transition-colors",
                                            isSelected
                                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                                : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <span>{time}</span>
                                        {time === "23:59" && <span className="text-[9px] opacity-75 uppercase">End</span>}
                                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer confirm */}
                <div className="flex items-center justify-end px-3 py-2 bg-muted/30 border-t border-border/40">
                    <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs font-semibold px-4"
                        onClick={() => setIsOpen(false)}
                    >
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
