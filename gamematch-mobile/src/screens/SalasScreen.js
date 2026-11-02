import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { salasApi } from '../api';
import { storage } from '../services/storage';
import { conectarSocket, obtenerSocket } from '../services/socket';
import ModalPerfilUsuario from '../components/ModalPerfilUsuario';

export default function SalasScreen({ route }) {
  const targetUser = route?.params?.targetUser;
  const salaDirecta = route?.params?.salaDirecta;

  const [salas, setSalas] = useState([]);
  const [salaActiva, setSalaActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [miUsuario, setMiUsuario] = useState(null);
  const [cargandoSalas, setCargandoSalas] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);

  const [modalIntegrantesVisible, setModalIntegrantesVisible] = useState(false);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);
  const [modalPerfilVisible, setModalPerfilVisible] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    const inicializar = async () => {
      const user = await storage.obtener('usuario');
      setMiUsuario(user);
      await conectarSocket();
      await cargarSalas();
    };

    inicializar();
  }, []);

  useEffect(() => {
    if (salas.length > 0) {
      let salaASeleccionar = null;

      if (salaDirecta) {
        salaASeleccionar = salas.find((s) => Number(s.id) === Number(salaDirecta.id)) || salaDirecta;
      } else if (targetUser) {
        salaASeleccionar = salas.find((s) => {
          const lista = s.participantes || s.usuarios || s.Participantes || [];
          return lista.some(
            (p) => Number(p.id || p.usuario_id || p.usuario?.id) === Number(targetUser.id)
          );
        });
      }

      if (salaASeleccionar && (!salaActiva || Number(salaActiva.id) !== Number(salaASeleccionar.id))) {
        seleccionarSala(salaASeleccionar);
      }
    }
  }, [targetUser, salaDirecta, salas]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket) return;

    const handleNuevoMensaje = (mensaje) => {
      if (salaActiva && Number(mensaje.sala_id) === Number(salaActiva.id)) {
        setMensajes((prev) => {
          if (prev.some((m) => m.id === mensaje.id)) return prev;
          return [...prev, mensaje];
        });
      }
    };

    const handleErrorChat = (data) => {
      Alert.alert('Chat', data.error || 'Ocurrió un error en la sala');
    };

    const handleSalaActualizada = () => {
      cargarSalas();
    };

    socket.on('mensaje_nuevo', handleNuevoMensaje);
    socket.on('error_chat', handleErrorChat);
    socket.on('sala_actualizada', handleSalaActualizada);

    return () => {
      socket.off('mensaje_nuevo', handleNuevoMensaje);
      socket.off('error_chat', handleErrorChat);
      socket.off('sala_actualizada', handleSalaActualizada);
    };
  }, [salaActiva]);

  const obtenerListaIntegrantes = (sala) => {
    if (!sala) return [];
    const rawLista =
      sala.participantes ||
      sala.usuarios ||
      sala.Participantes ||
      sala.Usuarios ||
      sala.integrantes ||
      [];

    const map = new Map();
    rawLista.forEach((p) => {
      const uObj = p.usuario || p.Usuario || p;
      const id = uObj.id || p.usuario_id || p.id;
      if (id && !map.has(Number(id))) {
        map.set(Number(id), {
          id: Number(id),
          username: uObj.username || uObj.nombre || p.username || 'Jugador',
          foto_perfil:
            uObj.foto_perfil ||
            uObj.avatar ||
            p.foto_perfil ||
            p.avatar ||
            'https://via.placeholder.com/150',
          rango: uObj.rango || p.rango || 'Sin Rango'
        });
      }
    });

    return Array.from(map.values());
  };

  const obtenerNombreSala = (sala) => {
    if (!sala) return 'Sala';
    if (sala.nombre && sala.nombre.trim() !== '' && !sala.nombre.startsWith('Sala #')) {
      return sala.nombre;
    }

    const integrantes = obtenerListaIntegrantes(sala);
    const otros = integrantes.filter(
      (p) => Number(p.id) !== Number(miUsuario?.id)
    );

    if (otros.length > 0) {
      return otros.map((p) => p.username).join(', ');
    }

    return `Sala #${sala.id}`;
  };

  const handleAbrirPerfil = (usuarioId) => {
    if (!usuarioId || Number(usuarioId) === Number(miUsuario?.id)) return;
    setModalIntegrantesVisible(false);
    setUsuarioSeleccionadoId(usuarioId);
    setModalPerfilVisible(true);
  };

  const cargarSalas = async () => {
    try {
      const data = await salasApi.listarMisSalas();
      const lista = Array.isArray(data) ? data : data.salas || [];
      setSalas(lista);

      setSalaActiva((prevActiva) => {
        if (!prevActiva) {
          if (lista.length > 0 && !salaDirecta && !targetUser) {
            return lista[0];
          }
          return null;
        }
        const actualizada = lista.find((s) => Number(s.id) === Number(prevActiva.id));
        return actualizada || prevActiva;
      });
    } catch (error) {
      console.error('Error al cargar salas:', error);
    } finally {
      setCargandoSalas(false);
    }
  };

  const seleccionarSala = async (sala) => {
    if (!sala || !sala.id) return;

    const salaCompleta = salas.find((s) => Number(s.id) === Number(sala.id)) || sala;
    setSalaActiva(salaCompleta);
    setCargandoMensajes(true);

    try {
      const socket = obtenerSocket();
      if (socket) {
        socket.emit('unirse_sala', { sala_id: sala.id });
      }

      const historial = await salasApi.obtenerHistorial(sala.id);
      setMensajes(Array.isArray(historial) ? historial : historial.mensajes || []);
    } catch (error) {
      console.error('Error al cargar historial de mensajes:', error);
    } finally {
      setCargandoMensajes(false);
    }
  };

  const handleEnviarMensaje = () => {
    if (!nuevoMensaje.trim() || !salaActiva) return;

    const socket = obtenerSocket();
    if (!socket) {
      Alert.alert('Error', 'No hay conexión con el servidor de chat');
      return;
    }

    socket.emit('enviar_mensaje', {
      sala_id: salaActiva.id,
      contenido: nuevoMensaje.trim()
    });

    setNuevoMensaje('');
  };

  const renderItemSala = ({ item }) => {
    const esSeleccionada = salaActiva?.id === item.id;
    const nombreMostrar = obtenerNombreSala(item);

    return (
      <TouchableOpacity
        style={[styles.chipSala, esSeleccionada ? styles.chipSalaActiva : null]}
        onPress={() => seleccionarSala(item)}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={16}
          color={esSeleccionada ? '#fff' : '#94a3b8'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.textoChip, esSeleccionada ? styles.textoChipActivo : null]} numberOfLines={1}>
          {nombreMostrar}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMensaje = ({ item }) => {
    const emisorId = item.emisor_id || item.emisor?.id;
    const esMio = Number(emisorId) === Number(miUsuario?.id);
    const nombreEmisor = item.emisor?.username || item.usuario?.username;

    return (
      <View style={[styles.burbujaContenedor, esMio ? styles.burbujaMia : styles.burbujaOtro]}>
        <View style={[styles.burbuja, esMio ? styles.burbujaEstiloMia : styles.burbujaEstiloOtra]}>
          {!esMio && nombreEmisor ? (
            <Text style={styles.remitente}>{nombreEmisor}</Text>
          ) : null}
          <Text style={styles.textoMensaje}>{item.contenido || ''}</Text>
        </View>
      </View>
    );
  };

  const integrantes = obtenerListaIntegrantes(salaActiva);
  const otrosIntegrantes = integrantes.filter(
    (p) => Number(p.id) !== Number(miUsuario?.id)
  );

  const esGrupo =
    salaActiva?.tipo === 'grupal' ||
    salaActiva?.tipo === 'grupo' ||
    salaActiva?.es_grupo === true ||
    integrantes.length > 2;

  const esChatUnoAUno = !esGrupo && (salaActiva?.tipo === 'privada' || otrosIntegrantes.length === 1);
  const otroUsuario = otrosIntegrantes[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Salas & Chat</Text>
            {cargandoSalas ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <FlatList
                horizontal
                data={salas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItemSala}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listaSalasHorizontal}
              />
            )}
          </View>

          {/* Encabezado dinámico según tipo de conversación */}
          {salaActiva ? (
            <View style={styles.barrasalaActiva}>
              {esChatUnoAUno && otroUsuario ? (
                <>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                    onPress={() => handleAbrirPerfil(otroUsuario.id)}
                  >
                    <Text style={styles.tituloSalaActiva} numberOfLines={1}>
                      {obtenerNombreSala(salaActiva)}
                    </Text>
                    <Text style={styles.subtituloSalaActiva}>
                      Toca para ver perfil
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botonIntegrantes}
                    onPress={() => handleAbrirPerfil(otroUsuario.id)}
                  >
                    <Ionicons name="person-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                    onPress={() => setModalIntegrantesVisible(true)}
                  >
                    <Text style={styles.tituloSalaActiva} numberOfLines={1}>
                      {obtenerNombreSala(salaActiva)}
                    </Text>
                    <Text style={styles.subtituloSalaActiva}>
                      {`${integrantes.length} ${integrantes.length === 1 ? 'integrante' : 'integrantes'} · Toca para ver integrantes`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botonIntegrantes}
                    onPress={() => setModalIntegrantesVisible(true)}
                  >
                    <Ionicons name="people-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}

          <View style={styles.chatArea}>
            {cargandoMensajes ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : !salaActiva ? (
              <View style={styles.loaderCenter}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#64748b" />
                <Text style={styles.textoVacio}>No tenés salas activas</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={mensajes}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderMensaje}
                contentContainerStyle={styles.listaMensajes}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}
          </View>

          {salaActiva ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escribí un mensaje..."
                placeholderTextColor="#64748b"
                value={nuevoMensaje}
                onChangeText={setNuevoMensaje}
              />
              <TouchableOpacity style={styles.botonEnviar} onPress={handleEnviarMensaje}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>

      {/* MODAL DE INTEGRANTES*/}
      <Modal visible={modalIntegrantesVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Integrantes del Grupo</Text>
              <TouchableOpacity onPress={() => setModalIntegrantesVisible(false)}>
                <Ionicons name="close-circle-outline" size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={integrantes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const esMiUsuario = Number(item.id) === Number(miUsuario?.id);

                return (
                  <TouchableOpacity
                    style={[styles.itemIntegrante, esMiUsuario ? { opacity: 0.7 } : null]}
                    activeOpacity={esMiUsuario ? 1 : 0.7}
                    disabled={esMiUsuario}
                    onPress={() => handleAbrirPerfil(item.id)}
                  >
                    <Image source={{ uri: item.foto_perfil }} style={styles.avatarIntegrante} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.nombreIntegrante}>{item.username}</Text>
                      <Text style={styles.rangoIntegrante}>{`🏆 ${item.rango}`}</Text>
                    </View>
                    {esMiUsuario ? (
                      <Text style={styles.badgeVos}>Tú</Text>
                    ) : (
                      <Ionicons name="person-circle-outline" size={22} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL DE PERFIL DE USUARIO */}
      <ModalPerfilUsuario
        visible={modalPerfilVisible}
        usuarioId={usuarioSeleccionadoId}
        usuarioActual={miUsuario}
        onClose={() => setModalPerfilVisible(false)}
        deshabilitarChat={true}
        onIrAlChat={(salaNueva) => {
          setModalPerfilVisible(false);
          if (salaNueva) {
            cargarSalas().then(() => seleccionarSala(salaNueva));
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#1e293b' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  listaSalasHorizontal: { gap: 8, paddingBottom: 4 },
  chipSala: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxWidth: 160,
  },
  chipSalaActiva: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  textoChip: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  textoChipActivo: { color: '#fff', fontWeight: 'bold' },
  barrasalaActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tituloSalaActiva: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  subtituloSalaActiva: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  botonIntegrantes: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chatArea: { flex: 1, paddingHorizontal: 12 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoVacio: { color: '#64748b', marginTop: 8, fontSize: 14 },
  listaMensajes: { paddingVertical: 16, gap: 10 },
  burbujaContenedor: { width: '100%', flexDirection: 'row', marginBottom: 4 },
  burbujaMia: { justifyContent: 'flex-end' },
  burbujaOtro: { justifyContent: 'flex-start' },
  burbuja: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  burbujaEstiloMia: { backgroundColor: '#6366f1', borderBottomRightRadius: 2 },
  burbujaEstiloOtra: { backgroundColor: '#1e293b', borderBottomLeftRadius: 2 },
  remitente: { color: '#a5b4fc', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  textoMensaje: { color: '#fff', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  botonEnviar: {
    backgroundColor: '#6366f1',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  itemIntegrante: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarIntegrante: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155' },
  nombreIntegrante: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rangoIntegrante: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  badgeVos: {
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});