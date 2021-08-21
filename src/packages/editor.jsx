import { computed, defineComponent, inject } from "vue";
import "./editor.scss";
import EditorBlock from "./editor-block";
export default defineComponent({
  props: {
    modelValue: { type: Object },
  },
  components: {
    EditorBlock,
  },
  setup(props) {
    const data = computed({
      get() {
        return props.modelValue;
      },
    });
    /* 内容区域 样式 宽度 高度 */
    const containerStyle = computed(() => ({
      width: data.value.container.width + "px",
      height: data.value.container.height + "px",
    }));
    const config = inject("config");
    return () => (
      <div class="editor">
        {/* 左侧物料区 */}
        <div class="editor-left">
          {/* 根据注册列表渲染内容 */}
          {config.componentList.map((component) => (
            <div class="editor-left-item">
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
            >
              {data.value.blocks.map((block) => (
                <EditorBlock block={block}></EditorBlock>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
