import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

export const useTimer = (startTime) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setElapsedSeconds(0);
            return;
        }

        // Calculate initial elapsed time
        const calculateElapsed = () => {
            const start = new Date(startTime);
            const now = new Date();
            return differenceInSeconds(now, start);
        };

        setElapsedSeconds(calculateElapsed());

        // Update every second
        const interval = setInterval(() => {
            setElapsedSeconds(calculateElapsed());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    // Format as HH:MM:SS
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return formatTime(elapsedSeconds);
};
