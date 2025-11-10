/**
 * Timezone Detection Utility
 * Auto-detects timezone from postcode (UK-specific) or IP address
 */

interface TimezoneInfo {
  timezone: string;
  offset: number; // Minutes from UTC
  isDST: boolean;
}

/**
 * UK Postcode to timezone mapping
 * Most of UK uses Europe/London, but we check for edge cases
 */
const UK_TIMEZONE = "Europe/London";

/**
 * Detect timezone from UK postcode
 * @param postcode - UK postcode (e.g., "SW1A 1AA")
 * @returns Timezone info
 */
export function detectTimezoneFromPostcode(postcode: string | null | undefined): TimezoneInfo {
  // UK uses Europe/London for all regions
  // In the future, could add specific logic for Channel Islands, etc.
  return getTimezoneInfo(UK_TIMEZONE);
}

/**
 * Detect timezone from IP address (fallback method)
 * @param ipAddress - Client IP address
 * @returns Timezone info
 */
export async function detectTimezoneFromIP(ipAddress: string | null | undefined): Promise<TimezoneInfo> {
  // For local/private IPs, default to UK timezone
  if (!ipAddress || isPrivateIP(ipAddress)) {
    return getTimezoneInfo(UK_TIMEZONE);
  }

  try {
    // In production, you might use a geolocation API like:
    // - ipapi.co
    // - ip-api.com
    // - MaxMind GeoIP2
    
    // For now, default to UK timezone
    // TODO: Implement IP geolocation API integration
    return getTimezoneInfo(UK_TIMEZONE);
  } catch (error) {
    console.error("Error detecting timezone from IP:", error);
    return getTimezoneInfo(UK_TIMEZONE);
  }
}

/**
 * Get timezone information including offset
 * @param timezone - IANA timezone string (e.g., "Europe/London")
 * @returns Timezone info with offset
 */
export function getTimezoneInfo(timezone: string): TimezoneInfo {
  try {
    const now = new Date();
    
    // Create formatter for the timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    
    // Get offset in minutes
    const offset = getTimezoneOffset(timezone, now);
    
    // Check if DST is active
    const isDST = isDaylightSavingTime(timezone, now);
    
    return {
      timezone,
      offset,
      isDST,
    };
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    // Fallback to UTC
    return {
      timezone: "UTC",
      offset: 0,
      isDST: false,
    };
  }
}

/**
 * Calculate timezone offset in minutes from UTC
 * @param timezone - IANA timezone string
 * @param date - Date to calculate offset for
 * @returns Offset in minutes (positive = ahead of UTC, negative = behind UTC)
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  // Get UTC time
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  
  // Get time in target timezone
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  
  // Calculate difference in minutes
  const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  
  return Math.round(offset);
}

/**
 * Check if daylight saving time is active
 * @param timezone - IANA timezone string
 * @param date - Date to check
 * @returns True if DST is active
 */
function isDaylightSavingTime(timezone: string, date: Date): boolean {
  // Get offset in January (winter)
  const january = new Date(date.getFullYear(), 0, 1);
  const winterOffset = getTimezoneOffset(timezone, january);
  
  // Get offset in July (summer)
  const july = new Date(date.getFullYear(), 6, 1);
  const summerOffset = getTimezoneOffset(timezone, july);
  
  // Get current offset
  const currentOffset = getTimezoneOffset(timezone, date);
  
  // DST is active if current offset matches summer offset and differs from winter
  return currentOffset === summerOffset && winterOffset !== summerOffset;
}

/**
 * Check if IP address is private/local
 * @param ip - IP address
 * @returns True if IP is private
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,          // Loopback
    /^10\./,           // Private class A
    /^172\.(1[6-9]|2\d|3[01])\./,  // Private class B
    /^192\.168\./,     // Private class C
    /^::1$/,           // IPv6 loopback
    /^fe80:/,          // IPv6 link-local
    /^fc00:/,          // IPv6 unique local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Auto-detect timezone for a patient based on available information
 * Priority: 1. Postcode, 2. IP address, 3. Default to UK
 */
export async function autoDetectTimezone(
  postcode?: string | null,
  ipAddress?: string | null
): Promise<TimezoneInfo> {
  // Try postcode first (most accurate for UK patients)
  if (postcode) {
    return detectTimezoneFromPostcode(postcode);
  }
  
  // Fallback to IP address
  if (ipAddress) {
    return await detectTimezoneFromIP(ipAddress);
  }
  
  // Default to UK timezone
  return getTimezoneInfo(UK_TIMEZONE);
}

/**
 * Format timezone for display
 * @param timezone - IANA timezone string
 * @returns Human-readable timezone string (e.g., "GMT+0" or "BST+1")
 */
export function formatTimezone(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    
    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find(part => part.type === "timeZoneName")?.value || timezone;
    
    return timeZoneName;
  } catch (error) {
    return timezone;
  }
}
