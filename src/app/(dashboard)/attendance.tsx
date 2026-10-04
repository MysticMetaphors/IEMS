
import Arrow from "@/assets/icons/arrow.svg";
import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import Filter from "@/assets/icons/filter.svg";
import Absent from "@/assets/icons/status/absent.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Present from "@/assets/icons/status/present.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;
const students = [
  {
    name: "Jonathan Freeman",
    date: "Aug 7, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Present
  },
  {
    name: "Sophia Bennett",
    date: "Aug 7, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Absent
  },
  {
    name: "Ethan Carter",
    date: "Aug 7, 2026",
    time: "11:00 AM–11:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Olivia Mitchell",
    date: "Aug 8, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Present
  },
  {
    name: "Liam Anderson",
    date: "Aug 8, 2026",
    time: "9:30 AM–10:00 AM",
    icon: Present
  },
  {
    name: "Emma Richardson",
    date: "Aug 8, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Present
  },
  {
    name: "Noah Thompson",
    date: "Aug 8, 2026",
    time: "2:00 PM–2:30 PM",
    icon: Absent
  },
  {
    name: "Ava Williams",
    date: "Aug 9, 2026",
    time: "8:00 AM–8:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Lucas Morgan",
    date: "Aug 9, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Present
  },
  {
    name: "Mia Parker",
    date: "Aug 9, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Not_Tagged
  },
  {
    name: "James Cooper",
    date: "Aug 10, 2026",
    time: "8:30 AM–9:00 AM",
    icon: Not_Tagged
  },
  {
    name: "Charlotte Evans",
    date: "Aug 10, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Absent
  },
  {
    name: "Benjamin Scott",
    date: "Aug 10, 2026",
    time: "1:00 PM–1:30 PM",
    icon: Not_Tagged
  },
  {
    name: "Amelia Turner",
    date: "Aug 11, 2026",
    time: "9:00 AM–9:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Henry Collins",
    date: "Aug 11, 2026",
    time: "10:00 AM–10:30 AM",
    icon: Not_Tagged
  },
  {
    name: "Harper Stewart",
    date: "Aug 11, 2026",
    time: "11:00 AM–11:30 AM",
    icon: Present
  },
  {
    name: "Daniel Brooks",
    date: "Aug 12, 2026",
    time: "8:00 AM–8:30 AM",
    icon: Absent
  },
  {
    name: "Evelyn Murphy",
    date: "Aug 12, 2026",
    time: "9:30 AM–10:00 AM",
    icon: Present
  },
  {
    name: "Alexander Reed",
    date: "Aug 12, 2026",
    time: "10:30 AM–11:00 AM",
    icon: Present
  },
  {
    name: "Grace Foster",
    date: "Aug 12, 2026",
    time: "2:00 PM–2:30 PM",
    icon: Absent
  },
];

const statusBg = (icon: typeof Present) => icon === Absent ? "bg-red-500/30" : icon === Present ? "bg-green-500/30" : "bg-gray-500/30";

export default function Attendance() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students;
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginated = filtered.slice(startIndex, endIndex);

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
  };

  const isFirst = page === 1;
  const isLast = page >= totalPages;

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-[18px] pb-[200px]"
    >
      <View className="flex flex-row gap-[10px] max-w-full">
        <SearchInput value={search} onChangeText={handleSearch} className="flex-1" />
        <Button LeftIcon={Filter} />
      </View>

      <View className="flex flex-row items-center justify-between h-fit w-full">
        <Text className="font-inter-semibold text-[12px]">Student Attendance</Text>
        <Text className="font-inter-semibold text-[12px]">Actions</Text>
      </View>

      <View className="flex gap-[10px]">
        {paginated.length === 0 ? (
          <Text className="font-inter text-[12px] text-muted text-center py-6">
            No students found
          </Text>
        ) : (
          paginated.map((student) => {
            const Icon = student.icon;

            return (
              <View
                key={`${student.name}-${student.date}-${student.time}`}
                className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
              >
                <View className="flex w-fit flex-row items-center gap-[10px]">
                  <View className={`p-[4px] rounded-full ${statusBg(Icon)}`}>
                    <Icon height={26} width={26} />
                  </View>
                  <View>
                    <Text className="font-inter-bold text-[12px] text-foreground">
                      {student.name}
                    </Text>
                    <Text className="font-inter text-[10px] font-normal text-muted">
                      {student.date} • {student.time}
                    </Text>
                  </View>
                </View>

                <Ellipsis height={22} width={22} />
              </View>
            );
          })
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
  );
}