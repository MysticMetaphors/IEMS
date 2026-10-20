import Button from "@/components/button";
import Drawer from "@/components/ui/drawer";
import type { Student } from "@/components/ui/student-drawer";
import type { ClassStatus, getClasses } from "@/db/classes/classes";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export type ClassItem = Awaited<ReturnType<typeof getClasses>>[number];
export type ClassDrawerMode = "add" | "edit" | "view";

export type ClassFormPayload = {
  name: string;
  subject: string;
  description: string;
  status: ClassStatus;
  studentIds: string[]; // students to enroll in this class
};

type ClassDrawerProps = {
  open: boolean;
  mode: ClassDrawerMode;
  initial: ClassItem | null;
  /** Every student that can be enrolled. */
  students: Student[];
  /** Student ids currently enrolled in `initial` (empty when adding). */
  initialStudentIds: string[];
  onClose: () => void;
  onCreate: (input: ClassFormPayload) => void;
  onUpdate: (input: ClassFormPayload & { id: ClassItem["id"] }) => void;
  onEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
  saveError: string | null;
};

type FormState = Omit<ClassFormPayload, "studentIds"> & {
  studentIds: string[];
  studentSearch: string;
  formError: string;
};

function buildFormState(initial: ClassItem | null, studentIds: string[]): FormState {
  return {
    name: initial?.name ?? "",
    subject: initial?.subject ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "active",
    studentIds,
    studentSearch: "",
    formError: "",
  };
}

const TITLES: Record<ClassDrawerMode, string> = {
  add: "New Class",
  edit: "Edit Class",
  view: "Class Details",
};

const INPUT_CLASS =
  "border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground";

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      className={`h-[20px] w-[20px] items-center justify-center rounded-[6px] border ${checked ? "bg-foreground border-foreground" : "bg-white border-border"
        }`}
    >
      {checked ? <Text className="text-[12px] leading-[14px] text-white">✓</Text> : null}
    </View>
  );
}

export default function ClassDrawer({
  open,
  mode,
  initial,
  students,
  initialStudentIds,
  onClose,
  onCreate,
  onUpdate,
  onEdit,
  onDelete,
  isSaving,
  saveError,
}: ClassDrawerProps) {
  const readOnly = mode === "view";
  const editable = !readOnly && !isSaving;
  const [form, setForm] = useState<FormState>(() => buildFormState(initial, initialStudentIds));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Reset whenever the drawer opens or a different class/mode loads.
  // initialStudentIds is joined so a freshly loaded roster also resets the checkboxes.
  const key = `${mode}-${initial?.id ?? "new"}-${initialStudentIds.join(",")}`;
  useEffect(() => {
    if (open) setForm(buildFormState(initial, initialStudentIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const selected = useMemo(() => new Set(form.studentIds), [form.studentIds]);

  // In view mode only the enrolled students are listed; otherwise everyone (filtered).
  const visibleStudents = useMemo(() => {
    const query = form.studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (readOnly && !selected.has(s.id)) return false;
      return !query || s.name.toLowerCase().includes(query);
    });
  }, [students, form.studentSearch, readOnly, selected]);

  function toggleStudent(id: string) {
    if (!editable) return;
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  }

  function selectAllVisible() {
    setForm((prev) => ({
      ...prev,
      studentIds: Array.from(new Set([...prev.studentIds, ...visibleStudents.map((s) => s.id)])),
    }));
  }

  function clearAll() {
    set("studentIds", []);
  }

  function handleSubmit() {
    if (readOnly) return;

    const name = form.name.trim();
    if (!name) {
      set("formError", "Please enter the class name.");
      return;
    }

    const payload: ClassFormPayload = {
      name,
      subject: form.subject.trim(),
      description: form.description.trim(),
      status: form.status,
      studentIds: form.studentIds,
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
            {readOnly && (
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
                label={isSaving ? "Saving..." : mode === "edit" ? "Save Changes" : "Add Class"}
                onPress={handleSubmit}
              />
            )}
          </View>
        </View>
      }
    >
      <View className="gap-[18px] pt-3">
        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Class Name *</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => set("name", v)}
            placeholder="e.g. Grade 7 Mathematics"
            placeholderTextColor="#A9A9A9"
            autoCapitalize="words"
            editable={editable}
            className={INPUT_CLASS}
          />
        </View>

        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Subject</Text>
          <TextInput
            value={form.subject}
            onChangeText={(v) => set("subject", v)}
            placeholder={readOnly ? "—" : "Enter subject (optional)"}
            placeholderTextColor="#A9A9A9"
            autoCapitalize="words"
            editable={editable}
            className={INPUT_CLASS}
          />
        </View>

        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Description</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => set("description", v)}
            placeholder={readOnly ? "—" : "Additional class information (optional)"}
            placeholderTextColor="#A9A9A9"
            multiline
            textAlignVertical="top"
            editable={editable}
            className={`min-h-[80px] ${INPUT_CLASS}`}
          />
        </View>

        {/* Status (only meaningful once the class exists) */}
        {mode !== "add" && (
          <View className="gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">Status</Text>
            <View className="flex-row gap-[10px]">
              {(["active", "archived"] as const).map((status) => {
                const isSelected = form.status === status;
                return (
                  <Pressable
                    key={status}
                    disabled={!editable}
                    onPress={() => set("status", status)}
                    className={`flex-1 items-center rounded-[12px] border py-[11px] ${isSelected ? "border-foreground bg-card" : "border-border"
                      } ${!editable && !isSelected ? "opacity-40" : ""}`}
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

        {/* Enroll students */}
        <View className="gap-[8px]">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-semibold text-[12px]">
              {readOnly ? "Enrolled Students" : "Enroll Students"}{" "}
              <Text className="font-inter text-[12px] text-muted">({form.studentIds.length})</Text>
            </Text>

            {editable && students.length > 0 && (
              <View className="flex-row gap-[14px]">
                <Pressable onPress={selectAllVisible}>
                  <Text className="font-inter-semibold text-[12px] text-muted">Select all</Text>
                </Pressable>
                <Pressable onPress={clearAll}>
                  <Text className="font-inter-semibold text-[12px] text-muted">Clear</Text>
                </Pressable>
              </View>
            )}
          </View>

          {!readOnly && students.length >= 10 && (
            <TextInput
              value={form.studentSearch}
              onChangeText={(v) => set("studentSearch", v)}
              placeholder="Search students"
              placeholderTextColor="#A9A9A9"
              editable={!isSaving}
              className={INPUT_CLASS}
            />
          )}

          <View className="rounded-[12px] border border-border">
            {visibleStudents.length === 0 ? (
              <Text className="font-inter text-[12px] text-muted text-center py-5">
                {students.length === 0
                  ? "No students yet. Add students first."
                  : readOnly
                    ? "No students enrolled."
                    : "No students found"}
              </Text>
            ) : (
              <ScrollView nestedScrollEnabled className="max-h-[240px]">
                {visibleStudents.map((student, index) => {
                  const checked = selected.has(student.id);
                  return (
                    <Pressable
                      key={student.id}
                      disabled={!editable}
                      onPress={() => toggleStudent(student.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked, disabled: !editable }}
                      className={`flex-row items-center gap-[12px] px-[14px] py-[12px] ${index > 0 ? "border-t border-border" : ""
                        }`}
                    >
                      <Checkbox checked={checked} />
                      <View className="flex-1">
                        <Text className="font-inter-semibold text-[12px] text-foreground">
                          {student.name}
                        </Text>
                        {student.email || student.phone ? (
                          <Text className="font-inter text-[10px] text-muted">
                            {student.email || student.phone}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>

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