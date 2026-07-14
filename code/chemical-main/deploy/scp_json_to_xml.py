#!/usr/bin/env python3
"""Convert JSON SCP files to XML format for SuperMap Cesium library."""
import json
import os
import sys

def scp_json_to_xml(scp):
    pos = scp['position']['point3D']
    gb = scp.get('geoBounds', {})
    hr = scp.get('heightRange', {})
    ext = scp.get('extensions', {})

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<Spatial3DModel Asset="SuperMap" Version="{}"'.format(scp.get('version', '3.01'))
    xml += ' DataType="{}"'.format(scp.get('dataType', 'ArtificialModel'))
    xml += ' PyramidSplitType="{}"'.format(scp.get('pyramidSplitType', 'QuadTree'))
    xml += ' LodType="{}">\n'.format(scp.get('lodType', 'Replace'))

    xml += '  <Position>\n'
    xml += '    <X>{}</X>\n'.format(pos['x'])
    xml += '    <Y>{}</Y>\n'.format(pos['y'])
    xml += '    <Z>{}</Z>\n'.format(pos['z'])
    xml += '  </Position>\n'

    if gb:
        xml += '  <GeoBounds>\n'
        xml += '    <Left>{}</Left>\n'.format(gb.get('left', 0))
        xml += '    <Top>{}</Top>\n'.format(gb.get('top', 0))
        xml += '    <Right>{}</Right>\n'.format(gb.get('right', 0))
        xml += '    <Bottom>{}</Bottom>\n'.format(gb.get('bottom', 0))
        xml += '  </GeoBounds>\n'

    if hr:
        xml += '  <HeightRange>\n'
        xml += '    <Min>{}</Min>\n'.format(hr.get('min', 0))
        xml += '    <Max>{}</Max>\n'.format(hr.get('max', 0))
        xml += '  </HeightRange>\n'

    xml += '  <Extensions>\n'
    xml += '    <FileType>{}</FileType>\n'.format(ext.get('s3m:FileType', 'OSGBCacheFile'))
    xml += '    <TileSplitType>{}</TileSplitType>\n'.format(ext.get('s3m:TileSplitType', 'LOCAL'))
    xml += '    <TextureSharing>{}</TextureSharing>\n'.format(ext.get('s3m:TextureSharing', 'FALSE'))
    xml += '    <TransparencyOptimization>{}</TransparencyOptimization>\n'.format(ext.get('s3m:TransparencyOptimization', 'TRUE'))
    xml += '    <VertexWeightMode>{}</VertexWeightMode>\n'.format(ext.get('s3m:VertexWeightMode', 'Height'))
    xml += '    <ProcessType>{}</ProcessType>\n'.format(ext.get('s3m:processType', 'Normal'))
    xml += '  </Extensions>\n'

    xml += '  <Tiles>\n'
    for tile in scp.get('rootTiles', []):
        bb = tile.get('boundingBox', {})
        xml += '    <Tile>\n'
        xml += '      <Url>{}</Url>\n'.format(tile['url'])
        if bb:
            center = bb.get('center', {})
            cx = center.get('x', 0)
            cy = center.get('y', 0)
            cz = center.get('z', 0)
            xext = bb.get('xExtent', {})
            yext = bb.get('yExtent', {})
            zext = bb.get('zExtent', {})
            # Compute AABB from oriented bounding box (8 corners)
            min_x = min_y = min_z = float('inf')
            max_x = max_y = max_z = float('-inf')
            for sx in (-1, 1):
                for sy in (-1, 1):
                    for sz in (-1, 1):
                        px = cx + sx * xext.get('x', 0) + sy * yext.get('x', 0) + sz * zext.get('x', 0)
                        py = cy + sx * xext.get('y', 0) + sy * yext.get('y', 0) + sz * zext.get('y', 0)
                        pz = cz + sx * xext.get('z', 0) + sy * yext.get('z', 0) + sz * zext.get('z', 0)
                        min_x = min(min_x, px); max_x = max(max_x, px)
                        min_y = min(min_y, py); max_y = max(max_y, py)
                        min_z = min(min_z, pz); max_z = max(max_z, pz)
            xml += '      <Boundingbox>\n'
            xml += '        <Min><X>{}</X><Y>{}</Y><Z>{}</Z></Min>\n'.format(min_x, min_y, min_z)
            xml += '        <Max><X>{}</X><Y>{}</Y><Z>{}</Z></Max>\n'.format(max_x, max_y, max_z)
            xml += '      </Boundingbox>\n'
        xml += '    </Tile>\n'
    xml += '  </Tiles>\n'
    xml += '</Spatial3DModel>\n'

    return xml


def process_directory(base_dir):
    """Find all .scp files and convert to XML."""
    count = 0
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.scp'):
                scp_path = os.path.join(root, f)
                xml_path = os.path.join(root, f.replace('.scp', '.xml'))
                try:
                    with open(scp_path, 'r', encoding='utf-8') as fp:
                        scp = json.load(fp)
                    xml = scp_json_to_xml(scp)
                    with open(xml_path, 'w', encoding='utf-8') as fp:
                        fp.write(xml)
                    print(f"Converted: {scp_path} -> {xml_path}")
                    count += 1
                except Exception as e:
                    print(f"Error converting {scp_path}: {e}")
    return count


if __name__ == '__main__':
    base = sys.argv[1] if len(sys.argv) > 1 else '.'
    n = process_directory(base)
    print(f"\nTotal converted: {n} files")
