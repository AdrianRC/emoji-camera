import { ref, watch, Ref } from "@vue/composition-api";

interface Camera {
  id: string;
  label: string;
}

export default function useCameras(video: Ref<HTMLVideoElement | null>) {
  const selectedCamera = ref<Camera>(null);
  const cameraList = ref<Camera[]>([]);
  const accessDenied = ref<boolean>(false);
  const width = ref<number | undefined>(undefined);
  const height = ref<number | undefined>(undefined);
  const done = ref<boolean>(false);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: camera?.id
        }
      });
      accessDenied.value = false;
      const settings = stream.getVideoTracks()[0].getSettings();
      width.value = settings.width;
      height.value = settings.height;
      getDevices();
      if (video.value) {
        video.value.srcObject = stream;
        video.value.play();
      }
      if (camera) {
        selectedCamera.value = camera;
      }
      done.value = true;
    } catch (e) {
      accessDenied.value = true;
    }
  }

  navigator.mediaDevices.ondevicechange = getDevices;

  getMedia();

  watch(selectedCamera, val => {
    if (val) {
      done.value = false;
      getMedia(val);
    }
  });

  return { cameraList, selectedCamera, accessDenied, width, height, done };
}
