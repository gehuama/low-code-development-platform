<template>
  <div class="app">
    <!--
      <editor v-model="state"></editor>
      相当于
      <editor :modelValue="state" @updateValue="xxx"></editor>
    -->
    <editor v-model="state"></editor>
  </div>
</template>
<script lang="ts">
/** vue 基础 */
import { defineComponent, provide, ref } from "vue";
/** 第三方库 */

/** api 定义接口 */

/** 公共方法 */
import data from "./data.json";
import { registerConfig as config } from "@/utils/editor-config.jsx";
/** 封装函数 */

/** 组件 */
import Editor from "@/packages/editor.jsx";
/** 数据类型声明 */

export default defineComponent({
  components: {
    Editor,
  },
  setup(props) {
    const state = ref(data);
    provide("config", config);
    return {
      state,
    };
  },
});
</script>
<style lang="scss">
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
</style>
