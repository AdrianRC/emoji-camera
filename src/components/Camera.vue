<template>
  <div>
    <template v-if="!accessDenied">
      <video
        ref="video"
        class="absolute inset-0 object-fill w-screen h-screen"
      ></video>
      <canvas
        ref="canvas"
        class="absolute inset-0 z-10 object-fill w-screen h-screen"
      ></canvas>
      <div class="absolute bottom-0 z-20 w-full mb-8 sm:mb-4">
        <div class="flex justify-center">
          <div class="relative inline-block">
            <select
              v-model="selectedCamera"
              class="block w-full px-4 py-2 pr-8 leading-tight bg-white border border-gray-400 rounded shadow appearance-none hover:border-gray-500 focus:outline-none focus:shadow-outline"
            >
              <option value="" disabled>Select your camera</option>
              <option
                v-for="camera in cameraList"
                :value="camera"
                :key="camera.id"
                >{{ camera.label }}</option
              >
            </select>
            <div
              class="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none"
            >
              <svg
                class="w-4 h-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </template>
    <h1 v-else>
      Access to the camera is needed for this app to function.
    </h1>
  </div>
</template>

<script lang="ts">
import * as posenet from "@tensorflow-models/posenet";
import { defineComponent, ref, watch } from "@vue/composition-api";
import useCameras from "../composition/useCameras";

export default defineComponent({
  name: "Camera",
  setup() {
    const video = ref<HTMLVideoElement>(null);
    const canvas = ref<HTMLCanvasElement>(null);
    const net = ref<posenet.PoseNet>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);

    const {
      cameraList,
      selectedCamera,
      accessDenied,
      height,
      width,
      done: cameraReady
    } = useCameras(video);

    async function setupFrame() {
      if (!net.value || !ctx.value) return;
      const pose = await net.value.estimateSinglePose(
        video.value as HTMLVideoElement,
        {
          flipHorizontal: false
        }
      );
      ctx.value.clearRect(0, 0, width.value || 0, height.value || 0);
      const nosePos = pose.keypoints[0].position;
      const leftEyePos = pose.keypoints[1].position;
      const rightEyePos = pose.keypoints[2].position;
      ctx.value.font = "50px serif";
      ctx.value.textAlign = "center";
      ctx.value.textBaseline = "middle";
      ctx.value.fillText("👃", nosePos.x - 5, nosePos.y);
      ctx.value.fillText("👁", leftEyePos.x - 10, leftEyePos.y);
      ctx.value.fillText("👁", rightEyePos.x - 10, rightEyePos.y);
      requestAnimationFrame(setupFrame);
    }

    async function setupModel() {
      if (!video.value || !canvas.value) return;
      video.value.width = width.value || 0;
      video.value.height = height.value || 0;
      canvas.value.width = width.value || 0;
      canvas.value.height = height.value || 0;
      ctx.value = canvas.value.getContext("2d");
      net.value = await posenet.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        inputResolution: {
          width: video.value.width,
          height: video.value.height
        }
      });
      requestAnimationFrame(setupFrame);
    }

    watch(cameraReady, isReady => {
      if (isReady) {
        setupModel();
      }
    });

    return {
      video,
      canvas,
      cameraList,
      selectedCamera,
      accessDenied
    };
  }
});
</script>