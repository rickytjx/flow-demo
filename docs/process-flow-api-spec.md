# 流程图接口接入与 Mock 方案（定稿）

## 需求整理（我的理解）

- 页面右上角输入框新增一个“请求”按钮，只有点击按钮才发起请求。
- 接入后端接口前，先用 mock 数据跑通流程；mock 使用 `mockjs`，请求使用 `axios`。
- 需要定义清晰的数据结构，并形成接口文档供后端对齐返回格式。

## 现有实现简要（影响点）

- 当前流程图数据在 `src/pages/index.vue` 内部用本地随机逻辑生成。
- 节点结构与展示依赖 `FlowNodeData`（`title`/`duration`/`index`/`stats`）。
- 布局由 `useLayout`（dagre）计算，仍可继续沿用前端布局。

## 技术方案（KISS / DRY / YAGNI / SOLID）

1. **请求与数据层**

   - 新增 `axios` 实例（统一 baseURL、超时、错误处理）。
   - 新增 `flow` 请求函数，入参为输入字符串，返回结构化数据。
   - 抽离类型定义，避免在页面里拼装与重复转换。

2. **Mock 方案**

   - 使用 `vite-plugin-mock` + `mockjs` 在开发环境拦截并返回与真实接口一致的数据。
   - 开发环境默认启用，可通过 `VITE_USE_MOCK=0` 或 `VITE_USE_MOCK=false` 关闭。
   - 生成逻辑可复用现有“seed -> 伪随机”策略，保证输入一致时结果一致。

3. **页面交互**
   - 输入框右侧增加按钮：点击触发请求，加载中禁用输入与按钮。
   - 按钮文案：`获取流程`，加载态为 `请求中...`。
   - 错误提示：输入框下方红色提示（不阻断页面）。
   - 请求成功后更新节点与边并触发布局。
   - 现有的 `debounce` 与“输入即更新”逻辑改为“按钮触发”。

## 接口文档（定稿）

### 接口名称

- `POST /api/process-flow`
- 说明：输入字符串作为生成依据

### 请求参数

```json
{
  "seed": "string",
  "maxNodes": 10
}
```

- `seed`：必填，输入字符串（用于生成结果）
- `maxNodes`：可选，最大节点数（默认 10）

### 响应结构（标准包裹）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "steps": [
      {
        "id": "step-1",
        "name": "Application",
        "order": 1,
        "durationMinutes": 7488,
        "stats": {
          "caseCount": 569,
          "executionCount": 569,
          "throughputMinutes": {
            "median": 48.4,
            "max": 151344,
            "min": 1.3
          }
        }
      }
    ],
    "links": [
      {
        "id": "edge-step-1-step-2",
        "sourceId": "step-1",
        "targetId": "step-2"
      }
    ]
  }
}
```

### 字段说明（核心）

- `steps[].durationMinutes` / `steps[].stats.throughputMinutes.*`：统一为分钟数（number），前端负责格式化为 `m/h/d`。
- `steps[].order`：顺序号，用于展示序号与排序。

### 错误响应（建议）

```json
{
  "code": 4001,
  "message": "seed is required",
  "data": null
}
```

## 已确认决策

1. **接口路径与方法**：`POST /api/process-flow`。
2. **响应包裹**：采用 `{ code, message, data }` 标准包裹。
3. **数据结构**：采用 `steps/links` 域模型。
4. **时间字段类型**：统一分钟数（number），前端负责格式化。
5. **交互细节**：按钮 `获取流程`，加载态 `请求中...`，错误提示显示在输入框下方。
6. **Mock 方式**：引入 `vite-plugin-mock`（基于 mockjs）。

## 后续执行顺序（确认后）

1. 安装依赖：`axios`、`mockjs`、`vite-plugin-mock`（可选：`@types/mockjs`）。
2. 新增 API 类型与请求封装。
3. 增加 mock 入口与开关。
4. 更新页面按钮与交互。
