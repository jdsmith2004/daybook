/* Backups on iOS and Android: pick a backup file to restore, or save one and hand it to the share sheet
   (Files, AirDrop, email, Drive). The web version is backup.web.ts. */
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** the text of a file the person picks, or null if they cancel */
export async function pickBackupText(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.length) return null;
  return new File(r.assets[0].uri).text();
}

export async function saveBackupFile(name: string, text: string, mime = 'application/json'): Promise<void> {
  const f = new File(Paths.cache, name);
  f.create({ overwrite: true });
  f.writeSync(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(f.uri, {
    mimeType: mime,
    dialogTitle: 'Save ' + name,
    UTI: mime === 'text/csv' ? 'public.comma-separated-values-text' : 'public.json',
  });
}
