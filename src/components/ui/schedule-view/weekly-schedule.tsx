import type { ClassSessionRow } from "@/db/classes/sessions";
import React, { useMemo, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/**
 * Weekly schedule grid (Monday -> Sunday).
 * React Native + NativeWind (Tailwind).
 *
 * Every hour row is exactly HOUR_HEIGHT px tall, and each time label is
 * centered on its grid line, so lines and times always match.
 * Sessions are plotted with absolute positioning inside their day column:
 *   top    = (startHour + startMinutes / 60) * HOUR_HEIGHT
 *   height = durationInHours * HOUR_HEIGHT
 * Session color = class color "dark,light": left stroke is dark, background is light.
 */

const HOUR_HEIGHT = 37; // px per hour -> change this to zoom in/out
const COLUMN_WIDTH = 112; // px per day column
const TIME_COL_WIDTH = 70; // px for the time labels column
const HEADER_HEIGHT = 30;
const LABEL_HEIGHT = 16;
const STROKE_WIDTH = 8; // dark left stroke of a session card

const FALLBACK_DARK = "#6B7280";
const FALLBACK_LIGHT = "#9CA3AF";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatHour = (h: number) => {
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Start from today (or the provided date), then display 7 consecutive days.
const getStartDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// "#dark,#light" -> { dark, light }
const parseColor = (color: string | null) => {
  const [dark, light] = (color ?? "").split(",").map((c) => c.trim());
  return { dark: dark || FALLBACK_DARK, light: light || dark || FALLBACK_LIGHT };
};

type Placed = {
  session: ClassSessionRow;
  start: Date;
  end: Date;
  top: number;
  height: number;
  lane: number;
  lanes: number;
};

/**
 * Places the sessions that fall on one day. Sessions that overlap in time are
 * split side by side (lanes) so they never cover each other. A session that
 * crosses midnight is clipped to this day.
 */
function layoutDay(sessions: ClassSessionRow[], dayStart: Date): Placed[] {
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  const items = sessions
    .map((session) => ({
      session,
      start: new Date(session.starts_at),
      end: new Date(session.ends_at),
    }))
    .filter((i) => i.start.getTime() < dayEndMs && i.end.getTime() > dayStartMs)
    .sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime()
    );

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
    const startMs = Math.max(item.start.getTime(), dayStartMs);
    const endMs = Math.min(item.end.getTime(), dayEndMs);

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

    cluster.push({
      session: item.session,
      start: item.start,
      end: item.end,
      top: ((startMs - dayStartMs) / 3_600_000) * HOUR_HEIGHT,
      height: ((endMs - startMs) / 3_600_000) * HOUR_HEIGHT,
      lane,
      lanes: 1,
    });
  }
  flush();

  return placed;
}

function SessionCard({
  placed,
  onPress,
}: {
  placed: Placed;
  onPress?: (session: ClassSessionRow) => void;
}) {
  const { session, start, end, top, height, lane, lanes } = placed;
  const { dark, light } = parseColor(session.color);
  const cancelled = session.status === "cancelled";
  const title = session.title || session.class_name;
  const showTime = height >= 34; // hide the time line when the card is too short

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
        onPress={() => onPress?.(session)}
        style={{ backgroundColor: light, opacity: cancelled ? 0.5 : 1 }}
        className="flex-1 flex-row overflow-hidden rounded-[10px]"
      >
        {/* dark left stroke */}
        <View style={{ width: STROKE_WIDTH, backgroundColor: dark }} />

        <View className="flex-1 justify-start px-[5px] py-[5px]">
          <Text
            numberOfLines={1}
            className={`text-[10px] font-inter-bold text-white ${cancelled ? "line-through" : ""
              }`}
          >
            {title}
          </Text>
          {showTime ? (
            <Text numberOfLines={1} className="text-[9px] font-inter text-white/90">
              {formatTime(start)} - {formatTime(end)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

type Props = {
  /** Any date inside the week you want to show. Defaults to today. */
  weekOf?: Date;
  /** Sessions to plot (fetch the week with getClassSessions). */
  sessions?: ClassSessionRow[];
  /** Tap on a session card. */
  onSessionPress?: (session: ClassSessionRow) => void;
  /** Tap on an empty hour slot -> receives that day at that hour. */
  onSlotPress?: (date: Date) => void;
};

export default function WeeklySchedule({
  weekOf,
  sessions = [],
  onSessionPress,
  onSlotPress,
}: Props) {
  const headerScrollRef = useRef<ScrollView>(null);
  const weekKey = getStartDate(weekOf ?? new Date()).getTime();

  const days = useMemo(() => {
    const startDate = new Date(weekKey);

    return DAY_NAMES.map((name, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      return {
        name: i === 0 ? "Today" : name,
        date,
        label: `${MONTHS[date.getMonth()]} ${date.getDate()} (${i === 0 ? "Today" : name
          })`,
      };
    });
  }, [weekKey]);

  // sessions placed per day column
  const columns = useMemo(
    () => days.map((day) => layoutDay(sessions, day.date)),
    [days, sessions]
  );

  // keep the header in sync with the horizontal scroll of the body
  const onBodyScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({
      x: e.nativeEvent.contentOffset.x,
      animated: false,
    });
  };

  return (
    <View className="flex-1 overflow-hidden rounded-[12px] border border-neutral-300 bg-white">
      {/* Vertical scroll; first child (header) stays pinned */}
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* ---------- HEADER ---------- */}
        <View
          className="flex-row border-b border-border bg-neutral-100"
          style={{ height: HEADER_HEIGHT }}
        >
          <View style={{ width: TIME_COL_WIDTH }} className="bg-neutral-100" />
          <ScrollView
            ref={headerScrollRef}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
          >
            {days.map((day) => (
              <View
                key={day.label}
                style={{ width: COLUMN_WIDTH }}
                className="items-center justify-center border-l border-border"
              >
                <Text className="text-[10px] font-inter-bold text-neutral-800">
                  {day.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ---------- BODY ---------- */}
        <View className="flex-row">
          {/* Time labels, each centered on its line */}
          <View
            style={{ width: TIME_COL_WIDTH, height: HOUR_HEIGHT * 24 }}
            className="bg-neutral-100"
          >
            {HOURS.slice(1).map((h) => (
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

          {/* Day columns */}
          <ScrollView
            horizontal
            onScroll={onBodyScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            {days.map((day, dayIndex) => (
              <View
                key={day.label}
                style={{ width: COLUMN_WIDTH, height: HOUR_HEIGHT * 24 }}
                className="border-l border-border"
              >
                {/* Hour lines: the top border of each cell is the hour line */}
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    disabled={!onSlotPress}
                    onPress={() => {
                      const slot = new Date(day.date);
                      slot.setHours(h, 0, 0, 0);
                      onSlotPress?.(slot);
                    }}
                    style={{ height: HOUR_HEIGHT }}
                    className={h === 0 ? "" : "border-t border-border"}
                  />
                ))}

                {/* Sessions, drawn on top of the grid */}
                {columns[dayIndex].map((placed) => (
                  <SessionCard
                    key={`${placed.session.id}-${dayIndex}`}
                    placed={placed}
                    onPress={onSessionPress}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}