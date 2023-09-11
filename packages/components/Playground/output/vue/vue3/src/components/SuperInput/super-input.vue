<template>
  <div class="my-super-duper-input-field">
    <label :for="name">{{ label }}</label>
    <input
      :id="name"
      :name="name"
      :value="value"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <template v-if="errorMessage">
      <p class="form-message danger">{{ errorMessage }}</p>
    </template>
  </div>
</template>

<script lang="ts">
interface Props {
  name: string;
  label: string;
  value: string;
  errorMessage?: string;
}

const props = defineProps<Props>();
export default {
  name: "super-input-field",
};
</script>