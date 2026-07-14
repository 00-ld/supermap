from __future__ import annotations

import json
import os
import shutil
from datetime import datetime
from pathlib import Path


CUP_ROOT = Path(r"G:\竞赛\超图杯")
SOURCE_UDBX = CUP_ROOT / "报告素材" / "二维数据集识别" / "iserver_publish_cgcs2000" / "chemical_park_vectors_cgcs2000.udbx"
SOURCE_SMwu = CUP_ROOT / "报告素材" / "二维数据集识别" / "iserver_publish_cgcs2000" / "chemical_park_vectors_cgcs2000.smwu"
OUT_DIR = CUP_ROOT / "报告素材" / "NetworkAnalysis发布验收"
OUT_UDBX = OUT_DIR / "chemical_park_vectors_cgcs2000_network.udbx"
OUT_SMWU = OUT_DIR / "chemical_park_vectors_cgcs2000_network.smwu"
REPORT_JSON = OUT_DIR / "network_dataset_build_result.json"
REPORT_MD = OUT_DIR / "network_dataset_build_result.md"


def _patch_supermap_runtime_path() -> None:
    bin_dir = Path(r"F:\supermap-idesktopx-2026-windows-x64-setup\bin")
    if bin_dir.exists():
        os.environ["PATH"] = f"{bin_dir};{os.environ.get('PATH', '')}"
        os.environ.setdefault("UGO_HOME", str(bin_dir))


def _copy_workspace_inputs() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE_UDBX, OUT_UDBX)
    shutil.copy2(SOURCE_SMwu, OUT_SMWU)
    text = OUT_SMWU.read_text(encoding="utf-8", errors="ignore")
    text = text.replace(str(SOURCE_UDBX), str(OUT_UDBX))
    text = text.replace(SOURCE_UDBX.name, OUT_UDBX.name)
    OUT_SMWU.write_text(text, encoding="utf-8")


def _dataset_names(datasource) -> list[str]:
    return [dataset.name for dataset in datasource.datasets]


def _get_dataset(datasource, name: str):
    for dataset in datasource.datasets:
        if dataset.name == name:
            return dataset
    raise KeyError(name)


def _field_names(dataset) -> list[str]:
    try:
        return [field.name for field in dataset.field_infos]
    except Exception:
        return []


def _node_int_id(node_id: str) -> int:
    text = str(node_id or "").strip()
    if text.startswith("node-"):
        return int(text.split("-", 1)[1])
    digits = "".join(ch for ch in text if ch.isdigit())
    if digits:
        return int(digits)
    raise ValueError(f"Cannot convert node id to int: {node_id!r}")


def _ensure_int_field(jvm, dataset, field_name: str) -> None:
    jdataset = dataset._java_object
    field_infos = jdataset.getFieldInfos()
    if field_infos.indexOf(field_name) >= 0:
        return
    field_info = jvm.com.supermap.data.FieldInfo(field_name, jvm.com.supermap.data.FieldType.INT32)
    added_index = field_infos.add(field_info)
    if added_index < 0:
        raise RuntimeError(f"Failed to add INT32 field {field_name} to {dataset.name}")


def _prepare_numeric_network_fields(jvm, edge, node) -> dict[str, int]:
    cursor = jvm.com.supermap.data.CursorType.DYNAMIC
    for field_name in ("nodeIdInt",):
        _ensure_int_field(jvm, node, field_name)
    for field_name in ("edgeIdInt", "fromNodeInt", "toNodeInt"):
        _ensure_int_field(jvm, edge, field_name)

    node_count = 0
    node_recordset = node._java_object.getRecordset(False, cursor)
    try:
        if not node_recordset.isEmpty():
            node_recordset.moveFirst()
            while not node_recordset.isEOF():
                text_id = node_recordset.getString("id")
                int_id = _node_int_id(text_id)
                if not node_recordset.edit():
                    raise RuntimeError(f"Failed to edit node record {text_id}")
                node_recordset.setInt32("nodeIdInt", int_id)
                if not node_recordset.update():
                    raise RuntimeError(f"Failed to update node record {text_id}")
                node_count += 1
                node_recordset.moveNext()
    finally:
        node_recordset.close()

    edge_count = 0
    edge_recordset = edge._java_object.getRecordset(False, cursor)
    try:
        if not edge_recordset.isEmpty():
            edge_recordset.moveFirst()
            while not edge_recordset.isEOF():
                edge_id = edge_recordset.getID()
                from_id = _node_int_id(edge_recordset.getString("fromNode"))
                to_id = _node_int_id(edge_recordset.getString("toNode"))
                if not edge_recordset.edit():
                    raise RuntimeError(f"Failed to edit edge record {edge_id}")
                edge_recordset.setInt32("edgeIdInt", int(edge_id))
                edge_recordset.setInt32("fromNodeInt", int(from_id))
                edge_recordset.setInt32("toNodeInt", int(to_id))
                if not edge_recordset.update():
                    raise RuntimeError(f"Failed to update edge record {edge_id}")
                edge_count += 1
                edge_recordset.moveNext()
    finally:
        edge_recordset.close()

    return {"nodeCount": node_count, "edgeCount": edge_count}


