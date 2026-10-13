import Button from "@/components/button";
import Drawer from "@/components/ui/drawer";
import { getStudents } from "@/db/student/student";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export type Student = Awaited<ReturnType<typeof getStudents>>[number];
export type DrawerMode = "add" | "edit" | "view";

export type StudentFormPayload = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

type StudentDrawerProps = {
  open: boolean;
  mode: DrawerMode;
  initial: Student | null;
  onClose: () => void;
  onCreate: (input: StudentFormPayload) => void;
  onUpdate: (input: StudentFormPayload & { id: Student["id"] }) => void;
  onEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
  saveError: string | null;
};

type FormState = StudentFormPayload & {
  formError: string;
};

function buildFormState(initial: Student | null): FormState {
  return {
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
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

export default function StudentDrawer({
  open,
  mode,
  initial,
  onClose,
  onCreate,
  onUpdate,
  onEdit,
  onDelete,
  isSaving,
  saveError,
}: StudentDrawerProps) {
  const readOnly = mode === "view";
  const [form, setForm] = useState<FormState>(() => buildFormState(initial));

  // Single helper for updating any one field.
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Reset the form whenever the drawer opens or a different student/mode loads.
  const key = `${mode}-${initial?.id ?? "new"}`;
  useEffect(() => {
    if (open) setForm(buildFormState(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

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
            <Pressable
              disabled={isSaving}
              onPress={onClose}
              className="items-center py-2 px-[12px]"
            >
              <Text className={`font-inter-semibold text-[12px] text-muted ${readOnly ? "px-[17px] rounded-[12px] h-[44px] bg-black flex flex-row gap-[8px] items-center w-fit text-white" : ""}`}>
                {readOnly ? "Close" : "Cancel"}
              </Text>
            </Pressable>

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

        <View className="gap-[8px]">
          <Text className="font-inter-semibold text-[12px]">Enroll in Classes</Text>
        </View>

        {form.formError ? (
          <Text className="font-inter text-[12px] text-red-600">{form.formError}</Text>
        ) : null}
        {saveError ? (
          <Text className="font-inter text-[12px] text-red-600">{saveError}</Text>
        ) : null}

        {!readOnly && (
          <Text className="font-inter text-[10px] text-muted">
            Student information is saved locally on this device.
          </Text>
        )}
      </View>
    </Drawer>
  );
}