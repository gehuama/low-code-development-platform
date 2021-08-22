export interface IComponent {
  label: string;
  preview: void;
  render: void;
  key: string;
}
export interface IBlock {
  /** 组件居内容区域顶部位置 */
  top: number;
  /** 组件居内容区域左边位置 */
  left: number;
  /** 组件层级 */
  zIndex: number;
  /** 组件标识 */
  key: string;
  /** 组件被拖拽松手后，组件居中 */
  alignCenter?: boolean;
  /** 组件获取焦点 */
  focus?: boolean;
}
/** 产生内容区域 相关属性 */
export interface IContainer {
  /** 内容区域的宽度 */
  width: number;
  /** 内容区域的高度 */
  height: number;
}
/** 低代码开放平台 数据类型 */
export interface IEditorData {
  container: IContainer;
  blocks: Array<IBlock>;
}
/** 定义菜单拖拽返回 */
export interface IMenuDragger {
  dragStart: void;
  dragEnd: void;
}
