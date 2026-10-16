/* Backups in a browser: an ordinary file picker and an ordinary download. */
import * as DocumentPicker from 'expo-document-picker';

export async function pickBackupText(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '.json'] });
  if (r.canceled || !r.assets?.length) return null;
  const a = r.assets[0];
  if (a.file) return a.file.text();
  return (await fetch(a.uri)).text();
}

export async function saveBackupFile(name: string, text: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
