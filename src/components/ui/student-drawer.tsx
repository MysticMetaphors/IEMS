import Button from "@/components/button";
import Drawer from "@/components/ui/drawer";
import type { getClasses } from "@/db/classes/classes";
import { getStudents } from "@/db/student/student";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export type Student = Awaited<ReturnType<typeof getStudents>>[number];
type ClassOption = Awaited<ReturnType<typeof getClasses>>[number];
export type DrawerMode = "add" | "edit" | "view";

export type StudentFormPayload = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  classIds: string[]; // classes to enroll the student in
};

type StudentDrawerProps = {
  open: boolean;
  mode: DrawerMode;
  initial: Student | null;
  /** Every class a student can be enrolled in. */
  classes: ClassOption[];
  /** Class ids the student is currently enrolled in (empty when adding). */
  initialClassIds: string[];
  onClose: () => void;
  onCreate: (input: StudentFormPayload) => void;
  onUpdate: (input: StudentFormPayload & { id: Student["id"] }) => void;
  onEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
  saveError: string | null;
};

type FormState = Omit<StudentFormPayload, "classIds"> & {
  classIds: string[];
  classSearch: string;
  formError: string;
};

function buildFormState(initial: Student | null, classIds: string[]): FormState {
  return {
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
    classIds,
    classSearch: "",
    formError: "",
  };
}

const TITLES: Record<DrawerMode, string> = {
  add: "New Student",
  edit: "Edit Student",
  view: "Student Details",
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

export default function StudentDrawer({
  open,
  mode,
  initial,
  classes,
  initialClassIds,
  onClose,
  onCreate,
  onUpdate,
  onEdit,
  onDelete,
  isSaving,
  saveError,
}: StudentDrawerProps) {
  const readOnly = mode === "view";
  const [form, setForm] = useState<FormState>(() => buildFormState(initial, initialClassIds));

  // Single helper for updating any one field.
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Reset the form whenever the drawer opens or a different student/mode loads.
  // initialClassIds is joined so a freshly loaded enrollment list also resets the checkboxes.
  const key = `${mode}-${initial?.id ?? "new"}-${initialClassIds.join(",")}`;
  useEffect(() => {
    if (open) setForm(buildFormState(initial, initialClassIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const selected = useMemo(() => new Set(form.classIds), [form.classIds]);

  // View mode lists only enrolled classes. Otherwise list active classes, plus any
  // archived class the student is already in so it can still be unchecked.
  const visibleClasses = useMemo(() => {
    const query = form.classSearch.trim().toLowerCase();
    return classes.filter((c) => {
      if (readOnly) return selected.has(c.id);
      if (c.status === "archived" && !selected.has(c.id)) return false;
      return !query || `${c.name} ${c.subject ?? ""}`.toLowerCase().includes(query);
    });
  }, [classes, form.classSearch, readOnly, selected]);

  function toggleClass(id: string) {
    if (readOnly || isSaving) return;
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(id)
        ? prev.classIds.filter((c) => c !== id)
        : [...prev.classIds, id],
    }));
  }

  function handleSubmit() {
    if (readOnly) return;

    const name = form.name.trim();
    if (!name) {
      set("formError", "Please enter the student's name.");
      return;
    }

    const payload: StudentFormPayload = {
      name,
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      classIds: form.classIds,
    };

    if (mode === "edit" && initial) {
      onUpdate({ id: initial.id, ...payload });
    } else {
      onCreate(payload);
    }
  }

  const editable = !readOnly && !isSaving;

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
                  <Text className="font-inter-semibold text-[12px] text-muted">
                    Edit
                  </Text>
                </Pressable>
                <Pressable onPress={onDelete} className="items-center py-2 px-[12px]">
                  <Text className="font-inter-semibold text-[12px] text-red-600">
                    Delete
                  </Text>
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
                label={
                  isSaving
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Student"
                }
                onPress={handleSubmit}
              />
            )}
          </View>
        </View>
      }
    >
      <View className="gap-[18px] pt-3">
        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Student Name *</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => set("name", v)}
            placeholder="Enter student's full name"
            placeholderTextColor="#A9A9A9"
            autoCapitalize="words"
            autoCorrect={false}
            editable={editable}
            className={INPUT_CLASS}
          />
        </View>

        <View className="flex flex-row gap-[16px]">
          <View className="flex-1 gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">Email</Text>
            <TextInput
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder={readOnly ? "—" : "Enter email (optional)"}
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={editable}
              className={INPUT_CLASS}
            />
          </View>

          <View className="flex-1 gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">Contact</Text>
            <TextInput
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              placeholder={readOnly ? "—" : "Enter contact number (optional)"}
              placeholderTextColor="#A9A9A9"
              keyboardType="phone-pad"
              editable={editable}
              className={INPUT_CLASS}
            />
          </View>
        </View>

        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Notes</Text>
          <TextInput
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
            placeholder={readOnly ? "—" : "Additional student information (optional)"}
            placeholderTextColor="#A9A9A9"
            multiline
            textAlignVertical="top"
            editable={editable}
            className={`min-h-[100px] ${INPUT_CLASS}`}
          />
        </View>

        {/* Enroll in classes */}
        <View className="gap-[8px]">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-semibold text-[12px]">
              {readOnly ? "Enrolled Classes" : "Enroll in Classes"}{" "}
              <Text className="font-inter text-[12px] text-muted">({form.classIds.length})</Text>
            </Text>

            {editable && form.classIds.length > 0 && (
              <Pressable onPress={() => set("classIds", [])}>
                <Text className="font-inter-semibold text-[12px] text-muted">Clear</Text>
              </Pressable>
            )}
          </View>

          {!readOnly && classes.length >= 10 && (
            <TextInput
              value={form.classSearch}
              onChangeText={(v) => set("classSearch", v)}
              placeholder="Search classes"
              placeholderTextColor="#A9A9A9"
              editable={!isSaving}
              className={INPUT_CLASS}
            />
          )}

          <View className="rounded-[12px] border border-border">
            {visibleClasses.length === 0 ? (
              <Text className="font-inter text-[12px] text-muted text-center py-5">
                {classes.length === 0
                  ? "No classes yet. Add classes first."
                  : readOnly
                    ? "Not enrolled in any class."
                    : "No classes found"}
              </Text>
            ) : (
              <ScrollView nestedScrollEnabled className="max-h-[240px]">
                {visibleClasses.map((classItem, index) => {
                  const checked = selected.has(classItem.id);
                  return (
                    <Pressable
                      key={classItem.id}
                      disabled={!editable}
                      onPress={() => toggleClass(classItem.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked, disabled: !editable }}
                      className={`flex-row items-center gap-[12px] px-[14px] py-[12px] ${index > 0 ? "border-t border-border" : ""
                        }`}
                    >
                      <Checkbox checked={checked} />
                      <View className="flex-1">
                        <Text className="font-inter-semibold text-[12px] text-foreground">
                          {classItem.name}
                        </Text>
                        {classItem.subject ? (
                          <Text className="font-inter text-[10px] text-muted">
                            {classItem.subject}
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