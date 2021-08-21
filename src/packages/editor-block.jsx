import { computed, defineComponent, inject } from "vue";

export default defineComponent({
  props: {
    block: { type: Object },
  },
  setup(props) {
    const blockStyle = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}px`,
    }));
    const config = inject("config");
    return () => {
      // 通过block的key属性 获取对应的组件
      const component = config.componentMap[props.block.key];
      // 获取render函数
      const renderComponent = component.render();
      return (
        <div class="editor-block" style={blockStyle.value}>
          {renderComponent}
        </div>
      );
    };
  },
});
