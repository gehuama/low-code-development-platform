import { computed, defineComponent, inject, ref } from "vue";
import "./editor.scss";
import EditorBlock from "./editor-block";
import deepcopy from "deepcopy";
import menuDragger from "./menu-dragger";
import blockFocus from "./block-focus";
import blockDragger from "./block-dragger";
import command from "./command";
import { importDialog } from "../components/dialog";
import { importDropdown, dropdownItem } from "../components/dropdown";
import { ElButton, ElDropdownItem } from "element-plus";
export default defineComponent({
  props: {
    modelValue: { type: Object },
  },
  components: {
    EditorBlock,
  },
  emits: ["update:modelValue"], // 要出发的事件
  setup(props, ctx) {
    // 预览的时候 内容不能再操作了，可以点击或者输入内容 方便看效果
    const previewRef = ref(false);
    const editorRef = ref(true);

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
    const {
      blockMouseDown,
      containerMouseDown,
      focusData,
      lastSelectBlock,
      clearBlockFocus,
    } = blockFocus(data, previewRef, (e) => {
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
    const state = command(data, focusData); // []
    const button = [
      {
        label: "撤销",
        icon: "el-icon-refresh-left",
        handler: () => {
          state.commands.undo();
        },
      },
      {
        label: "重做",
        icon: "el-icon-refresh-right",
        handler: () => {
          state.commands.redo();
        },
      },
      {
        label: "导出",
        icon: "el-icon-download",
        handler: () => {
          console.log("导出");
          importDialog({
            title: "导出JSON使用",
            context: JSON.stringify(data.value),
          });
        },
      },
      {
        label: "导入",
        icon: "el-icon-upload2",
        handler: () => {
          console.log("导入");
          importDialog({
            title: "导入JSON",
            context: "",
            footer: true,
            confirm(text) {
              console.log(text);
              // data.value = JSON.parse(text); // 这样去更改无法保留历史记录
              state.commands.updateContainer(JSON.parse(text));
            },
          });
        },
      },
      {
        label: "置顶",
        icon: "el-icon-top",
        handler: () => {
          state.commands.placeTop();
        },
      },
      {
        label: "置底",
        icon: "el-icon-bottom",
        handler: () => {
          state.commands.placeBottom();
        },
      },
      {
        label: "删除",
        icon: "el-icon-delete",
        handler: () => {
          state.commands.delete();
        },
      },
      {
        label: () => (previewRef.value ? "编辑" : "预览"),
        icon: () => (previewRef.value ? "el-icon-edit" : "el-icon-view"),
        handler: () => {
          previewRef.value = !previewRef.value;
          clearBlockFocus();
        },
      },
      {
        label: "关闭",
        icon: "el-icon-close",
        handler: () => {
          editorRef.value = false;
          clearBlockFocus();
        },
      },
    ];
    const contextMenu = (e, block) => {
      e.preventDefault();
      importDropdown({
        el: e.target, // 以那个元素为准产生一个 dropdown
        content: () => {
          return (
            <div>
              <dropdownItem
                label="删除"
                icon="el-icon-delete"
                onClick={() => {
                  state.commands.delete();
                }}
              ></dropdownItem>
              <dropdownItem
                label="置顶"
                icon="el-icon-top"
                onClick={() => {
                  state.commands.placeTop();
                }}
              ></dropdownItem>
              <dropdownItem
                label="置底"
                icon="el-icon-bottom"
                onClick={() => {
                  state.commands.placeBottom();
                }}
              ></dropdownItem>
              <dropdownItem
                label="查看"
                icon="el-icon-view"
                onClick={() => {
                  importDialog({
                    title: "查看节点数据",
                    context: JSON.stringify(block),
                  });
                }}
              ></dropdownItem>
              <dropdownItem
                label="导入"
                icon="el-icon-upload2"
                onClick={() => {
                  importDialog({
                    title: "导入节点数据",
                    context: "",
                    footer: true,
                    confirm(text) {
                      console.log(text);
                      // data.value = JSON.parse(text); // 这样去更改无法保留历史记录
                      state.commands.updateBlock(JSON.parse(text), block);
                    },
                  });
                }}
              ></dropdownItem>
            </div>
          );
        },
      });
    };

    return () =>
      !editorRef.value ? (
        <div>
          <ElButton type="primary" onClick={() => (editorRef.value = true)}>
            继续编辑
          </ElButton>
          <div
            class="editor-container-canvas-content"
            style={containerStyle.value}
            style="margin:0"
          >
            {data.value.blocks.map((block) => (
              <EditorBlock
                class="editor-block-preview"
                block={block}
              ></EditorBlock>
            ))}
          </div>
        </div>
      ) : (
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
          <div class="editor-top">
            {button.map((btn) => {
              const icon =
                typeof btn.icon == "function" ? btn.icon() : btn.icon;
              const label =
                typeof btn.label == "function" ? btn.label() : btn.label;
              return (
                <div class="editor-top-button" onClick={btn.handler}>
                  <i class={icon}></i>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
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
                    class={previewRef.value ? "editor-block-preview" : ""}
                    block={block}
                    onMousedown={(e) => blockMouseDown(e, block, index)}
                    onBlockUpdate={(newBlock) => blockUpdate(newBlock, block)}
                    onContextmenu={(e) => contextMenu(e, block)}
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
