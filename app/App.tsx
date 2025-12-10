"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FolderOpen,
  Maximize,
  Settings,
  Shuffle,
  Repeat,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";

import "./../global.css";

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalTime, setTotalTime] = useState("00:00");
  const [isConnected, setIsConnected] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: API call to VLC HTTP interface
  };

  const handleStop = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("00:00");
    // TODO: API call to VLC HTTP interface
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    // TODO: API call to VLC HTTP interface
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    // TODO: API call to VLC HTTP interface to seek
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: API call to VLC HTTP interface
  };

  return (
    <LinearGradient
      colors={["#FF9500", "#FF3B30"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 pt-6"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 24,
          gap: 24,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <View className="items-center justify-center w-6 h-6 bg-white rounded-full">
                <View className="items-center justify-center">
                  <Text className="text-xs text-[#FF6B35]">▶</Text>
                </View>
              </View>
            </View>
            <View>
              <Text className="text-lg font-semibold text-white">
                VLC Remote
              </Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
                />
                <Text className="text-xs text-white/70">
                  {isConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity className="items-center justify-center w-10 h-10 rounded-full bg-white/10">
            <Settings width={20} height={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Now Playing Card */}
        <View className="gap-4 p-6 bg-white/10 rounded-3xl">
          <View className="items-center mb-2">
            <View className="items-center justify-center w-48 h-48 mb-4 rounded-2xl bg-white/10">
              <View className="items-center justify-center">
                <Text className="text-8xl text-white/40">▶</Text>
              </View>
            </View>
            <Text className="mb-1 text-lg font-semibold text-white">
              No media playing
            </Text>
            <Text className="text-sm text-white/60">Load a file to start</Text>
          </View>

          {/* Progress Bar */}
          <View className="gap-2">
            <Slider
              style={{ width: "100%", height: 6 }}
              minimumValue={0}
              maximumValue={100}
              value={progress}
              onValueChange={handleProgressChange}
              minimumTrackTintColor="rgba(255,255,255,0.8)"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="white"
            />

            <View className="flex-row justify-between">
              <Text className="text-xs text-white/60">{currentTime}</Text>
              <Text className="text-xs text-white/60">{totalTime}</Text>
            </View>
          </View>
        </View>

        {/* Main Controls */}
        <View className="gap-6 p-6 bg-white/10 rounded-3xl">
          {/* Primary Controls */}
          <View className="flex-row items-center justify-center gap-4">
            <TouchableOpacity className="items-center justify-center rounded-full w-14 h-14 bg-white/10">
              <SkipBack width={24} height={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePlayPause}
              className="items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg"
              style={{ elevation: 5 }}
            >
              {isPlaying ? (
                <Pause width={40} height={40} color="#FF6B35" fill="#FF6B35" />
              ) : (
                <Play width={40} height={40} color="#FF6B35" fill="#FF6B35" />
              )}
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center rounded-full w-14 h-14 bg-white/10">
              <SkipForward width={24} height={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Secondary Controls */}
          <View className="flex-row items-center justify-center gap-3">
            <TouchableOpacity
              className="items-center justify-center w-12 h-12 rounded-full bg-white/10"
              onPress={handleStop}
            >
              <Square width={20} height={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center w-12 h-12 rounded-full bg-white/10">
              <Shuffle width={20} height={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center w-12 h-12 rounded-full bg-white/10">
              <Repeat width={20} height={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center w-12 h-12 rounded-full bg-white/10">
              <Maximize width={20} height={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={toggleMute}
              className="items-center justify-center w-10 h-10 rounded-full bg-white/10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX width={20} height={20} color="white" />
              ) : (
                <Volume2 width={20} height={20} color="white" />
              )}
            </TouchableOpacity>

            <Slider
              style={{ flex: 1, height: 6 }}
              minimumValue={0}
              maximumValue={100}
              value={isMuted ? 0 : volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="rgba(255,255,255,0.8)"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="white"
            />

            <Text className="w-10 text-sm text-right text-white/80">
              {isMuted ? 0 : Math.round(volume)}%
            </Text>
          </View>
        </View>

        {/* Seek Controls */}
        <View className="p-4 bg-white/10 rounded-3xl">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity className="flex-row items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl">
              <ChevronLeft width={20} height={20} color="white" />
              <Text className="text-sm text-white">10s</Text>
            </TouchableOpacity>

            <Text className="text-sm text-white/60">Quick Seek</Text>

            <TouchableOpacity className="flex-row items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl">
              <Text className="text-sm text-white">10s</Text>
              <ChevronRight width={20} height={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Actions */}
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-row items-center justify-center flex-1 gap-2 py-4 bg-white/10 rounded-2xl">
            <FolderOpen width={24} height={24} color="white" />
            <Text className="text-base font-semibold text-white">
              Load File
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-center flex-1 gap-2 py-4 bg-white/10 rounded-2xl">
            <List width={24} height={24} color="white" />
            <Text className="text-base font-semibold text-white">Playlist</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
