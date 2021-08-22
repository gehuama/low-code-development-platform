import { IBlock, IBlockDragger, IFocusData } from "@/types/packages";
import { WritableComputedRef } from "vue";
interface IPosition {
  top: number;
  left: number;
}
interface IDragState {
  startX: number;
  startY: number;
  startPos?: Array<IPosition>;
}
/**
 * 实现组件拖拽
 * @param data  拖拽的数据
 * @returns blockMouseDown,focusData
 */
export default function blockDragger(
  focusData: WritableComputedRef<IFocusData>
): IBlockDragger {
  let dragState: IDragState = {
    startX: 0,
    startY: 0,
  };
  const mousemove = (e: MouseEvent) => {
    // 获取移动的位置
    const { clientX: moveX, clientY: moveY } = e;
    // 移动后的位置-移动前的位置
    const durX = moveX - dragState.startX;
    const durY = moveY - dragState.startY;
    focusData.value.focus.forEach((block: IBlock, index: number) => {
      if (dragState.startPos) {
        block.top = dragState.startPos[index].top + durY;
        block.left = dragState.startPos[index].left + durX;
      }
    });
  };
  const mouseup = () => {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };
  const mouseDown = (e: MouseEvent) => {
    dragState = {
      startX: e.clientX,
      startY: e.clientY, // 记录每一个选中的位置
      startPos: focusData.value.focus.map(({ top, left }) => ({
        top,
        left,
      })), // 每一个选中的组件的top,left 即组件当前的位置
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  return {
    mouseDown,
  } as unknown as IBlockDragger;
}
