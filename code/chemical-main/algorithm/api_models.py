"""Pydantic 请求模型，为算法服务端点提供 OpenAPI schema 与前置校验。

设计原则（宽松校验）：
- 仅把语义上硬必填的字段标为必填（如扩散仿真的 gasId），其余字段 Optional+默认值，
  由算法层自行处理缺失（phase1_diffusion 等已有 parse_float 默认值兜底）。
- model_config extra="allow" 允许额外字段透传，避免误杀前端动态拼装的 payload。
- model_dump() 把 Model 转回 dict 传给 _run_engine_task，保持算法层接口不变。
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DiffusionSimulationRequest(BaseModel):
    """扩散仿真请求。

    gasId 为唯一硬必填（算法层 get_gas_by_id 缺它抛 ValueError），提前到 FastAPI 层
    校验返回 422；其余环境/几何/源参数全部 Optional，由算法层兜底默认值。
    """

    model_config = ConfigDict(extra="allow")

    gasId: str = Field(..., description="气体标识，如 nh3/co/ch4/o2")
    facilities: list[dict[str, Any]] = Field(default_factory=list, description="设施列表")
    roads: list[dict[str, Any]] = Field(default_factory=list, description="道路列表")
    sensors: list[dict[str, Any]] = Field(default_factory=list, description="传感器列表")
    sourceFacilityId: str | None = Field(default=None, description="泄漏源设施 ID")
    sourceMapPoint: dict[str, Any] | None = Field(default=None, description="泄漏源地图坐标 {x,y}")


class CoarseSearchRequest(BaseModel):
    """粗搜索请求。sensors 为核心输入，缺失时返回空候选。"""

    model_config = ConfigDict(extra="allow")

    sensors: list[dict[str, Any]] = Field(default_factory=list, description="传感器观测列表")
    gas: dict[str, Any] | None = Field(default=None, description="气体元数据")
    scenario: dict[str, Any] | None = Field(default=None, description="场景参数（风速/风向/稳定度等）")


class AnalyticInversionRequest(BaseModel):
    """解析溯源请求。candidateRegions 来自粗搜索结果，缺失时算法层抛 ValueError。"""

    model_config = ConfigDict(extra="allow")

    sensors: list[dict[str, Any]] = Field(default_factory=list, description="传感器观测列表")
    candidateRegions: list[dict[str, Any]] = Field(default_factory=list, description="粗搜索候选区域")


class ParticleFilterRequest(BaseModel):
    """粒子滤波溯源请求。sensors 缺失时算法层抛 ValueError。"""

    model_config = ConfigDict(extra="allow")

    sensors: list[dict[str, Any]] = Field(default_factory=list, description="传感器观测列表")


class EvacuationRequest(BaseModel):
    """疏散规划请求。roads 为寻路基础，gas/frame 为危险感知输入。"""

    model_config = ConfigDict(extra="allow")

    roads: list[dict[str, Any]] = Field(default_factory=list, description="道路列表")
    gas: dict[str, Any] | None = Field(default=None, description="气体元数据")
