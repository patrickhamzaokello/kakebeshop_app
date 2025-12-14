import * as Haptics from 'expo-haptics';

export const useHaptic = () => {
  const trigger = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'none' = 'light') => {
    try {
      switch (type) {
        case 'success':
          return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        case 'light':
          return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        case 'medium':
          return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        case 'heavy':
          return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        default:
          return Haptics.selectionAsync();
      }
    } catch (e) {}
  };

  return { trigger };
};