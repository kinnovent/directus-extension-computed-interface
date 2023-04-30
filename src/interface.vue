<template>
	<div
	  v-if="mode"
	  :style="customCss"
	>
	  <span class="prefix">{{ prefix }}</span>
	  <span class="computed-value">{{ computedValue }}</span>
	  <span class="suffix">{{ suffix }}</span>
	</div>
	<v-input
	  v-else
	  v-bind="$attrs"
	  :field="field"
	  :collection="collection"
	  :primary-key="primaryKey"
	  :model-value="value"
	  @update:model-value="$emit('input', $event)"
	/>
	<v-notice
	  v-if="errorMsg"
	  type="danger"
	>{{ errorMsg }}</v-notice>
  </template>
  
  <script lang="ts">
  import {  defineComponent, inject, ref, watch } from 'vue';
  import { parseExpression, getVariables } from './operations';
  import { useCollection } from '@directus/extensions-sdk';
  
  export default defineComponent({
	  props: {
		  value: {
			  type: [String, Number],
			  default: null,
		  },
		  field: {
			  type: String,
			  default: null,
		  },
		  type: {
			  type: String,
			  default: null,
		  },
		  collection: {
			  type: String,
			  default: '',
		  },
		  primaryKey: {
			  type: [String, Number],
			  default: '',
		  },
		  template: {
			  type: String,
			  default: '',
		  },
		  mode: {
			  type: String,
			  default: null,
		  },
		  prefix: {
			  type: String,
			  default: null,
		  },
		  suffix: {
			  type: String,
			  default: null,
		  },
		  customCss: {
			  type: Object,
			  default: null,
		  },
	  },
	  emits: ['input'],
	  setup(props, { emit }) {
		  const defaultValues = useCollection(props.collection).defaults;
		  const computedValue = ref<string | number | null>(props.value);
  
		  const FieldValues = inject('values', ref<Record<string, any>>({}));
  
		  const errorMsg = ref<string | null>(null);
  
		  if (FieldValues) {
			  watch(FieldValues, () => {
				  const newValue = compute();
				  computedValue.value = newValue;
  
				  if (props.mode === 'displayonly') {
					  return;
				  }
				  if (newValue !== props.value) {
					  setTimeout(() => {
						  emit('input', newValue);
					  }, 1);
				  }
			  });
		  }
  
		  return {
			  computedValue,
			  errorMsg,
		  };
  
		  function compute() {
			  try {
				  if (getVariables(props.template).some((item) => !FieldValues.value[item])) {
					  return;
				  }
				  const res = props.template.replace(/{{.*?}}/g, (match) => {
					  const expression = match.slice(2, -2).trim();
					  return parseExpression(expression, FieldValues.value, defaultValues.value);
				  });
  
				  errorMsg.value = null;
  
				  if (['integer', 'decimal', 'bigInteger'].includes(props.type)) {
					  return parseInt(res) || 0;
				  }
				  if (['float'].includes(props.type)) {
					  return parseFloat(res) || 0;
				  }
				  return res;
			  } catch (err) {
				  errorMsg.value = err.message ?? 'Unknown error';
				  return null;
			  }
		  }
	  },
  });
  </script>
  