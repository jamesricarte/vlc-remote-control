"use client";

import { useEffect, useRef, useState } from "react";
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
  Trash2,
  X,
} from "lucide-react-native";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Button, Snackbar } from "react-native-paper";
import { prettyLog } from "./utils/prettyLog";

import { SafeAreaProvider } from "react-native-safe-area-context";

import { VLC_URL } from "./config/apiConfig";

import "./../global.css";

global.prettyLog = prettyLog;

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalTime, setTotalTime] = useState("00:00");
  const [state, setState] = useState("stopped");
  const [isConnected, setIsConnected] = useState(false);

  const [error, setError] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<{
    title: String;
    artist: String;
  } | null>(null);

  type PlaylistItem = {
    id: string;
    name: string;
    duration: number;
    current: boolean;
  };

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{
    type: "item" | "clear";
    id?: string;
  }>({ type: "clear" });

  const isConnectedRef = useRef(false);

  const VLC_PASSWORD = "Pass123$";
  const auth = "Basic " + btoa(`:${VLC_PASSWORD}`);

  useEffect(() => {
    const getDelayFromState = (state: String) => {
      switch (state) {
        case "playing":
          return 200;
        case "paused":
          return 500;
        case "stopped":
          return 2000;
      }
    };

    const delay = getDelayFromState(state);

    const interval = setInterval(() => {
      fetchStatus();
    }, delay);

    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPlaylist();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function secondsToTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  }

  const sendVLCCommand = async (
    command: String,
    value: String | null = null,
    valueType: "val" | "id" = "val"
  ) => {
    if (!command) return;

    let queryString = `command=${command}`;

    if (value) queryString = `command=${command}&${valueType}=${value}`;

    const response = await axios.get(
      `${VLC_URL}/requests/status.json?${queryString}`,
      {
        headers: { Authorization: auth },
      }
    );

    return response.data;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${VLC_URL}/requests/status.json`, {
        headers: { Authorization: auth },
      });

      const responseData = response.data;

      if (responseData) {
        // prettyLog("Response:", responseData);
        // console.log("CONNECTED!");
        setIsConnected(true);
        setState(responseData.state);
        setIsPlaying(responseData.state === "playing");

        const metadata = responseData?.information?.category?.meta;

        if (metadata) {
          setMediaInfo({
            title: metadata.filename,
            artist: metadata.artist || "",
          });
        } else {
          setMediaInfo(null);
        }

        setProgress(responseData.position * 100);
        setTime(responseData.time);
        setLength(responseData.length);
        setCurrentTime(secondsToTime(responseData.time));
        setTotalTime(secondsToTime(responseData.length));
        setVolume(Math.round((responseData.volume / 512) * 100));

        if (!isConnectedRef.current) {
          setError("Connected to VLC");
          setShowSnackbar(true);
          isConnectedRef.current = true;
        }
      }
    } catch (error: any) {
      // console.log("Error connecting to VLC interface:", error);
      // console.log("DISCONNECTED!");

      setIsConnected(false);
      setState("stopped");
      setMediaInfo(null);
      setIsPlaying(false);
      setCurrentTime("00:00");
      setTotalTime("00:00");
      setProgress(0);
      setVolume(50);
      setPlaylist([]);

      if (isConnectedRef.current) {
        setShowSnackbar(true);
        setError("Connection Error: Can't connect to VLC");
        isConnectedRef.current = false;
      }
    }
  };

  const fetchPlaylist = async () => {
    try {
      const response = await axios.get(`${VLC_URL}/requests/playlist.json`, {
        headers: { Authorization: auth },
      });

      const responseData = response.data;

      if (responseData) {
        setPlaylist(responseData.children[0].children);
      }
    } catch (error: any) {
      console.log("Error connecting to VLC interface:", error);
    }
  };

  const handlePlayPause = async () => {
    const command = state === "paused" ? "pl_play" : "pl_pause";

    try {
      const responseData = await sendVLCCommand(command);

      setIsPlaying(responseData?.state === "playing");
      setState((prev) => responseData?.state || prev);
    } catch (error: any) {
      console.error("ERROR:");
      prettyLog(error?.response?.data || error?.response || error);
    }
  };

  const handleStop = () => {
    sendVLCCommand("pl_stop");
  };

  const handleProgressChange = async (newProgress: number) => {
    try {
      const responseData = await sendVLCCommand("seek", `${newProgress}%25`);

      if (responseData) setProgress(responseData?.position * 100);
    } catch (error: any) {
      console.error("ERROR:");
      prettyLog(error?.response?.data || error?.response || error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    const responseData = await sendVLCCommand(
      "volume",
      `${(newVolume / 100) * 512}`
    );

    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = async () => {
    const volumeValue = isMuted ? "256" : "0";
    const responseData = await sendVLCCommand("volume", volumeValue);

    if (responseData) {
      setVolume(Math.round((responseData.volume / 512) * 100));
      if (responseData.volume > 0) setIsMuted(false);
      else setIsMuted(true);
    }
  };

  const toggleShuffle = async () => {
    const responseData = await sendVLCCommand("pl_random");

    if (responseData) setIsShuffle(responseData.random);
  };

  const toggleRepeat = async () => {
    const responseData = await sendVLCCommand("pl_repeat");

    if (responseData) setIsRepeat(responseData.repeat);
  };

  const handleSeek = async (direction: "previous" | "next") => {
    if (length <= 0) return;
    let absoluteTimeInSeconds = 0;

    if (time < 10 && time !== 0 && direction === "previous") {
      absoluteTimeInSeconds = 0;
    } else if (length - time < 10 && time !== length && direction === "next") {
      absoluteTimeInSeconds = length;
    } else if (
      (time === 0 && direction === "previous") ||
      (time === length && direction === "next")
    ) {
      absoluteTimeInSeconds = time;
    } else {
      absoluteTimeInSeconds = direction === "previous" ? time - 10 : time + 10;
    }

    const responseData = await sendVLCCommand(
      "seek",
      `${absoluteTimeInSeconds}`
    );

    if (responseData) {
      setProgress(responseData.position * 100);
      setTime(responseData.time);
      setCurrentTime(secondsToTime(responseData.time));
      setTotalTime(secondsToTime(responseData.length));
    }
  };

  const handlePlaylistToggle = () => {
    setShowPlaylist(!showPlaylist);
  };

  const handlePlaylistItemSelect = async (id: string) => {
    await sendVLCCommand("pl_play", id.toString(), "id");
    fetchPlaylist();
  };

  const handlePlaylistItemRemove = async (id: string) => {
    await sendVLCCommand("pl_delete", id.toString(), "id");
    fetchPlaylist();
  };

  const handleClearPlaylist = async () => {
    await sendVLCCommand("pl_empty");
    fetchPlaylist();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaProvider>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF9500"]}
            />
          }
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <View className="items-center justify-center w-6 h-6 bg-white rounded-full">
                  <View className="items-center justify-center pb-0.5 pl-0.5">
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

              {mediaInfo?.title ? (
                <>
                  <Text className="mb-1 text-lg font-semibold text-white">
                    {mediaInfo.title}
                  </Text>

                  {mediaInfo?.artist && (
                    <Text className="text-sm text-white/60">
                      {mediaInfo.artist}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text className="mb-1 text-lg font-semibold text-white">
                    No media playing
                  </Text>
                  <Text className="text-sm text-white/60">
                    Load a file to start
                  </Text>
                </>
              )}
            </View>

            {/* Progress Bar */}
            <View className="gap-2">
              <Slider
                style={{ width: "100%", height: 6 }}
                minimumValue={0}
                maximumValue={100}
                value={progress}
                onSlidingComplete={handleProgressChange}
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
              <TouchableOpacity
                onPress={() => sendVLCCommand("pl_previous")}
                className="items-center justify-center rounded-full w-14 h-14 bg-white/10"
              >
                <SkipBack width={24} height={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlayPause}
                className="items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg"
                style={{ elevation: 5 }}
              >
                {isPlaying ? (
                  <Pause
                    width={40}
                    height={40}
                    color="#FF6B35"
                    fill="#FF6B35"
                  />
                ) : (
                  <Play width={40} height={40} color="#FF6B35" fill="#FF6B35" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendVLCCommand("pl_next")}
                className="items-center justify-center rounded-full w-14 h-14 bg-white/10"
              >
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

              <TouchableOpacity
                onPress={toggleShuffle}
                className={`items-center justify-center w-12 h-12 rounded-full active:scale-95 ${isShuffle ? "bg-white" : "bg-white/10"}`}
              >
                <Shuffle
                  width={20}
                  height={20}
                  color={isShuffle ? "#FF6B35" : "white"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleRepeat}
                className={`items-center justify-center w-12 h-12 rounded-full relative ${isRepeat ? "bg-white" : "bg-white/10"}`}
              >
                <Repeat
                  width={20}
                  height={20}
                  color={isRepeat ? "#FF6B35" : "white"}
                />
                {isRepeat && (
                  <Text className="absolute text-xs text-orange-600 top-2 right-2">
                    1
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => sendVLCCommand("fullscreen")}
                className="items-center justify-center w-12 h-12 rounded-full bg-white/10"
              >
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
                onSlidingComplete={handleVolumeChange}
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
              <TouchableOpacity
                onPress={() => handleSeek("previous")}
                className="flex-row items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl"
              >
                <ChevronLeft width={20} height={20} color="white" />
                <Text className="text-sm text-white">10s</Text>
              </TouchableOpacity>

              <Text className="text-sm text-white/60">Quick Seek</Text>

              <TouchableOpacity
                onPress={() => handleSeek("next")}
                className="flex-row items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl"
              >
                <Text className="text-sm text-white">10s</Text>
                <ChevronRight width={20} height={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handlePlaylistToggle}
              className="flex-row items-center justify-center flex-1 gap-2 py-4 bg-white/10 rounded-2xl"
            >
              <List width={24} height={24} color="white" />
              <Text className="text-base font-semibold text-white">
                Playlist
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Playlist Modal */}
        <Modal
          visible={showPlaylist}
          transparent
          animationType="slide"
          onRequestClose={handlePlaylistToggle}
        >
          <View className="items-center justify-end flex-1 p-6 bg-black/60">
            <View
              className={`bg-white/10 rounded-3xl p-6 w-full max-w-md max-h-[80%] ${
                playlist.length > 0 ? "min-h-[50%]" : ""
              }`}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-white">
                  Playlist
                </Text>

                <TouchableOpacity
                  onPress={handlePlaylistToggle}
                  className="items-center justify-center w-8 h-8 rounded-full bg-white/10"
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Empty state */}
              {playlist.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-white/60">Playlist is empty</Text>
                </View>
              ) : (
                <>
                  {/* Playlist list */}
                  <ScrollView className="flex-1 mb-4">
                    <View className="gap-2">
                      {playlist.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handlePlaylistItemSelect(item.id)}
                          className={`flex-row items-center justify-between px-4 py-3 rounded-2xl ${
                            item.current
                              ? "bg-orange-500/20 border border-orange-500/30"
                              : "bg-white/10"
                          }`}
                        >
                          {/* Left */}
                          <View className="flex-row items-center flex-1 min-w-0 gap-3">
                            <TouchableOpacity
                              onPress={() => handlePlaylistItemSelect(item.id)}
                              className="items-center justify-center w-8 h-8 rounded-full bg-white/10"
                            >
                              <Play
                                size={16}
                                color={item.current ? "#f97316" : "white"}
                              />
                            </TouchableOpacity>

                            <View className="flex-1 min-w-0">
                              <Text
                                numberOfLines={1}
                                className="text-sm text-white"
                              >
                                {item.name}
                              </Text>
                              <Text className="text-xs text-white/50">
                                {formatDuration(item.duration)}
                              </Text>
                            </View>
                          </View>

                          {/* Remove */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setDeleteAction({
                                type: "item",
                                id: item.id,
                              });
                              setShowDeleteConfirmation(true);
                            }}
                            className="items-center justify-center w-8 h-8 ml-2 rounded-full bg-white/10"
                          >
                            <Trash2 size={16} color="white" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Clear playlist */}
                  <TouchableOpacity
                    onPress={() => {
                      setDeleteAction({ type: "clear" });
                      setShowDeleteConfirmation(true);
                    }}
                    className="flex-row items-center justify-center w-full gap-2 py-3 border bg-red-500/20 rounded-2xl border-red-500/30"
                  >
                    <Trash2 size={20} color="white" />
                    <Text className="text-white">Clear Playlist</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <Modal
            visible={showDeleteConfirmation}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeleteConfirmation(false)}
          >
            <View className="items-center justify-center flex-1 p-6 bg-black/70">
              <View className="bg-orange-100/10 rounded-3xl p-6 w-full max-w-md max-h-[80%]">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-white">
                    Confirm Delete
                  </Text>

                  <TouchableOpacity
                    onPress={() => setShowDeleteConfirmation(false)}
                    className="items-center justify-center w-8 h-8 rounded-full bg-white/10"
                  >
                    <X size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Message */}
                <View className="items-center py-8">
                  <Text className="text-center text-white/60">
                    {deleteAction.type === "item"
                      ? "Are you sure you want to remove this item from the playlist?"
                      : "Are you sure you want to clear the playlist?"}
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row items-center justify-center gap-4">
                  <TouchableOpacity
                    onPress={() => setShowDeleteConfirmation(false)}
                    className="flex-row items-center justify-center gap-3 p-4 bg-white/10 rounded-2xl"
                  >
                    <X size={20} color="white" />
                    <Text className="text-white">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (deleteAction.type === "item" && deleteAction.id) {
                        handlePlaylistItemRemove(deleteAction.id);
                      } else if (deleteAction.type === "clear") {
                        handleClearPlaylist();
                      }
                      setShowDeleteConfirmation(false);
                    }}
                    className="flex-row items-center justify-center gap-2 p-4 border bg-red-500/20 rounded-2xl border-red-500/30"
                  >
                    <Trash2 size={20} color="white" />
                    <Text className="text-white">
                      {deleteAction.type === "item" ? "Delete" : "Clear"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <Snackbar
          visible={showSnackbar && error !== ""}
          onDismiss={() => setShowSnackbar(false)}
          duration={4000}
        >
          {error ? error : "An error occured."}
        </Snackbar>
      </LinearGradient>
    </SafeAreaProvider>
  );
}
