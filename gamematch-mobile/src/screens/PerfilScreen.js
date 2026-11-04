import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';

export default function PerfilScreen({ usuario, onCerrarSesion }) {
  return (
    <View style={tw`flex-1 bg-slate-900 justify-center items-center p-5`}>
      <Text style={tw`text-[22px] font-bold text-white`}>Mi Perfil</Text>
      <Text style={tw`text-base text-slate-400 mt-2`}>¡Hola, {usuario?.nombre || usuario?.email || 'Jugador'}!</Text>

      <TouchableOpacity style={tw`bg-red-500 py-3 px-6 rounded-xl mt-[30px]`} onPress={onCerrarSesion}>
        <Text style={tw`text-white font-bold`}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}