/* The iOS side of the scripture library (ios/ScriptureVaultModule.swift): the person's Obsidian vault, kept across launches. Null
   on the web, on Android and on an installed app from before this module, so the library simply does not appear there. */
import { requireOptionalNativeModule } from 'expo';

export interface ScriptureVaultModule {
  /** shows the folder picker. The vault's name, and whether it holds a Scriptures folder (only then is it kept); null when closed */
  pick(): Promise<{ name: string; ok: boolean } | null>;
  /** the kept vault's name, or null when none is kept or it is gone */
  folder(): Promise<string | null>;
  forget(): Promise<void>;
  /** what is directly in a folder of the library ("Scriptures" or below) */
  list(dir: string): Promise<{ name: string; dir: boolean }[]>;
  /** a file's text, or null when it is not there; throws when the vault (or that file, still in iCloud) is out of reach */
  read(path: string): Promise<string | null>;
  /** writes a notes file in Scriptures/Notes only when it is still `expected` (null: not there yet); false when it changed */
  swap(path: string, expected: string | null, text: string): Promise<boolean>;
}

export const ScriptureVault = requireOptionalNativeModule<ScriptureVaultModule>('ScriptureVault');
