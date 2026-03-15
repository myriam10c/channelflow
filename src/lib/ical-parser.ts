/**
 * iCal Parser - Handles RFC 5545 format iCalendar feeds
 * Specifically designed for Airbnb and similar calendar exports
 */

export interface ICalEvent {
  uid: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  rrule?: string;
}

/**
 * Parse iCal feed from a URL
 * Fetches the URL and parses the iCal content
 */
export async function parseICalFeed(url: string): Promise<ICalEvent[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChannelFlow/1.0)',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
    }

    const icalContent = await response.text();
    return parseICalContent(icalContent);
  } catch (error) {
    console.error('Error parsing iCal feed:', error);
    throw new Error(`Failed to parse iCal feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse raw iCal content string
 * Extracts VEVENT blocks and parses them
 */
export function parseICalContent(content: string): ICalEvent[] {
  const events: ICalEvent[] = [];

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');

  // Extract VEVENT blocks
  const eventMatches = normalizedContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  eventMatches.forEach((eventBlock) => {
    try {
      const event = parseVEvent(eventBlock);
      if (event) {
        events.push(event);
      }
    } catch (error) {
      console.warn('Failed to parse event block:', error);
    }
  });

  return events;
}

/**
 * Parse a single VEVENT block
 */
function parseVEvent(eventBlock: string): ICalEvent | null {
  const properties: Record<string, string> = {};

  // Split into lines and handle line folding (continued lines)
  const lines = eventBlock.split('\n');
  let currentLine = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle line folding (RFC 5545 section 3.1)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentLine += line.substring(1);
    } else {
      if (currentLine) {
        parseProperty(currentLine, properties);
      }
      currentLine = line;
    }
  }

  // Don't forget the last line
  if (currentLine) {
    parseProperty(currentLine, properties);
  }

  // Extract required fields
  const uid = properties['UID'];
  const dtstart = properties['DTSTART'];
  const dtend = properties['DTEND'];
  let summary = properties['SUMMARY'] || properties['SUMMARY;LANGUAGE=en'];
  const description = properties['DESCRIPTION'];
  const location = properties['LOCATION'];
  const rrule = properties['RRULE'];

  // Decode any percent-encoded characters
  if (summary) {
    summary = decodeURIComponent(summary.replace(/%/g, '%'));
  }

  // Return null if missing required fields
  if (!uid || !dtstart || !dtend || !summary) {
    return null;
  }

  return {
    uid: uid.trim(),
    title: summary.trim(),
    description: description?.trim(),
    startDate: parseICalDate(dtstart),
    endDate: parseICalDate(dtend),
    location: location?.trim(),
    rrule,
  };
}

/**
 * Parse a single iCal property line
 */
function parseProperty(line: string, properties: Record<string, string>): void {
  // Skip empty lines and comments
  if (!line.trim() || line.trim().startsWith('BEGIN:') || line.trim().startsWith('END:')) {
    return;
  }

  // Find the colon that separates property name from value
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return;
  }

  const key = line.substring(0, colonIndex).trim();
  const value = line.substring(colonIndex + 1);

  // Store the property
  if (key && value) {
    properties[key] = value;
  }
}

/**
 * Parse iCal date format to ISO string
 * Handles:
 * - 20240115 (all-day date)
 * - 20240115T140000Z (UTC datetime)
 * - 20240115T140000 (local datetime)
 */
function parseICalDate(dateStr: string): string {
  const trimmed = dateStr.trim();

  if (trimmed.length === 8) {
    // All-day format: YYYYMMDD
    const year = trimmed.substring(0, 4);
    const month = trimmed.substring(4, 6);
    const day = trimmed.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  if (trimmed.includes('T')) {
    // DateTime format: YYYYMMDDTHHmmss[Z]
    const year = trimmed.substring(0, 4);
    const month = trimmed.substring(4, 6);
    const day = trimmed.substring(6, 8);
    const hour = trimmed.substring(9, 11);
    const minute = trimmed.substring(11, 13);
    const second = trimmed.substring(13, 15);

    const dateObj = trimmed.endsWith('Z')
      ? new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ))
      : new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        );

    return dateObj.toISOString();
  }

  throw new Error(`Invalid iCal date format: ${dateStr}`);
}

/**
 * Generate an iCal VEVENT string from event data
 * Used for exporting reservations to iCal format
 */
export function generateVEvent(event: {
  uid: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}): string {
  const formatICalDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const second = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${minute}${second}Z`;
  };

  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTART:${formatICalDate(event.startDate)}`,
    `DTEND:${formatICalDate(event.endDate)}`,
    `SUMMARY:${escapeICalString(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalString(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalString(event.location)}`);
  }

  lines.push('DTSTAMP:' + formatICalDate(new Date()));
  lines.push('CREATED:' + formatICalDate(new Date()));
  lines.push('LAST-MODIFIED:' + formatICalDate(new Date()));
  lines.push('SEQUENCE:0');
  lines.push('STATUS:CONFIRMED');
  lines.push('TRANSP:OPAQUE');
  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

/**
 * Escape special characters in iCal strings
 */
function escapeICalString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
