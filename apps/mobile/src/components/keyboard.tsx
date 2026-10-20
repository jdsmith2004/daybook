/* Keeping a text box and its button above the on-screen keyboard. iOS scrolls a page only as far as the caret, so the lower
   edge of the box and the Save or Add button under it can stay hidden behind the keyboard. A scroll area that holds text
   boxes (Screen, SheetFrame, SceneFrame, a lesson, setup) shares its scroll with the boxes inside it (KeyboardRoom). When a
   box gets the keyboard, the nearest KeepAbove around it (the box with its button), or the box alone, moves up to just
   above the keyboard, never so far that its top leaves the screen. Every TextInput comes from components/text.tsx, which
   does this by itself. On iOS a sheet measures from its own top edge while the keyboard is placed on the whole screen, so a
   room inside a sheet says how far down the sheet starts (onLayout of its outer view). */
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode, type Ref, type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  View,
  type HostInstance,
  type LayoutChangeEvent,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Scroll = RefObject<ScrollViewInstance | null>;
interface Room {
  scroll: Scroll;
  /** how far below the top of the screen this room's window starts (a sheet), 0 for a full page */
  shift: RefObject<number>;
}
const RoomCtx = createContext<Room | null>(null);
const KeepCtx = createContext<RefObject<HostInstance | null> | null>(null);

/** room between the button and the keyboard */
const GAP = 12;
/** the highest a box's top goes: under the clock, with the page's title gone */
const TOP = 64;

/** for a scroll area that holds text boxes: a ref for its ScrollView (joined with one passed in), its room for KeyboardRoom,
    and, for a sheet (card), an onLayout for the sheet's outer view, which reaches the bottom of the screen */
export function useKeyboardRoom(outer?: Ref<ScrollViewInstance>, card = false) {
  const scroll = useRef<ScrollViewInstance | null>(null);
  const shift = useRef(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      shift.current = card ? Math.max(0, Dimensions.get('window').height - e.nativeEvent.layout.height) : 0;
    },
    [card],
  );
  const room = useMemo(() => ({ scroll, shift }), []);
  const ref = useCallback(
    (v: ScrollViewInstance | null) => {
      scroll.current = v;
      if (typeof outer === 'function') outer(v);
      else if (outer) (outer as { current: ScrollViewInstance | null }).current = v;
    },
    [outer],
  );
  return { ref, room, onLayout };
}

/** a full page or moment needs only its scroll; a sheet passes the room from useKeyboardRoom */
export function KeyboardRoom({ room, scroll, children }: { room?: Room; scroll?: Scroll; children: ReactNode }) {
  const zero = useRef(0);
  const value = useMemo(() => room ?? (scroll ? { scroll, shift: zero } : null), [room, scroll]);
  return <RoomCtx.Provider value={value}>{children}</RoomCtx.Provider>;
}

/** a text box with what belongs to it (its Save, Add or Done): they come up above the keyboard together */
export function KeepAbove({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const ref = useRef<HostInstance | null>(null);
  return (
    <KeepCtx.Provider value={ref}>
      <View ref={ref} collapsable={false} style={style}>
        {children}
      </View>
    </KeepCtx.Provider>
  );
}

/** what a text box calls when it gets the keyboard */
export function useRevealOnFocus(own: RefObject<HostInstance | null>) {
  const room = useContext(RoomCtx);
  const keep = useContext(KeepCtx);
  return useCallback(() => {
    if (Platform.OS !== 'ios' || !room) return;
    const go = (screenY: number) => {
      const kbTop = screenY - room.shift.current;
      const sv = room.scroll.current;
      const t = keep?.current ?? own.current;
      const inner = sv?.getInnerViewRef();
      if (!sv || !t || !inner) return;
      t.measureInWindow((_x, ty, _w, th) => {
        if (ty + th + GAP <= kbTop) return;
        sv.measureInWindow((_a, svTop) => {
          t.measureLayout(inner, (_l, cy) => {
            const want = cy + th + GAP - (kbTop - svTop);
            sv.scrollTo({ y: Math.max(0, Math.min(want, cy - Math.max(0, TOP - svTop))), animated: true });
          });
        });
      });
    };
    const m = Keyboard.metrics();
    /* the keyboard is up already (moving from box to box): let iOS finish its own scroll to the caret first */
    if (Keyboard.isVisible() && m) {
      setTimeout(() => go(m.screenY), 280);
      return;
    }
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      sub.remove();
      go(e.endCoordinates.screenY);
    });
    setTimeout(() => sub.remove(), 1500);
  }, [room, keep, own]);
}
