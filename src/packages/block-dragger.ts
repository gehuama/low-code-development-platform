import {
  IBlock,
  IBlockDragger,
  IEditorData,
  IFocusData,
  IMarkLine,
} from "@/types/packages";
import { reactive, WritableComputedRef } from "vue";
import { events } from "./event";

interface ILines {
  x: Array<ILineX>;
  y: Array<ILineY>;
}
interface ILineY {
  showTop: number;
  top: number;
}
interface ILineX {
  showLeft: number;
  left: number;
}
interface IPosition {
  top: number;
  left: number;
}
interface IDragState {
  startX: number;
  startY: number;
  startLeft?: number;
  startTop?: number;
  startPos?: Array<IPosition>;
  lines?: ILines;
  dragging: boolean;
}
/**
 * 实现组件拖拽
 * @param focusData  拖拽的数据
 * @param lastSelectBlock 选择最后一个组件 用来标记辅助线
 * @param data
 * @returns blockMouseDown,focusData
 */
export default function blockDragger(
  focusData: WritableComputedRef<IFocusData>,
  lastSelectBlock: WritableComputedRef<IBlock>,
  data: WritableComputedRef<IEditorData>
): IBlockDragger {
  let dragState: IDragState = {
    startX: 0,
    startY: 0,
    dragging: false, // 默认不是正在拖拽
  };
  // 标记线
  const markLine: IMarkLine = reactive({
    x: null,
    y: null,
  });
  const mouseDown = (e: MouseEvent) => {
    const { width: bWidth, height: bHeight } = lastSelectBlock.value; // 最后一个拖拽的元素

    dragState = {
      startX: e.clientX,
      startY: e.clientY, // 记录每一个选中的位置
      dragging: false,
      startLeft: lastSelectBlock.value.left, // b点拖拽前的位置 left
      startTop: lastSelectBlock.value.top, // b点拖拽前端的位置 top
      startPos: focusData.value.focus.map(({ top, left }) => ({
        top,
        left,
      })), // 每一个选中的组件的top,left 即组件当前的位置
      lines: (() => {
        const { unFocused } = focusData.value;
        // 线的场景
        // 计算横线的的位置用Y来存放 计算竖线用X来存放
        const lines: ILines = { x: [], y: [] };
        [
          ...unFocused,
          {
            top: 0,
            left: 0,
            width: data.value.container.width,
            height: data.value.container.height,
          },
        ].forEach((block) => {
          const {
            top: aTop,
            left: aLeft,
            width: aWidth,
            height: aHeight,
          } = block;
          // 当此元素拖拽到和A元素top一致的时候，要显示这跟辅助线，辅助线的位置就是aTop
          lines.y.push({ showTop: aTop, top: aTop }); // 顶对顶
          lines.y.push({ showTop: aTop, top: aTop - (bHeight || 0) }); // 顶对底
          lines.y.push({
            showTop: aTop + (aHeight || 0) / 2,
            top: aTop - (aHeight || 0) / 2 - (bHeight || 0) / 2,
          }); // 中对中
          lines.y.push({
            showTop: aTop + (aHeight || 0),
            top: aTop + (aHeight || 0),
          }); // 底对顶
          lines.y.push({
            showTop: aTop + (aHeight || 0),
            top: aTop + (aHeight || 0) - (bHeight || 0),
          }); // 底对底

          // 当此元素拖拽到和A元素top一致的时候，要显示这跟辅助线，辅助线的位置就是aTop
          lines.x.push({ showLeft: aLeft, left: aLeft }); // 左对左边
          lines.x.push({ showLeft: aLeft, left: aLeft - (bWidth || 0) }); // 右边对左边
          lines.x.push({
            showLeft: aLeft + (aWidth || 0) / 2,
            left: aLeft + (aWidth || 0) / 2 - (bWidth || 0) / 2,
          }); // 中对中
          lines.x.push({
            showLeft: aLeft + (aWidth || 0),
            left: aLeft - (bWidth || 0),
          }); // 左边对右边
          lines.x.push({
            showLeft: aLeft + (aWidth || 0),
            left: aLeft + (aWidth || 0) - (bWidth || 0),
          }); // 右边对右边
        });
        return lines;
      })(),
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };
  const mousemove = (e: MouseEvent) => {
    // 获取移动的位置
    let { clientX: moveX, clientY: moveY } = e;
    if (!dragState.dragging) {
      // 如果不是正在拖拽，更新拖拽状态
      dragState.dragging = true;
      events.emit("start"); // 触发事件 记录拖拽之前组件的位置
    }
    // 计算当前元素最新的left和top 去线里面找，找到显示
    // 鼠标移动后-鼠标移动前 + left 即可
    const left = moveX - dragState.startX + (dragState.startLeft || 0);
    const top = moveY - dragState.startY + (dragState.startTop || 0);
    // 先计算横线， 距离参照物元素还有5像素时，就显示这跟线
    let y = null;
    let x = null;
    if (dragState.lines) {
      for (let i = 0; i < dragState.lines.y.length; i++) {
        const { top: t, showTop: s } = dragState.lines.y[i]; // 获取每一根线
        if (Math.abs(t - top) < 5) {
          // 如果小于5 说明横向线接近了
          y = s; // 线要实现的位置
          moveY = dragState.startY - (dragState.startTop || 0) + t; // 容器距离顶部的距离 + 目标的高度 就是最新的moveY
          // 实现快速和这个元素贴在一起
          break; // 找到一根线后就跳出循环
        }
      }
      for (let i = 0; i < dragState.lines.x.length; i++) {
        const { left: l, showLeft: s } = dragState.lines.x[i]; // 获取每一根线
        if (Math.abs(l - left) < 5) {
          // 如果小于5 说明横向线接近了
          x = s; // 线要实现的位置
          moveX = dragState.startX - (dragState.startLeft || 0) + l; // 容器距离顶部的距离 + 目标的高度 就是最新的moveY
          // 实现快速和这个元素贴在一起
          break; // 找到一根线后就跳出循环
        }
      }
    }

    markLine.x = x; // markLine 是一个响应式数据 x, y更新了会导致视图更新
    markLine.y = y;

    // 移动后的位置-移动前的位置
    const durX = moveX - dragState.startX; //
    const durY = moveY - dragState.startY; //
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

    markLine.x = null; // markLine 是一个响应式数据 x, y更新了会导致视图更新
    markLine.y = null;
    if (dragState.dragging) {
      // 如果只是点击就不会触发
      // dragState.dragging = false;
      events.emit("end"); // 触发事件 记录拖拽之前组件的位置
    }
  };

  return {
    mouseDown,
    markLine,
  } as unknown as IBlockDragger;
}
