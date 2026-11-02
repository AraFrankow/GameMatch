import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PerfilScreen({ usuario, onCerrarSesion }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mi Perfil</Text>
      <Text style={styles.usuario}>¡Hola, {usuario?.nombre || usuario?.email || 'Jugador'}!</Text>

      <TouchableOpacity style={styles.botonCerrar} onPress={onCerrarSesion}>
        <Text style={styles.textoBoton}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  usuario: { fontSize: 16, color: '#94a3b8', marginTop: 8 },
  botonCerrar: { backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 30 },
  textoBoton: { color: '#fff', fontWeight: 'bold' },
});