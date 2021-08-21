import { createApp } from "vue";
import App from "./App.vue";
import "element-plus/lib/theme-chalk/index.css";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

createApp(App).use(store).use(router).mount("#app");

// 1. 先自己构造假数据 实现根据位置渲染内容
// 2. 配置组件对应的映射关系 （preview:xxx， render:xxx）
