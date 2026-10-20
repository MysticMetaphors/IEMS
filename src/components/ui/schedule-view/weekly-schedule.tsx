import type { ClassSessionRow } from "@/db/classes/sessions";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/**
 * Schedule grid with two views:
 *   "day"  -> 1 column  (the chosen date)
 *   "week" -> 7 columns (the chosen date + the next 6 days)
 *
 * Performance notes
 *  - The grid is drawn ONCE for the whole width (23 hour lines + a few column
 *    separators) instead of 24 pressable cells per day (168 views before).
 *  - Each day column has a single touch area; the tapped hour comes from the
 *    touch position.
 *  - The header follows the horizontal scroll with a native-driven Animated
 *    value, so no JS work happens while scrolling.
 *  - Static pieces and session cards are memoized; session dates are parsed
 *    once, and the time label is built once per card.
 */

export type ScheduleView = "day" | "week";

const HOUR_HEIGHT = 37; // px per hour -> change this to zoom in/out
const COLUMN_WIDTH = 112; // px per day column (week view)
const TIME_COL_WIDTH = 70; // px for the time labels column
const HEADER_HEIGHT = 30;
const LABEL_HEIGHT = 16;
const STROKE_WIDTH = 8; // dark left stroke of a session card
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const HOUR_MS = 3_600_000;

const FALLBACK_DARK = "#6B7280";
const FALLBACK_LIGHT = "#9CA3AF";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const LINE_HOURS = HOURS.slice(1); // 1..23 (the 12 AM line is the top edge)
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // indexed by getDay()
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EMPTY_SESSIONS: ClassSessionRow[] = [];

const formatHour = (h: number) => {
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
};

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// "#dark,#light" -> { dark, light }
const parseColor = (color: string | null) => {
  const [dark, light] = (color ?? "").split(",").map((c) => c.trim());
  return { dark: dark || FALLBACK_DARK, light: light || dark || FALLBACK_LIGHT };
};

type ParsedSession = { session: ClassSessionRow; startMs: number; endMs: number };

type Placed = {
  session: ClassSessionRow;
  top: number;
  height: number;
  lane: number;
  lanes: number;
  timeLabel: string | null; // null when the card is too short to show it
};

/**
 * Places the sessions that fall on one day. Sessions that overlap in time are
 * split side by side (lanes) so they never cover each other. A session that
 * crosses midnight is clipped to this day.
 */
function layoutDay(sessions: ParsedSession[], dayStart: Date): Placed[] {
  const dayStartMs = dayStart.getTime();
  const next = new Date(dayStart);
  next.setDate(next.getDate() + 1);
  const dayEndMs = next.getTime();

  const items = sessions
    .filter((i) => i.startMs < dayEndMs && i.endMs > dayStartMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = 0;

  const flush = () => {
    cluster.forEach((p) => (p.lanes = laneEnds.length));
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = 0;
  };

  for (const item of items) {
    const startMs = Math.max(item.startMs, dayStartMs);
    const endMs = Math.min(item.endMs, dayEndMs);

    // a new group starts once nothing before it is still running
    if (cluster.length && startMs >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= startMs);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endMs);
    } else {
      laneEnds[lane] = endMs;
    }
    clusterEnd = Math.max(clusterEnd, endMs);

    const height = ((endMs - startMs) / HOUR_MS) * HOUR_HEIGHT;

    cluster.push({
      session: item.session,
      top: ((startMs - dayStartMs) / HOUR_MS) * HOUR_HEIGHT,
      height,
      lane,
      lanes: 1,
      timeLabel:
        height >= 34 ? `${formatTime(item.startMs)} - ${formatTime(item.endMs)}` : null,
    });
  }
  flush();

  return placed;
}

/* ---------------------------- static pieces ---------------------------- */

