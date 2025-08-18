// components/ui/date-picker.tsx
import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Helper functions to handle date conversion properly
const stringToDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  // Parse the date string and create a date in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

const dateToString = (date: Date | undefined): string => {
  if (!date) return '';
  // Format date as YYYY-MM-DD in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DatePickerProps {
  label?: string
  placeholder?: string
  value?: string // Changed to string to match your usage
  onChange: (dateString: string) => void // Changed to return string
  id?: string
  className?: string
  disabled?: boolean
  selectedDateClassName?: string // Add custom styling prop
}

export function DatePicker({
  label,
  placeholder = "Select date",
  value,
  onChange,
  id,
  className = "",
  disabled = false,
  selectedDateClassName = "[&_.rdp-day_selected]:bg-[#6CDD82] [&_.rdp-day_selected]:text-black \
  [&_.rdp-day_selected]:hover:bg-[#39C454] [&_.rdp-day_selected]:hover:text-black \
  [&_.rdp-day_selected]:focus:bg-[#39C454] [&_.rdp-day_selected]:focus:text-black"
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert string value to Date for the Calendar component
  const dateValue = stringToDate(value || '');

  const handleDateSelect = (date: Date | undefined) => {
    // Convert Date back to string and pass to onChange
    const dateString = dateToString(date);
    onChange(dateString);
    setOpen(false);
  };

  return (
    <div className={`flex1 gap-3 flex-row ${className}`}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {dateValue ? dateValue.toLocaleDateString() : placeholder}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
          <Calendar
            mode="single"
            selected={dateValue}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            className="[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:hover:bg-primary [&_.rdp-day_selected]:hover:text-primary-foreground [&_.rdp-day_selected]:focus:bg-primary [&_.rdp-day_selected]:focus:text-primary-foreground"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}