import { IEditorData, IBlock, IBlockFocus } from "@/types/packages";
import { WritableComputedRef, computed } from "vue";
/**
 * 获取内容区域那些组件被选中
 * @param data  拖拽的数据
 * @returns blockMouseDown,focusData
 */
export default function blockFocus(
  data: WritableComputedRef<IEditorData>,
  callback: (arg0: MouseEvent) => void
): IBlockFocus {
  const focusData = computed(() => {
    const focus: Array<IBlock> = [];
    const unFocused: Array<IBlock> = [];
    data.value.blocks.forEach((block) => {
      (block.focus ? focus : unFocused).push(block);
    });
    return { focus, unFocused };
  });
  const clearBlockFocus = () => {
    data.value.blocks.forEach((block: IBlock) => (block.focus = false));
  };
  /** 点击容器让选中的失去焦点 */
  const containerMouseDown = () => {
    clearBlockFocus();
  };
  /** 点击组件获取焦点焦点 */
  const blockMouseDown = (e: MouseEvent, block: IBlock) => {
    e.preventDefault();
    e.stopPropagation();
    // block上我们规划一个属性 focus 获取焦点后就将focus变为true
    if (e.shiftKey) {
      // shift+点击选中多个组件
      block.focus = !block.focus;
    } else {
      if (!block.focus) {
        // 先要清空其他组件focus属性
        clearBlockFocus();
        // 再给当前组件负责
        block.focus = true;
      } else {
        block.focus = false;
      }
    }
    callback(e);
  };

  return {
    blockMouseDown,
    containerMouseDown,
    focusData,
  } as unknown as IBlockFocus;
}
