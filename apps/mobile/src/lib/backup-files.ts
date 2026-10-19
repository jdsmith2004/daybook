/* Backup files (save a full backup, restore one) are hidden from people: sync keeps the safe copy, and two ways to keep a
   log were confusing. The code stays for the owner, and shows only in a development build (npx expo start / run:ios). */
export const BACKUP_FILES = __DEV__;