def main() -> int:
    _patch_supermap_runtime_path()
    _copy_workspace_inputs()

    from iobjectspy import open_datasource

    result: dict[str, object] = {
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "sourceUdbx": str(SOURCE_UDBX),
        "outputUdbx": str(OUT_UDBX),
        "outputWorkspace": str(OUT_SMWU),
        "targetDataset": "Park_RoadNetwork_N",
        "ok": False,
        "attempts": [],
    }

    datasource = open_datasource(str(OUT_UDBX))
    try:
        datasets_before = _dataset_names(datasource)
        result["datasetsBefore"] = datasets_before
        edge = _get_dataset(datasource, "Park_RoadNetworkEdge_L")
        node = _get_dataset(datasource, "Park_RoadNetworkNode_P")
        result["edgeFields"] = _field_names(edge)
        result["nodeFields"] = _field_names(node)
        result["edgeType"] = str(edge.type)
        result["nodeType"] = str(node.type)
        result["projection"] = getattr(getattr(edge, "prj_coordsys", None), "name", None)

        jedge = getattr(edge, "_java_object", None)
        jnode = getattr(node, "_java_object", None)
        jdatasource = getattr(datasource, "_java_object", None)
        result["hasJavaObjects"] = bool(jedge and jnode and jdatasource)

        gateway = getattr(datasource, "_gateway", None)
        if gateway is None:
            try:
                from iobjectspy._jsuperpy._gateway import get_gateway

                gateway = get_gateway()
            except Exception as exc:
                result["attempts"].append({"name": "get_gateway", "ok": False, "error": repr(exc)})
        if gateway is None:
            raise RuntimeError("iObjectsPy gateway is unavailable")

        jvm = gateway.jvm
        result["numericFieldPreparation"] = _prepare_numeric_network_fields(jvm, edge, node)
        builder = jvm.com.supermap.analyst.networkanalyst.NetworkBuilder

        attempts = [
            (
                "edge_node_numeric_fields",
                lambda: builder.buildNetwork(
                    jedge,
                    jnode,
                    "edgeIdInt",
                    "fromNodeInt",
                    "toNodeInt",
                    "nodeIdInt",
                    jdatasource,
                    "Park_RoadNetwork_N",
                ),
            ),
            (
                "edge_node_sm_node_fields",
                lambda: builder.buildNetwork(
                    jedge,
                    jnode,
                    "edgeIdInt",
                    "fromNodeInt",
                    "toNodeInt",
                    "SmID",
                    jdatasource,
                    "Park_RoadNetwork_N",
                ),
            ),
        ]

        network_dataset = None
        for name, fn in attempts:
            try:
                network_dataset = fn()
                ok = network_dataset is not None
                result["attempts"].append({"name": name, "ok": ok, "javaResult": str(network_dataset)})
                if ok:
                    break
            except Exception as exc:
                java_message = None
                java_exception = getattr(exc, "java_exception", None)
                if java_exception is not None:
                    try:
                        java_message = str(java_exception.toString())
                    except Exception:
                        java_message = str(java_exception)
                result["attempts"].append(
                    {
                        "name": name,
                        "ok": False,
                        "error": repr(exc),
                        "message": str(exc),
                        "javaMessage": java_message,
                    }
                )

        datasets_after = _dataset_names(datasource)
        result["datasetsAfter"] = datasets_after
        result["ok"] = "Park_RoadNetwork_N" in datasets_after or network_dataset is not None
    finally:
        datasource.close()

    REPORT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# Network Dataset 构建结果",
        "",
        f"- 时间：{result['createdAt']}",
        f"- 源 UDBX：`{result['sourceUdbx']}`",
        f"- 输出 UDBX：`{result['outputUdbx']}`",
        f"- 目标数据集：`{result['targetDataset']}`",
        f"- 结果：{'成功' if result['ok'] else '未成功'}",
        f"- 投影：`{result.get('projection')}`",
        "",
        "## 尝试记录",
        "",
    ]
    for item in result["attempts"]:
        lines.append(f"- `{item['name']}`：{'OK' if item.get('ok') else 'FAIL'}")
        if item.get("error"):
            lines.append(f"  - error: `{item['error']}`")
    lines.extend(
        [
            "",
            "## 说明",
            "",
            "本脚本只在副本 UDBX 上构建网络数据集，不覆盖已发布的 CGCS2000 Data/Map 基线。",
            "如果结果为未成功，需要转入 iDesktopX 手工网络构建向导，并以本报告中的字段清单作为配置依据。",
        ]
    )
    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
