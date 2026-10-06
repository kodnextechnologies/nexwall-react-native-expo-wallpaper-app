import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage, Wallpaper } from '../api/nexwall';
import { colors } from '../components';
import { saveWallpaper } from '../saveWallpaper';

interface Props {
  wallpaper: Wallpaper;
  onBack: () => void;
}

export function PreviewScreen({ wallpaper, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveWallpaper(wallpaper);
      Alert.alert('Saved', 'Wallpaper saved to your photos. Set it from your Gallery or Photos app.');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={wallpaper.image_url}
        placeholder={wallpaper.thumbnail_url ?? undefined}
        placeholderContentFit="cover"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
      <View style={[styles.bar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.button, styles.secondary]} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onSave} disabled={saving || wallpaper.type !== 'image'}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save to photos</Text>}
        </Pressable>
      </View>
      {wallpaper.resolution ? (
        <Text style={[styles.meta, { top: insets.top + 12 }]}>{wallpaper.resolution}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 16,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  secondary: { backgroundColor: 'rgba(0,0,0,0.6)', minWidth: 90 },
  buttonText: { color: '#fff', fontWeight: '600' },
  meta: {
    position: 'absolute',
    right: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