// Time labels, each centered on its line
const TimeColumn = memo(function TimeColumn() {
  return (
    <View
      style={{ width: TIME_COL_WIDTH, height: GRID_HEIGHT }}
      className="bg-neutral-100"
    >
      {LINE_HOURS.map((h) => (
        <View
          key={h}
          style={{
            position: "absolute",
            top: h * HOUR_HEIGHT - LABEL_HEIGHT / 2,
            height: LABEL_HEIGHT,
            left: 0,
            right: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text className="text-[10px] font-inter-bold text-neutral-800">
            {formatHour(h)}
          </Text>
        </View>
      ))}
    </View>
  );
});

// Hour lines across the whole width + one separator at the left of every column
const GridLines = memo(function GridLines({
  columnWidth,
  dayCount,
}: {
  columnWidth: number;
  dayCount: number;
}) {
  return (
    <>
      {LINE_HOURS.map((h) => (
        <View
          key={`h${h}`}
          pointerEvents="none"
          className="bg-border"
          style={{ position: "absolute", top: h * HOUR_HEIGHT, left: 0, right: 0, height: 1 }}
        />
      ))}
      {Array.from({ length: dayCount }, (_, i) => (
        <View
          key={`v${i}`}
          pointerEvents="none"
          className="bg-border"
          style={{ position: "absolute", top: 0, left: i * columnWidth, width: 1, height: GRID_HEIGHT }}
        />
      ))}
    </>
  );
});

/* ------------------------------ session card ------------------------------ */

const SessionCard = memo(function SessionCard({
  placed,
  onPress,
}: {
  placed: Placed;
  onPress: (session: ClassSessionRow) => void;
}) {
  const { session, top, height, lane, lanes, timeLabel } = placed;
  const { dark, light } = parseColor(session.color);

  const cancelled = session.status === "cancelled";
  const completed = session.status === "completed";
  const muted = cancelled || completed;

  const title = session.title || session.class_name;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top,
        height,
        left: `${(lane / lanes) * 100}%`,
        width: `${100 / lanes}%`,
        padding: 1.5,
      }}
    >
      <Pressable
        onPress={() => onPress(session)}
        style={{ backgroundColor: muted ? "#dedede" : light }}
        className="flex-1 flex-row overflow-hidden rounded-[10px]"
      >
        {/* Left stroke */}
        <View
          style={{
            width: STROKE_WIDTH,
            backgroundColor: muted ? "#7B7B7B" : dark,
          }}
        />

        <View className="flex-1 justify-start px-[5px] py-[5px]">
          <Text
            numberOfLines={1}
            className={`text-[10px] font-inter-bold ${
              muted ? "text-muted" : "text-white"
            } ${cancelled ? "line-through" : ""}`}
          >
            {title}
          </Text>

          {timeLabel ? (
            <Text
              numberOfLines={1}
              className={`text-[9px] font-inter ${
                muted ? "text-muted" : "text-white/90"
              }`}
            >
              {timeLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});

/* -------------------------------- component -------------------------------- */

type Props = {
  /** "day" shows 1 column, "week" shows 7 columns starting at `date`. */
  view?: ScheduleView;
  /** The filter date: the single day, or the first day of the week view. Defaults to today. */
  date?: Date;
  /** Sessions to plot (fetch the same range with getClassSessions). */
  sessions?: ClassSessionRow[];
  /** Tap on a session card. */
  onSessionPress?: (session: ClassSessionRow) => void;
  /** Tap on an empty hour slot -> receives that day at that hour. */
  onSlotPress?: (date: Date) => void;
};

export default function WeeklySchedule({
  view = "week",
  date,
  sessions = EMPTY_SESSIONS,
  onSessionPress,
  onSlotPress,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(0);

  // Horizontal offset drives the header natively (no JS per scroll frame).
  const scrollX = useRef(new Animated.Value(0)).current;
  const headerTranslateX = useMemo(() => Animated.multiply(scrollX, -1), [scrollX]);
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX]
  );

  // Keep card callbacks stable so memoized cards don't re-render.
  const sessionPressRef = useRef(onSessionPress);
  sessionPressRef.current = onSessionPress;
  const handleSessionPress = useCallback(
    (session: ClassSessionRow) => sessionPressRef.current?.(session),
    []
  );

  const dayCount = view === "day" ? 1 : 7;
  const startKey = startOfDay(date ?? new Date()).getTime();

  useEffect(() => {
    scrollX.setValue(0); // back to the start when switching views
  }, [dayCount, startKey, scrollX]);

  const days = useMemo(() => {
    const first = new Date(startKey);
    const today = new Date();

    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);

      const name = isSameDay(d, today) ? "Today" : DAY_NAMES[d.getDay()];
      return {
        date: d,
        label: `${MONTHS[d.getMonth()]} ${d.getDate()} (${name})`,
      };
    });
  }, [startKey, dayCount]);

  // parse every session's dates once
  const parsed = useMemo<ParsedSession[]>(
    () =>
      sessions.map((session) => ({
        session,
        startMs: Date.parse(session.starts_at),
        endMs: Date.parse(session.ends_at),
      })),
    [sessions]
  );

  // sessions placed per day column
  const columns = useMemo(
    () => days.map((day) => layoutDay(parsed, day.date)),
    [days, parsed]
  );

  // Week view: fixed-width columns (scroll sideways).
  // Day view: the single column fills the remaining width.
  const columnWidth =
    view === "day"
      ? Math.max(COLUMN_WIDTH, containerWidth - TIME_COL_WIDTH - 2)
      : COLUMN_WIDTH;
  const totalWidth = columnWidth * dayCount + 1;

  const onLayout = (e: LayoutChangeEvent) =>
    setContainerWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      className="flex-1 overflow-hidden rounded-[12px] border border-neutral-300 bg-white"
    >
      {/* Vertical scroll; first child (header) stays pinned */}
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* ---------- HEADER ---------- */}
        <View
          className="flex-row border-b border-border bg-neutral-100"
          style={{ height: HEADER_HEIGHT }}
        >
          <View style={{ width: TIME_COL_WIDTH }} className="bg-neutral-100" />

          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View
              style={{
                flexDirection: "row",
                width: totalWidth,
                transform: [{ translateX: headerTranslateX }],
              }}
            >
              {days.map((day) => (
                <View
                  key={day.label}
                  style={{ width: columnWidth, height: HEADER_HEIGHT - 1 }}
                  className="items-center justify-center border-l border-border"
                >
                  <Text className="text-[10px] font-inter-bold text-neutral-800">
                    {day.label}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* ---------- BODY ---------- */}
        <View className="flex-row">
          <TimeColumn />

          {/* Day columns */}
          <Animated.ScrollView
            horizontal
            scrollEnabled={dayCount > 1}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ width: totalWidth, height: GRID_HEIGHT }}>
              <GridLines columnWidth={columnWidth} dayCount={dayCount} />

              {days.map((day, dayIndex) => (
                <View
                  key={day.label}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: dayIndex * columnWidth + 1,
                    width: columnWidth - 1,
                    height: GRID_HEIGHT,
                  }}
                >
                  {/* One touch area per column; the hour comes from the touch position */}
                  <Pressable
                    disabled={!onSlotPress}
                    onPress={(e) => {
                      const hour = Math.min(
                        23,
                        Math.max(0, Math.floor(e.nativeEvent.locationY / HOUR_HEIGHT))
                      );
                      const slot = new Date(day.date);
                      slot.setHours(hour, 0, 0, 0);
                      onSlotPress?.(slot);
                    }}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  />

                  {/* Sessions, drawn on top of the grid */}
                  {columns[dayIndex].map((placed) => (
                    <SessionCard
                      key={placed.session.id}
                      placed={placed}
                      onPress={handleSessionPress}
                    />
                  ))}
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}