
import React from 'react';

const WeekdayHeader: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm w-full">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((day, index) => (
          <div
            key={index}
            className={`py-3 text-center font-medium text-gray-700 ${
              index === 0 || index === 6 ? 'text-indigo-600' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekdayHeader;
