import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { iconForCategory } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      await createCategory.mutateAsync({ name: newName.trim() });
      setNewName("");
      setAdding(false);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't create that category."));
    }
  };

  const handleDelete = (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      Alert.alert("Can't delete", "Default categories can't be removed.");
      return;
    }
    Alert.alert("Delete category", `Delete "${name}"? Memories in it will keep their category name.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCategory.mutate(id) },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Categories</Text>
        <Pressable onPress={() => setAdding((v) => !v)}>
          <Feather name={adding ? "x" : "plus"} size={22} color={colors.accent} />
        </Pressable>
      </View>

      {adding ? (
        <View style={styles.addRow}>
          <TextField
            value={newName}
            onChangeText={setNewName}
            placeholder="New category name"
            style={styles.addInput}
            onSubmitEditing={handleAdd}
          />
          <Button label="Add" onPress={handleAdd} loading={createCategory.isPending} fullWidth={false} />
        </View>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      {categoriesQuery.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={categoriesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/(tabs)/memories", params: { category: item.name } })}
              onLongPress={() => handleDelete(item.id, item.name, item.is_default)}
            >
              <Card style={styles.categoryCard}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Feather name={iconForCategory(item.name)} size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                    {item.memory_count} {item.memory_count === 1 ? "memory" : "memories"}
                  </Text>
                </View>
                {!item.is_default ? <Feather name="more-horizontal" size={18} color={colors.textMuted} /> : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
  title: { ...typography.title },
  addRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginBottom: spacing.md },
  addInput: { flex: 1 },
  categoryCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryName: { ...typography.subtitle },
  categoryCount: { ...typography.caption },
});
