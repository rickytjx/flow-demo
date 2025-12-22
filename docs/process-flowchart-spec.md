# 流程图组件需求与技术方案

## 目标与范围

- 在现有 Vue 3 项目中实现“垂直流程图组件”，使用 @vue-flow/core + dagre 计算布局。
- 提供“Demo 模式”：输入字符串后生成随机但可复现的线性流程图。
- 交付内容：`App.vue`（或等效入口）、自定义节点组件、布局 composable、Tooltip 逻辑与样式。

## 需求梳理（按业务意图重述）

1. **视觉结构**

   - 画布占满可用宽高，流程图严格自上而下、线性排列。
   - 节点为白色矩形、描边；左侧蓝色小方块显示图标或序号。
   - 右侧显示主标题与小号时长文本（如 “5.2d”）。
   - 连接点在节点的顶部与底部；边线使用 smoothstep 或直线，带箭头。

2. **交互行为**

   - 鼠标悬停节点时显示 Tooltip（深蓝背景 #1e3a8a、白字、圆角、轻微透明）。
   - Tooltip 展示：标题、Case Count、Execution Count、吞吐时间（中位/最大/最小）。
   - 需兼容触摸设备：支持触摸触发与跟随位置展示。

3. **Demo 模式（字符串驱动生成）**
   - 输入字符串 -> 数字 seed -> 伪随机数生成器（可复现）。
   - 生成 3~10 个节点，标题从预设列表随机抽取。
   - 生成 Tooltip 模拟数据与节点时长。
   - 输入变化需 debounce 触发重新渲染。

## 现有项目分析（关键点）

- Vue 3 + Vite + TypeScript + UnoCSS，已启用文件路由与自动导入。
- `App.vue` 目前仅包含 `RouterView` 与 `TheFooter`（计划移除 `TheFooter`）。
- `@vue-flow/core` 已在依赖中，但 `dagre` 尚未添加。

## 技术方案（遵循 KISS/DRY/YAGNI/SOLID）

1. **组件划分（单一职责）**

   - `ProcessNode.vue`：自定义节点外观与 Handle 位置，仅负责 UI；左侧蓝色方块用 slot 承载，默认展示序号。
   - `useLayout.ts`：封装 dagre 纵向布局逻辑，仅负责坐标计算。
   - `FlowTooltip.vue`（可选）：仅负责浮层 UI 与定位展示。
   - `src/pages/index.vue`：整合输入框、节点/边数据、hover 状态与布局调用（保留路由结构）。

2. **数据结构（简洁可读）**

   - `FlowNodeData`：`title`、`duration`、`stats`（case/execution/ttm）。
   - `FlowEdge`：线性连接 `node-i -> node-(i+1)`。

3. **布局策略**

   - dagre `rankdir: 'TB'`，固定节点尺寸（宽/高）用于稳定布局。
   - 每次数据变化后调用 `useLayout` 生成 `position`。
   - 节点保持线性排序；边类型 `smoothstep` + `markerEnd` 箭头。

4. **Tooltip 策略**

   - 使用 Vue Flow 的节点事件控制显示状态，鼠标与触摸统一走 pointer 事件。
   - 位置以 pointer 坐标为主，移动端保持跟随。

5. **样式策略**

   - 优先使用 UnoCSS 原子类完成布局与颜色；少量 scoped CSS 仅处理复杂细节。
   - 画布容器满高满宽，输入区与画布分区清晰，整体保持纯净画布。

6. **可复现随机**
   - 自定义轻量 PRNG（如 LCG），保证相同字符串输出一致。
   - debounce 使用 `@vueuse/core` 的 `useDebounceFn`。

## 已确认的决策项

1. **入口位置**：使用 `src/pages/index.vue`，保留路由结构。
2. **现有 UI 处理**：移除 `TheFooter` 与暗色模式按钮，引入 `@vue-flow/controls`。
3. **蓝色方块内容**：默认展示步骤序号，采用 slot 形式便于后续自定义。
4. **Tooltip 定位**：跟随鼠标，同时兼容触摸设备。
5. **背景与整体风格**：保持纯净画布。
6. **依赖变更**：允许新增 `dagre` 依赖。

## 补充确认项

1. **Tooltip 的触摸交互细节**：移动端采用“点按显示 + 再次点按/点空白隐藏”。
2. **边线样式默认值**：采用 `smoothstep`。

## 下一步

- 已确认所有待确认项，可以进入编码实现与文件调整。
