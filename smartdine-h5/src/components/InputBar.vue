<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '试着问：今天有什么好吃的？',
  },
})

const emit = defineEmits(['send'])
const draft = ref('')

const canSend = computed(() => !props.loading && draft.value.trim().length > 0)

const handleSend = () => {
  if (!canSend.value) {
    return
  }

  emit('send', draft.value.trim())
  draft.value = ''
}
</script>

<template>
  <footer class="input-bar">
    <div class="input-shell">
      <input
        v-model="draft"
        type="text"
        class="message-input"
        :placeholder="placeholder"
        :disabled="loading"
        autocomplete="off"
        enterkeyhint="send"
        @keydown.enter.prevent="handleSend"
      />
      <button type="button" class="send-button" :disabled="!canSend" @click="handleSend">
        {{ loading ? '发送中' : '发送' }}
      </button>
    </div>
  </footer>
</template>

<style scoped>
.input-bar {
  position: sticky;
  bottom: 0;
  z-index: 2;
  flex-shrink: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #dbe3ef;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
}

.input-shell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #cdd8e8;
  border-radius: 999px;
  background: #f8fafc;
  color: #111827;
  outline: none;
}

.message-input:disabled {
  background: #edf2f7;
  color: #94a3b8;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: #94a3b8;
}

.message-input:focus {
  border-color: #2f6fed;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
}

.send-button {
  flex-shrink: 0;
  min-width: 72px;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #2f6fed;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.send-button:disabled {
  background: #c7d2e3;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .input-bar {
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  }

  .input-shell {
    gap: 8px;
  }

  .send-button {
    min-width: 68px;
  }
}
</style>
