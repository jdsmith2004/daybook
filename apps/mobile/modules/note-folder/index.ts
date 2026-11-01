/* The iOS side of journal notes (ios/NoteFolderModule.swift): one picked folder, kept across launches. Null on the web, on
   Android, and on an installed app from before this module, so everything that uses it simply does not appear. */
import { requireOptionalNativeModule } from 'expo';

export interface NoteFolderModule {
  /** shows the folder picker; the folder's name, or null when it was closed */
  pick(): Promise<string | null>;
  /** the kept folder's name, or null when none is kept or it is gone */
  folder(): Promise<string | null>;
  forget(): Promise<void>;
  read(name: string): Promise<string | null>;
  write(name: string, text: string): Promise<void>;
  remove(name: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
}

export const NoteFolder = requireOptionalNativeModule<NoteFolderModule>('NoteFolder');
