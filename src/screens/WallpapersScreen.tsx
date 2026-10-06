import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Category, errorMessage, nexwall, Sort, Wallpaper } from '../api/nexwall';
import { colors, ErrorView, Header } from '../components';

const PAGE_SIZE = 30;
const SORTS: Sort[] = ['newest', 'popular', 'random', 'oldest'];

interface Props {
  category: Category | null;
  onBack: () => void;
  onOpen: (wallpaper: Wallpaper) => void;
}

export function WallpapersScreen({ category, onBack, onOpen }: Props) {
  const [items, setItems] = useState<Wallpaper[]>([]);
  const [sort, setSort] = useState<Sort>('newest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs avoid duplicate requests when onEndReached fires several times.
  const page = useRef(0);
  const lastPage = useRef(1);
  const inFlight = useRef(false);
  const generation = useRef(0);

  const loadMore = useCallback(async () => {
    // After an error (e.g. 429) wait for the user to tap Retry.
    if (inFlight.current || page.current >= lastPage.current || error) return;
    inFlight.current = true;
    setLoading(true);
    const gen = generation.current;
    try {
      const res = await nexwall.getWallpapers({
        page: page.current + 1,
        per_page: PAGE_SIZE,
        category_id: category?.id,
        sort,
      });
      if (gen !== generation.current) return; // sort changed meanwhile
      page.current = res.current_page;
      lastPage.current = res.data.length ? res.last_page : res.current_page;
      setItems((prev) => [...prev, ...res.data]);
    } catch (e) {
      if (gen === generation.current) setError(errorMessage(e));
    } finally {
      if (gen === generation.current) {
        inFlight.current = false;
        setLoading(false);
      }
    }
  }, [category?.id, sort, error]);

  // Runs on mount, after a sort change (page reset to 0) and after Retry
  // clears the error. loadMore's guards make extra calls harmless.
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  const changeSort = (next: Sort) => {
    if (next === sort) return;
    generation.current += 1;
    page.current = 0;
    lastPage.current = 1;
    inFlight.current = false;
    setItems([]);
    setError(null);
    setSort(next);
  };

  const retry = () => setError(null);

  return (
    <View style={styles.flex}>
      <Header title={category?.name ?? 'All wallpapers'} onBack={onBack} />
      <View style={styles.sorts}>
        {SORTS.map((s) => (
          <Pressable key={s} onPress={() => changeSort(s)} style={[styles.chip, s === sort && styles.chipActive]}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {items.length === 0 && error ? (
        <ErrorView message={error} onRetry={retry} />
      ) : items.length === 0 && !loading ? (
        <Text style={styles.empty}>No wallpapers found.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => onOpen(item)}>
              <Image
                source={item.thumbnail_url ?? item.image_url}
                style={styles.thumb}
                contentFit="cover"
                transition={150}
                recyclingKey={String(item.id)}
              />
            </Pressable>
          )}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator style={styles.footer} color={colors.accent} />
            ) : error ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>{error}</Text>
                <Pressable onPress={retry}>
                  <Text style={styles.retry}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sorts: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, textTransform: 'capitalize' },
  list: { padding: 8, gap: 8 },
  row: { gap: 8 },
  cell: { flex: 1 / 3, aspectRatio: 9 / 16, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface },
  thumb: { width: '100%', height: '100%' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 48 },
  footer: { padding: 16, alignItems: 'center' },
  footerText: { color: colors.text, textAlign: 'center' },
  retry: { color: colors.accent, marginTop: 8, fontWeight: '600' },
});
