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
interface EmitEvents {
  (e: "update:modelValue", val: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<EmitEvents>();
export default {
  name: "super-input-field",
};
</script>