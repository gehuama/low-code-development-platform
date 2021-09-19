import { IEditorData, IBlock, IBlockFocus } from "@/types/packages";
import { WritableComputedRef, computed } from "vue";
/**
 * 获取内容区域那些组件被选中
 * @param data  拖拽的数据
 * @returns blockMouseDown,focusData
 */
export default function blockFocus(
  data: WritableComputedRef<IEditorData>,
  previewRef: WritableComputedRef<boolean>,
  callback: (arg0: MouseEvent) => void
): IBlockFocus {
  let selectIndex = -1;
  const lastSelectBlock = computed(() => data.value.blocks[selectIndex]);
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
    if (previewRef.value) return;
    clearBlockFocus();
    selectIndex = -1;
  };
  /** 点击组件获取焦点焦点 */
  const blockMouseDown = (e: MouseEvent, block: IBlock, index: number) => {
    if (previewRef.value) return;
    e.preventDefault();
    e.stopPropagation();
    // block上我们规划一个属性 focus 获取焦点后就将focus变为true
    if (e.shiftKey) {
      if (focusData.value.focus.length <= 1) {
        block.focus = true; // 当前只有一个节点被选中时，按住shift健也不会切换focus状态
      } else {
        // shift+点击选中多个组件
        block.focus = !block.focus;
      }
    } else {
      if (!block.focus) {
        // 先要清空其他组件focus属性
        clearBlockFocus();
        // 再给当前组件负责
        block.focus = true;
      } // 当被选中时，再次点击仍旧被选中，因此不需要else 改变状态
    }
    selectIndex = index;
    callback(e);
  };

  return {
    blockMouseDown,
    containerMouseDown,
    focusData,
    lastSelectBlock,
    clearBlockFocus,
  } as unknown as IBlockFocus;
}
