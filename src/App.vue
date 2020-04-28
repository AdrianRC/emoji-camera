<template>
  <div id="app">
    <camera />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import Camera from "@/components/Camera.vue";

export default defineComponent({
  name: "App",
  components: { Camera },
  setup() {
    return {};
  }
});
</script>
