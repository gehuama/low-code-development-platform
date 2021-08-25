import { computed, defineComponent, inject, ref } from "vue";
import "./editor.scss";
import EditorBlock from "./editor-block";
import deepcopy from "deepcopy";
import menuDragger from "./menu-dragger";
import blockFocus from "./block-focus";
import blockDragger from "./block-dragger";
export default defineComponent({
  props: {
    modelValue: { type: Object },
  },
  components: {
    EditorBlock,
  },
  emits: ["update:modelValue"], // 要出发的事件
  setup(props, ctx) {
    const data = computed({
      get() {
        return props.modelValue;
      },
      set(newValue) {
        ctx.emit("update:modelValue", deepcopy(newValue));
      },
    });
    /* 内容区域 样式 宽度 高度 */
    const containerStyle = computed(() => ({
      width: data.value.container.width + "px",
      height: data.value.container.height + "px",
    }));
    const config = inject("config");
    const containerRef = ref(null);
    // 1. 实现菜单的拖拽功能
    const { dragStart, dragEnd } = menuDragger(containerRef, data); // 实现菜单的拖拽
    // 2. 实现获取焦点 选中后可能直接就进行拖拽了
    const { blockMouseDown, containerMouseDown, focusData, lastSelectBlock } =
      blockFocus(data, (e) => {
        mouseDown(e);
      });
    // 3. 实现组件拖拽
    const { mouseDown, markLine } = blockDragger(
      focusData,
      lastSelectBlock,
      data
    );

    // 3. 实现拖拽多个元素功能

    /** 拖拽的组件松手后,数据更新 */
    const blockUpdate = (newBlock, block) => {
      block.left = newBlock.left;
      block.top = newBlock.top;
      block.alignCenter = newBlock.alignCenter;
      block.width = newBlock.width;
      block.height = newBlock.height;
    };
    return () => (
      <div class="editor">
        {/* 左侧物料区 */}
        <div class="editor-left">
          {/* 根据注册列表渲染内容 可以实现h5拖拽 */}
          {config.componentList.map((component) => (
            <div
              class="editor-left-item"
              draggable
              onDragstart={(e) => dragStart(e, component)}
              onDragend={(e) => dragEnd(e)}
            >
              <span>{component.label}</span>
              <div>{component.preview()}</div>
            </div>
          ))}
        </div>
        {/* 菜单栏 */}
        <div class="editor-top">菜单栏</div>
        {/* 属性控制栏 */}
        <div class="editor-right">属性控制栏</div>
        <div class="editor-container">
          {/* 负责产生滚动条 */}
          <div class="editor-container-canvas">
            {/* 产生内容区域*/}
            <div
              class="editor-container-canvas-content"
              style={containerStyle.value}
              ref={containerRef}
              onMousedown={(e) => containerMouseDown(e)}
            >
              {data.value.blocks.map((block, index) => (
                <EditorBlock
                  class={block.focus ? "editor-block-focus" : ""}
                  block={block}
                  onMousedown={(e) => blockMouseDown(e, block, index)}
                  onBlockUpdate={(newBlock) => blockUpdate(newBlock, block)}
                ></EditorBlock>
              ))}
              {markLine.x !== null && (
                <div class="line-x" style={{ left: markLine.x + "px" }}></div>
              )}
              {markLine.y !== null && (
                <div class="line-y" style={{ top: markLine.y + "px" }}></div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
