<template>
  <div>
    <button></button>
    <button class="active"></button>
  </div>
</template>

<script lang="ts">
export default {
  name: "sub-button",
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