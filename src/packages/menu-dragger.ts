import {
  IEditorData,
  IMenuDragger,
  IComponent,
  IBlock,
} from "@/types/packages";
import { WritableComputedRef } from "vue";
import { Ref } from "vue";
import { events } from "./event";

/**
 * 菜单拖拽
 * @param containerRef 要拖拽到的容器dom
 * @param data 拖拽的数据
 */
export default function menuDragger(
  containerRef: Ref<HTMLElement>,
  data: WritableComputedRef<IEditorData>
): IMenuDragger {
  let currentComponent: IComponent | null = null;
  /** 拖动的组件进入其容器范围内时触发此事件
   * 进入元素中 添加一个移动的标识 */
  const dragEnter = (e: DragEvent): void => {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move"; // h5的拖动图标
    }
  };
  /** 拖动的组件在另一对象容器范围内拖动时触发此事件
   * 在目标元素经过 必要阻止默认行为 否则不能触发drop */
  const dragOver = (e: DragEvent): void => {
    e.preventDefault();
  };
  /** 拖动的对象离开其容器范围内时触发此事件
   * 离开元素时，增加一个禁用标识 */
  const dragLeave = (e: DragEvent): void => {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "none";
    }
  };
  /** 释放鼠标键时触发此事件 根据拖拽的组件
   * 添加一个组件 */
  const drop = (e: DragEvent): void => {
    const blocks: Array<IBlock> = (data.value as IEditorData).blocks;
    console.log("当前组件值", currentComponent);
    console.log(currentComponent ? currentComponent.key : "");
    data.value = {
      ...data.value,
      blocks: [
        ...blocks,
        {
          top: e.offsetY,
          left: e.offsetX,
          zIndex: 1,
          key: currentComponent ? currentComponent.key : "",
          alignCenter: true, // 组件被拖拽松手后，组件居中
        },
      ],
    };
    // 松手的时候清除正在拖拽的组件
    currentComponent = null;
  };
  /** 拖拽开始处理 */
  const dragStart = (_e: DragEvent, component: IComponent): void => {
    containerRef.value.addEventListener(
      "dragenter",
      dragEnter as unknown as EventListener
    );
    containerRef.value.addEventListener(
      "dragover",
      dragOver as unknown as EventListener
    );
    containerRef.value.addEventListener(
      "dragleave",
      dragLeave as unknown as EventListener
    );
    containerRef.value.addEventListener(
      "drop",
      drop as unknown as EventListener
    );
    currentComponent = component;
    console.log("初始化", currentComponent);
    events.emit("start"); // 发布start
  };
  /** 拖拽结束处理 */
  const dragEnd = (): void => {
    containerRef.value.removeEventListener(
      "dragenter",
      dragEnter as unknown as EventListener
    );
    containerRef.value.removeEventListener(
      "dragover",
      dragOver as unknown as EventListener
    );
    containerRef.value.removeEventListener(
      "dragleave",
      dragLeave as unknown as EventListener
    );
    containerRef.value.removeEventListener(
      "drop",
      drop as unknown as EventListener
    );
    events.emit("end"); // 发布end
  };

  return { dragStart, dragEnd } as unknown as IMenuDragger;
}
