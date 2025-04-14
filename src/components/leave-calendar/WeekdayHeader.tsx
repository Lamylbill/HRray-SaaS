import React from 'react';

const WeekdayHeader: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <div
            key={index}
            className="py-2 px-4 text-center font-medium text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekdayHeader;