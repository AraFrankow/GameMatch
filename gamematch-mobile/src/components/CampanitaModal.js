import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import CustomModal from './CustomModal';

export default function CampanitaModal({ notificaciones = [], onAceptar, onRechazar }) {
  const [abierto, setAbierto] = useState(false);
  const [cargandoId, setCargandoId] = useState(null);
  const sinLeer = notificaciones.length;

  const handleAceptar = async (n) => {
    setCargandoId(n.id || n.sala_id);
    await onAceptar(n);
    setCargandoId(null);
    setAbierto(false);
  };

  const handleRechazar = async (n) => {
    setCargandoId(n.id || n.sala_id);
    await onRechazar(n);
    setCargandoId(null);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setAbierto(true)}
        activeOpacity={0.7}
        style={tw`relative p-2 bg-slate-800 rounded-full border border-white/10 flex-row items-center justify-center`}
      >
        <Ionicons name="notifications-outline" size={20} color="#fff" />
        {sinLeer > 0 && (
          <View style={tw`absolute -top-1 -right-1 bg-rose-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border-2 border-slate-900`}>
            <Text style={tw`text-white font-bold text-[9px]`}>{sinLeer > 99 ? '99+' : sinLeer}</Text>
          </View>
        )}
      </TouchableOpacity>

      <CustomModal
        visible={abierto}
        onClose={() => setAbierto(false)}
        titulo={`Notificaciones (${sinLeer})`}
      >
        {notificaciones.length === 0 ? (
          <Text style={tw`text-slate-400 text-xs text-center py-6`}>Sin notificaciones pendientes</Text>
        ) : (
          notificaciones.map((n) => {
            const idUnico = n.id || n.sala_id;
            const cargando = cargandoId === idUnico;

            return (
              <View key={idUnico} style={tw`bg-slate-900 border border-white/5 p-3 rounded-xl mb-2.5`}>
                <Text style={tw`font-bold text-indigo-400 text-xs mb-1`}>Invitación a sala</Text>
                <Text style={tw`text-slate-300 text-xs mb-2.5`}>
                  <Text style={tw`text-white font-bold`}>{n.invitado_por}</Text> te invitó a la sala <Text style={tw`text-amber-400 font-bold`}>"{n.nombre_sala || 'Sala de juego'}"</Text>.
                </Text>

                <View style={tw`flex-row justify-end gap-2`}>
                  <TouchableOpacity
                    disabled={cargando}
                    onPress={() => handleRechazar(n)}
                    style={tw`px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg`}
                  >
                    <Text style={tw`text-slate-400 font-medium text-xs`}>Descartar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={cargando}
                    onPress={() => handleAceptar(n)}
                    style={tw`px-3 py-1.5 bg-indigo-500 rounded-lg flex-row items-center justify-center min-w-[65px]`}
                  >
                    {cargando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={tw`text-white font-bold text-xs`}>Unirme</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </CustomModal>
    </>
  );
}