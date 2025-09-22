// Utility functions for timezone handling

/**
 * Convert UTC time to GMT+7 (Vietnam timezone)
 * @param {Date} date - The date to convert
 * @returns {Date} - Date in GMT+7 timezone
 */
export const toVietnamTime = (date) => {
  if (!date) return null;
  
  const utcDate = new Date(date);
  const vietnamTime = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
  return vietnamTime;
};

/**
 * Get current time in Vietnam timezone (GMT+7)
 * @returns {Date} - Current time in GMT+7
 */
export const getCurrentVietnamTime = () => {
  return toVietnamTime(new Date());
};

/**
 * Format date to Vietnam timezone string
 * @param {Date} date - The date to format
 * @param {string} format - Format type ('iso', 'datetime', 'date', 'time')
 * @returns {string} - Formatted date string
 */
export const formatVietnamTime = (date, format = 'iso') => {
  if (!date) return null;
  
  const vietnamTime = toVietnamTime(date);
  
  switch (format) {
    case 'iso':
      return vietnamTime.toISOString();
    case 'datetime':
      return vietnamTime.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    case 'date':
      return vietnamTime.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'time':
      return vietnamTime.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    default:
      return vietnamTime.toISOString();
  }
};


/**
 * Format date for API response (includes timezone info)
 * @param {Date} date - The date to format
 * @returns {object} - Formatted date object with timezone info
 */
export const formatForAPI = (date) => {
  if (!date) return null;
  
  const vietnamTime = toVietnamTime(date);
  
  return {
    utc: date.toISOString(),
    vietnam: vietnamTime.toISOString(),
    vietnamFormatted: formatVietnamTime(date, 'datetime'),
    timezone: 'GMT+7'
  };
};

/**
 * Get Vietnam time as ISO string (for simple API responses)
 * @param {Date} date - The date to convert (optional, defaults to current time)
 * @returns {string} - Vietnam time as ISO string
 */
export const getVietnamTimeISO = (date = null) => {
  const targetDate = date || new Date();
  return toVietnamTime(targetDate).toISOString();
};

/**
 * Check if a date is today in Vietnam timezone
 * @param {Date} date - The date to check
 * @returns {boolean} - True if the date is today
 */
export const isTodayVietnam = (date) => {
  if (!date) return false;
  
  const vietnamTime = toVietnamTime(date);
  const today = getCurrentVietnamTime();
  
  return vietnamTime.toDateString() === today.toDateString();
};

/**
 * Get start and end of day in Vietnam timezone
 * @param {Date} date - The date (optional, defaults to current time)
 * @returns {object} - Object with startOfDay and endOfDay
 */
export const getDayRangeVietnam = (date = null) => {
  const targetDate = date || new Date();
  const vietnamTime = toVietnamTime(targetDate);
  
  const startOfDay = new Date(vietnamTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(vietnamTime);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString()
  };
};
