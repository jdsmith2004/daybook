/* The iOS side of the scripture library (ios/ScriptureVaultModule.swift): the person's Obsidian vault, kept across launches. It is
   the owner's own, in their own builds only (docs/review-plan.md, D9): a build made with DAYBOOK_SCRIPTURE=1 (app.config.js) sets
   DaybookScripture in Info.plist. Anywhere else (a store build, the web, Android, an older install) this is null, so the library
   does not appear at all. */
import { requireOptionalNativeModule } from 'expo';

export interface ScriptureVaultModule {
  /** whether this build has the library (DAYBOOK_SCRIPTURE=1) */
  readonly on: boolean;
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

const mod = requireOptionalNativeModule<ScriptureVaultModule>('ScriptureVault');
export const ScriptureVault = mod?.on ? mod : null;
