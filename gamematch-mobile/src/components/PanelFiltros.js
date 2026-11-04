import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api'; 

const RANGOS_LOL = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'];
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const OPCIONES_MODO = [
  { label: 'Todos', value: '' },
  { label: 'Competitivo', value: 'competitivo' },
  { label: 'Casual', value: 'casual' },
  { label: 'Ambos', value: 'ambos' },
];

const OPCIONES_PLATAFORMA = [
  { label: 'Todas', value: '' },
  { label: 'PC', value: 'pc' },
  { label: 'Consola', value: 'consola' },
  { label: 'Mobile', value: 'mobile' },
];

const OPCIONES_EDAD = [
  { label: 'Todos', value: '' },
  { label: 'Menor de 18', value: 'menor_18' },
  { label: '18 a 25', value: '18_25' },
  { label: '26 a 35', value: '26_35' },
  { label: '36 o más', value: '36_mas' },
];

const OPCIONES_WINRATE = [
  { label: 'Sin Mínimo', value: '' },
  { label: '≥ 50% Winrate', value: '50' },
  { label: '≥ 75% Winrate', value: '75' },
  { label: '≥ 90% Winrate', value: '90' },
];

const OPCIONES_SINERGIA = [
  { label: 'Sin Mínimo', value: '' },
  { label: '≥ 70% Sinergia', value: '70' },
  { label: '≥ 80% (Alta)', value: '80' },
  { label: '≥ 90% (Dúo Perfecto)', value: '90' },
];

const OPCIONES_REPUTACION = [
  { label: 'Sin Mínimo', value: '' },
  { label: '≥ 50% Positiva', value: '50' },
  { label: '≥ 75% Buena', value: '75' },
  { label: '≥ 90% Excelente', value: '90' },
];

