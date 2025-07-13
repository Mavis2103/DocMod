<template>
  <div class="docmod-processor">
    <button @click="processFiles" :disabled="processing" class="docmod-button">
      <span v-if="processing" class="spinner"></span>
      {{ processing ? 'Processing...' : 'Process All MD Files' }}
    </button>

    <div v-if="result" class="result-panel">
      <div class="result-header">
        <h3>Processing Results</h3>
        <button @click="clearResult" class="close-btn">×</button>
      </div>

      <div class="result-stats">
        <span class="stat">Total: {{ result.total }}</span>
        <span class="stat success">Processed: {{ result.processed.length }}</span>
        <span class="stat error">Errors: {{ result.errors.length }}</span>
      </div>

      <div v-if="result.processed.length > 0" class="processed-files">
        <h4>✅ Processing Results:</h4>
        <ul>
          <li v-for="file in result.processed" :key="file.input" :class="{ 'has-includes': file.hasIncludes, 'no-includes': !file.hasIncludes }">
            <span class="file-name">{{ file.input }}</span>
            <span v-if="file.hasIncludes" class="file-result">→ {{ file.output }}</span>
            <span v-else class="file-result">→ {{ file.output }}</span>
          </li>
        </ul>
      </div>

      <div v-if="result.errors.length > 0" class="error-files">
        <h4>❌ Errors:</h4>
        <ul>
          <li v-for="error in result.errors" :key="error.file">
            <strong>{{ error.file }}:</strong> {{ error.error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'DocModProcessor',
  setup() {
    const processing = ref(false);
    const result = ref(null);

    const processFiles = async () => {
      processing.value = true;
      result.value = null;

      try {
        const response = await fetch('/api/process-markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        result.value = data;
      } catch (error) {
        result.value = {
          total: 0,
          processed: [],
          errors: [{ file: 'global', error: error.message }]
        };
      } finally {
        processing.value = false;
      }
    };

    const clearResult = () => {
      result.value = null;
    };

    return {
      processing,
      result,
      processFiles,
      clearResult
    };
  }
};
</script>

<style scoped>
.docmod-processor {
  margin: 20px 0;
}

.docmod-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.docmod-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.docmod-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.result-panel {
  margin-top: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--vp-c-gray-1);
  color: var(--vp-c-text-1);
}

.result-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.stat {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.stat.success {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(34, 197, 94);
}

.stat.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.processed-files,
.error-files {
  margin-top: 15px;
}

.processed-files h4 {
  color: rgb(34, 197, 94);
  margin-bottom: 10px;
}

.error-files h4 {
  color: rgb(239, 68, 68);
  margin-bottom: 10px;
}

.processed-files ul,
.error-files ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.processed-files li,
.error-files li {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
}

.processed-files li {
  background: rgba(34, 197, 94, 0.05);
  border-left: 3px solid rgb(34, 197, 94);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.processed-files li.no-includes {
  background: rgba(156, 163, 175, 0.05);
  border-left: 3px solid rgb(156, 163, 175);
}

.file-name {
  font-weight: 500;
}

.file-result {
  font-size: 12px;
  opacity: 0.8;
}

.error-files li {
  background: rgba(239, 68, 68, 0.05);
  border-left: 3px solid rgb(239, 68, 68);
}
</style>
