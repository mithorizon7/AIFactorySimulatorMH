interface GameTimerProps {
  timeElapsed: number;
  formattedTime: string;
}

export default function GameTimer({ timeElapsed, formattedTime }: GameTimerProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-medium">{formattedTime}</span>
    </div>
  );
}
