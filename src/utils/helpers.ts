import { SessionType } from "@/types/Table.interface";
export const getCurrentDateString = (): string => {
  // Use Mexico City timezone to match server
  const now = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Mexico_City' 
  });
  const date = new Date(now);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
export const getCurrentTimeString = (): string => {
  // Use Mexico City timezone
  const now = new Date().toLocaleString('en-US', { 
    timeZone: 'America/Mexico_City' 
  });
  const date = new Date(now);
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};
export const extractTimeRange = (className: string): { startTime: string; endTime: string } | null => {
  const timeMatch = className.match(/(\d{2}:\d{2})\s+a\s+(\d{2}:\d{2})/);
  if (timeMatch) {
    return {
      startTime: timeMatch[1],
      endTime: timeMatch[2]
    };
  }
  return null;
};
export const isClassActiveNow = (startTime: string, endTime: string, currentTime: string): boolean => {
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Handle classes that cross midnight (e.g., 23:00 - 01:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  // Normal case: show if current time is between start and end (inclusive of start, exclusive of end)
  // At 10:00, show 10:00-11:00 class
  // At 10:59, still show 10:00-11:00 class
  // At 11:00, show 11:00-12:00 class (not 10:00-11:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

export const getSessionType = (className: string): SessionType => {
  const lower = className.toLowerCase();
  
  if (lower.includes('grupal')) return 'Group';
  if (lower.includes('semiprivad')) return 'Semi-Private';
  if (lower.includes('privad')) return 'Private';
  if (lower.includes('open gym')) return 'Open Gym';
  
  return 'Other';
};
export const getColor = (sessionType: SessionType): string => {
  const colors: Record<SessionType, string> = {
    'Group': '#02b105',
    'Semi-Private': '#22c7dd',
    'Private': '#dbbf0a',
    'Open Gym': '#9333ea',
    'Other': '#6366f1'
  };
  return colors[sessionType];
};

export const formatDate = (dateStr: string): string => {
  const [day, month, year] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${weekdays[date.getDay()]}, ${day} de ${months[parseInt(month) - 1]}`;
};
