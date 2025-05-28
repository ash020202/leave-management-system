// import Holidays from "date-holidays";
// const hd = new Holidays("US"); // You can also use "IN", "TN" if needed

// export const getPublicHolidays = (year) => {
//   console.log(`\n📅 Fetching public holidays for year: ${year}\n`);
//   //   console.log(hd.getCountries());

//   const holidays = hd.getHolidays(year);

//   holidays.forEach((holiday) => {
//     console.log(
//       `🛑 Holiday: ${holiday.name} | Raw Date: ${holiday.date} | Formatted: ${
//         new Date(holiday.date).toISOString().split("T")[0]
//       }`
//     );
//   });

//   return holidays.map(
//     (holiday) => new Date(holiday.date).toISOString().split("T")[0]
//   );
// };

// const year = 2024;

// const holidays = getPublicHolidays(year);

// console.log("\n✅ Final formatted holiday dates:\n", holidays);

const fetchPublicHolidays = async (year) => {
  const API_KEY = "2FAB4XeIiVUO0n7MBMM6YeVVwyXqtVSY";
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Ensure all dates are in ISO format
    console.log("Fetched Public Holidays:", data.response.holidays);

    return data;
  } catch (error) {
    console.error("Failed to fetch public holidays:", error);
    return [];
  }
};
// const holidays = await fetchPublicHolidays(2025);
// console.log(
//   "\n✅ Final formatted public holiday dates:\n",
//   holidays.response.holidays
// );
