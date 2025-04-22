
import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SELECTED_DAY_CLASS =
  "bg-[#1d4ED8] text-white font-bold border-none shadow transition-all";
const TODAY_CLASS =
  "text-[#1d4ED8] font-semibold underline underline-offset-2 cursor-pointer px-2 py-1 rounded hover:bg-[#1d4ED8]/10";

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
  const defaultMonth = date || new Date();
  const [displayMonth, setDisplayMonth] = React.useState<Date>(defaultMonth);

  React.useEffect(() => {
    if (date) {
      setDisplayMonth(date);
    }
  }, [date]);

  // Handles year/month change via selectors
  const handleMonthChange = (increment: number) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(displayMonth.getMonth() + increment);
    setDisplayMonth(newDate);
  };

  const handleYearChange = (increment: number) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(displayMonth.getFullYear() + increment);
    setDisplayMonth(newDate);
  };

  // Today's handler
  const handleTodayClick = () => {
    onDateChange(new Date());
    setOpen(false);
  };

  // List of months for dropdown
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];

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
        <div className="rounded-xl border border-[#1d4ED8]/30 bg-white/90 shadow-md overflow-hidden min-w-[320px] max-w-[360px]">
          {/* Calendar header with month/year dropdowns */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleMonthChange(-1)} className="rounded-full p-1">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <select
                className="bg-white rounded border border-[#1d4ED8]/30 px-2 py-1 text-base font-medium"
                value={displayMonth.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(displayMonth);
                  newDate.setMonth(Number(e.target.value));
                  setDisplayMonth(newDate);
                }}
                aria-label="Select month"
              >
                {months.map((name, i) => (
                  <option key={name} value={i}>{name}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" onClick={() => handleMonthChange(1)} className="rounded-full p-1">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => handleYearChange(-1)} className="rounded-full p-1">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <input
                type="number"
                className="border rounded px-2 py-1 w-20 text-center font-medium"
                value={displayMonth.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(displayMonth);
                  newDate.setFullYear(Number(e.target.value));
                  setDisplayMonth(newDate);
                }}
                aria-label="Year"
                min={1970}
                max={2099}
                style={{ width: '60px' }}
              />
              <Button variant="ghost" size="icon" onClick={() => handleYearChange(1)} className="rounded-full p-1">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(selectedDate) => {
              onDateChange(selectedDate);
              if (selectedDate) setOpen(false);
            }}
            initialFocus
            className={cn(
              "p-3 pointer-events-auto w-full",
              "[&_table]:w-full [&_table]:mb-2"
            )}
            fromDate={fromDate}
            defaultMonth={displayMonth}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            disabled={(cdate) => cdate < fromDate}
            classNames={{
              months: "flex flex-col w-full space-y-0",
              month: "w-full",
              caption: "hidden",
              head_row: "flex w-full mb-2",
              head_cell: "text-[#1d4ED8] font-medium text-sm w-10 h-10 flex items-center justify-center",
              row: "flex w-full",
              cell: "relative w-10 h-10 p-0 text-center text-base cursor-pointer rounded-lg transition-colors hover:bg-gray-100",
              cell: "relative w-10 h-10 p-0 text-center text-base cursor-pointer rounded-lg transition-colors hover:bg-[#1d4ED8]/10",
              day_selected: SELECTED_DAY_CLASS,
            }}
          />
          <div className="flex justify-center py-2 border-t border-gray-100">
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
