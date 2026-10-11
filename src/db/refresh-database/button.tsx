
import { Alert, Platform, Pressable, Text } from 'react-native';
import { resetDatabase } from '../refresh-database/reset';

export function ResetDatabaseButton() {
  async function handleReset() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Delete all IEMS data and recreate the database?',
      );

      if (!confirmed) return;
    } else {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Reset database?',
          'All local IEMS data will be permanently deleted.',
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            {
              text: 'Reset',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ],
        );
      });

      if (!confirmed) return;
    }

    try {
      await resetDatabase();

      if (Platform.OS === 'web') {
        window.alert('Database reset successfully.');
      } else {
        Alert.alert('Success', 'Database reset successfully.');
      }
    } catch (error) {
      console.error('Database reset failed:', error);
    }
  }

  return (
    <Pressable onPress={handleReset}>
      <Text>Reset Database</Text>
    </Pressable>
  );
}
