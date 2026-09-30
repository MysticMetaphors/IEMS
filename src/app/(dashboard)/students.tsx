import Arrow from "@/assets/icons/arrow.svg";
import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import Unknown from "@/assets/icons/status/unknown.svg";
import AddStudent from "@/assets/icons/user-add-fill.svg";
import AddStudentModal, { generateStudentId } from "@/components/add-students-modal";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

type Student = {
  name: string;
  custom_id: string;
  contact?: string;
};

const initialStudents: Student[] = [
  { name: "Jonathan Freeman", custom_id: "STU_GJWM2026100" },
  { name: "Sophia Bennett", custom_id: "STU_KRZT2026101" },
  { name: "Ethan Carter", custom_id: "STU_PLNX2026102" },
  { name: "Olivia Mitchell", custom_id: "STU_WQHF2026103" },
  { name: "Liam Anderson", custom_id: "STU_BVKC2026104" },
  { name: "Emma Richardson", custom_id: "STU_XDJP2026105" },
  { name: "Noah Thompson", custom_id: "STU_MQRS2026106" },
  { name: "Ava Williams", custom_id: "STU_HZFK2026107" },
  { name: "Lucas Morgan", custom_id: "STU_TNWB2026108" },
  { name: "Mia Parker", custom_id: "STU_CYLG2026109" },
  { name: "James Cooper", custom_id: "STU_RVQP2026110" },
  { name: "Charlotte Evans", custom_id: "STU_JKDX2026111" },
  { name: "Benjamin Scott", custom_id: "STU_FMZT2026112" },
  { name: "Amelia Turner", custom_id: "STU_QHNR2026113" },
  { name: "Henry Collins", custom_id: "STU_LWPC2026114" },
  { name: "Harper Stewart", custom_id: "STU_ZXGM2026115" },
  { name: "Daniel Brooks", custom_id: "STU_NKQV2026116" },
  { name: "Evelyn Murphy", custom_id: "STU_DTRH2026117" },
  { name: "Alexander Reed", custom_id: "STU_YBFS2026118" },
  { name: "Grace Foster", custom_id: "STU_VJLK2026119" },
];

export default function Students() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students;
  }, [search, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginated = filtered.slice(startIndex, endIndex);

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  const handleAddStudent = ({ name, contact }: { name: string; contact: string }) => {
    const newStudent: Student = {
      name,
      contact,
      custom_id: generateStudentId(students.length + 1),
    };

    setStudents((prev) => [...prev, newStudent]);

    // clear the search and jump to the page where the new student lands
    setSearch("");
    setPage(Math.ceil((students.length + 1) / PAGE_SIZE));
  };

  const isFirst = page === 1;
  const isLast = page >= totalPages;

  return (
    <>
      <ScrollView
        className="flex-1 bg-white "
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        <View className="flex flex-row gap-[10px] max-w-full">
          <SearchInput value={search} onChangeText={handleSearch} className="flex-1" />
          <Button LeftIcon={AddStudent} label="New Student" onPress={() => setAddOpen(true)} />
        </View>

        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Students</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        <View className="flex gap-[10px]">
          {paginated.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              No students found
            </Text>
          ) : (
            paginated.map((student) => (
              <View
                key={student.custom_id}
                className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
              >
                <View className="flex w-fit flex-row items-center gap-[10px]">
                  <View className="border border-gray-500 rounded-full">
                    <Unknown height={26} width={26} style={{ opacity: 0.8 }} />
                  </View>
                  <View>
                    <Text className="font-inter-bold text-[12px] text-foreground">
                      {student.name}
                    </Text>
                    <Text className="font-inter text-[10px] font-normal text-muted">
                      ID: {student.custom_id}
                    </Text>
                  </View>
                </View>

                <Ellipsis height={22} width={22} />
              </View>
            ))
          )}
        </View>

        <View className="flex flex-row items-center justify-between gap-[10px]">
          <View className="flex flex-row gap-[10px]">
            <Pressable
              disabled={isFirst}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isFirst ? "opacity-40" : ""}`}
            >
              <Arrow height={15} width={24} style={{ color: "#A9A9A9" }} />
            </Pressable>
            <Pressable
              disabled={isLast}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isLast ? "opacity-40" : ""}`}
            >
              <Arrow
                height={15}
                width={24}
                style={{ color: "#A9A9A9", transform: [{ rotate: "180deg" }] }}
              />
            </Pressable>
          </View>

          <Text className="font-inter-semibold text-[12px]">
            {filtered.length === 0
              ? "No results"
              : `Showing students ${startIndex + 1}–${Math.min(endIndex, filtered.length)} of ${filtered.length}`}
          </Text>
        </View>
      </ScrollView>

      <AddStudentModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddStudent}
      />
    </>
  );
}