import logger from "./logger.js";

export const fetchIndianHolidays = async (year) => {
  const API_KEY = process.env.CALENDARIFIC_API_KEY;
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.response || !data.response.holidays) {
      return [];
    }

    // Ensure all dates are in ISO format
    return data.response.holidays.map(
      (holiday) => new Date(holiday.date.iso).toISOString().split("T")[0]
    );
  } catch (error) {
    logger.error(
      "calendarHoliday-fetchIndianHolidays: Failed to fetch holidays:",
      error
    );
    return [];
  }
};

export const fetchPublicHolidays = async (year) => {
  const API_KEY = process.env.CALENDARIFIC_API_KEY;
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Ensure all dates are in ISO format
    // console.log("Fetched Public Holidays:", data.response.holidays);

    return data;
  } catch (error) {
    logger.error(
      "calendarHoliday-fetchPublicHolidays: Failed to fetch public holidays:",
      error
    );
    return [];
  }
};
