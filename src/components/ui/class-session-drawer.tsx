import Button from "@/components/button";
import type { ClassItem } from "@/components/ui/class-drawer";
import DatetimePickerField from "@/components/ui/datetime-picker";
import Drawer from "@/components/ui/drawer";
import type { AttendanceStatus, SessionAttendanceRow } from "@/db/classes/attendance";
import type { ClassSessionRow, SessionStatus } from "@/db/classes/sessions";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import AttendanceDropdown from "../attendanceDropdown";

export type SessionItem = ClassSessionRow;
export type SessionDrawerMode = "add" | "edit" | "view";

export type SessionFormPayload = {
  class_id: string;
  title: string;
  starts_at: Date;
  ends_at: Date;
  status: SessionStatus;
};

type SessionDrawerProps = {
  open: boolean;
  mode: SessionDrawerMode;
  initial: SessionItem | null;
  /** Classes a session can belong to. */
  classes: ClassItem[];
  /** Optional prefill when adding (e.g. the grid cell the user tapped). */
  defaultStart?: Date;
  defaultClassId?: string;
  /** Roster of the session (enrolled students + their attendance). */
  attendance?: SessionAttendanceRow[];
  attendanceLoading?: boolean;
  showActions?: boolean;
  /** A student's attendance was changed (saved right away by the parent). */
  onAttendanceChange?: (studentId: string, status: AttendanceStatus) => void;
  /** Mark every student that has no attendance yet as present. */
  onMarkAllPresent?: () => void;
  onClose: () => void;
  onCreate: (input: SessionFormPayload) => void;
  onUpdate: (input: SessionFormPayload & { id: SessionItem["id"] }) => void;
  onStatusChange?: (status: SessionStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
  saveError: string | null;
};

type FormState = {
  classId: string;
  title: string;
  date: Date; // only the day part is used
  start: Date; // only the time part is used
  end: Date; // only the time part is used
  status: SessionStatus;
  formError: string;
};

const TITLES: Record<SessionDrawerMode, string> = {
  add: "New Session",
  edit: "Edit Session",
  view: "Session Details",
};

const STATUSES: SessionStatus[] = ["scheduled", "completed", "cancelled"];
const HOUR_MS = 60 * 60 * 1000;

// Attendance: "• Present" -> the dot carries the color
export const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "#16A34A" }, // green
  { value: "absent", label: "Absent", color: "#DC2626" }, // red
  { value: "late", label: "Late", color: "#F59E0B" }, // amber
  { value: "excused", label: "Excused", color: "#3B82F6" }, // blue
];

function nextFullHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

// Combine the day of `day` with the clock time of `time`.
function merge(day: Date, time: Date) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0
  );
}

function buildFormState(
  initial: SessionItem | null,
  defaultStart?: Date,
  defaultClassId?: string
): FormState {
  const start = initial ? new Date(initial.starts_at) : (defaultStart ?? nextFullHour());
  const end = initial ? new Date(initial.ends_at) : new Date(start.getTime() + HOUR_MS);

  return {
    classId: initial?.class_id ?? defaultClassId ?? "",
    title: initial?.title ?? "",
    date: start,
    start,
    end,
    status: initial?.status ?? "scheduled",
    formError: "",
  };
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <View
      className={`h-[20px] w-[20px] items-center justify-center rounded-full border ${checked ? "border-foreground" : "border-border"
        }`}
    >
      {checked ? <View className="h-[10px] w-[10px] rounded-full bg-foreground" /> : null}
    </View>
  );
}

