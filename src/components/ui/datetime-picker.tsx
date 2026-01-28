"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
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
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Initial time check
    const currentTime = date
        ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
        : "00:00";

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            setDate(undefined);
            return;
        }

        const newDate = new Date(selectedDate);
        // Preserve time if already set, or default to 00:00 (or current time if not set)
        if (date) {
            newDate.setHours(date.getHours(), date.getMinutes());
        } else {
            // Default to current time for usability
            const now = new Date();
            newDate.setHours(now.getHours(), now.getMinutes());
        }
        setDate(newDate);
    };

    const handleTimeChange = (time: string) => {
        if (!date) return;
        const [hours, minutes] = time.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes);
        setDate(newDate);
    };

    // Generate time slots (every 30 mins for example, or simply a scrollable list of hours/mins?
    // Screenshot showed hours/mins separate sidebars. Let's do a simple scrollable list of times for now, simpler to implement reliably).
    // Actually, screenshot showed separate columns for Date | Hours | Minutes.
    // Let's implement a nice scrollable list of common times.
    const timeSlots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) { // 15 min increments
            timeSlots.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`);
        }
    }


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP p") : <span>Pick a date & time</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-[300px]">
                    <div className="border-r">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </div>
                    <div className="flex flex-col p-3 w-[140px]">
                        <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Time</span>
                        </div>
                        <div className="h-full overflow-y-auto pr-1 custom-scrollbar">
                            <div className="grid gap-1">
                                {timeSlots.map((time) => (
                                    <Button
                                        key={time}
                                        variant={currentTime === time ? "default" : "ghost"}
                                        size="sm"
                                        className="justify-start font-normal"
                                        onClick={() => handleTimeChange(time)}
                                        disabled={!date}
                                    >
                                        {time}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
