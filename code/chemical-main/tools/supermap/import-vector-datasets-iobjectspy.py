from __future__ import annotations

import os
from pathlib import Path

from iobjectspy import ImportMode, PrjCoordSys, import_geojson, open_datasource


CUP_ROOT = Path(r"G:\竞赛\超图杯")
DATA_ROOT = Path(
    os.environ.get(
        "SUPERMAP_SOURCE_DATA_ROOT",
        str(CUP_ROOT / "报告素材" / "二维数据集识别" / "supermap_import"),
    )
)
OUT_ROOT = CUP_ROOT / "报告素材" / "二维数据集识别" / "supermap_udbx"
OUT_ROOT.mkdir(parents=True, exist_ok=True)
SOURCE_CHARSET = os.environ.get("SUPERMAP_SOURCE_CHARSET", "UTF-8")
TARGET_EPSG = int(os.environ.get("SUPERMAP_TARGET_EPSG", "0") or "0")

OUTPUT_DATASOURCE = Path(
    os.environ.get(
        "SUPERMAP_OUTPUT_DATASOURCE",
        str(OUT_ROOT / "chemical_park_vectors.udbx"),
    )
)

DATASETS = [
    ("road_polygons_map.geojson", "Park_RoadPolygon"),
    ("road_network_nodes_map.geojson", "Park_RoadNetworkNode"),
    ("road_network_edges_map.geojson", "Park_RoadNetworkEdge"),
    ("building_facility_polygons_map.geojson", "Park_BuildingFacilityPolygon"),
    ("building_footprints_map.geojson", "Park_BuildingFootprint"),
    ("entrance_points_map.geojson", "Park_EntrancePoint"),
    ("s3m_object_footprints_map.geojson", "Park_S3MObjectFootprint"),
]


def main() -> None:
    imported = []
    for file_name, dataset_name in DATASETS:
        source = DATA_ROOT / file_name
        if not source.exists():
            raise FileNotFoundError(source)
        result = import_geojson(
            str(source),
            str(OUTPUT_DATASOURCE),
            out_dataset_name=dataset_name,
            import_mode=ImportMode.OVERWRITE,
            source_file_charset=SOURCE_CHARSET,
        )
        imported.append({
            "source": str(source),
            "dataset": dataset_name,
            "result": [item.name if hasattr(item, "name") else str(item) for item in result],
        })

    projection_note = "not set"
    if TARGET_EPSG:
        prj = PrjCoordSys.from_epsg_code(TARGET_EPSG)
        datasource = open_datasource(str(OUTPUT_DATASOURCE))
        datasource.set_prj_coordsys(prj)
        for dataset in datasource.datasets:
            dataset.set_prj_coordsys(prj)
        projection_note = f"EPSG:{TARGET_EPSG} / {prj.name}"
        datasource.close()

    manifest = OUT_ROOT / "iobjectspy_import_manifest.txt"
    lines = [
        f"Output datasource: {OUTPUT_DATASOURCE}",
        f"Source data root: {DATA_ROOT}",
        f"Source charset: {SOURCE_CHARSET}",
        f"Target projection: {projection_note}",
        "Imported datasets:",
        *[
            f"- {item['dataset']} <= {Path(item['source']).name} -> {', '.join(item['result'])}"
            for item in imported
        ],
        "",
        "Next iDesktopX steps:",
        "1. Open the datasource in iDesktopX.",
        "2. Verify Park_RoadNetworkEdge and Park_RoadNetworkNode topology.",
        "3. Build a network dataset from road edge/node datasets.",
        "4. Verify Park_BuildingFootprint against the S3M scene and refine pending/low-confidence polygons.",
        "5. Publish the datasource through iServer as Data/Map service.",
    ]
    manifest.write_text("\n".join(lines), encoding="utf-8")
    print(str(OUTPUT_DATASOURCE))
    print(manifest.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
