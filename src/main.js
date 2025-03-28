import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './style.css'
import App from './App.vue'
import router from './router';

const app = createApp(App); // ✅ 先建立 app 實例
app.use(createPinia());     // ✅ 註冊 Pinia
app.use(router);            // ✅ 註冊 Vue Router
app.mount("#app");          // ✅ 掛載到畫面上
