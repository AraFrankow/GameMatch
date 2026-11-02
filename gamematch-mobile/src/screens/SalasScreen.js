import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SalasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis Salas</Text>
      <Text style={styles.subtitulo}>Salas activas y chat de partida</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitulo: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});