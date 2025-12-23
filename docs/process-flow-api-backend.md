# 流程图接口文档（后端对接用）

## 概述

用于根据前端输入字符串返回流程图数据，前端展示为**线性纵向流程**。接口返回统一标准包裹，数据结构采用领域模型 `steps/links`。

## 接口信息

- **Method**: POST
- **Path**: `/api/process-flow`
- **Content-Type**: `application/json`
- **鉴权**: 暂无（如需鉴权请在接口层追加）

## 请求参数

### Body

```json
{
  "seed": "string",
  "maxNodes": 10
}
```

### 字段说明

- `seed` (string, 必填)：输入字符串，作为生成依据。
- `maxNodes` (number, 可选)：最大节点数，默认 10，建议范围 3~10。

## 响应结构（标准包裹）

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "steps": [],
    "links": []
  }
}
```

### data.steps (Step[])

| 字段            | 类型   | 必填 | 说明                  |
| --------------- | ------ | ---- | --------------------- |
| id              | string | 是   | 节点唯一标识          |
| name            | string | 是   | 节点名称              |
| order           | number | 是   | 节点顺序号，从 1 开始 |
| durationMinutes | number | 是   | 节点耗时，单位：分钟  |
| stats           | object | 是   | 指标汇总              |

### data.steps[].stats

| 字段              | 类型   | 必填 | 说明             |
| ----------------- | ------ | ---- | ---------------- |
| caseCount         | number | 是   | 案件数           |
| executionCount    | number | 是   | 执行次数         |
| throughputMinutes | object | 是   | 吞吐时间（分钟） |

### data.steps[].stats.throughputMinutes

| 字段   | 类型   | 必填 | 说明           |
| ------ | ------ | ---- | -------------- |
| median | number | 是   | 中位数（分钟） |
| max    | number | 是   | 最大值（分钟） |
| min    | number | 是   | 最小值（分钟） |

### data.links (Link[])

| 字段     | 类型   | 必填 | 说明         |
| -------- | ------ | ---- | ------------ |
| id       | string | 是   | 连线唯一标识 |
| sourceId | string | 是   | 起点节点 id  |
| targetId | string | 是   | 终点节点 id  |

## 业务约束

- 前端仅支持**线性流程**，建议 `links` 按 `order` 相邻连接（step-1 -> step-2 -> ...）。
- `order` 用于排序与展示序号，需连续且唯一。
- 所有时间字段均为 **分钟数（number）**，前端负责格式化为 `m/h/d`。

## 成功示例

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
      },
      {
        "id": "step-2",
        "name": "Review",
        "order": 2,
        "durationMinutes": 3200,
        "stats": {
          "caseCount": 420,
          "executionCount": 420,
          "throughputMinutes": {
            "median": 36.2,
            "max": 8200,
            "min": 8.4
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

## 错误响应示例

```json
{
  "code": 4001,
  "message": "seed is required",
  "data": null
}
```

## 错误码建议

- `4001`：seed 缺失或为空
- `4002`：maxNodes 非法
- `5000`：服务端异常
