import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { authApi } from '../api';

export default function ChatScreen({ token, usuario, onCerrarSesion }) {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [salas, setSalas] = useState([]);

  useEffect(() => {
    cargarSalas();
  }, []);

  const cargarSalas = async () => {
    try {
      const res = await authApi.misSalas(token);
      setSalas(res.salas || []);
    } catch (err) {
      console.error('Error al cargar salas:', err);
    }
  };

  const handleBuscar = async (texto) => {
    setBusqueda(texto);
    if (!texto.trim()) {
      setSugerencias([]);
      return;
    }

    setCargando(true);
    try {
      const res = await authApi.buscarUsuarios(token, texto.trim());
      const usuariosEncontrados = res.usuarios || [];
      
      setSugerencias(usuariosEncontrados.filter((u) => u && u.id && u.id !== usuario?.id));
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ENCABEZADO CON BOTÓN CERRAR SESIÓN */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Salas y Mensajes</Text>
          {usuario?.username ? (
            <Text style={styles.userSub}>@{usuario.username}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.btnCerrarSesion} onPress={onCerrarSesion}>
          <Text style={styles.btnCerrarText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* INPUT DE BÚSQUEDA */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Buscar jugador (ej: 'to')..."
          placeholderTextColor="#64748b"
          value={busqueda}
          onChangeText={handleBuscar}
        />
        {cargando && <ActivityIndicator size="small" color="#6366f1" style={styles.spinner} />}
      </View>

      {/* SUGERENCIAS FLOTANTES */}
      {sugerencias.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={sugerencias}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  {item.foto_perfil ? (
                    <Image source={{ uri: item.foto_perfil }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{(item.username?.[0] || 'U').toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.username}>@{item.username}</Text>
                <TouchableOpacity style={styles.btnInvitar}>
                  <Text style={styles.btnInvitarText}>Invitar</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* SALAS ACTIVAS */}
      <Text style={styles.subTitle}>Tus Conversaciones</Text>
      <FlatList
        data={salas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.salaCard}>
            <Text style={styles.salaNombre}>{item.nombre || `Sala ${item.tipo}`}</Text>
            <Text style={styles.salaDetalle}>{item.participantes?.length || 0} miembros</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16, paddingTop: 50 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userSub: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  btnCerrarSesion: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnCerrarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  searchBox: { position: 'relative', marginBottom: 10 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  spinner: { position: 'absolute', right: 12, top: 12 },
  dropdown: { backgroundColor: '#1e293b', borderRadius: 10, maxHeight: 200, borderWidth: 1, borderColor: '#6366f1', marginBottom: 16, padding: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  username: { color: '#fff', flex: 1, marginLeft: 10, fontSize: 14 },
  btnInvitar: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  btnInvitarText: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
  subTitle: { color: '#94a3b8', fontSize: 14, marginTop: 12, marginBottom: 8 },
  salaCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  salaNombre: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  salaDetalle: { color: '#64748b', fontSize: 12, marginTop: 2 }
});