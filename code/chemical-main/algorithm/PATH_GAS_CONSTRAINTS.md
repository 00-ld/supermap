# 路径规划与气体扩散修正说明

## 强制约束（必须遵守）
- <span style="color:red">禁止再次引入道路权重（主干路/非主干路、道路宽度、历史通行速度等一律不得参与路径代价）。</span>
- <span style="color:red">必须实时剔除高浓度路段（浓度 >= IDLH 阈值）并从 A* OPEN 扩展候选中移除。</span>

## 核心伪代码
```text
function REPLAN(start, exits, graph, gas_sources, weather, t_now):
    risk_field = compute_concentration_field(gas_sources, weather, t_now)
    danger_mask = build_danger_road_mask(graph, risk_field, threshold=IDLH)
        # danger_mask.blocked_edges: 所有浓度>=IDLH的路段
        # danger_mask.blocked_nodes: 所有浓度>=IDLH的节点

    best = None
    for exit in exits:
        route = A_STAR_SHORTEST_PATH(start, exit, graph, danger_mask)
        if route.isReachable and (best is None or route.distance < best.distance):
            best = route
    return best

function A_STAR_SHORTEST_PATH(start, goal, graph, danger_mask):
    open_set = priority_queue()
    g[start] = 0
    push(open_set, f=heuristic(start, goal), node=start)

    while open_set not empty:
        cur = pop_min_f(open_set)
        if cur == goal:
            return reconstruct_path(cur)

        for each neighbor in graph[cur]:
            edge = (cur, neighbor)

            # ---- 浓度规避判断插入点（强制）----
            if cur in danger_mask.blocked_nodes:
                continue
            if neighbor in danger_mask.blocked_nodes:
                continue
            if edge in danger_mask.blocked_edges:
                continue
            # ----------------------------------

            # ---- 简化A*：仅最短路径目标 ----
            tentative_g = g[cur] + geometric_length(cur, neighbor)
            # 不允许加入任何道路等级/宽度/速度等附加权重
            # ----------------------------------

            if tentative_g < g[neighbor]:
                parent[neighbor] = cur
                g[neighbor] = tentative_g
                f = tentative_g + heuristic(neighbor, goal)  # 欧氏或曼哈顿
                push_or_update(open_set, neighbor, f)

    return blocked
```

## 单元测试覆盖
- 文件：`algorithm/tests/test_path_hazard_avoidance.py`
- 覆盖内容：
  - 最短路径穿越高浓度段时，算法必须绕行
  - 至少 3 条“最短但危险”路径被屏蔽后仍可返回安全路径
  - 动态重规划时危险掩码变化可触发路径切换

## 性能基准
- 脚本：`algorithm/benchmarks/benchmark_replan_10k.py`
- 配置：10,000 节点、30,000 边，随机危险掩码，30 轮重规划
- 输出：
  - 平均重规划耗时 `avg_replan_ms`
  - 内存峰值 `peak_mem_mb`
  - 判定阈值：`avg_replan_ms <= 80` 且 `peak_mem_mb <= 128`
