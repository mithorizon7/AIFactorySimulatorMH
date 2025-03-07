interface GameTimerProps {
  timeLeft: number;
  formattedTime: string;
}

export default function GameTimer({ timeLeft, formattedTime }: GameTimerProps) {
  // Calculate color based on time left
  const getColor = () => {
    if (timeLeft < 180) return "text-red-400"; // Less than 3 minutes
    if (timeLeft < 300) return "text-amber-400"; // Less than 5 minutes
    return "text-gray-400";
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${getColor()}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-medium">{formattedTime}</span>
    </div>
  );
}
