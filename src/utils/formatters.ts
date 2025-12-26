export const formatTime = (seconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return "Not started";
    return new Date(timestamp * 1000).toLocaleString();
};

export const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';

    return trimmed
        .split(/\s+/)
        .filter(part => part.length > 0)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const formatPercentage = (value: number, total: number): string => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
};
