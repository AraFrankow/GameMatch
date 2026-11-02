import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { perfilApi, salasApi } from '../api';

const ESTADO_COLOR = {
  online: '#10b981',
  jugando: '#a855f7',
  ausente: '#f59e0b',
  offline: '#64748b'
};

const ESTADO_LABEL = {
  online: 'En línea',
  jugando: 'Jugando',
  ausente: 'Ausente',
  offline: 'Desconectado'
};

export default function ModalPerfilUsuario({
  visible,
  usuarioId,
  usuarioActual,
  onClose,
  onIrAlChat,
  deshabilitarChat = false
}) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState('riot');

  useEffect(() => {
    if (!usuarioId || !visible) return;

    setCargando(true);
    perfilApi.obtenerPerfilPublico(usuarioId)
      .then((data) => {
        const u = data.usuario || data.perfil || data;
        const riot = data.riot || u.riot || u.IntegracionRiot || null;
        const steam = data.steam || u.steam || u.IntegracionSteam || null;

        setPerfil({
          ...u,
          riot,
          steam,
          puede_calificar: Boolean(data.puede_calificar || u.puede_calificar || u.interactuado)
        });

        if (!riot && steam) setPestana('steam');
        else setPestana('riot');
      })
      .catch((err) => {
        Alert.alert('Error', err.message || 'No se pudo cargar el perfil');
      })
      .finally(() => setCargando(false));
  }, [usuarioId, visible]);

  const iniciarChatPrivado = async () => {
    try {
      const res = await salasApi.crearSala({
        tipo: 'privada',
        participante_id: usuarioId
      });
      onClose();
      if (onIrAlChat) {
        onIrAlChat(res.sala || res || { id: usuarioId });
      }
    } catch (err) {
      // Manejado por interceptor
    }
  };

  if (!visible) return null;

  const esMenorActual = usuarioActual?.rango_edad === 'menor_18';
  const esMenorPerfil = perfil?.rango_edad === 'menor_18';
  const diferenteEntornoEdad = Boolean(
    usuarioActual?.rango_edad && perfil?.rango_edad && esMenorActual !== esMenorPerfil
  );

  const esPremiumPerfil = Boolean(perfil?.es_premium || perfil?.esPremium || Number(perfil?.es_premium) === 1);
  const estaVerificado = Boolean(perfil?.verificado || perfil?.estaVerificado);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.botonCerrar} onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>

          {cargando ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.textoCargando}>Cargando perfil...</Text>
            </View>
          ) : perfil ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={[styles.avatarContainer, esPremiumPerfil ? styles.avatarPremium : null]}>
                {perfil.foto_perfil || perfil.avatar ? (
                  <Image source={{ uri: perfil.foto_perfil || perfil.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{perfil.username ? perfil.username[0].toUpperCase() : 'U'}</Text>
                )}
              </View>

              <Text style={styles.username}>{perfil.username || 'Jugador'}</Text>

              <View style={styles.insigniasContainer}>
                <View style={[styles.badge, esMenorPerfil ? styles.badgeMenor : styles.badgeAdulto]}>
                  <Text style={[styles.badgeText, esMenorPerfil ? styles.badgeTextMenor : styles.badgeTextAdulto]}>
                    {esMenorPerfil ? 'Menor' : 'Adulto'}
                  </Text>
                </View>

                {estaVerificado ? (
                  <View style={[styles.badge, styles.badgeVerificado]}>
                    <Text style={styles.badgeTextVerificado}>✓ Verificado</Text>
                  </View>
                ) : null}

                {esPremiumPerfil ? (
                  <View style={[styles.badge, styles.badgePremium]}>
                    <Text style={styles.badgeTextPremium}>⭐ Suscripto</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.estadoContainer}>
                <View style={[styles.estadoDot, { backgroundColor: ESTADO_COLOR[perfil.estado] || '#64748b' }]} />
                <Text style={styles.estadoTexto}>{ESTADO_LABEL[perfil.estado] || 'Desconectado'}</Text>
                {perfil.reputacion_porcentaje !== null && perfil.reputacion_porcentaje !== undefined ? (
                  <Text style={styles.reputacionTexto}>{` · ${perfil.reputacion_porcentaje}% rep`}</Text>
                ) : null}
              </View>

              {perfil.riot || perfil.steam ? (
                <View style={styles.pestanasContainer}>
                  {perfil.riot ? (
                    <TouchableOpacity
                      style={[styles.pestanaBoton, pestana === 'riot' ? styles.pestanaBotonActiva : null]}
                      onPress={() => setPestana('riot')}
                    >
                      <Text style={styles.pestanaTexto}>⚔️ LoL</Text>
                    </TouchableOpacity>
                  ) : null}
                  {perfil.steam ? (
                    <TouchableOpacity
                      style={[styles.pestanaBoton, pestana === 'steam' ? styles.pestanaBotonSteamActiva : null]}
                      onPress={() => setPestana('steam')}
                    >
                      <Text style={styles.pestanaTexto}>🎮 Steam</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {pestana === 'riot' && perfil.riot ? (
                <View style={styles.tarjetaPlataforma}>
                  <Text style={styles.tituloPlataforma}>Riot Games</Text>
                  <Text style={styles.detallePlataforma}>{`Invocador: ${perfil.riot.summoner_name || 'Vinculado'}`}</Text>
                  {perfil.riot.rango ? (
                    <Text style={styles.detallePlataforma}>{`Rango: ${perfil.riot.rango}`}</Text>
                  ) : null}
                </View>
              ) : null}

              {pestana === 'steam' && perfil.steam ? (
                <View style={styles.tarjetaPlataforma}>
                  <Text style={styles.tituloPlataforma}>Steam</Text>
                  <Text style={styles.detallePlataforma}>{`Perfil: ${perfil.steam.steam_id || 'Vinculado'}`}</Text>
                </View>
              ) : null}

              {!perfil.riot && !perfil.steam ? (
                <View style={styles.tarjetaVacia}>
                  <Text style={styles.textoVacio}>Sin cuentas de juego vinculadas</Text>
                </View>
              ) : null}

              {usuarioActual?.id !== perfil?.id ? (
                <View style={styles.accionesContainer}>
                  {diferenteEntornoEdad ? (
                    <View style={styles.alertaError}>
                      <Text style={styles.alertaErrorTexto}>
                        🚫 No se permiten chats entre usuarios de distintos entornos de edad.
                      </Text>
                    </View>
                  ) : deshabilitarChat ? (
                    <View style={styles.chatDeshabilitadoContainer}>
                      <Ionicons name="chatbubbles" size={16} color="#a5b4fc" style={{ marginRight: 6 }} />
                      <Text style={styles.chatDeshabilitadoTexto}>Ya estás en un chat con este usuario</Text>
                    </View>
                  ) : !esMenorActual && !perfil.verificado ? (
                    <View style={styles.alertaWarning}>
                      <Text style={styles.alertaWarningTexto}>
                        ⚠️ Este usuario requiere verificar su cuenta para recibir chats privados.
                      </Text>
                    </View>
                  ) : !esMenorActual && !usuarioActual?.verificado ? (
                    <View style={styles.alertaWarning}>
                      <Text style={styles.alertaWarningTexto}>
                        🔒 Debes verificar tu perfil para iniciar chats privados.
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.botonHablar} onPress={iniciarChatPrivado}>
                      <Ionicons name="chatbubble-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.botonHablarTexto}>Hablar por privado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  botonCerrar: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10
  },
  loaderContainer: { padding: 40, alignItems: 'center' },
  textoCargando: { color: '#94a3b8', marginTop: 10, fontSize: 13 },
  scrollContent: { alignItems: 'center', paddingTop: 10 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1'
  },
  avatarPremium: {
    borderColor: '#fbbf24'
  },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  username: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  insigniasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeMenor: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' },
  badgeAdulto: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  badgeVerificado: { backgroundColor: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)' },
  badgePremium: { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' },
  badgeText: { fontSize: 11, fontWeight: '500' },
  badgeTextMenor: { color: '#60a5fa' },
  badgeTextAdulto: { color: '#34d399' },
  badgeTextVerificado: { color: '#67e8f9', fontSize: 11, fontWeight: '500' },
  badgeTextPremium: { color: '#fcd34d', fontSize: 11, fontWeight: '500' },
  estadoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  estadoDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  estadoTexto: { color: '#94a3b8', fontSize: 12 },
  reputacionTexto: { color: '#34d399', fontSize: 12, fontWeight: 'bold' },
  pestanasContainer: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 16 },
  pestanaBoton: { flex: 1, backgroundColor: '#0f172a', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  pestanaBotonActiva: { backgroundColor: '#6366f1' },
  pestanaBotonSteamActiva: { backgroundColor: '#0284c7' },
  pestanaTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tarjetaPlataforma: { width: '100%', backgroundColor: '#0f172a', padding: 12, borderRadius: 10, marginTop: 10 },
  tituloPlataforma: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  detallePlataforma: { color: '#94a3b8', fontSize: 12 },
  tarjetaVacia: { width: '100%', backgroundColor: '#0f172a', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  textoVacio: { color: '#64748b', fontSize: 12 },
  accionesContainer: { width: '100%', marginTop: 20 },
  botonHablar: { backgroundColor: '#6366f1', flexDirection: 'row', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  botonHablarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chatDeshabilitadoContainer: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  chatDeshabilitadoTexto: { color: '#cbd5e1', fontWeight: '600', fontSize: 13 },
  alertaError: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  alertaErrorTexto: { color: '#fca5a5', fontSize: 12, textAlign: 'center' },
  alertaWarning: { backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  alertaWarningTexto: { color: '#fcd34d', fontSize: 12, textAlign: 'center' }
});