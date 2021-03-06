import { IBlock, IEditorData, IFocusData } from "@/types/packages";
import deepcopy from "deepcopy";
import { onUnmounted, WritableComputedRef } from "vue";
import blockDragger from "./block-dragger";
import { events } from "./event";

interface IQueue {
  redo(): void;
  undo?(): void;
}
interface IExecute {
  redo(): void;
  undo?(): void;
}
interface IInit {
  (): void;
}
interface ICommand {
  name: string;
  before?: Array<IBlock> | null;
  keyboard: string;
  pushQueue?: boolean;
  init?(): () => void;
  execute(): IExecute;
}
interface ICommands {
  [key: string]: () => void;
}
interface ICommandState {
  current: number;
  queue: Array<IQueue>;
  commands: ICommands;
  commandArray: Array<ICommand>;
  destroyArray: Array<IInit>;
}

export default function command(
  data: WritableComputedRef<IEditorData>,
  focusData: WritableComputedRef<IFocusData>
): ICommandState {
  // 前进后退需要指针
  const state: ICommandState = {
    current: -1, // 前进后退的索引值
    queue: [], // 存放所有的操作命令
    commands: {}, // 制作命令和执行功能一个映射表 undo:()=>{}	redo:()=>{}
    commandArray: [], // 存放所有的命令
    destroyArray: [], //
  };
  // 注册
  const registry = (command: ICommand) => {
    state.commandArray.push(command);
    state.commands[command.name] = (...args) => {
      // 命令名字对应执行函数
      const { redo, undo } = command.execute(...args);
      redo();
      if (!command.pushQueue) {
        // 不需要放到队列中直接跳过即可
        return;
      }
      let { queue } = state;
      const { current } = state;
      // 如果先放了 组件1 => 组件2 => 撤回 => 组件3
      // 组件1 => 组件3
      if (queue.length > 0) {
        queue = queue.slice(0, current + 1); // 可能在放置的过程中有撤销操作，所以根据当前最新的current值来计算新的队列
        state.queue = queue;
      }
      queue.push({ redo, undo }); // 保存指令的前进后退
      state.current = current + 1;
    };
  };

  // 注册我们需要的命令
  registry({
    name: "redo",
    keyboard: "ctrl+y",
    execute() {
      return {
        redo() {
          const item = state.queue[state.current + 1]; // 找到当前的下一步 还原操作
          if (item) {
            item.redo && item.redo();
            state.current++;
          }
        },
      };
    },
  });
  registry({
    name: "undo",
    keyboard: "ctrl+z",
    execute() {
      return {
        redo() {
          if (state.current == -1) return; // 没有可以撤销了
          const item = state.queue[state.current]; // 找到上一步还原
          if (item) {
            item.undo && item.undo(); // 这里没有操作队列
            state.current--;
          }
        },
      };
    },
  });
  registry({
    // 如果希望将操作到队列中可以增加一个属性 标识等会操作要放到队列中
    name: "drag",
    before: null,
    pushQueue: true,
    keyboard: "ctrl+x",
    init() {
      // 初始化操作，默认就会绑定事件
      this.before = null;
      // 监控拖拽开始事件，保存状态
      const start = () => {
        this.before = deepcopy(data.value.blocks);
      };
      // 拖拽之后需要触发对应的指令
      const end = () => {
        if (state.commands) {
          state.commands.drag();
        }
      };
      events.on("start", start);
      events.on("end", end);
      return () => {
        events.off("start", start);
        events.off("end", end);
      };
    },
    execute() {
      // state.commands.drag()
      const before = this.before;
      const after = data.value.blocks; //之后的状态
      return {
        redo() {
          // 默认一松手 就直接把当前事情做了
          data.value = { ...data.value, blocks: after };
        },
        undo() {
          // 前一步做的
          data.value = { ...data.value, blocks: before || [] };
        },
      };
    },
  });
  // 带有历史记录常用的模式
  // registry({
  //   name: "updateContainer", // 更新整个容器
  //   pushQueue: true,
  //   keyboard: "",
  //   execute(newValue: any) {
  //     const state = {
  //       before: data.value, // 当前的值
  //       after: newValue, // 新值
  //     };
  //     return {
  //       redo: () => {
  //         data.value = state.after;
  //       },
  //       undo: () => {
  //         data.value = state.before;
  //       },
  //     };
  //   },
  // });
  // 带有历史记录常用的模式
  // registry({
  //   name: "updateBlock", // 更新整个容器
  //   pushQueue: true,
  //   keyboard: "",
  //   execute(newBlock, oldBlock) {
  //     const state = {
  //       before: data.value.blocks,
  //       after: (() => {
  //         const blocks = [...data.value.blocks]; // 拷贝一份用于新的blocks
  //         const index = data.value.blocks.indexOf(oldBlock); // 找老的 需要通过老的查找
  //         if (index > -1) {
  //           blocks.splice(index, 1, newBlock);
  //         }
  //         return blocks;
  //       })(), // 新值
  //     };
  //     return {
  //       redo: () => {
  //         data.value = { ...data.value, blocks: state.after };
  //       },
  //       undo: () => {
  //         data.value = { ...data.value, blocks: state.before };
  //       },
  //     };
  //   },
  // });
  registry({
    // 置顶操作
    name: "placeTop",
    pushQueue: true,
    keyboard: "",
    execute() {
      const before = deepcopy(data.value.blocks);
      const after = (() => {
        // 置顶就是在所有的block中找到最大的
        const { focus, unFocused } = focusData.value;
        const maxZIndex = unFocused.reduce((prev, block) => {
          return Math.max(prev, block.zIndex);
        }, -Infinity);
        focus.forEach((block) => (block.zIndex = maxZIndex + 1)); // 让当前选中的组件，比未选中的组件最大的zIndex+1 即可
        return data.value.blocks;
      })(); //之后的状态
      return {
        redo() {
          data.value = { ...data.value, blocks: after };
        },
        undo() {
          // 如果当前 blocks 前后一致 则不会更新
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });
  registry({
    // 置底操作
    name: "placeBottom",
    pushQueue: true,
    keyboard: "",
    execute() {
      const before = deepcopy(data.value.blocks);
      const after = (() => {
        // 置顶就是在所有的block中找到最大的
        const { focus, unFocused } = focusData.value;
        let minZIndex =
          unFocused.reduce((prev, block) => {
            return Math.min(prev, block.zIndex);
          }, Infinity) - 1;
        // 不能直接 -1 因为 zIndex 不能出现负值 负值就看不到组件了
        if (minZIndex < 0) {
          // 这里如果是负值，则让没选中的组件向上，选中的组件自己变成0
          const dur = Math.abs(minZIndex);
          minZIndex = 0;
          unFocused.forEach((block) => (block.zIndex += dur));
        }
        focus.forEach((block) => (block.zIndex = minZIndex)); // 让当前选中的组件，zIndex 为 0 即可
        return data.value.blocks;
      })(); //之后的状态
      return {
        redo() {
          data.value = { ...data.value, blocks: after };
        },
        undo() {
          // 如果当前 blocks 前后一致 则不会更新
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });
  registry({
    // 删除操作
    name: "delete",
    pushQueue: true,
    keyboard: "",
    execute() {
      const state = {
        before: deepcopy(data.value.blocks), // 当前的值
        after: focusData.value.unFocused, // 选中的都删除了，留下的都是没有删除的
      };
      return {
        redo() {
          data.value = { ...data.value, blocks: state.after };
        },
        undo() {
          // 如果当前 blocks 前后一致 则不会更新
          data.value = { ...data.value, blocks: state.before };
        },
      };
    },
  });
  const keyboardEvent = (() => {
    const init: IInit = () => {
      // 初始化事件
      const onKeyDown = (e: KeyboardEvent) => {
        const { ctrlKey, key } = e; // ctrl+z ctrl+y
        // if (ctrlKey) keyString.push("ctrl");
        // keyString.push(keyCodeMap[code]);
        let keyString = "";
        if (ctrlKey) {
          keyString = "ctrl+" + key;
        }
        console.log("keyString", keyString);
        state.commandArray.forEach(({ keyboard, name }) => {
          if (!keyboard) return; // 没有键盘事件
          if (keyboard === keyString) {
            state.commands[name]();
            e.preventDefault();
          }
        });
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        // 销毁事件
        window.removeEventListener("keydown", onKeyDown);
      };
    };
    return init;
  })();
  (() => {
    keyboardEvent();
    // state.destroyArray.push(keyboardEvent());
    state.commandArray.forEach((command: ICommand) => {
      if (command.init) {
        state.destroyArray.push(command.init());
      }
    });
  })();
  onUnmounted(() => {
    // 清理绑定的事件
    state.destroyArray.forEach((fn) => fn && fn);
  });
  return state;
}
