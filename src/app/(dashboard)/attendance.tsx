import Arrow from "@/assets/icons/arrow.svg";
import Filter from "@/assets/icons/filter.svg";
import Absent from "@/assets/icons/status/absent.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Present from "@/assets/icons/status/present.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import AttendanceDrawer from "@/components/ui/attendance-drawer";
import Pagination from "@/components/ui/pagination";
import { ListSkeleton } from "@/components/ui/skeleton";
import { getClassSessionsPage } from "@/db/classes/sessions";
import { usePagedList } from "@/hooks/use-paged-list";
import { useSessionAttendance } from "@/hooks/use-session-attendance";
import { getDisplayStatus, type DisplaySessionStatus } from "@/lib/utils/session-status";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

type StatusStyle = {
  Icon: typeof Present;
  bg: string;
  badge?: { label: string; bg: string; text: string };
};

const STATUS_STYLE: Record<DisplaySessionStatus, StatusStyle> = {
  scheduled: { Icon: Not_Tagged, bg: "bg-gray-500/30" },
  completed: { Icon: Present, bg: "bg-green-500/30" },
  missed: {
    Icon: Absent,
    bg: "bg-red-500/30",
    badge: { label: "Missed", bg: "bg-red-500/15", text: "text-red-600" },
  },
  cancelled: {
    Icon: Not_Tagged,
    bg: "bg-gray-500/30",
    badge: { label: "Cancelled", bg: "bg-gray-500/15", text: "text-muted" },
  },
};

// Aug 7, 2026
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// 10:00 AM–10:30 AM
const formatTimeRange = (startIso: string, endIso: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)}–${fmt(endIso)}`;
};

export default function Attendance() {
  const { rows: sessions, total, page, setPage, totalPages, startIndex, endIndex, search, setSearch, loading, reload,
  } = usePagedList(getClassSessionsPage, PAGE_SIZE);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [drawerError, setDrawerError] = useState<string | null>(null);
  const {
    drawerOpen, setDrawerOpen, selected, attendance, attendanceLoading,
    openSession, handleAttendanceChange, handleMarkAllPresent,
  } = useSessionAttendance({ setError: setDrawerError });

  const hasBeenFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());

      if (hasBeenFocused.current) {
        reload();
      } else {
        hasBeenFocused.current = true;
      }
    }, [reload])
  );

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        <View className="flex flex-row gap-[10px] max-w-full">
          <SearchInput value={search} onChangeText={setSearch} className="flex-1" />
          <Button LeftIcon={Filter} />
        </View>

        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Class Sessions</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton leading label="Loading class sessions" />
          ) : sessions.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              No sessions found
            </Text>
          ) : (
            sessions.map((session) => {
              const { Icon, bg, badge } = STATUS_STYLE[getDisplayStatus(session, now)];

              return (
                <Pressable
                  key={session.id}
                  onPress={() => openSession(session)}
                  className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
                >
                  <View className="flex flex-1 flex-row items-center gap-[10px]">
                    <View className={`p-[4px] rounded-full ${bg}`}>
                      <Icon height={26} width={26} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-[6px]">
                        <Text
                          numberOfLines={1}
                          className="shrink font-inter-bold text-[12px] text-foreground"
                        >
                          {session.title || session.class_name}
                        </Text>
                        {badge ? (
                          <View className={`rounded-full px-[7px] py-[1px] ${badge.bg}`}>
                            <Text className={`font-inter-semibold text-[9px] ${badge.text}`}>
                              {badge.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="font-inter text-[10px] font-normal text-muted">
                        {formatDate(session.starts_at)} •{" "}
                        {formatTimeRange(session.starts_at, session.ends_at)}
                      </Text>
                    </View>
                  </View>

                  <Arrow
                    height={8}
                    width={8}
                    style={{
                      color: "#808080",
                      transform: [{ rotate: '180deg' }]
                    }}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel="sessions"
            setPage={setPage}
          />
        )}
      </ScrollView >

      <AttendanceDrawer
        open={drawerOpen}
        session={selected}
        attendance={attendance}
        attendanceLoading={attendanceLoading}
        onAttendanceChange={handleAttendanceChange}
        onMarkAllPresent={handleMarkAllPresent}
        onClose={() => setDrawerOpen(false)}
        error={drawerError}
      />
    </>
  );
}