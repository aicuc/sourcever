# 数据模型 v0.1

采用可读 JSON，实体间通过稳定 ID 引用。`data/cases.json` 是 UI 所需的聚合视图；`needs/solutions/resources/sources/access/evolution-events/relations.json` 保留独立图谱实体。修改节点后必须同步实体与聚合视图，运行 `npm run check`。

| 实体 | 核心字段 |
| --- | --- |
| Need | id, title, want, need, keywords |
| Solution | id, needId, name, era, solves, limitation, representative, reason, evidence, sourceIds |
| Resource | id, name, solutionId, sourceId, url, pricing, status, accessId |
| Source | id, name, url, tier, description, checkedAt（未知为 null） |
| Access | id, resourceId, how, eligibility, conditions, region, window, sourceId, alternativeIds |
| Evolution Event | id, needId, fromId, toId, why, oldCapability, oldLimit, newCapability, newProblem, sourceIds, evidence |

## 关系语义

- Need `solved_by` Solution
- Solution `implemented_by` Resource
- Resource `accessible_via` Access
- Resource `documented_at` Source（没有首发证据时不得写 first_published_at）
- `relations.json` 中新 Solution `evolved_from` 旧 Solution，原路线 `forked_into` 分支。
- UI 的 cases.edges 与 Evolution Event 为按时间绘图的视图：旧 fromId → 新 toId，type=evolved_into。两种方向显式区分。
- 分支重新接回共同节点表达汇合；正式 merged_into 语义需明确继承证据后再添加。

## 验证

`web/schema.mjs` 是模型与数据共用的结构契约。验证节点引用、来源引用、URL 协议与所需字段。`scripts/validate.mjs` 额外检查全局唯一 ID、关系端点和演化图无环。结构正确不等于事实正确。

日期字段只记录编辑/查阅时间，不自动延长状态有效期。节点 era 可用模糊阶段，不要求伪造精确年份。空失败列表需带 failureNote 解释资料缺口。

## AI 返回协议

`POST /api/analyze` 输入 `{query:string, forceAI?:boolean}`，成功返回 `{case,resources,sources,access,matched?}`。模型输出通过同一契约。mode 强制为 ai，checkedAt 强制清空；通过校验也仍是未经事实核查的草稿。无密钥且无匹配返回 422。非法输入 400，超长请求 413，模型失败 502。密钥永不进入响应。
