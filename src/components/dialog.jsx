import { createVNode, defineComponent, render, reactive } from "vue";
import { ElButton, ElDialog, ElInput } from "element-plus";

const dialogComponents = defineComponent({
  props: {
    option: { type: Object },
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option, // 用户给组件的属性
      isShow: false,
    });
    ctx.expose({
      // 让外界可以调用组件中的方法
      showDialog(option) {
        state.option = option;
        console.log(state.option);
        state.isShow = true;
      },
    });
    const cancelClick = () => {
      state.isShow = false;
    };
    const confirmClick = () => {
      state.isShow = false;
      state.option.confirm && state.option.confirm(state.option.context);
    };
    return () => {
      return (
        <ElDialog v-model={state.isShow} title={state.option.title}>
          {{
            default: () => (
              <ElInput
                type="textarea"
                v-model={state.option.context}
                rows={10}
              ></ElInput>
            ),
            footer: () =>
              state.option.footer && (
                <div>
                  <ElButton onClick={cancelClick}>取消</ElButton>
                  <ElButton type="primary" onClick={confirmClick}>
                    确定
                  </ElButton>
                </div>
              ),
          }}
        </ElDialog>
      );
    };
  },
});
let vm;
export function importDialog(option) {
  // element-plus 中是有 el-dialog 组件
  // 手动去挂载组件 vue2中 手动挂载 通过 new SubComponent.$mount();
  if (!vm) {
    let el = document.createElement("div");
    vm = createVNode(dialogComponents, { option }); // 将组件渲染成虚拟节点
    // 这里需要将el渲染到我们的页面中
    document.body.appendChild((render(vm, el), el)); // 渲染成真实节点，扔到页面中
  }
  // 将组件渲染到这个el元素上
  let { showDialog } = vm.component.exposed;
  showDialog(option); // 其他说明组件已经有了只需要渲染出来即可
}
