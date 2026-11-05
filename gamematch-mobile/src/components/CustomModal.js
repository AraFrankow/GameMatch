import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function CustomModal({ visible, onClose, titulo, children, containerStyle = '' }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/75 justify-center p-4`}>
        <View style={tw.style('bg-slate-800 rounded-2xl border border-white/10 p-4 max-h-[85%]', containerStyle)}>
          
          <View style={tw`flex-row justify-between items-center pb-2 border-b border-white/10 mb-3`}>
            <Text style={tw`text-white font-bold text-base`}>{titulo || ''}</Text>
            <TouchableOpacity onPress={onClose} style={tw`p-1`}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {children}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}