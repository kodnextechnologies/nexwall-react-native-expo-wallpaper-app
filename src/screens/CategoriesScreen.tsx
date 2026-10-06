import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Category, errorMessage, nexwall } from '../api/nexwall';
import { colors, ErrorView, Header } from '../components';

interface Props {
  onOpen: (category: Category | null) => void;
}

export function CategoriesScreen({ onOpen }: Props) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setCategories(null);
    try {
      const res = await nexwall.getCategories();
      setCategories(res.data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.flex}>
      <Header title="Categories" />
      {error ? (
        <ErrorView message={error} onRetry={load} />
      ) : !categories ? (
        <ActivityIndicator style={styles.flex} color={colors.accent} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <Pressable style={styles.all} onPress={() => onOpen(null)}>
              <Text style={styles.allText}>Browse all wallpapers</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.tile} onPress={() => onOpen(item)}>
              <Image source={item.cover_image_url} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.label}>
                <Text style={styles.labelText} numberOfLines={1}>
                  {item.name} ({item.wallpaper_count})
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 12, gap: 12 },
  row: { gap: 12 },
  all: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  allText: { color: colors.accent, fontWeight: '600' },
  tile: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
  },
  label: { backgroundColor: 'rgba(0,0,0,0.55)', padding: 8 },
  labelText: { color: '#fff', fontWeight: '600' },
});
