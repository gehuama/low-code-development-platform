import { WritableComputedRef } from "vue";
import { IBlock } from "./menu-dragger";

interface IFocusData {
  [key: string]: Array<IBlock>;
}
export interface IMarkLine {
  x: number | null;
  y: number | null;
}

/** 定义组件获取焦点 */
export interface IBlockDragger {
  mouseDown: void;
  markLine: IMarkLine;
}
