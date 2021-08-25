import { WritableComputedRef } from "vue";
import { IBlock } from "./menu-dragger";

export interface IFocusData {
  [key: string]: Array<IBlock>;
}
/** 定义组件获取焦点 */
export interface IBlockFocus {
  blockMouseDown: void;
  containerMouseDown: void;
  focusData: WritableComputedRef<IFocusData>;
  lastSelectBlock: WritableComputedRef<IBlock>;
}
