<template>
  <div>
    <template v-if="!accessDenied">
      <h1 v-if="!modelLoaded" class="z-20">Loading...</h1>
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
    <template v-else>
      <h1>Access to the camera is needed for this app to function.</h1>
      <p>Error message: {{ errorMessage }}</p>
    </template>
  </div>
</template>

<script lang="ts">
import * as posenet from "@tensorflow-models/posenet";
import { defineComponent, ref, watch } from "@vue/composition-api";
import useCameras from "../composition/useCameras";
import { Vector2D } from "@tensorflow-models/posenet/dist/types";
import { isMobile } from "../utils/responsive";

export default defineComponent({
  name: "Camera",
  setup() {
    const video = ref<HTMLVideoElement>(null);
    const canvas = ref<HTMLCanvasElement>(null);
    const net = ref<posenet.PoseNet>(null);
    const ctx = ref<CanvasRenderingContext2D>(null);
    const modelLoaded = ref<boolean>(false);

    const {
      cameraList,
      selectedCamera,
      accessDenied,
      errorMessage,
      height,
      width,
      videoReady
    } = useCameras(video);

    function drawEmoji(
      emoji: string,
      keypoint: posenet.Keypoint,
      xOffset: number
    ) {
      const { position, score } = keypoint;
      if (!ctx.value || score < 0.6) return;
      ctx.value.fillText(emoji, position.x - xOffset, position.y);
    }

    function getRatio(posA: Vector2D, posB: Vector2D) {
      const distance = Math.sqrt(
        (posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2
      );
      return Math.round(distance);
    }

    async function setupFrame() {
      if (!net.value || !ctx.value || !videoReady.value) return;
      const pose = await net.value.estimateSinglePose(
        video.value as HTMLVideoElement,
        {
          flipHorizontal: false
        }
      );
      ctx.value.clearRect(0, 0, width.value || 0, height.value || 0);

      // How big the emojis should be depending on the distance between eyes
      const ratio = getRatio(
        pose.keypoints[1].position,
        pose.keypoints[2].position
      );

      ctx.value.font = `${ratio}px serif`;
      ctx.value.textAlign = "center";
      ctx.value.textBaseline = "middle";

      drawEmoji("👃", pose.keypoints[0], ratio / 10);
      drawEmoji("👁", pose.keypoints[1], ratio / 5);
      drawEmoji("👁", pose.keypoints[2], ratio / 5);
      requestAnimationFrame(setupFrame);
    }

    async function setupModel() {
      if (!video.value || !canvas.value) return;
      video.value.width = width.value || 0;
      video.value.height = height.value || 0;
      canvas.value.width = width.value || 0;
      canvas.value.height = height.value || 0;
      ctx.value = canvas.value.getContext("2d");
      const multiplier = isMobile() ? 0.5 : 0.75;
      net.value = await posenet.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier,
        inputResolution: {
          width: video.value.width,
          height: video.value.height
        }
      });
      modelLoaded.value = true;
      requestAnimationFrame(setupFrame);
    }

    watch(videoReady, isReady => {
      if (isReady) {
        setupModel();
      }
    });

    return {
      video,
      canvas,
      cameraList,
      selectedCamera,
      accessDenied,
      errorMessage,
      modelLoaded
    };
  }
});
</script>
