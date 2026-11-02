import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../services/storage';
import { usuariosApi, salasApi } from '../api';
import ModalPerfilUsuario from '../components/ModalPerfilUsuario';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const MOTIVOS = [
  { id: 'lenguaje_inapropiado', label: 'Lenguaje Inapropiado' },
  { id: 'acoso', label: 'Acoso / Hostigamiento' },
  { id: 'spam', label: 'Spam' },
  { id: 'otro', label: 'Otro motivo' }
];

export default function HomeScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [miUsuario, setMiUsuario] = useState(null);

  const [modalReporteVisible, setModalReporteVisible] = useState(false);
  const [usuarioAReportar, setUsuarioAReportar] = useState(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('lenguaje_inapropiado');
  const [comentarioReporte, setComentarioReporte] = useState('');
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const [usuarioPerfilId, setUsuarioPerfilId] = useState(null);
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const user = await storage.obtener('usuario');
      setMiUsuario(user);

      const token = await storage.obtener('token');
      const response = await fetch(`${API_URL}/busqueda`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
      }
    } catch (error) {
      console.error('Error al conectar con la API de búsqueda:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarUsuarios();
  }, []);

  const abrirPerfilUsuario = (usuarioId) => {
    setUsuarioPerfilId(usuarioId);
    setModalPerfilVisible(true);
  };

  const handleHablar = async (usuario) => {
    if (!usuario) return;

    const esMenorMio = miUsuario?.rango_edad === 'menor_18';
    const esMenorTarget = usuario.rango_edad === 'menor_18';
    const verificadoMio = Boolean(miUsuario?.verificado || miUsuario?.estaVerificado);
    const verificadoTarget = Boolean(usuario.verificado || usuario.estaVerificado);

    if (miUsuario?.rango_edad && usuario.rango_edad && esMenorMio !== esMenorTarget) {
      Alert.alert(
        'Acceso Restringido',
        '🚫 No se permiten chats entre usuarios de distintos entornos de edad (Menores / Adultos).'
      );
      return;
    }

    if (!esMenorMio && !verificadoMio) {
      Alert.alert(
        'Verificación Requerida',
        '🔒 Debés verificar tu rostro en tu perfil para iniciar chats privados.'
      );
      return;
    }

    if (!esMenorMio && !verificadoTarget) {
      Alert.alert(
        'Usuario No Verificado',
        '⚠️ Este usuario requiere verificar su cuenta para poder recibir chats privados.'
      );
      return;
    }

    try {
      const res = await salasApi.crearSala({
        tipo: 'privada',
        participante_id: usuario.id
      });
      const salaObtenida = res.sala || res;
      navigation.navigate('Salas', { targetUser: usuario, salaDirecta: salaObtenida });
    } catch (err) {
      navigation.navigate('Salas', { targetUser: usuario });
    }
  };

  const handleBloquear = (usuario) => {
    const nombre = usuario.nombre || usuario.username || 'este usuario';
    Alert.alert(
      'Bloquear usuario',
      `¿Estás seguro de que querés bloquear a ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await usuariosApi.bloquear(usuario.id);
              setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
              Alert.alert('Éxito', `${nombre} ha sido bloqueado.`);
            } catch (err) {
              Alert.alert('Error', 'No se pudo procesar el bloqueo.');
            }
          }
        }
      ]
    );
  };

  const abrirModalReporte = async (usuario) => {
    try {
      const { interactuaron } = await usuariosApi.verificarInteraccion(usuario.id);

      if (interactuaron) {
        setUsuarioAReportar(usuario);
        setMotivoSeleccionado('lenguaje_inapropiado');
        setComentarioReporte('');
        setModalReporteVisible(true);
      } else {
        Alert.alert(
          'Acción no permitida',
          'Solo podés reportar a jugadores con los que hayas interactuado o compartido una sala.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar la interacción con el usuario.');
    }
  };

  const enviarReporteModal = async () => {
    if (!usuarioAReportar) return;

    setEnviandoReporte(true);
    try {
      await usuariosApi.reportar(
        usuarioAReportar.id,
        motivoSeleccionado,
        comentarioReporte || 'Reportado desde la App Móvil'
      );
      setModalReporteVisible(false);
      Alert.alert('Reporte enviado', 'Gracias por mantener la comunidad segura.');
    } catch (err) {
      const mensajeError = err.response?.data?.error || 'No se pudo enviar el reporte.';
      Alert.alert('No se pudo reportar', mensajeError);
    } finally {
      setEnviandoReporte(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((user) => {
    const query = busqueda.toLowerCase();
    const nombre = (user.nombre || user.username || '').toLowerCase();
    const juego = (user.juegoFavorito || user.juego || '').toLowerCase();
    return nombre.includes(query) || juego.includes(query);
  });

  const renderPlayerCard = ({ item }) => {
    const avatarUri = item.avatar || item.foto_perfil || item.fotoPerfil || 'https://via.placeholder.com/150';

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} activeOpacity={0.7} onPress={() => abrirPerfilUsuario(item.id)}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.nombre}>{item.nombre || item.username || 'Jugador'}</Text>
            <Text style={styles.detalles}>🎮 {item.juegoFavorito || item.juego || 'Juego N/A'}</Text>
            <Text style={styles.rango}>🏆 {item.rango || 'Sin Rango'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        {item.biografia ? (
          <Text style={styles.biografia} numberOfLines={2}>"{item.biografia}"</Text>
        ) : null}

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.botonHablar} onPress={() => handleHablar(item)}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.textoBoton}>Hablar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonAccionIcono} onPress={() => handleBloquear(item)}>
            <Ionicons name="ban-outline" size={18} color="#f59e0b" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonAccionIcono} onPress={() => abrirModalReporte(item)}>
            <Ionicons name="flag-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Buscar Dúo</Text>
        <Text style={styles.subtitulo}>Encontrá compañeros activos para jugar</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.inputSearch}
            placeholder="Buscar por jugador o juego..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda ? (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {cargando ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderPlayerCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No se encontraron jugadores disponibles</Text>
            </View>
          }
        />
      )}

      {/* MODAL DE PERFIL DE USUARIO */}
      <ModalPerfilUsuario
        visible={modalPerfilVisible}
        usuarioId={usuarioPerfilId}
        usuarioActual={miUsuario}
        onClose={() => setModalPerfilVisible(false)}
        onIrAlChat={(salaObtenida) => {
          setModalPerfilVisible(false);
          navigation.navigate('Salas', { salaDirecta: salaObtenida });
        }}
      />

      {/* MODAL DE REPORTE */}
      <Modal visible={modalReporteVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              Reportar a {usuarioAReportar?.nombre || usuarioAReportar?.username}
            </Text>
            <Text style={styles.modalSubtitulo}>Seleccioná el motivo del reporte:</Text>

            <View style={styles.motivosContainer}>
              {MOTIVOS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.motivoChip,
                    motivoSeleccionado === item.id ? styles.motivoChipSeleccionado : null
                  ]}
                  onPress={() => setMotivoSeleccionado(item.id)}
                >
                  <Text
                    style={[
                      styles.motivoTexto,
                      motivoSeleccionado === item.id ? styles.motivoTextoSeleccionado : null
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.inputComentario}
              placeholder="Detallá el motivo o la situación..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={comentarioReporte}
              onChangeText={setComentarioReporte}
            />

            <View style={styles.modalAcciones}>
              <TouchableOpacity
                style={styles.botonCancelarModal}
                onPress={() => setModalReporteVisible(false)}
                disabled={enviandoReporte}
              >
                <Text style={styles.textoCancelarModal}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botonEnviarModal}
                onPress={enviarReporteModal}
                disabled={enviandoReporte}
              >
                {enviandoReporte ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoEnviarModal}>Enviar Reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#1e293b' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitulo: { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputSearch: { flex: 1, color: '#fff', fontSize: 14 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#334155' },
  infoContainer: { marginLeft: 14, flex: 1 },
  nombre: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  detalles: { fontSize: 13, color: '#a5b4fc', marginTop: 2 },
  rango: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  biografia: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', marginTop: 10 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  botonHablar: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoBoton: { color: '#fff', fontWeight: '600', fontSize: 14 },
  botonAccionIcono: {
    backgroundColor: '#334155',
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', fontSize: 15, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  modalSubtitulo: { fontSize: 13, color: '#94a3b8', marginBottom: 14 },
  motivosContainer: { gap: 8, marginBottom: 14 },
  motivoChip: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  motivoChipSeleccionado: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1'
  },
  motivoTexto: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  motivoTextoSeleccionado: { color: '#fff', fontWeight: 'bold' },
  inputComentario: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
    textAlignVertical: 'top'
  },
  modalAcciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  botonCancelarModal: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  textoCancelarModal: { color: '#94a3b8', fontWeight: '600' },
  botonEnviarModal: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  textoEnviarModal: { color: '#fff', fontWeight: 'bold' }
});