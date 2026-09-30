import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import AuroraInput from "./fields/input";
import Modal from "./ui/modal";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * STU_{4 random caps}{year}{month}{index}
 * e.g. STU_GJWM202609021  (Sept 2026, student #21)
 */
export function generateStudentId(index: number) {
  const letters = Array.from(
    { length: 4 },
    () => LETTERS[Math.floor(Math.random() * LETTERS.length)]
  ).join("");
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `STU_${letters}${year}${month}${index}`;
}

type AddStudentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; contact: string }) => void;
};

export default function AddStudentModal({ visible, onClose, onSubmit }: AddStudentModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // start fresh every time the modal opens
  useEffect(() => {
    if (visible) {
      setName("");
      setContact("");
      setSubmitted(false);
    }
  }, [visible]);

  const nameError = submitted && !name.trim() ? "Name is required" : "";
  const contactError = submitted && !contact.trim() ? "Contact number is required" : "";

  const handleSave = () => {
    setSubmitted(true);
    if (!name.trim() || !contact.trim()) return;
    onSubmit({ name: name.trim(), contact: contact.trim() });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New student"
      description="An ID is generated automatically when you save."
      footer={
        <>
          <Pressable
            onPress={onClose}
            className="px-[16px] py-[10px] rounded-[12px] border border-border bg-card"
          >
            <Text className="font-inter-semibold text-[12px] text-foreground">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            className="px-[16px] py-[10px] rounded-[12px] bg-foreground"
          >
            <Text className="font-inter-semibold text-[12px] text-white">Save student</Text>
          </Pressable>
        </>
      }
    >
      <View className="gap-[6px]">
        <Text className="font-inter-semibold text-[12px] text-foreground">Name</Text>
        <AuroraInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          className="w-full"
        />
        {nameError ? (
          <Text className="font-inter text-[10px] text-red-500">{nameError}</Text>
        ) : null}
      </View>

      <View className="gap-[6px]">
        <Text className="font-inter-semibold text-[12px] text-foreground">Contact number</Text>
        <AuroraInput
          value={contact}
          onChangeText={setContact}
          placeholder="e.g. 0917 123 4567"
          className="w-full"
        />
        {contactError ? (
          <Text className="font-inter text-[10px] text-red-500">{contactError}</Text>
        ) : null}
      </View>
    </Modal>
  );
}