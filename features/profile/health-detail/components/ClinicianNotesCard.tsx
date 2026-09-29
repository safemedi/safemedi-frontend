import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

export interface ClinicianNotesCardProps {
  readonly notes: readonly string[];
}

export function ClinicianNotesCard({ notes }: ClinicianNotesCardProps) {
  const keyedNotes = useMemo(() => {
    const noteCountMap = new Map<string, number>();

    return notes.map((note) => {
      const nextCount = (noteCountMap.get(note) ?? 0) + 1;
      noteCountMap.set(note, nextCount);
      return {
        id: `${note}-${nextCount}`,
        note,
      };
    });
  }, [notes]);

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>의료진 참고사항</Text>
      <View style={styles.noteList}>
        {keyedNotes.map(({ id, note }) => (
          <View key={id} style={styles.noteRow}>
            <View style={styles.bullet} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  noteList: {
    gap: 8,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.green,
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: palette.black,
  },
});
