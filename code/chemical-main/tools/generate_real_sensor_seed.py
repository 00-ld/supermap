from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path


DEFAULT_OUTPUT = Path("db/seed/real_dom_sensor_seed.sql")
LEGACY_SENSOR_DATA_OUTPUT = Path("deploy/mysql/sensor_data.sql")


@dataclass(frozen=True)
class SensorSeed:
    id: str
    x: float
    y: float
    height: float
    radius: float
    priority: int
    risk: float
    remark: str


SENSORS: list[SensorSeed] = [
    SensorSeed("PA-01L", 272, 286, 0.5, 4, 1, 0.86, "GB/T 50493-2019 4.2.1; real-DOM west-north process valve line"),
    SensorSeed("PA-01H", 272, 286, 2.2, 4, 1, 0.86, "GB/T 50493-2019 6.1.2; high-level light gas pair at PA-01L"),
    SensorSeed("PA-02L", 336, 332, 0.5, 4, 1, 0.84, "GB/T 50493-2019 4.2.1; real-DOM west-north tower base"),
    SensorSeed("PA-03L", 420, 354, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.2.1; real-DOM west-north pipe rack joint"),
    SensorSeed("PA-03H", 420, 354, 2.2, 4, 1, 0.82, "GB/T 50493-2019 6.1.2; high-level light gas pair at PA-03L"),
    SensorSeed("PA-04L", 510, 304, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.2.1; real-DOM west-north blue-roof process edge"),
    SensorSeed("PA-05L", 548, 398, 0.5, 4, 1, 0.78, "GB/T 50493-2019 4.2.1; real-DOM west-north south pipe outlet"),
    SensorSeed("PA-05H", 548, 398, 2.2, 4, 1, 0.78, "GB/T 50493-2019 6.1.2; high-level light gas pair at PA-05L"),
    SensorSeed("TK-01L", 276, 456, 0.5, 4, 1, 0.9, "GB/T 50493-2019 4.3.1; real-DOM southwest tank-pump north edge"),
    SensorSeed("TK-02L", 346, 500, 0.5, 4, 1, 0.9, "GB/T 50493-2019 4.3.1; real-DOM southwest white tank group"),
    SensorSeed("TK-02H", 346, 500, 2.2, 4, 1, 0.88, "GB/T 50493-2019 6.1.2; high-level pair above southwest tank group"),
    SensorSeed("TK-03L", 430, 470, 0.5, 4, 1, 0.86, "GB/T 50493-2019 4.3.1; real-DOM southwest pump outlet"),
    SensorSeed("TK-04L", 520, 510, 0.5, 4, 1, 0.84, "GB/T 50493-2019 4.3.1; real-DOM southwest pipe corridor bend"),
    SensorSeed("TK-05L", 292, 598, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.3.1; real-DOM southwest lower tank edge"),
    SensorSeed("TK-06L", 372, 636, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.3.1; real-DOM southwest lower pump row"),
    SensorSeed("TK-07L", 470, 604, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.3.1; real-DOM southwest process skid"),
    SensorSeed("TK-08L", 558, 648, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.3.1; real-DOM southwest southeast boundary valve"),
    SensorSeed("TK-08H", 558, 648, 2.2, 4, 1, 0.78, "GB/T 50493-2019 6.1.2; high-level pair at southwest boundary valve"),
    SensorSeed("PA-06L", 612, 292, 0.5, 4, 2, 0.7, "GB/T 50493-2019 4.2.1; real-DOM central-north west plant edge"),
    SensorSeed("PA-07L", 674, 288, 0.5, 4, 2, 0.7, "GB/T 50493-2019 4.2.1; real-DOM central-north roofed plant inlet"),
    SensorSeed("PA-08L", 730, 366, 0.5, 4, 2, 0.68, "GB/T 50493-2019 4.2.1; real-DOM central-north tank cluster"),
    SensorSeed("PA-08H", 730, 366, 2.2, 4, 2, 0.68, "GB/T 50493-2019 6.1.2; high-level pair at central-north tank cluster"),
    SensorSeed("PA-09L", 620, 456, 0.5, 4, 1, 0.74, "GB/T 50493-2019 4.2.1; real-DOM central-south reactor inlet"),
    SensorSeed("PA-10L", 704, 504, 0.5, 4, 1, 0.74, "GB/T 50493-2019 4.2.1; real-DOM central-south vessel manifold"),
    SensorSeed("PA-11L", 642, 590, 0.5, 4, 1, 0.76, "GB/T 50493-2019 4.2.1; real-DOM central-south lower tank row"),
    SensorSeed("PA-12L", 736, 650, 0.5, 4, 2, 0.68, "GB/T 50493-2019 4.2.1; real-DOM central-south southeast equipment edge"),
    SensorSeed("UT-01L", 782, 300, 0.5, 4, 2, 0.52, "GB/T 50493-2019 4.4.4; real-DOM utility north pipe trench"),
    SensorSeed("UT-01H", 782, 300, 2.2, 4, 2, 0.52, "GB/T 50493-2019 6.1.2; high-level pair at utility north pipe trench"),
    SensorSeed("UT-02L", 826, 426, 0.5, 4, 2, 0.5, "GB/T 50493-2019 4.4.4; real-DOM utility middle pipe rack"),
    SensorSeed("UT-03L", 800, 520, 0.5, 4, 2, 0.48, "GB/T 50493-2019 4.4.4; real-DOM utility lower equipment skid"),
    SensorSeed("UT-04L", 832, 628, 0.5, 4, 2, 0.48, "GB/T 50493-2019 4.4.4; real-DOM utility south blue-roof edge"),
    SensorSeed("TW-01L", 872, 286, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.2.1; real-DOM tower area north column base"),
    SensorSeed("TW-01H", 872, 286, 2.2, 4, 1, 0.82, "GB/T 50493-2019 6.1.2; high-level pair at tower north column"),
    SensorSeed("TW-02L", 920, 326, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.2.1; real-DOM tower area green tank group"),
    SensorSeed("TW-03L", 892, 410, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.2.1; real-DOM tower area central valve rack"),
    SensorSeed("TW-04L", 922, 500, 0.5, 4, 1, 0.78, "GB/T 50493-2019 4.2.1; real-DOM tower area lower manifold"),
    SensorSeed("TW-04H", 922, 500, 2.2, 4, 1, 0.78, "GB/T 50493-2019 6.1.2; high-level pair at lower manifold"),
    SensorSeed("TW-05L", 880, 610, 0.5, 4, 1, 0.76, "GB/T 50493-2019 4.2.1; real-DOM tower area south tank row"),
    SensorSeed("TW-06L", 938, 650, 0.5, 4, 2, 0.68, "GB/T 50493-2019 4.2.1; real-DOM tower area southeast boundary"),
    SensorSeed("PB-01L", 982, 284, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.3.1; real-DOM northeast black tank west edge"),
    SensorSeed("PB-01H", 982, 284, 2.2, 4, 1, 0.8, "GB/T 50493-2019 6.1.2; high-level pair at northeast black tank west edge"),
    SensorSeed("PB-02L", 1030, 294, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.3.1; real-DOM northeast tank manifold"),
    SensorSeed("PB-03L", 1082, 304, 0.5, 4, 1, 0.82, "GB/T 50493-2019 4.3.1; real-DOM northeast tank header"),
    SensorSeed("PB-03H", 1082, 304, 2.2, 4, 1, 0.82, "GB/T 50493-2019 6.1.2; high-level pair at northeast tank header"),
    SensorSeed("PB-04L", 1132, 314, 0.5, 4, 1, 0.8, "GB/T 50493-2019 4.3.1; real-DOM northeast tank east valve"),
    SensorSeed("PB-05L", 1180, 344, 0.5, 4, 1, 0.78, "GB/T 50493-2019 4.3.1; real-DOM northeast east vessel boundary"),
    SensorSeed("PB-06L", 1000, 386, 0.5, 4, 2, 0.7, "GB/T 50493-2019 4.3.1; real-DOM northeast lower pipe connection"),
    SensorSeed("PB-07L", 1100, 394, 0.5, 4, 2, 0.7, "GB/T 50493-2019 4.3.1; real-DOM northeast lower pipe header"),
    SensorSeed("P2-01L", 984, 456, 0.5, 4, 2, 0.64, "GB/T 50493-2019 4.2.1; real-DOM east-middle west equipment edge"),
    SensorSeed("P2-02L", 1060, 470, 0.5, 4, 2, 0.62, "GB/T 50493-2019 4.2.1; real-DOM east-middle blue basin"),
    SensorSeed("P2-03L", 1150, 470, 0.5, 4, 2, 0.62, "GB/T 50493-2019 4.2.1; real-DOM east-middle small tank row"),
    SensorSeed("P2-03H", 1150, 470, 2.2, 4, 2, 0.62, "GB/T 50493-2019 6.1.2; high-level pair at east-middle small tank row"),
    SensorSeed("P2-04L", 990, 520, 0.5, 4, 2, 0.58, "GB/T 50493-2019 4.4.4; real-DOM east-middle water treatment edge"),
    SensorSeed("P2-05L", 1130, 520, 0.5, 4, 2, 0.58, "GB/T 50493-2019 4.4.4; real-DOM east-middle south equipment edge"),
    SensorSeed("WH-01", 1100, 560, 1.5, 8, 2, 0.48, "GB/T 50493-2019 4.3.4; real-DOM warehouse north loading row"),
    SensorSeed("WH-02", 1160, 560, 1.5, 8, 2, 0.48, "GB/T 50493-2019 4.3.4; real-DOM warehouse north storage row"),
    SensorSeed("WH-03", 1200, 592, 1.5, 8, 2, 0.46, "GB/T 50493-2019 4.3.4; real-DOM warehouse east boundary row"),
    SensorSeed("WH-04", 1120, 630, 1.5, 8, 2, 0.46, "GB/T 50493-2019 4.3.4; real-DOM warehouse south loading row"),
    SensorSeed("WH-05", 1180, 650, 1.5, 8, 2, 0.46, "GB/T 50493-2019 4.3.4; real-DOM warehouse southeast row"),
    SensorSeed("FS-01", 1000, 560, 1.5, 8, 2, 0.4, "GB/T 50493-2019 4.4.3; real-DOM east emergency yard west boundary"),
    SensorSeed("FS-02", 1040, 620, 1.5, 8, 2, 0.4, "GB/T 50493-2019 4.4.3; real-DOM east emergency yard south boundary"),
]


HEADER = """-- 真实 DOM 二维地图传感器布点种子数据。
-- 源地图：external-real-dom-source/ResultDOM_2.tiff（脱敏来源标识，不记录本机绝对路径）
-- 源分辨率：0.05 m/pixel；前端资源：frontend/public/maps/real-park-dom.jpg。
-- 坐标为真实地图米制坐标，严格限制在 1587.2m x 947.2m 数据边界内。
-- 布点依据：GB/T 50493-2019。CO/CH4/NH3/O2 混合点按有毒气体 4m 水平覆盖半径控制；
-- 仓储区和应急边界点使用 8m 覆盖半径。
"""
LEGACY_HEADER = """-- LEGACY OPTIONAL: 真实 DOM 二维地图传感器布点历史参考脚本。
-- Canonical 部署入口是 deploy/mysql/init.sql；本文件不是初始化入口，也不参与默认校验。
""" + HEADER


AREA_LABELS = {
    "PA": "生产装置区",
    "TK": "储罐与泵区",
    "UT": "公用工程与管廊区",
    "TW": "塔器与罐组区",
    "PB": "东北罐组与管汇区",
    "P2": "东中生产与污水装置区",
    "WH": "仓储物流区",
    "FS": "东侧应急与装卸边界区",
}


def format_sensor_remark(sensor: SensorSeed) -> str:
    clause = sensor.remark.split(";", 1)[0].strip()
    prefix = sensor.id.split("-", 1)[0]
    area = AREA_LABELS.get(prefix, "真实 DOM 识别设备区")
    height_basis = "高位配对点，覆盖轻气上浮或顶部积聚风险" if sensor.id.endswith("H") else "低位近源点，覆盖有毒/重气贴地扩散风险"
    if prefix in {"WH", "FS"}:
        height_basis = "边界/装卸通道巡检点，覆盖仓储与应急通道风险"
    return (
        f"依据 {clause}；真实DOM识别区域：{area}；"
        f"点位坐标({sensor.x:.1f}m,{sensor.y:.1f}m)，安装高度{sensor.height:.1f}m，"
        f"覆盖半径{sensor.radius:.1f}m；{height_basis}"
    )


def sql_for_sensors(header: str = HEADER) -> str:
    lines = [
        header,
        "",
        "-- 重建真实 DOM 点位集，避免旧版 canvas 假点位继续混入数据库。",
        "DELETE FROM sensor;",
        "",
    ]
    for sensor in SENSORS:
        remark = format_sensor_remark(sensor)
        lines.append(
            "INSERT INTO sensor "
            "(id, x, y, installation_height, effective_range, detection_range, "
            "install_remark, priority, risk, type, mode) VALUES "
            f"('{sensor.id}', {sensor.x:.1f}, {sensor.y:.1f}, {sensor.height:.1f}, "
            f"{sensor.radius:.1f}, 'CO/CH4/NH3/O2', '{remark}', "
            f"{sensor.priority}, {sensor.risk:.2f}, 'gas', 'auto') "
            "ON DUPLICATE KEY UPDATE "
            "x = VALUES(x), "
            "y = VALUES(y), "
            "installation_height = VALUES(installation_height), "
            "effective_range = VALUES(effective_range), "
            "detection_range = VALUES(detection_range), "
            "install_remark = VALUES(install_remark), "
            "priority = VALUES(priority), "
            "risk = VALUES(risk), "
            "type = VALUES(type), "
            "mode = VALUES(mode);"
        )
    return "\n".join(lines) + "\n"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate the real-DOM sensor seed SQL as a dry run by default."
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Repository-relative output path used with --write.",
    )
    parser.add_argument(
        "--legacy-sensor-data",
        action="store_true",
        help="Write to deploy/mysql/sensor_data.sql instead of the default db/seed staging path.",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Actually write the generated SQL. Without this flag the script only reports the target.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    root = Path(__file__).resolve().parents[1]
    output_rel = LEGACY_SENSOR_DATA_OUTPUT if args.legacy_sensor_data else Path(args.output)
    header = LEGACY_HEADER if output_rel.as_posix() == LEGACY_SENSOR_DATA_OUTPUT.as_posix() else HEADER
    sensor_sql = sql_for_sensors(header=header)
    output_path = root / output_rel
    if not args.write:
        print(f"dry-run: would write {len(SENSORS)} real-DOM sensor seed rows to {output_rel}")
        print("pass --write to update the file")
        return
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sensor_sql, encoding="utf-8", newline="\n")
    print(f"wrote {len(SENSORS)} real-DOM sensor seed rows to {output_rel}")


if __name__ == "__main__":
    main()
