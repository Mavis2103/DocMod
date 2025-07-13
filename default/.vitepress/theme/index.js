import DefaultTheme from 'vitepress/theme';
import DocModProcessor from './components/DocModProcessor.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DocModProcessor', DocModProcessor);
  }
};
