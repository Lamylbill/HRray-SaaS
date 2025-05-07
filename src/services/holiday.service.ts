import { format } from 'date-fns';

export interface PublicHoliday {
  date: string; // YYYY-MM-DD format
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

/**
 * Fetches public holidays for Singapore within a given year range from the Nager.Date API.
 * @param startYear The start year of the range.
 * @param endYear The end year of the range.
 * @returns A promise resolving to an array of PublicHoliday objects.
 */
export const fetchPublicHolidays = async (startYear: number, endYear: number): Promise<PublicHoliday[]> => {
  const allHolidays: PublicHoliday[] = [];

  for (let year = startYear; year <= endYear; year++) {
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/SG`);
      if (!response.ok) {
        console.error(`[Holiday API] Failed to fetch holidays for ${year}: ${response.status} ${response.statusText}`);
        continue;
      }

      const yearHolidays: PublicHoliday[] = await response.json();
      allHolidays.push(...yearHolidays);
    } catch (error) {
      console.error(`[Holiday API] Error fetching holidays for ${year}:`, error);
      continue;
    }
  }

  return allHolidays;
};
