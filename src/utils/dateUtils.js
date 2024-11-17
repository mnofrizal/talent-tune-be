/**
 * Calculate expiry date as 2 years from the schedule date
 * @param {Date} scheduleDate - The schedule date
 * @returns {Date} - The expiry date
 */
export const calculateExpiryDate = (scheduleDate) => {
  const expiryDate = new Date(scheduleDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  return expiryDate;
};
