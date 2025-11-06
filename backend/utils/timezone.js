// Utility functions for timezone handling

/**
 * Convert a date object to a new date object representing time in GMT+7.
 * Note: This is tricky. The resulting Date object's internal UTC value
 * will be 7 hours ahead of the input's.
 * @param {Date} date - The date to convert
 * @returns {Date} - A new Date object shifted by +7 hours.
 */
export const toVietnamTime = (date) => {
  if (!date) return null;
  const utcDate = new Date(date);
  // The input 'date' object already represents a specific moment in time (internally as UTC).
  // We should not add any offset, as that corrupts the time value.
  // The comparison in the validation logic will correctly compare two Date objects.
  return new Date(utcDate);
};

/**
 * Get current time in Vietnam timezone (GMT+7)
 * @returns {Date} - Current time in GMT+7
 */
export const getCurrentVietnamTime = () => {
  return toVietnamTime(new Date());
};

/**
 * Format a UTC date into a Vietnam timezone string.
 * @param {Date} date - The UTC date to format.
 * @param {string} format - Format type ('iso', 'datetime', 'date', 'time').
 * @returns {string} - Formatted date string in Vietnam time.
 */
export const formatVietnamTime = (date, format = 'iso') => {
  if (!date) return null;

  // The Date object is in UTC. We format it directly to the target timezone.
  const options = { timeZone: 'Asia/Ho_Chi_Minh' };

  switch (format) {
    case 'iso':
      // This is tricky. An ISO string with timezone would be ideal,
      // but for consistency with old logic, we'll format it.
      const year = date.toLocaleString('en-US', { ...options, year: 'numeric' });
      const month = date.toLocaleString('en-US', { ...options, month: '2-digit' });
      const day = date.toLocaleString('en-US', { ...options, day: '2-digit' });
      const time = date.toLocaleString('en-US', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      return `${year}-${month}-${day}T${time}.000+07:00`;
    case 'datetime':
      return new Date(date).toLocaleString('vi-VN', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
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
 * Format a date from the database for API response.
 * @param {Date} date - The UTC date from the database.
 * @returns {object} - Formatted date object with timezone info.
 */
export const formatForAPI = (date) => {
  if (!date) return null;

  return {
    utc: date.toISOString(),
    vietnam: formatVietnamTime(date, 'iso'),
    vietnamFormatted: formatVietnamTime(date, 'datetime'),
    timezone: 'GMT+7',
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