import {
  computed,
  defineComponent,
  inject,
  onMounted,
  reactive,
  ref,
} from "vue";

export default defineComponent({
  props: {
    block: { type: Object },
  },
  setup(props, cxt) {
    console.log(props.block);
    let blockInfo = reactive({ ...props.block });
    const blockStyle = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}px`,
    }));
    const config = inject("config");
    const blockRef = ref(null);
    onMounted(() => {
      let { offsetWidth, offsetHeight } = blockRef.value;
      if (props.block.alignCenter) {
        // 说明是拖拽松手的时候才渲染的，其他的默认渲染到页面上的内容不需要居中
        blockInfo.left = props.block.left - offsetWidth / 2;
        blockInfo.top = props.block.top - offsetHeight / 2; // 原则上重新派发事件
        // blockInfo.alignCenter = false;
        cxt.emit("blockUpdate", {
          left: blockInfo.left,
          top: blockInfo.top,
          alignCenter: false,
          width: offsetWidth, // 组件的宽度
          height: offsetHeight, // 组件的高度
        }); // 渲染后的结果才能去居中
      }
    });
    return () => {
      // 通过block的key属性 获取对应的组件
      const component = config.componentMap[props.block.key];
      // 获取render函数
      const renderComponent = component.render();
      return (
        <div class="editor-block" style={blockStyle.value} ref={blockRef}>
          {renderComponent}
        </div>
      );
    };
  },
});