export default function PanelFiltros({ filtros, setFiltros, esPremium, onBuscar }) {
  const [modalActivo, setModalActivo] = useState(null);

  const [busquedaJuego, setBusquedaJuego] = useState(filtros.juego_steam || '');
  const [sugerenciasJuegos, setSugerenciasJuegos] = useState([]);
  const [cargandoJuegos, setCargandoJuegos] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    setBusquedaJuego(filtros.juego_steam || '');
  }, [filtros.juego_steam]);

  const handleChange = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  const handleInputChangeJuego = async (texto) => {
    setBusquedaJuego(texto);
    handleChange('juego_steam', texto);

    if (!texto.trim()) {
      setSugerenciasJuegos([]);
      setMostrarSugerencias(false);
      return;
    }

    setCargandoJuegos(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await authApi.buscarJuegosSteam(token, texto.trim());
      const lista = res?.juegos || [];
      setSugerenciasJuegos(lista);
      setMostrarSugerencias(lista.length > 0);
    } catch (err) {
      console.error('Error al buscar juegos de Steam en mobile:', err);
      setSugerenciasJuegos([]);
    } finally {
      setCargandoJuegos(false);
    }
  };

  const seleccionarJuego = (nombreJuego) => {
    setBusquedaJuego(nombreJuego);
    handleChange('juego_steam', nombreJuego);
    setMostrarSugerencias(false);
  };

  const handleLimpiar = () => {
    setBusquedaJuego('');
    setSugerenciasJuegos([]);
    setMostrarSugerencias(false);
    setFiltros({
      modo_juego: '',
      plataforma: '',
      juego_steam: '',
      rango_edad: '',
      rango_lol: '',
      winrate_min: '',
      sinergia_min: '',
      rol_preferido: '',
      reputacion_min: '',
      solo_premium: '',
    });
  };

  const abrirSelector = (titulo, campo, opciones, deshabilitado = false) => {
    if (deshabilitado) return;
    setModalActivo({ titulo, campo, opciones });
  };

  const seleccionarOpcion = (valor) => {
    if (modalActivo) {
      handleChange(modalActivo.campo, valor);
      setModalActivo(null);
    }
  };

  const renderSelectField = (label, valorActual, tituloModal, campo, opciones, deshabilitado = false) => {
    const opcionSeleccionada = opciones.find((o) => String(o.value) === String(valorActual));
    const textoMostrar = opcionSeleccionada ? opcionSeleccionada.label : 'Cualquiera / Todos';

    return (
      <View style={tw`mb-2.5`}>
        <Text style={tw`text-[11px] text-slate-400 mb-1 font-medium`}>{label}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={deshabilitado}
          onPress={() => abrirSelector(tituloModal, campo, opciones, deshabilitado)}
          style={tw.style(
            'bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 flex-row items-center justify-between',
            deshabilitado && 'opacity-40 bg-slate-900/50'
          )}
        >
          <Text style={tw`text-xs text-white flex-1 pr-2`} numberOfLines={1}>
            {textoMostrar}
          </Text>
          <Ionicons name="chevron-down" size={16} color={deshabilitado ? '#475569' : '#94a3b8'} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={tw`w-full bg-slate-800 border border-white/10 rounded-2xl p-4 shadow-xl mb-4`}>
      {/* CABECERA DE FILTROS */}
      <View style={tw`flex-row items-center justify-between border-b border-white/10 pb-2.5 mb-3`}>
        <Text style={tw`text-sm font-bold text-white flex-row items-center`}>
          Filtros de Búsqueda
        </Text>
        <TouchableOpacity onPress={handleLimpiar} activeOpacity={0.7}>
          <Text style={tw`text-xs text-slate-400`}>Limpiar filtros</Text>
        </TouchableOpacity>
      </View>

      {/* FILTRO SOLO PREMIUM */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleChange('solo_premium', filtros.solo_premium === 'true' ? '' : 'true')}
        style={tw.style(
          'flex-row items-center justify-between p-3 rounded-xl border mb-3',
          filtros.solo_premium === 'true'
            ? 'bg-amber-500/20 border-amber-500/50'
            : 'bg-slate-900 border-white/10'
        )}
      >
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-sm mr-2`}>⭐</Text>
          <Text style={tw`text-xs font-bold text-amber-400`}>Mostrar solo jugadores Premium</Text>
        </View>
        <View
          style={tw.style(
            'w-5 h-5 rounded-full border items-center justify-center',
            filtros.solo_premium === 'true' ? 'bg-amber-400 border-amber-400' : 'border-slate-500'
          )}
        >
          {filtros.solo_premium === 'true' && <Ionicons name="checkmark" size={14} color="#0f172a" />}
        </View>
      </TouchableOpacity>

      {/* FILTROS BÁSICOS */}
      <View style={tw`mb-2`}>
        {renderSelectField('Modo de Juego', filtros.modo_juego, 'Modo de Juego', 'modo_juego', OPCIONES_MODO)}
        {renderSelectField('Plataforma', filtros.plataforma, 'Plataforma', 'plataforma', OPCIONES_PLATAFORMA)}
        {renderSelectField('Rango de Edad', filtros.rango_edad, 'Rango de Edad', 'rango_edad', OPCIONES_EDAD)}

        {/* BUSCADOR AUTOCOMPLETABLE DE JUEGOS DE STEAM */}
        <View style={tw`mb-2.5`}>
          <Text style={tw`text-[11px] text-slate-400 mb-1 font-medium`}>Juego de Steam</Text>
          <View style={tw`relative justify-center`}>
            <TextInput
              value={busquedaJuego}
              onChangeText={handleInputChangeJuego}
              onFocus={() => sugerenciasJuegos.length > 0 && setMostrarSugerencias(true)}
              placeholder="Ej: Counter-Strike, Rust..."
              placeholderTextColor="#64748b"
              style={tw`bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white pr-8`}
            />
            {cargandoJuegos && (
              <ActivityIndicator size="small" color="#818cf8" style={tw`absolute right-3`} />
            )}
          </View>

          {/* DESPLEGABLE FLOTANTE DE SUGERENCIAS */}
          {mostrarSugerencias && sugerenciasJuegos.length > 0 && (
            <View style={tw`bg-slate-900 border border-white/10 rounded-xl mt-1 overflow-hidden max-h-40 shadow-2xl`}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {sugerenciasJuegos.map((juego, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => seleccionarJuego(juego)}
                    style={tw`px-3 py-2.5 border-b border-white/5 flex-row items-center`}
                  >
                    <Text style={tw`text-xs text-slate-200`}>🎮 {juego}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* FILTROS COMPETITIVOS AVANZADOS (PREMIUM) */}
      <View style={tw`pt-3 border-t border-white/10 mb-2`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`text-xs font-bold text-amber-400`}>
            ⭐ Filtros Competitivos Avanzados
          </Text>
          {!esPremium && (
            <View style={tw`bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full`}>
              <Text style={tw`text-[10px] text-amber-300 font-semibold`}>🔒 Solo Premium</Text>
            </View>
          )}
        </View>

        {renderSelectField(
          'Rango LoL Mínimo',
          filtros.rango_lol,
          'Rango LoL Mínimo',
          'rango_lol',
          [{ label: 'Cualquiera', value: '' }, ...RANGOS_LOL.map((r) => ({ label: r, value: r }))],
          !esPremium
        )}

        {renderSelectField(
          'Winrate Mínimo (%WR)',
          filtros.winrate_min,
          'Winrate Mínimo',
          'winrate_min',
          OPCIONES_WINRATE,
          !esPremium
        )}

        {renderSelectField(
          'Sinergia Mínima',
          filtros.sinergia_min,
          'Sinergia Mínima',
          'sinergia_min',
          OPCIONES_SINERGIA,
          !esPremium
        )}

        {renderSelectField(
          'Reputación Mínima',
          filtros.reputacion_min,
          'Reputación Mínima',
          'reputacion_min',
          OPCIONES_REPUTACION,
          !esPremium
        )}

        {renderSelectField(
          'Rol Buscado',
          filtros.rol_preferido,
          'Rol Buscado',
          'rol_preferido',
          [{ label: 'Cualquiera', value: '' }, ...ROLES.map((r) => ({ label: r, value: r }))],
          !esPremium
        )}
      </View>

      {/* BOTÓN APLICAR FILTROS */}
      <TouchableOpacity
        onPress={() => onBuscar && onBuscar(filtros)}
        activeOpacity={0.8}
        style={tw`w-full bg-indigo-500 py-3 rounded-xl items-center mt-2 shadow-md`}
      >
        <Text style={tw`text-white font-bold text-xs`}>Aplicar Filtros y Buscar Jugadores</Text>
      </TouchableOpacity>

      {/* MODAL DE SELECCIÓN DE OPCIONES */}
      <Modal visible={Boolean(modalActivo)} transparent animationType="fade" onRequestClose={() => setModalActivo(null)}>
        <View style={tw`flex-1 bg-black/70 justify-center p-5`}>
          <View style={tw`bg-slate-800 rounded-2xl p-4 border border-white/10 max-h-[70%]`}>
            <View style={tw`flex-row justify-between items-center pb-2 border-b border-white/10 mb-2`}>
              <Text style={tw`text-white font-bold text-sm`}>{modalActivo?.titulo}</Text>
              <TouchableOpacity onPress={() => setModalActivo(null)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {modalActivo?.opciones.map((opcion) => {
                const esSeleccionado = String(filtros[modalActivo.campo]) === String(opcion.value);
                return (
                  <TouchableOpacity
                    key={String(opcion.value)}
                    activeOpacity={0.7}
                    onPress={() => seleccionarOpcion(opcion.value)}
                    style={tw.style(
                      'py-3 px-3 rounded-xl flex-row items-center justify-between mb-1',
                      esSeleccionado ? 'bg-indigo-500/20 border border-indigo-500/50' : 'bg-slate-900/40'
                    )}
                  >
                    <Text style={tw.style('text-xs', esSeleccionado ? 'text-indigo-400 font-bold' : 'text-slate-300')}>
                      {opcion.label}
                    </Text>
                    {esSeleccionado && <Ionicons name="checkmark-circle" size={18} color="#818cf8" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}