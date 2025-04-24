/**
 * Generates a unique order number in the format ORD-YYYY-XXXX
 * where YYYY is the current year and XXXX is a random number
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `ORD-${year}-${randomPart}`;
}
