import AttendanceDropdown from "@/components/attendanceDropdown";
import Drawer from "@/components/ui/drawer";
import type { AttendanceStatus, SessionAttendanceRow } from "@/db/classes/attendance";
import type { ClassSessionRow } from "@/db/classes/sessions";
import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type AttendanceDrawerProps = {
  open: boolean;
  /** The session being viewed (class, date and time are shown read-only). */
  session: ClassSessionRow | null;
  /** Enrolled students + their attendance. */
  attendance: SessionAttendanceRow[];
  attendanceLoading?: boolean;
  /** A student's attendance was changed (saved right away by the parent). */
  onAttendanceChange: (studentId: string, status: AttendanceStatus) => void;
  /** Mark every student that has no attendance yet as present. */
  onMarkAllPresent?: () => void;
  onClose: () => void;
  error?: string | null;
};

// Wednesday, October 21, 2026
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// 10:00 AM – 10:30 AM
const formatTimeRange = (startIso: string, endIso: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
};

/** Non-editable field: same look as the other drawers, with a muted background. */
function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-[8px]">
      <Text className="font-inter-semibold text-[12px]">{label}</Text>
      <View className="rounded-[12px] border border-border bg-neutral-100 px-[14px] py-[13px]">
        {children}
      </View>
    </View>
  );
}

export default function AttendanceDrawer({
  open,
  session,
  attendance,
  attendanceLoading = false,
  onAttendanceChange,
  onMarkAllPresent,
  onClose,
  error,
}: AttendanceDrawerProps) {
  const markedCount = useMemo(() => attendance.filter((r) => r.status).length, [attendance]);
  const hasUnmarked = markedCount < attendance.length;

  const dot = session?.color?.split(",")[0]?.trim() || "#A9A9A9";

  return (
    <Drawer
      visible={open}
      onClose={onClose}
      title="Session Attendance"
      visible_closeButton={true}
      footer={
        <View className="flex-1 flex-row items-center justify-end">
          <Pressable onPress={onClose} className="items-center py-2 px-[12px]">
            <Text className="font-inter-semibold text-[12px] text-muted">Close</Text>
          </Pressable>
        </View>
      }
    >
      {session ? (
        <View className="gap-[18px] pt-3">
          {/* Class, date and time are shown only (not editable) */}
          <ReadOnlyField label="Class">
            <View className="flex-row items-center gap-[10px]">
              <View style={{ backgroundColor: dot }} className="h-[10px] w-[10px] rounded-full" />
              <Text className="flex-1 font-inter text-[12px] text-foreground">
                {session.class_name}
              </Text>
            </View>
          </ReadOnlyField>

          <ReadOnlyField label="Date">
            <Text className="font-inter text-[12px] text-foreground">
              {formatDate(session.starts_at)}
            </Text>
          </ReadOnlyField>

          <ReadOnlyField label="Time">
            <Text className="font-inter text-[12px] text-foreground">
              {formatTimeRange(session.starts_at, session.ends_at)}
            </Text>
          </ReadOnlyField>

          {/* Students + attendance (editable) */}
          <View className="gap-[8px]">
            <View className="flex-row items-center justify-between">
              <Text className="font-inter-semibold text-[12px]">
                Students{" "}
                <Text className="font-inter text-[12px] text-muted">
                  ({markedCount}/{attendance.length} marked)
                </Text>
              </Text>

              {hasUnmarked && onMarkAllPresent ? (
                <Pressable onPress={onMarkAllPresent}>
                  <Text className="font-inter-semibold text-[12px] text-muted">Mark all present</Text>
                </Pressable>
              ) : null}
            </View>

            <View className="rounded-[12px] border border-border">
              {attendanceLoading ? (
                <Text className="font-inter text-[12px] text-muted text-center py-5">Loading...</Text>
              ) : attendance.length === 0 ? (
                <Text className="font-inter text-[12px] text-muted text-center py-5">
                  No students enrolled in this class.
                </Text>
              ) : (
                <ScrollView nestedScrollEnabled className="max-h-[360px]">
                  {attendance.map((row, index) => (
                    <View
                      key={row.student_id}
                      className={`flex-row items-center justify-between gap-[12px] px-[14px] py-[10px] ${index > 0 ? "border-t border-border" : ""
                        }`}
                    >
                      <Text
                        numberOfLines={1}
                        className="flex-1 font-inter-semibold text-[12px] text-foreground"
                      >
                        {row.student_name}
                      </Text>

                      <AttendanceDropdown
                        value={row.status}
                        onChange={(status) => onAttendanceChange(row.student_id, status)}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {error ? (
            <Text className="font-inter text-[12px] text-red-600">{error}</Text>
          ) : null}
        </View>
      ) : null}
    </Drawer>
  );
}