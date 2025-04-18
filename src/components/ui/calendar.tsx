
import * as React from "react";
import { DayPicker, CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  hideNavigation?: boolean;
  showWeekdayHeader?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  hideNavigation = false,
  showWeekdayHeader = true,
  defaultMonth = new Date(), // Default to current month
  ...props
}: CalendarProps) {
  // Custom caption component with month/year dropdowns
  function CustomCaption({ displayMonth }: CaptionProps) {
    const startYear = 1900;
    const endYear = 2100;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];

    const handleYearChange = (year: string) => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(parseInt(year));
      props.onMonthChange?.(newDate);
    };

    const handleMonthChange = (month: string) => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(months.indexOf(month));
      props.onMonthChange?.(newDate);
    };

    return (
      <div className="flex justify-center pt-1 relative items-center">
        <Select
          value={months[displayMonth.getMonth()]}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[110px] h-7 text-sm font-medium">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={displayMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[70px] h-7 ml-1 text-sm font-medium">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto w-full", className)}
      classNames={{
        months: "flex flex-col w-full space-y-4",
        month: "w-full space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden",
        nav: hideNavigation ? "hidden" : "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full h-full border-collapse space-y-1",
        head_row: cn(
          showWeekdayHeader ? "flex w-full mb-2" : "hidden"
        ),
        head_cell: cn(
          showWeekdayHeader ? "text-muted-foreground rounded-md w-full font-normal text-xs" : "hidden"
        ),
        row: "flex w-full mt-2",
        cell: "relative h-auto text-center text-sm p-0 overflow-visible first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full aspect-square",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-1 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => null,
        IconRight: () => null,
        Caption: CustomCaption,
      }}
      captionLayout="buttons"
      defaultMonth={defaultMonth}
      fromYear={new Date().getFullYear()}
      toYear={2100}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
