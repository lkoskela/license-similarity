/**
 * Method for computing the length of a license text.
 *
 * @param text The license text to compute the length of.
 * @returns Length of the text as measured in meaningful (alphabetic) characters.
 */
export const computeLength = (text: string): number => text.replace(/[^a-zA-Z]/g, '').length
