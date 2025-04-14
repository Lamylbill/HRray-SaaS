import React from 'react';
import { LeaveRequest, MonthViewProps } from './interfaces';
import LeaveItem from './LeaveItem';

const MonthView: React.FC<MonthViewProps & { leaveRequests: LeaveRequest[] }> = ({ month, year, leaveRequests }) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

  const getDayOfWeek = (day: number) => {
    const dayIndex = (firstDayOfWeek + day - 1) % 7;
    return dayIndex;
  };

  // Create a grid of leave items, keyed by day of the month.
  const leaveItemsByDay: { [day: number]: LeaveRequest[] } = {};
  for (const leaveRequest of leaveRequests) {
    const leaveStart = new Date(leaveRequest.start_date);
    const leaveEnd = new Date(leaveRequest.end_date);

    // Check if the leave request overlaps with the current month.
    if (leaveEnd >= firstDayOfMonth && leaveStart <= lastDayOfMonth) {
      // Determine the range of days in the current month that the leave request covers.
      const startDay = Math.max(1, leaveStart.getMonth() === month && leaveStart.getFullYear() === year ? leaveStart.getDate() : 1);
      const endDay = Math.min(daysInMonth, leaveEnd.getMonth() === month && leaveEnd.getFullYear() === year ? leaveEnd.getDate() : daysInMonth);

      for (let day = startDay; day <= endDay; day++) {
        if (!leaveItemsByDay[day]) {
          leaveItemsByDay[day] = [];
        }
        leaveItemsByDay[day].push(leaveRequest);
      }
    }
  }

  const renderDays = () => {
    const days = [];
    let row = [];
    let dayOfWeek = firstDayOfWeek;

    // Add empty cells for the days before the 1st of the month
    for (let i = 0; i < dayOfWeek; i++) {
      row.push(<div key={`empty-${i}`} className="p-2 border border-gray-200" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const leaveItems = leaveItemsByDay[day] || [];
      const cellContent = (
        <div className="h-24">
          <span className="text-sm text-gray-500">{day}</span>
          {leaveItems.map((leaveItem, index) => (
            <LeaveItem key={index} leaveRequest={leaveItem} />
          ))}
        </div>
      );

      row.push(
        <div key={day} className="p-2 border border-gray-200">
          {cellContent}
        </div>
      );

      dayOfWeek = (dayOfWeek + 1) % 7;

      if (dayOfWeek === 0 || day === daysInMonth) {
        days.push(<div key={days.length} className="grid grid-cols-7">{row}</div>);
        row = [];
      }
    }

    return days;
  };

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div>
      <h2 className="text-lg font-bold mt-4 mb-2">
        {monthName}
      </h2>

      {leaveRequests.length > 0 ? (
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      ) : (
        <p className="text-gray-500 italic">No leave records for {monthName}.</p>
      )}
    </div>
  );
};


export default MonthView;