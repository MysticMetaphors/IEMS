import { useEffect } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// Same value as the `border` color in tailwind.config.js. Plain style props are
// used (not className) because the blocks are Animated.Views.
const SKELETON_COLOR = "#DFDFDF";

const PULSE_LOW = 0.45;
const PULSE_STATIC = 0.7; // opacity when the user has reduced motion turned on

/**
 * One pulse drives every skeleton on screen, so they all fade together and
 * only a single animation runs no matter how many placeholders there are. It
 * starts with the first mounted skeleton and stops with the last one.
 */
const pulse = new Animated.Value(1);
let mounted = 0;
let loop: Animated.CompositeAnimation | null = null;
let reduceMotion = false;
let watchingMotion = false;

function fade(toValue: number) {
  return Animated.timing(pulse, {
    toValue,
    duration: 800,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: Platform.OS !== "web",
  });
}

function sync() {
  if (mounted > 0 && !reduceMotion) {
    if (!loop) {
      loop = Animated.loop(Animated.sequence([fade(PULSE_LOW), fade(1)]));
      loop.start();
    }
    return;
  }

  // Clear the reference first so a failing stop() can never leave a dead loop behind
  // that would stop the next mount from starting a new one.
  const running = loop;
  loop = null;
  running?.stop();
  pulse.setValue(reduceMotion ? PULSE_STATIC : 1);
}

function setReduceMotion(value: boolean) {
  reduceMotion = value;
  sync();
}

function watchReduceMotion() {
  if (watchingMotion) return;
  watchingMotion = true;

  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  /** Defaults to a light gray. Use a translucent white on the dark brown KPI card. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** A pulsing placeholder block for one piece of content that is still loading. */
export function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  color = SKELETON_COLOR,
  style,
}: SkeletonProps) {
  useEffect(() => {
    watchReduceMotion();
    mounted += 1;
    sync();

    return () => {
      mounted -= 1;
      sync();
    };
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color, opacity: pulse },
        style,
      ]}
    />
  );
}

type RowSkeletonProps = {
  /** Round icon at the start, like the status icon on the overview rows. */
  leading?: boolean;
  /** Small shape at the end, where the row menu or arrow is. */
  trailing?: boolean;
};

/** Placeholder with the same card shape as a student, class, session or issue row. */
export function RowSkeleton({ leading = false, trailing = true }: RowSkeletonProps) {
  return (
    <View
      className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
      style={{ minHeight: 56 }}
    >
      <View className="flex-1 flex-row items-center gap-[10px] mr-3">
        {leading ? <Skeleton width={34} height={34} radius={17} /> : null}

        <View className="flex-1 gap-[6px]">
          <Skeleton width="55%" height={12} />
          <Skeleton width="35%" height={10} />
        </View>
      </View>

      {trailing ? <Skeleton width={16} height={16} radius={8} /> : null}
    </View>
  );
}

type ListSkeletonProps = RowSkeletonProps & {
  count?: number;
  /** Read out by screen readers instead of the (meaningless) placeholder shapes. */
  label?: string;
};

/** A list of row placeholders, announced as a single "loading" element. */
export function ListSkeleton({
  count = 6,
  label = "Loading",
  leading,
  trailing,
}: ListSkeletonProps) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      className="flex gap-[10px]"
    >
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} leading={leading} trailing={trailing} />
      ))}
    </View>
  );
}
