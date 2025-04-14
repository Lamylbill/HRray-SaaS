import React from 'react';

const WeekdayHeader: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="sticky top-16 bg-white z-10 border-b border-gray-200 mt-4 w-full">
      <div className="grid grid-cols-7 border-t border-l border-gray-200 ">
        {days.map((day, index) => (
          <div
            key={index}
            className="py-2 text-center font-medium text-gray-700"
          >
            {day}
          </div>
          
        ))}
      </div>
    </div>
  );
};

export default WeekdayHeader;