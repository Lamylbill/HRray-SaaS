
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Updated to apply brand colors & styles matching your screenshot
const SELECTED_DAY_CLASS =
  "bg-[#6E59A5] text-white font-bold border-none shadow transition-all";
const TODAY_CLASS =
  "text-[#6E59A5] font-semibold underline underline-offset-2 cursor-pointer px-2 py-1 rounded hover:bg-[#6E59A5]/10";

interface DatePickerProps {
  date?: Date | null;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  fromDate?: Date;
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pick a date",
  disabled = false,
  fromDate = new Date(),
}: DatePickerProps) {
  // Track open state for popover
  const [open, setOpen] = React.useState(false);

  // Focus calendar on selected date or today
  const defaultMonth = date || new Date();

  // Today's handler
  const handleTodayClick = () => {
    onDateChange(new Date());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="rounded-xl border border-[#eee] bg-white shadow-md overflow-hidden min-w-[320px] max-w-[360px]">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate);
              if (selectedDate) {
                setOpen(false);
              }
            }}
            initialFocus
            className={cn(
              "p-3 pointer-events-auto w-full",
              "[&_table]:w-full [&_table]:mb-2"
            )}
            fromDate={fromDate}
            defaultMonth={defaultMonth}
            disabled={(date) => date < fromDate}
            classNames={{
              months: "flex flex-col w-full space-y-0",
              month: "w-full",
              caption: "flex justify-center items-center pt-2 pb-4 font-medium text-[17px]",
              head_row: "flex w-full mb-2",
              head_cell:
                "text-gray-400 font-medium text-sm w-10 h-10 flex items-center justify-center",
              row: "flex w-full",
              cell:
                "relative w-10 h-10 p-0 text-center text-base cursor-pointer rounded-lg transition-colors hover:bg-[#eee] active:bg-[#d6bcfa]",
              day: "w-full h-full flex items-center justify-center",
              day_selected: SELECTED_DAY_CLASS,
            }}
            components={{
              // Use default except for today, handled below
            }}
          />
          <div className="flex justify-center py-2 border-t border-[#f0f0f0]">
            <button
              type="button"
              className={TODAY_CLASS}
              onClick={handleTodayClick}
              tabIndex={0}
            >
              Today
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
