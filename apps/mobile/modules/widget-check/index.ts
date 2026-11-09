/* Whether the flame widget is on a screen (ios/WidgetCheckModule.swift). Null on the web, on Android, and on an installed app from
   before this module, so nothing that uses it appears there. */
import { requireOptionalNativeModule } from 'expo';

export interface WidgetCheckModule {
  /** the sizes of Daybook's widgets on a screen now; empty when there are none */
  placed(): Promise<string[]>;
}

export const WidgetCheck = requireOptionalNativeModule<WidgetCheckModule>('WidgetCheck');
