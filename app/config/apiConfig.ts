import Constants from "expo-constants";

let VLC_URL: any;
const port = 8080;

const hostUri = Constants.expoConfig?.hostUri;

if (hostUri) {
  const debuggerHost = hostUri.split(":")[0];
  VLC_URL = `http://${debuggerHost}:${port}`;
} else {
  VLC_URL = `http://192.168.1.7:${port}`;
}

export { VLC_URL };