export default function SessionDrawer({
  open,
  mode,
  initial,
  classes,
  defaultStart,
  defaultClassId,
  attendance = [],
  attendanceLoading = false,
  showActions = true,
  onAttendanceChange,
  onMarkAllPresent,
  onClose,
  onCreate,
  onUpdate,
  onStatusChange,
  onEdit,
  onDelete,
  isSaving,
  saveError,
}: SessionDrawerProps) {
  const readOnly = mode === "view";
  const editable = !readOnly && !isSaving;
  const [form, setForm] = useState<FormState>(() =>
    buildFormState(initial, defaultStart, defaultClassId)
  );
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Reset whenever the drawer opens or a different session/mode loads.
  const key = `${mode}-${initial?.id ?? "new"}-${defaultStart?.getTime() ?? ""}-${defaultClassId ?? ""}`;
  useEffect(() => {
    if (open) setForm(buildFormState(initial, defaultStart, defaultClassId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  // In view mode only the chosen class is listed; otherwise every class.
  const visibleClasses = useMemo(
    () => classes.filter((c) => !readOnly || c.id === form.classId),
    [classes, readOnly, form.classId]
  );

  const markedCount = useMemo(() => attendance.filter((r) => r.status).length, [attendance]);
  const hasUnmarked = markedCount < attendance.length;

  function handleStartChange(next: Date) {
    setForm((prev) => {
      // keep the end after the start: if not, push it to start + 1 hour
      const startAt = merge(prev.date, next);
      const endAt = merge(prev.date, prev.end);
      const end = endAt.getTime() > startAt.getTime() ? prev.end : new Date(startAt.getTime() + HOUR_MS);
      return { ...prev, start: next, end };
    });
  }

  function handleSubmit() {
    if (readOnly) return;

    if (!form.classId) {
      set("formError", "Please choose a class.");
      return;
    }

    const starts_at = merge(form.date, form.start);
    const ends_at = merge(form.date, form.end);

    if (ends_at.getTime() <= starts_at.getTime()) {
      set("formError", "End time must be after the start time.");
      return;
    }

    const payload: SessionFormPayload = {
      class_id: form.classId,
      title: form.title.trim(),
      starts_at,
      ends_at,
      status: form.status,
    };

    if (mode === "edit" && initial) {
      onUpdate({ id: initial.id, ...payload });
    } else {
      onCreate(payload);
    }
  }

  return (
    <Drawer
      visible={open}
      onClose={onClose}
      title={TITLES[mode]}
      visible_closeButton={true}
      footer={
        <View className="flex-1 flex-row items-center justify-between gap-[16px]">
          {/* Left side */}
          <View className="flex-row items-center gap-[8px]">
            {readOnly && showActions && (
              <>
                <Pressable onPress={onEdit} className="items-center py-2 px-[12px]">
                  <Text className="font-inter-semibold text-[12px] text-muted">Edit</Text>
                </Pressable>
                <Pressable onPress={onDelete} className="items-center py-2 px-[12px]">
                  <Text className="font-inter-semibold text-[12px] text-red-600">Delete</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Right side */}
          <View className="flex-row items-center gap-[16px]">
            {readOnly && (
              <Button
                label="Close"
                onPress={onClose}
                disabled={isSaving}
                classname={`${readOnly ? "px-[17px] rounded-[12px] h-[44px] bg-black flex flex-row gap-[8px] items-center w-fit text-white" : ""}`}
              />
            )}

            {!readOnly && (
              <Pressable
                disabled={isSaving}
                onPress={onClose}
                className="items-center py-2 px-[12px]"
              >
                <Text className={`font-inter-semibold text-[12px] text-muted`}>
                  Cancel
                </Text>
              </Pressable>
            )}

            {!readOnly && (
              <Button
                label={isSaving ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Session"}
                onPress={handleSubmit}
              />
            )}
          </View>
        </View>
      }
    >
      <View className="gap-[18px] pt-3">
        {/* Class (the session color comes from this class) */}
        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Class *</Text>

          <View className="rounded-[12px] border border-border">
            {visibleClasses.length === 0 ? (
              <Text className="font-inter text-[12px] text-muted text-center py-5">
                No classes yet. Add a class first.
              </Text>
            ) : (
              <ScrollView nestedScrollEnabled className="max-h-[200px]">
                {visibleClasses.map((cls, index) => {
                  const checked = form.classId === cls.id;
                  const dot = cls.color?.split(",")[0] || "#A9A9A9";
                  return (
                    <Pressable
                      key={cls.id}
                      disabled={!editable}
                      onPress={() => {
                        setForm((prev) => ({
                          ...prev,
                          classId: cls.id,
                          title: cls.name,
                        }));
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked, disabled: !editable }}
                      className={`flex-row items-center gap-[12px] px-[14px] py-[12px] ${index > 0 ? "border-t border-border" : ""
                        }`}
                    >
                      <Radio checked={checked} />
                      <View
                        style={{ backgroundColor: dot }}
                        className="h-[10px] w-[10px] rounded-full"
                      />
                      <View className="flex-1">
                        <Text className="font-inter-semibold text-[12px] text-foreground">
                          {cls.name}
                        </Text>
                        {cls.subject ? (
                          <Text className="font-inter text-[10px] text-muted">{cls.subject}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Title */}
        <View className="gap-[8px] hidden">
          <Text className="font-inter-semibold text-[12px]">Title</Text>
          <TextInput
            value={form.title}
            placeholder="Select a class first"
            placeholderTextColor="#A9A9A9"
            editable={false}
            className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground opacity-70"
          />
        </View>

        {/* Date & time */}
        <DatetimePickerField
          label="Date *"
          mode="date"
          value={form.date}
          disabled={!editable}
          onChange={(d) => set("date", d)}
        />
        <View className="flex-row gap-4">
          <View className="flex-1">
            <DatetimePickerField
              label="Start Time *"
              mode="time"
              value={form.start}
              disabled={!editable}
              onChange={handleStartChange}
            />
          </View>

          <View className="flex-1">
            <DatetimePickerField
              label="End Time *"
              mode="time"
              value={form.end}
              disabled={!editable}
              onChange={(d) => set("end", d)}
            />
          </View>
        </View>

        {/* Status (only meaningful once the session exists) */}
        {mode !== "add" && (
          <View className="gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">Status</Text>
            <View className="flex-row gap-[10px]">
              {STATUSES.map((status) => {
                const isSelected = form.status === status;
                return (
                  <Pressable
                    key={status}
                    disabled={isSaving}
                    onPress={() => {
                      set("status", status);
                      // view mode has no Save button, so save right away
                      if (readOnly && status !== form.status) onStatusChange?.(status);
                    }}
                    className={`flex-1 items-center rounded-[12px] border py-[11px] ${isSelected ? "border-foreground bg-card" : "border-border"
                      } ${isSaving && !isSelected ? "opacity-40" : ""}`}
                  >
                    <Text
                      className={`font-inter-semibold text-[12px] capitalize ${isSelected ? "text-foreground" : "text-muted"
                        }`}
                    >
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Attendance (only once the session exists). Tap a student to change the status. */}
        {mode !== "add" && initial && (
          <View className="gap-[8px]">
            <View className="flex-row items-center justify-between">
              <Text className="font-inter-semibold text-[12px]">
                Attendance{" "}
                <Text className="font-inter text-[12px] text-muted">
                  ({markedCount}/{attendance.length})
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
                <ScrollView nestedScrollEnabled className="max-h-[300px]">
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
                        onChange={(status) => onAttendanceChange?.(row.student_id, status)}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {form.formError ? (
          <Text className="font-inter text-[12px] text-red-600">{form.formError}</Text>
        ) : null}
        {saveError ? (
          <Text className="font-inter text-[12px] text-red-600">{saveError}</Text>
        ) : null}
      </View>
    </Drawer>
  );
}