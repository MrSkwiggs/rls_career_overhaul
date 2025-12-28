/**
 * Time formatting utilities for Rally Loop UI
 */
export function formatMetersToKm(distance, precision = 1) {
  return (distance / 1000.0).toFixed(precision)
}