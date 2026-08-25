import type { ChildGender } from "@/types/kidfuel";

export function childVoice(gender: ChildGender) {
  if (gender === "female") {
    return { they: "she", their: "her", them: "her" };
  }
  if (gender === "male") {
    return { they: "he", their: "his", them: "him" };
  }
  return { they: "they", their: "their", them: "them" };
}
