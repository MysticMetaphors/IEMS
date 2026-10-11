import Arrow from "@/assets/icons/arrow.svg";
import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import AddStudent from "@/assets/icons/user-add-fill.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import Drawer from "@/components/ui/drawer";
import { ResetDatabaseButton } from "@/db/refresh-database/button";
import { createStudent, getStudents } from "@/db/student/student";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const PAGE_SIZE = 10;

type Student = Awaited<ReturnType<typeof getStudents>>[number];

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load students through the existing database helper.
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getStudents();
      setStudents(result);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError("Unable to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  // Search by name or email.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
    );
  }, [search, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginated = filtered.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setError("");
  };

  const handleCloseDrawer = () => {
    if (saving) return;

    setDrawerOpen(false);
    resetForm();
  };

  const handleAddStudent = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter the student's name.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createStudent({
        name: trimmedName,
        email,
        phone,
        notes,
      });

      // Refresh from SQLite so the UI reflects persisted records.
      const result = await getStudents();

      setStudents(result);
      setSearch("");
      setPage(1);
      setDrawerOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create student:", err);
      setError("Unable to save the student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isFirst = page === 1;
  const isLast = page >= totalPages;

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        {/* Search and create */}
        <View className="flex flex-row gap-[10px] max-w-full">
          <SearchInput
            value={search}
            onChangeText={handleSearch}
            className="flex-1"
          />

          <Button
            LeftIcon={AddStudent}
            label="New Student"
            onPress={() => {
              setError("");
              setDrawerOpen(true);
            }}
          />
        </View>

        {/* Column headings */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">
            Students
          </Text>

          <Text className="font-inter-semibold text-[12px]">
            Actions
          </Text>
        </View>

        {/* Student list */}
        <View className="flex gap-[10px]">
          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator />

              <Text className="font-inter text-[12px] text-muted mt-2">
                Loading students...
              </Text>
            </View>
          ) : error && students.length === 0 ? (
            <View className="items-center gap-3 py-6">
              <Text className="font-inter text-[12px] text-muted text-center">
                {error}
              </Text>

              <Pressable onPress={() => void loadStudents()}>
                <Text className="font-inter-semibold text-[12px]">
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : paginated.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              {search.trim()
                ? "No students found"
                : "No students yet. Add your first student."}
            </Text>
          ) : (
            paginated.map((student) => (
              <View key={student.id} className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card" >
                <View className="flex-1 flex-row items-center gap-[10px] mr-3">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-[12px] text-foreground">
                      {student.name}
                    </Text>

                    <Text className="font-inter text-[10px] text-muted">
                      {student.email || student.phone || "No contact information"} 
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Actions for ${student.name}`}
                  hitSlop={8}
                  onPress={() => {
                    // Add student actions here later.
                  }}
                >
                  <Ellipsis height={22} width={22} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <ResetDatabaseButton />

        {/* Pagination */}
        {totalPages > 1 && (
          <View className="flex flex-row items-center justify-between gap-[10px]">
            <View className="flex flex-row gap-[10px]">
              <Pressable
                disabled={isFirst}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isFirst ? "opacity-40" : ""
                  }`}
              >
                <Arrow height={15} width={24} style={{ color: "#A9A9A9" }} />
              </Pressable>

              <Pressable
                disabled={isLast}
                onPress={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isLast ? "opacity-40" : ""
                  }`}
              >
                <Arrow
                  height={15}
                  width={24}
                  style={{
                    color: "#A9A9A9",
                    transform: [{ rotate: "180deg" }],
                  }}
                />
              </Pressable>
            </View>

            <Text className="font-inter-semibold text-[12px]">
              {filtered.length === 0
                ? "No results"
                : `Showing students ${startIndex + 1}–${Math.min(
                  endIndex,
                  filtered.length
                )} of ${filtered.length}`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New student drawer */}
      <Drawer
        visible={drawerOpen}
        onClose={handleCloseDrawer}
        title="New Student"
        visible_closeButton={true}
        footer={
          <View className="flex-1 flex-row items-center justify-end gap-[16px]">
            <Pressable disabled={saving} onPress={handleCloseDrawer} className="items-center py-2 px-[12px]">
              <Text className="font-inter-semibold text-[12px] text-muted">
                Cancel
              </Text>
            </Pressable>
            <Button label={saving ? "Saving..." : "Add Student"} onPress={() => void handleAddStudent()}/>
          </View>
        }
      >
        <View className="gap-[18px] pt-3">
          <View className="gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">
              Student Name *
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter student's full name"
              placeholderTextColor="#A9A9A9"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!saving}
              className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground"
            />
          </View>

          <View className="flex flex-row gap-[16px]">
            <View className="flex-1 gap-[8px]">
              <Text className="font-inter-semibold text-[12px]">
                Email
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email (optional)"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground"
              />
            </View>

            <View className="flex-1 gap-[8px]">
              <Text className="font-inter-semibold text-[12px]">
                Contact
              </Text>

              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter contact number (optional)"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
                editable={!saving}
                className="border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground"
              />
            </View>
          </View>

          <View className="gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">
              Notes
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional student information (optional)"
              placeholderTextColor="#A9A9A9"
              multiline
              textAlignVertical="top"
              editable={!saving}
              className="min-h-[100px] border border-border rounded-[12px] px-[14px] py-[13px] font-inter text-[12px] text-foreground"
            />
          </View>

          <View className="gap-[8px]">
            <Text className="font-inter-semibold text-[12px]">
              Enroll in Classes
            </Text>
          </View>

          {error ? (
            <Text className="font-inter text-[12px] text-red-600">
              {error}
            </Text>
          ) : null}

          <Text className="font-inter text-[10px] text-muted">
            Student information is saved locally on this device.
          </Text>
        </View>
      </Drawer>
    </>
  );
}