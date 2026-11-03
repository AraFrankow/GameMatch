import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navegarASala(salaId) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Salas', {
      salaDirecta: { id: salaId },
    });
  }
}
