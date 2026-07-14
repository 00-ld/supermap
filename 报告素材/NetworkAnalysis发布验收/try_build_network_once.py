from iobjectspy import open_datasource
from iobjectspy._jsuperpy._gateway import get_gateway
import shutil, pathlib
src=pathlib.Path(r'G:\竞赛\超图杯\报告素材\二维数据集识别\iserver_publish_cgcs2000\chemical_park_vectors_cgcs2000.udbx')
out=pathlib.Path(r'G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\chemical_park_vectors_cgcs2000_network_try2.udbx')
shutil.copy2(src,out)
ds=open_datasource(str(out))
try:
    edge=[d for d in ds.datasets if d.name=='Park_RoadNetworkEdge_L'][0]
    node=[d for d in ds.datasets if d.name=='Park_RoadNetworkNode_P'][0]
    gw=get_gateway()
    builder=gw.jvm.com.supermap.analyst.networkanalyst.NetworkBuilder
    r=builder.buildNetwork(edge._java_object,node._java_object,'id','id','fromNode','toNode',ds._java_object,'Park_RoadNetwork_N')
    print('RESULT', r)
    print([d.name for d in ds.datasets])
finally:
    ds.close()
