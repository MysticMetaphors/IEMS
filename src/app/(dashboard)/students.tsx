import Ellipsis from "@/assets/icons/dots-vertical-rounded.svg";
import AddStudent from "@/assets/icons/user-add-fill.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

const students = [
  {
    name: "Jonathan Freeman",
    custom_id: "STU_GJWM2026100",
  },
  {
    name: "Sophia Bennett",
    custom_id: "STU_KRZT2026101",
  },
  {
    name: "Ethan Carter",
    custom_id: "STU_PLNX2026102",
  },
  {
    name: "Olivia Mitchell",
    custom_id: "STU_WQHF2026103",
  },
  {
    name: "Liam Anderson",
    custom_id: "STU_BVKC2026104",
  },
  {
    name: "Emma Richardson",
    custom_id: "STU_XDJP2026105",
  },
  {
    name: "Noah Thompson",
    custom_id: "STU_MQRS2026106",
  },
  {
    name: "Ava Williams",
    custom_id: "STU_HZFK2026107",
  },
  {
    name: "Lucas Morgan",
    custom_id: "STU_TNWB2026108",
  },
  {
    name: "Mia Parker",
    custom_id: "STU_CYLG2026109",
  },
  {
    name: "James Cooper",
    custom_id: "STU_RVQP2026110",
  },
  {
    name: "Charlotte Evans",
    custom_id: "STU_JKDX2026111",
  },
  {
    name: "Benjamin Scott",
    custom_id: "STU_FMZT2026112",
  },
  {
    name: "Amelia Turner",
    custom_id: "STU_QHNR2026113",
  },
  {
    name: "Henry Collins",
    custom_id: "STU_LWPC2026114",
  },
  {
    name: "Harper Stewart",
    custom_id: "STU_ZXGM2026115",
  },
  {
    name: "Daniel Brooks",
    custom_id: "STU_NKQV2026116",
  },
  {
    name: "Evelyn Murphy",
    custom_id: "STU_DTRH2026117",
  },
  {
    name: "Alexander Reed",
    custom_id: "STU_YBFS2026118",
  },
  {
    name: "Grace Foster",
    custom_id: "STU_VJLK2026119",
  },
];

export default function Students() {
  const [search, setSearch] = useState("")

  return (
    <ScrollView
      className="flex-1 bg-white "
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-[18px] pb-[200px]"
    >
      <View className="flex flex-row gap-[10px] max-w-full">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          className="flex-1"
        />

        <Button
          LeftIcon={AddStudent}
          label="New Student"
        />
      </View>
      <View className="flex flex-row items-center justify-between h-fit w-full">
        <Text className="font-inter-semibold text-[12px]">Students</Text>
        <Text className="font-inter-semibold text-[12px]">Actions</Text>
      </View>

      <View className="flex gap-[10px]">
        {students.map((student, index) => (
          <View key={index} className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card">
            <View>
              <Text className="font-inter-bold text-[12px] text-foreground">
                {student.name}
              </Text>
              <Text className="font-inter text-[10px] font-normal text-muted">
                ID: {student.custom_id}
              </Text>
            </View>

            <Ellipsis
              height={22}
              width={22}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}