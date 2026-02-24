import { format, formatDistanceToNow, isValid } from "date-fns";

/**
 * safeDate — Production-grade date formatter
 * Prevents "Invalid time value" crashes by validating inputs before parsing.
 *
 * @param {any} date - The date value to format
 * @param {string} type - Formatting type ('date', 'datetime', 'relative', 'monthYear')
 * @returns {string} - Formatted date or fallback em-dash
 */
export const safeDate = (date, type = "date") => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (!isValid(parsed)) {
    return "—";
  }

  try {
    switch (type) {
      case "datetime":
        return format(parsed, "MMM dd, yyyy HH:mm");
      case "detailed":
        return format(parsed, "MMM dd, yyyy • p");
      case "time":
        return format(parsed, "pp");
      case "relative":
        return formatDistanceToNow(parsed, { addSuffix: true });
      case "monthYear":
        return format(parsed, "MMMM yyyy");
      case "date":
      default:
        return format(parsed, "MMM dd, yyyy");
    }
  } catch (error) {
    console.error("[DATE_UTILS] Error formatting date:", error);
    return "—";
  }
};
