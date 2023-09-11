<template>
  <div>
    <button></button>
    <button class="active"></button>
    <sub-button></sub-button>
  </div>
</template>

<script lang="ts">
import SubButton from "@components/SubButton/sub-button.vue";

export default {
  name: "button",
  components: { SubButton: SubButton },
};
</script>

<style scoped>
button {
  color: aqua;
}
button.active {
  background-color: #000;
  color: #fff;
}
</style>