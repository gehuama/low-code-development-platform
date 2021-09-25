import {
  createVNode,
  defineComponent,
  render,
  reactive,
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  provide,
  inject,
} from "vue";

export const dropdownItem = defineComponent({
  props: {
    label: String,
    icon: String,
  },

  setup(props) {
    const hide = inject("hide");
    return () => (
      <div class="dropdown-item" onClick={hide}>
        <i class={props.icon}></i>
        <span>{props.label}</span>
      </div>
    );
  },
});

const dropdownComponents = defineComponent({
  props: {
    option: { type: Object },
  },
  setup(props, ctx) {
    const state = reactive({
      option: props.option, // 用户给组件的属性
      isShow: false,
      top: 0,
      left: 0,
    });
    ctx.expose({
      // 让外界可以调用组件中的方法
      showDropdown(option) {
        state.option = option;
        console.log(state.option);
        state.isShow = true;
        let { top, left, height } = option.el.getBoundingClientRect();
        state.top = top + height;
        state.left = left;
      },
    });
    provide("hide", () => {
      state.isShow = false;
    });
    const classes = computed(() => [
      "dropdown",
      {
        "dropdown-is-show": state.isShow,
      },
    ]);
    const styles = computed(() => ({
      top: state.top + "px",
      left: state.left + "px",
    }));
    const el = ref(null);
    const onMouseDownDocument = (e) => {
      if (!el.value.contains(e.target)) {
        // 如果点击的是dropdown内部 什么都 不做
        state.isShow = false;
      }
    };
    onMounted(() => {
      // 事件的传递行为是先捕获，在冒泡
      // 之前为了阻止事件传播 我们给block 都增加 stopProPropagation
      document.body.addEventListener("mousedown", onMouseDownDocument, true);
    });
    onBeforeUnmount(() => {
      document.body.removeEventListener("mousedown", onMouseDownDocument);
    });
    return () => {
      return (
        <div ref={el} class={classes.value} style={styles.value}>
          {state.option.content()}
        </div>
      );
    };
  },
});
let vm;
export function importDropdown(option) {
  // element-plus 中是有 el-dialog 组件
  // 手动去挂载组件 vue2中 手动挂载 通过 new SubComponent.$mount();
  if (!vm) {
    let el = document.createElement("div");
    vm = createVNode(dropdownComponents, { option }); // 将组件渲染成虚拟节点
    // 这里需要将el渲染到我们的页面中
    document.body.appendChild((render(vm, el), el)); // 渲染成真实节点，扔到页面中
  }
  // 将组件渲染到这个el元素上
  let { showDropdown } = vm.component.exposed;
  showDropdown(option); // 其他说明组件已经有了只需要渲染出来即可
}
