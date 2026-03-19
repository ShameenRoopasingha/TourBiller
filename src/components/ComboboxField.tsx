'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  label: string;
  value: string;
}

interface ComboboxFieldProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowCustomValue?: boolean;
  className?: string;
  disabled?: boolean;
}

export function ComboboxField({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  allowCustomValue = false,
  className,
  disabled = false,
}: ComboboxFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedLabel = React.useMemo(() => {
    if (!value) return "";
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  }, [value, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal overflow-hidden min-w-0", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <span className="truncate flex-1 text-left min-w-0">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={placeholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoComplete="off"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {allowCustomValue && searchQuery && !options.some(o => o.label.toLowerCase() === searchQuery.toLowerCase()) && (
                <CommandItem
                  value={searchQuery}
                  onSelect={() => {
                    onChange(searchQuery);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="font-medium text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Use &quot;{searchQuery}&quot;
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
