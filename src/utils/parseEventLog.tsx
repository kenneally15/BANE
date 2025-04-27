export interface LogEntry {
  timestamp: string;
  content: string;
  videoTimestamp?: number; // in seconds, for video seeking
}

export const parseTimeToSeconds = (timestamp: string): number => {
  // Convert "00h00m00s" to seconds
  const match = timestamp.match(/(\d{2})h(\d{2})m(\d{2})s/);
  if (!match) return 0;
  
  const [_, hours, minutes, seconds] = match;
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds)
  );
};

export const parseEventLog = (log: string): LogEntry[] => {
  if (!log) return [];
  
  return log.split('\n').map(line => {
    const timeMatch = line.match(/TIME: ([\d]{2}h[\d]{2}m[\d]{2}s)/);
    if (!timeMatch) return { timestamp: '', content: line, videoTimestamp: 0 };
    
    const timestamp = timeMatch[1];
    const content = line.replace(`TIME: ${timestamp}`, '').trim();
    const videoTimestamp = parseTimeToSeconds(timestamp);
    
    return {
      timestamp,
      content,
      videoTimestamp
    };
  });
}; 