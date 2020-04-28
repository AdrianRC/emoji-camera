import { ref, watch, Ref } from "@vue/composition-api";

interface Camera {
  id: string;
  label: string;
}

export default function useCameras(video: Ref<HTMLVideoElement | null>) {
  const selectedCamera = ref<Camera>(null);
  const cameraList = ref<Camera[]>([]);
  const accessDenied = ref<boolean>(false);
  const errorMessage = ref<string>("");
  const width = ref<number | undefined>(undefined);
  const height = ref<number | undefined>(undefined);
  const frameRate = ref<number | undefined>(undefined);
  const videoReady = ref<boolean>(false);
  const lastStream = ref<MediaStream>(null);

  function getDevices() {
    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {
        const list: Camera[] = [];
        devices.forEach(device => {
          if (device.kind === "videoinput") {
            list.push({ id: device.deviceId, label: device.label });
          }
        });
        cameraList.value = list;
        if (!selectedCamera.value) selectedCamera.value = list[0];
      })
      .catch();
  }

  async function getMedia(camera?: Camera) {
    try {
      if (lastStream.value) {
        lastStream.value.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: camera?.id
        }
      });
      lastStream.value = stream;
      accessDenied.value = false;
      const settings = stream.getVideoTracks()[0].getSettings();
      width.value = settings.width;
      height.value = settings.height;
      frameRate.value = settings.frameRate;
      getDevices();
      if (video.value) {
        video.value.onloadeddata = () => {
          videoReady.value = true;
        };
        video.value.srcObject = stream;
        video.value.play();
      }
      if (camera) {
        selectedCamera.value = camera;
      }
    } catch (e) {
      errorMessage.value = e;
      accessDenied.value = true;
    }
  }

  navigator.mediaDevices.ondevicechange = getDevices;

  getMedia();

  watch(selectedCamera, val => {
    if (val) {
      videoReady.value = false;
      getMedia(val);
    }
  });

  return {
    cameraList,
    selectedCamera,
    accessDenied,
    width,
    height,
    frameRate,
    videoReady,
    errorMessage
  };
}
