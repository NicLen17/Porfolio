/** Copy can flag its key words with **double asterisks**. */
export const mark = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
