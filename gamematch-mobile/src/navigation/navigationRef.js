import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function abrirCampanitaGlobal() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Buscar');
  }
}