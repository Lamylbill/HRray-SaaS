import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SELECTED_DAY_CLASS = "bg-[#1d4ED8] text-white hover:bg-[#1d4ED8]";
const TODAY_CLASS = "text-[#1d4ED8] font-semibold underline underline-offset-2 cursor-pointer px-2 py-1 rounded hover:bg-[#1d4ED8]/10";

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
  const [open, setOpen] = React.useState(false);
  const defaultMonth = date || new Date();
  const [displayMonth, setDisplayMonth] = React.useState<Date>(defaultMonth);

  React.useEffect(() => {
    if (date) {
      setDisplayMonth(date);
    }
  }, [date]);

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
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
            'px-3'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div>
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
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              head_row: "flex w-full mb-2",
              head_cell: "text-[#1d4ED8] font-medium text-sm w-10 h-10 flex items-center justify-center",
              row: "flex w-full",
              cell: "relative w-10 h-10 p-0 text-center text-base cursor-pointer rounded-lg transition-colors hover:bg-[#1d4ED8]/10",
              day_selected: SELECTED_DAY_CLASS,
            }}
          />
          <div className="flex items-center gap-1 justify-center py-2">
            <input
              type="number"
              className="border rounded px-2 py-1 w-28 text-center font-medium"
              value={displayMonth.getFullYear()}
              onChange={(e) => {
                const newDate = new Date(displayMonth);
                newDate.setFullYear(Number(e.target.value));
                setDisplayMonth(newDate);
              }}
              aria-label="Year"
              min={1970}
              max={2099}
            />
          </div>
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