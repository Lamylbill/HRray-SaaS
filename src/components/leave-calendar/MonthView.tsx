
import React from 'react';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';

interface MonthViewProps {
  month: number;
  year: number;
  leaveRequests: LeaveRequest[];
}

const MonthView: React.FC<MonthViewProps> = ({ month, year, leaveRequests }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayOfWeek = (day: number) => {
    return new Date(year, month, day).getDay();
  };

  const getGridColumnStart = (day: number) => {
    return getDayOfWeek(day) + 1; 
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
        {monthName} {year}
      </h2>
      <div className="grid grid-cols-7 gap-1 border border-gray-300 rounded-md">
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="border border-gray-300 p-2"></div>
        ))}
        {calendarDays.map((day) => {
          const currentDate = new Date(year, month, day);
          const currentDayOfWeek = getDayOfWeek(day);
          const currentGridColumnStart = currentDayOfWeek + 1;
          const currentGridColumnEnd = currentGridColumnStart + 1;

          return (
            <div key={day} className="border border-gray-300 p-2 relative">
              <span className="text-sm">{day}</span>
              {leaveRequests.map(
                (leaveRequest) => {
                  const leaveStartDate = new Date(leaveRequest.start_date);
                  const leaveEndDate = new Date(leaveRequest.end_date);

                  if (
                    currentDate.getTime() >= leaveStartDate.getTime() &&
                    currentDate.getTime() <= leaveEndDate.getTime()
                  ) {
                    const leaveStartColumn =
                      leaveStartDate.getMonth() === month &&
                      leaveStartDate.getFullYear() === year
                        ? getGridColumnStart(leaveStartDate.getDate())
                        : 1;
                    const leaveEndColumn =
                    leaveEndDate.getMonth() === month &&
                    leaveEndDate.getFullYear() === year
                      ? getGridColumnStart(leaveEndDate.getDate()) + 1
                        : 8;

                    const duration = Math.min(leaveEndColumn, currentGridColumnEnd) - Math.max(leaveStartColumn, currentGridColumnStart);


                    return (
                      <div
                        key={leaveRequest.id}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{
                          gridColumnStart: `${leaveStartColumn}`,
                          gridColumnEnd: `${leaveEndColumn}`,
                        }}
                      >
                        <LeaveItem leaveRequest={leaveRequest} />
                      </div>
                    );
                  }
                  return null;
                }
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MonthView;