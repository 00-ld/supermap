//TODO: 同步resource_zh_CN.js

/**
 * 数据源类型定义到DatasourceType中
 */
var commonRes = {
    'checkboxWMS111': 'WMS1.1.1 Service',
    'checkboxWMS130': 'WMS1.3.0 Service',
    'checkboxWMTS100': 'WMTS1.0.0 Service',
    'checkboxWMTSChina': 'WMTS-China Service',
    'checkboxRestMap': 'REST Map Service',
    'checkboxRestPlot': 'REST Plotting Service(2D+3D)',
    'checkboxRestPlot2D': 'REST Plotting Service(2D)',
    'checkboxRestPlot3D': 'REST Plotting Service(3D)',
    'checkboxWFS100': 'WFS1.0.0 Service',
    'checkboxWFS200': 'WFS2.0.0 Service',
    'checkboxWCS111': 'WCS1.1.1 Service',
    'checkboxWCS112': 'WCS1.1.2 Service',
    'checkboxWPS100': 'WPS1.0.0 Service',
    'checkboxRestData': 'REST Data Service',
    'checkboxRestDataHistory': 'REST DataHistory Service',
    'checkboxRestRealspace': 'REST 3D Service',
    'checkboxRestSpatialAnalyst': 'REST Spatial Analysis Service',
    'checkboxRestTransportationAnalyst': 'REST Transportation Analysis Service',
    'checkboxRestTrafficTransferAnalyst': 'REST Traffic Transfer Analysis Service',
    'checkboxRestAddressMatch': 'REST Address Matching Service',
    'checkboxRestDataFlow': 'REST Data Flow Service',
    'checkboxRestVectortile': 'REST Vector Tile Service',
    'checkBoxRestNetworkAnalyst3D': 'REST 3D Network Analysis Service',
    'checkBoxAgsRestMap': 'ArcGIS REST Map Service',
    'checkBoxAgsRestData': 'ArcGIS REST Feature Service',
    'checkBoxAgsRestNetworkAnalyst': 'ArcGIS REST Network Analysis Service',
    'checkBoxBaiduRestMap': 'Baidu REST Map Service',
    'checkBoxGoogleRestMap': 'Google REST Map Service',
    'checkBoxGeoprocessing': 'REST Geoprocessing Service',
    'checkBoxImageService':'OpenAPI-Image service'
};

var LicenseInfoRes = {
    'licenseIsNull': '许可为空，请选择许可',
    'quotaLicenseMasterServerIsNull': '主节点服务地址为空，请填写服务地址'
}

/**
 * 快速发布时的数据源类型，和select option的value保持一致。
 */
var DatasourceType = {
    VTPK: 'VTPK File',
    WMS: 'WMS Service',
    BINGMAPS: 'Bing Maps Service',
    GOOGLEMAPS: 'Google Maps Service',
    TianDiTu: 'TianDiTu Service',
    SUPERMAP_CLOUD: 'SuperMap Cloud Service',
    WMTS: 'WMTS Service',
    SMTiles: 'SMTiles File',
    MVTTiles: 'UGCV5(MVT) Tiles',
    ZXYTiles: 'ZXY Tiles',
    MBTiles: 'MBTiles File',
	MBTilesVector: 'MBTiles Vector File',
    TPK: 'TPK File',
    WFS: 'WFS Service',
    RESTMap: 'REST Map Service',
    RESTVectorTile: 'REST Vector Tile Service',
    RESTData: 'REST Data Service',
    RESTPlot: 'REST Plot Service',
    RESTNetworkAnalyst: "REST Network Analysis Service",
    RESTAddressMatch: "REST Address Matching Service",
    ArcGIS: 'ArcGIS REST Map Service',
    WORKSPACE: 'Workspace',
    WORKSPACE_FILE: 'Workspace File',
    UGCV5: 'UGCV5 Tiles',
    ArcGISCache: 'ArcGIS Cache',
    ArcGISCacheV2: 'ArcGIS CacheV2',
    Local3DCache: 'Local 3D Cache',
    ThreeDTilesCache: '3DTiles Cache',
    OSS3DTilesCache: 'OSS 3D Cache',
    Plot: 'Plot library',
    SVTiles: 'SVTiles File',
    MongoDB: 'MongoDB Tiles',
    MultiTiles: 'Multi Tiles',
    OTS: 'OTS Tiles',
    FastDFS: 'FastDFS Tiles',
    GeoPackage: 'GeoPackage File',
    BaiduMap: 'Baidu Map Service',
    OpenStreetMap: 'OpenStreetMap Map Service',
    ArcGISRestData: "ArcGIS REST Feature Service",
    ArcGISRestNetwork: "ArcGIS REST Network Analysis Service",
    ArcGISGeometryService: "ArcGIS REST Geometry Service",
    DataStoreData: "DataStore Data",
    DataFlowService: "Data Flow Service",
    StreamingService: "Stream Processing Model",
    GeometryService: "Geometry Service",
    AddressMathIndex: "AddressMatch Index",
    ElasticsearchData: "Elasticsearch Service",
    ShapeFile: 'Shapefile Directory',
    DSF: 'Distribute Spatial Format',
    PostGISData: "PostGIS Service",
    blockchainData: "Blockchain Service",
    HBase: "HBase Service",
    GeoTrellis: "Distributed Raster Data",
    ImageService: "Image Service"
};

var serviceTypeRes = {
    'Map': 'Map Service',
    'VectorTile': 'Vector Tile Service',
    'Data': 'Data Service',
    'DataHistory': 'DataHistory Service',
    'AddressMatch': 'Address Matching Service',
    'DataFlow': 'Data Flow Service',
    'Realspace': '3D Service',
    '3DNetWork': '3D NetWork Service',
    'Plot': 'Plot Service',
    'SpatialAnalyst': 'Spatial Aanalysis Service',
    'TrafficTransferAnalyst': 'Traffic Transfer Analysis Service',
    'TransportationAnalyst': 'Transportation Analysis Service',
    'GeoprocessorComponent': 'Geoprocessor Service',
    'VectorTile': 'REST Vector Tile Service',
    'ComponentSetType': 'Service Component(Set)s',
    'Geoprocessing': 'Geoprocessing Service',
    'Unknown': 'Unknown',
    'NoSupportMultiInstance': 'Not support multi-instance',
    'DatacatalogService': 'Data Catalog Services',
    'ProcessingService': 'Distributed Analysis Services',
    'MachineLearningService': 'Machine Learning Services',
    'GeoprocessingService': 'Processing Automation Services',
    'ImageService': 'Image Manager Services',
    'WebprintingService': 'Web Printing Services',
    'GeometryService': 'Geometry Services',
    'Network3D': '3D NetWork Service',
    'ComponentSetService': 'Service Component Sets',
    'VideoFlowService': 'Video Stream Service',
    'DomainService': 'Domain Services'
};

var serviceTypeExtendRes = {
    'NetworkAnalys3D': '3D NetWork Service',
    'Plot': 'Plotting Service'
};

var abbreviationServiceTypeRes = {
    "com.supermap.services.components.impl.MapImpl": "Map",
    "com.supermap.services.components.impl.DataImpl": "Data",
    "com.supermap.services.components.impl.SpatialAnalystImpl": "SpatialAnalyst",
    "com.supermap.services.components.impl.TransportationAnalystImpl": "TransportationAnalyst",
    "com.supermap.services.components.impl.TrafficTransferAnalystImpl": "TrafficTransferAnalyst",
    "com.supermap.services.components.impl.RealspaceImpl": "Realspace",
    "com.supermap.services.components.impl.NetworkAnalyst3DImpl": "3DNetWork",
    "com.supermap.services.components.impl.AddressMatchImpl": "AddressMatch",
    "com.supermap.services.components.impl.PlotImpl": "Plot"

};

var publishServiceRes = {
    'WMSService': 'WMS Service',
    'WFSService': 'WFS Service',
    'configureTrafficTransferAnalystServiceTitle': 'Configurate TrafficTransferAnalyst Service',
    'loadingTrafficTransferAnalystConfigDialog': 'Loading configuration dialog box. Please wait...',
    'workspaceFile': 'WorkspaceFile',
    'firstStepTitle': 'Configure data',
    'secondStepTitle': 'Please select the service type',
    'secondStepDes': 'Service types supported by current data source (more than one can be selected).',
    'thirdStepTitle': 'Other necessary configuration',
    'forthStepTitle': 'Configuration completed',
    'forthStepDes': 'Service instance information',
    'fifthStepTitle': 'Newly published services',
    'publishServiceDialogTitle': 'Service publishing wizard',
    'resultWorkspaceBingMaps': 'Bing Maps online service',
    'resultWorkspaceGoogleMaps': 'GoogleMaps online service',
    'resultWorkspaceTianditu': 'TianDiTu online service',
    'resultWorkspaceCloud': 'SuperMap cloud service',
    'resultWorkspaceBaidu': 'Baidu Map Service',
    'resultWorkspaceOSM': 'OpenStreetMap Map Service',
    'dialogNextAlert1': 'Service address cannot be null.',
    'dialogNextAlert2': 'Map set cannot be null.',
    'dialogNextAlert3': 'Key cannot be null.',
    'step2Alert1': 'Service type cannot be null.',
    'step3Alert1': 'Output site cannot be null.',
    'dialogCancelClose': 'Close',
    'dialogCancelCancel': 'Cancel',
    'tips': 'Browse in service list',
    'selectAll': 'Select/Deselect',
    'securityWarings': 'You browser security settings do not allow to contain the local directory, please select the remote server file system.',
    'passwdIncorrect': 'workspace\'s password is not correct',
    'wkspValidFailureReason': 'workspace valid failure\nbecause:',
    'wkspConnectStrIncorrect': 'workspace\'s connect information is not correct',
    'dsConnectStrIncorrect': 'dataSource\'s connect information is not correct',
    'InvalidURLAddress': 'Invalid URL',
    "Service": "Service"
};

var publishServiceCommonRes = {
    'errorWMS': 'Create WMS Interface failed: ',
    'errorRest': 'Create REST interface failed: ',
    'errorWFS': 'Create WFS Interface failed: ',
    'errorWMTS': 'Create WMTS Interface failed: ',
    'errorWCS': 'Create WCS Interface failed: ',
    'errorWPS': 'Create WPS Interface failed: ',
    'alertErrorMapComponent': 'Create Map Component failed',
    'alertErrorcausation': 'Cause: ',
    'alertErrorMapProvider': 'Create Map provider failed',
    'alertErrorDataComponent': 'Create Data Component failed',
    'alertErrorDataHistoryComponent': 'Create DataHistory Component failed',
    'alertErrorDataProvider': 'Create Data provider failed',
    'alertErrorDataHistoryProvider': 'Create DataHistory provider failed',
    'alertErrorPlotComponent': 'Create Plotting Component failed',
    'alertErrorPlotProvider': 'Create Plotting provider failed',
    'alertErrorRealspaceComponent': 'Create Realspace Component failed',
    'alertErrorRealspaceProvider': 'Create Realspace provider failed',
    'alertErrorSpatialAnalystComponent': 'Create Spatial Analysis Component failed',
    'alertErrorSpatialAnalystProvider': 'Create Spatial Analysis provider failed',
    'alertTransportationAnalystComponent': 'Create Transportation Analysis Component failed',
    'alertTransportationAnalystProvider': 'Create Transportation Analysis provider failed',
    'alertTrafficTransferAnalystComponent': 'Create Traffic Transfer Analysis Component failed',
    'alertTrafficTransferAnalystProvider': 'Create Traffic Transfer Analysis provider failed',
    'alertAddressMatchComponent': 'Create AddressMatching Component failed',
    'alertAddressMatchProvider': 'Create AddressMatching provider failed',
    'validateNullAlert1': 'Workspace path cannot be null',
    'validateNullAlert2': 'Service type cannot be null',
    'alertErrorNotContainTileSetInTileSourceInfo': "There are no map tiles in the current configuration.",
    'alertErrorTileSourceInfoConfigError': "Tile configuration parameters error.",
    'publishAllTileset': "All",
    'alertErrorImageServiceProvider': 'Create image service Provider failed',
    'alertErrorImageServiceComponent': 'Create image service Component failed'
};

var quickCreateInstanceRes = {
    'service': 'Service',
    'starting': 'is starting',
    'firstStepTitle': ' Please select the data source',
    'firstStepDes': 'Data source can be workspace or standard remote service.',
    'firstStepDesForExpress': 'Data source can be standard remote services.',
    'cacheConfigTitle': 'Cache Configuration',
    'prjConfigTitle': 'Projection Configuration',
    'styleConfigTitle': 'Style Configuration',
    'configureAddressMatchServiceTitle': 'Configure address matching service',
    'configureTrafficTransferAnalystServiceTitle': 'Configure traffic transfer analysis service',
    'configureTransportNetworkAnalystServiceTitle': 'Configure transportation analysis service',
    'configureFacilityAnalyst3DServiceTitle': 'Configure 3D network analysis service',
    'loadingTrafficTransferAnalystConfigDialog': 'Loading configuration dialog box. Please wait...',
    'secondStepTitle': 'Configure data',
    'thirdStepTitle': 'Please select the service type',
    'thirdStepDes': 'Service types supported by current data source (more than one can be selected).',
    'forthStepTitle': 'Other necessary configuration',
    'fifthStepTitle': 'Configuration compleleted',
    'fifthStepDes': 'Service instance information',
    'fifthStepContainsDataTitle': 'Whether the data service is editable or not',
    'fifthStepContainsDataModifyUsersTitle': 'data service modify data users list',
    'fifthStepContainsMapTitle': 'map service config',
    'cannotEdit': 'Uneditable',
    'sixthStepTitle': 'Newly published services',
    'publishServiceDialog': 'Quickly publish service',
    'step2alert1': 'Service address cannot be null.',
    'step2alert2': 'Map set cannot be null.',
    'resultWorkspaceBingMaps': 'Bing Maps online service',
    'resultWorkspaceTianditu': 'TianDiTu online service',
    'resultWorkspaceCloud': 'Supermap Cloud service',
    'resultWorkspaceMBTiles': 'MBTiles File',
    'googleMapCryptoKeyNull': 'Google Maps CryptoKey cannot be null.',
    'step2alert3': 'Bing Maps key cannot be null.',
    'step3alert1': 'Service type cannot be null.',
    'step4alert1': 'Output site cannot be null.',
    'dialogCancelCancel': 'Cancel',
    'dialogCancelClose': 'Close',
    'noNetworkDataset': 'no network dataset in workspace',
    'noScene': 'no scene in workspace',
    'fileWorkspacePath': 'workspace path',
    'alertDpiNull': "Please input dpi.",
    "alertDpiNumber": "Dpi must be numeric.",
    "tileMatrixSetLabel": " (TileMatrixSet):",
    "configureTileSourceInfoTitle": "Configure tile info ",
    "configureTilesetTitle": "Configure the map to be released",
    "svtilesFileNameNullAlert": "The path of SVTiles file can not be null",
    "mvtTilesFileNameNullAlert": "The path of tiles file can not be null",
    "arcGisTilesFileNameNullAlert": "The path of Arcgis cache file can not be null",
    "ThreeDConfigFileNameNullAlert": "The path of 3D cache file can not be null",
    "arcGisRestFeatureService": "ArcGIS REST Feature Service",
    "serviceStartSuccess": "Start successfully",
    "serviceStartFailed": "Failed to start, please view the logs for more information"
};

var clusterRes = {
    'addFilterDialogTitle': 'Add cluster filter',
    'editFilterDialogTitle': 'Edit cluster filter',
    'checkLicenceDescription': 'The standard edition of iServer does not support cluster services.',
    'startStopStart': 'Enable',
    'startStopStop': 'Disable',
    'editFilterDialogAlert': 'Please select service instance',
    'addFilterDialogAlert1': 'Please input valid cluster filter name',
    'addFilterDialogAlert2': 'Please select cluster filter type',
    'addFilterDialogAlert3': 'Please select service instance',
    'addFilterDialogAlert4': 'Add cluster filter failed',
    'addFilterDialogAlert5': 'The service instance does not exist',
    'removeFilterAlert1': 'Delete cluster filter',
    'removeFilterAlert2': 'Failed',
    'editFilterButton': 'Edit',
    'removeFilterButton': 'Delete'
};

var clusterMembersRes = {
    'removeMemberConfirm1': 'Are you sure to remove cluster member',
    'removeMemberConfirm2': '?',
    'inputTextAlert': 'Please make sure your text input is valid.',
    'showCharacters': 'Show',
    'hideCharacters': 'Hide',
    'deployInstanceSuccess': 'Succeed in deploying the controlled node service instance:',
    'deployInstanceFailed': '. Failed:',
    'deployInstanceTotal': '. Total:',
    'viewMemberDetail': 'View Details',
    'allowMember': 'Enable',
    'denyMember': 'Disable',
    'instanceUnsupport': 'It does not support this type of service',
    'offLine': 'This member is offline now',
    'agentOffLine': 'This Agent is offline now',
    'redeployFailedInstance': 'Retry',
    'redeployAllFailedInstances': 'Retry All',
    'agentReady': 'Ready',
    'agentUnready': 'Readying...'
};

var controlledClusterMemberInstanceDeployErroyTypeRes = {
    'FILEUPLOAD': 'Failed to upload the file to a controlled chid node',
    'CREATEPROVIDER': 'Failed to create service provider',
    'CREATEPROVIDERSET': 'Failed to create service provider set',
    'CREATECOMPONENT': 'Failed to create service component',
    'CREATECOMPONENTSET': 'Failed to create service component set',
    'CREATEINTERFACE': 'Failed to create service interface',
    'CREATEINSTANCE': 'Failed to create service instance:',
    'UNKNOWN': 'Unknown error'
};

var cluserReportersRes = {
    'addReporterDialogTitle': 'Add reporter',
    'ReporterEditButton': 'Edit',
    'ReporterRemoveButton': 'Remove',
    'addReporterDialogAlert': 'Report address cannot be null',
    'editReporterDialogTitle': 'Edit reporter',
    'editReporterDialogAlert': 'Report address cannot be null'
};

var componentRes = {
    'addProviderDialogTitle': 'Add service provider set',
    'addInterfaceDialogTitle': 'Add binding interfaces',
    'checkedBoxRemoveProvider': 'Remove',
    'checkedBoxRemoveInterface': 'Remove',
    'createComponentSettingAlert1': 'Chinese and special characters cannot be contained in the name.',
    'createComponentSettingAlert2': 'Component name already exists.',
    'createComponentSettingAlert3': 'Please select at least one service interface!',
    'createComponentSettingAlert4': 'The input is not in Json format',
    'loadPageRemoveProvider': 'Remove',
    'loadPageRemoveInterface': 'Remove',
    'importStorageInfo': 'Import Tile Storage Info',
    'importStorageTip1': 'Storage type is not ',
    'importStorageTip2': ', please select again.',
    'storageID': 'Storage ID:',
    'selectStorageID': 'Please select stroage ID',
    'instanceCountInvalid': 'Instance count is invalid!Please enter a number without less than zero.'
};

var componentRefRes = {
    'saveChangeConfirm': 'Are you sure you want to save the changes?',
    'createComponentRefSettingAlert': 'Chinese and special characters cannot be contained in the name.'

};

var componentsRes = {
    'generalSetting': 'GeneralSetting',
    'deleteComponentConfirm1': 'Are you sure you want to delete the selected service component(s) ',
    'deleteComponentConfirm2': ' ?',
    'addComponentDialogTitle': 'Add service component',
    'getMatchProvidersMap': 'Map Service',
    'getMatchProviderSetsMap': 'Map Service',
    'getMatchInterfacesMap': 'Map Service',
    'addComponentDialogAlert1': 'Chinese and special characters cannot be contained in the name.',
    'addComponentDialogAlert2': 'Please select at least one service interface!',
    'addComponentDialogAlert3': 'The input is not in Json format',
    // 英文语句语序颠倒
    'deleteComponent': ' the service component(set)',
    'choose': "Please select",
    'components': " to delete"
};

var componentSetRes = {
    'addToComponentDialogTitle': 'Add service component',
    'addInterfaceDialogTitle': 'Add binding service interfaces',
    'checkedBoxRemoveComponent': 'Remove',
    'checkedBoxRemoveInterface': 'Remove',
    'createComponentSetSettingAlert1': 'Chinese and special characters cannot be contained in the name.',
    'createComponentSetSettingAlert2': 'Component set already exists.',
    'createComponentSetSettingAlert3': 'Please select at least one service interface!',
    'createComponentSetSettingAlert4': 'Please select at least one service component!',
    'loadComponentType': 'Spatial Analyst Component',
    'loadUnbindInterfaceWFS': 'WFS Interface',
    'loadUnbindInterfaceWMS': 'WMS Interface',
    'loadUnbindInterfaceWMTS': 'WMTS Interface',
    'loadUnbindInterfaceRESTJSR': 'REST/JSR Service Interface'
};

var componentSetsRes = {
    'deleteComponentSetConfirm1': 'Are you sure you want to delete the selected service component set(s)',
    'deleteComponentSetConfirm2': '?',
    'addComponentSetDialogTitle': 'Add service component set',
    'addComponentSetDialogSpatialAnalyst': 'Spatial Analyst Component',
    'matchInterfacesMap': 'Map Service',
    'addComponentSetDialogAlert1': 'Chinese and special characters cannot be contained in the name!',
    'addComponentSetDialogAlert2': 'Please select at least one service component!',
    'addComponentSetDialogAlert3': 'Please select at least one service interface!',
    // 英文语句语序颠倒
    'deleteComponentSet': ' the service component(set)',
    'choose': "Please select",
    'componentSet': " to delete"
};

var instancesRes = {
    'startStopStart': 'Start',
    'startStopStop': 'Stop',
    'started': 'Started',
    'stopped': 'Stopped',
    'status': 'Status',
    'allServiceInterface': 'All Interfaces',
    'allServiceComponent': 'All Component(Set)s',
    'security': 'Security',
    'resetConfirm': 'Are you sure you want to restart all services?',
    'deleteConfirm': 'Are you sure you want to delete the selected services?',
    'resetDefaultStatus1': 'The server is restarting all services, please wait.',
    'resetDefaultStatus2': 'Services have been restarted, please wait for the page refresh.',
    'NotSelectAnyInstance': 'No service instance is selected',
    'clusterNodeDoesNotSupport': 'The service instance of cluster child node does not allow this operation'
};

var instancesByDataViewRes = {
    'startStopStart': 'Start',
    'startStopStop': 'Stop',
    'resetConfirm': 'Are you sure you want to restart all services?',
    'WMSService': 'WMS Service'
};

var interfaceRes = {
    'modifyInterfaceSetting': '修改服务接口配置',//这段文本被拼凑在url中的，修改文本前，需要验证url是否可用
    'createInterfaceSettingAlert1': 'Chinese and special characters cannot be contained in the name.',
    'createInterfaceSettingAlert2': 'Interface name already exists.',
    'createInterfaceSettingAlert3': 'The input is not in Json format'
};

var interfacesRes = {
    'deleteInterfaceConfirm1': 'Are you sure you want to delete the selected service interface(s)',
    'deleteInterfaceConfirm2': '?',
    'addInterfaceDialogTitle': 'Add service interface',
    'addInterfaceDialogAlert1': 'Chinese and special characters cannot be contained in the name.',
    'addInterfaceDialogAlert2': 'The input is not in Json format',
    // 英文语句语序颠倒
    'choose': 'Please select',
    'deleteInterface': ' the service interface(s)',
    'interfaces': " to delete"
};
var interfaceInfosRes = {
    'WMS111': 'Web Map Service. This service conform to the 1.1.1 Web Map Service standard formulated by OGC (Open Geospatial Consortium). It supports the following opeations: GetCapabilities, GetMap and GetFeatureInfo.',
    'WMS130': 'Web Map Service. This service conform to the 1.3.0 Web Map Service standard formulated by OGC (Open Geospatial Consortium). It supports the following opeations: GetCapabilities, GetMap and GetFeatureInfo.',
    'Handler': 'Handler Service',
    'WFS100': 'Web Feature Service. This service conform to the 1.0.0 Web Feature Service standard formulated by (Open Geospatial Consortium). It supports the following operations: GetCapabilities, DescribeFeatureType, GetFeature and Transaction.',
    'WFS200': 'Web Feature Service. This service conform to the 2.0.0 Web Feature Service standard formulated by (Open Geospatial Consortium). It supports the following operations: GetCapabilities, DescribeFeatureType, GetFeature, Transaction, GetPropertyValue, ListStoredQueries and DescribeStoredQueries.',
    'REST-Map': 'Adopt the REST architecture to provide map related functions in the format of resources, such as map browsing, dynamic thematic map publishing, attribute query, spatial query, distance query, nearest feature search, distance/area measurement, legend and so on.',
    'REST-Data': 'Adopt the REST architecture to provide data related functions in the format of resources, such as providing datasource/dataset information, dataset editing, data feature query, dataset fields statistics.',
    'REST-DataHistory': 'Adopt the REST architecture to provide data related functions in the format of resources, such as providing dataHistory feature query',
    'REST-Spatial': 'Adopt the REST architecture to provide spatial analyst related functions in the format of resources, such as buffer analyst, overlay analyst, surface analyst and so on.',
    'REST-Transportation': 'Adopt the REST architecture to provide transportation related functions in the format of resources, such as best path analysis, TSP analyst, location analysis and so on.',
    'REST-TrafficTransfer': 'Adopt the REST architecture to provide TrafficTransfer related functions in the format of resources, such as view the stop, search bus lines and query traffic transfer solutions, etc.',
    'REST-3D': 'Adopt the REST architecture to provide 3D related functions in the format of resources, such as 2D and 3D data (image, terrain, model, vector, 2D map and KML data) publishing. It supports the dynamic and static publish.',
    'WMTS100': 'Map Tile Service. This service conform to the Web Map Tile Service standard formulated by OGC (Open Geospatial Consortium). It supports the following operations: GetCapabilities and GetTile.',
    'WMTS-China': 'Chinese Map Tile Service. This service conform to Web Map Tile Service standard. It supports China geographic information public service platform, the scale levels specified by electronic map data specification and screen resolution',
    'WCS111': 'Web Coverage Service. This service conform to the 1.1.1 Web Coverage Service standard OGC（Open Geospatial Consortium). It supports the following operations: GetCapabilities, DescribeCoverage and GetCoverage.',
    'WCS112': 'Web Coverage Service. This service conform to the 1.1.2 Web Coverage Service standard OGC（Open Geospatial Consortium). It supports the following operations: GetCapabilities, DescribeCoverage and GetCoverage.',
    'WPS100': 'Web Processing Service. This service conform to the 1.0.0 Web Coverage Processing standard OGC（Open Geospatial Consortium). It supports the following operations: GetCapabilities, DescribeProcess and Execute.'

};

var unavailableInterfaces = ["arcgisrest", "baidurest", "googlerest", "tmsrest", "osmrest"];

var dataProviderDelayCommitSettingRes = {
    'intervalUpdateSettingAlert': 'Must be integer greater than 0!'
};

var addressMatchProviderSettingRes = {
    'or': 'or',
    'addField': 'add',
    'datasetNames': 'dataset',
    'providerNames': 'provider',
    'searchFields': 'search fields',
    'filterFields': 'filter fields',
    'noValidFields': 'No valid field',
    'mustLessOrEqual': 'Must be euqal or less than ',
    'level': 'level',
    'mustBeNumberAlert': 'Must be number greater than 0',
    'mustNotNullAlert': 'Must not be empty string',
    'mustBePositiveIntegerAlert': 'Must be integer greater than 0',
    'mustBeIntegerAlert': 'Must be integer',
    'mustNotNull': 'Must not be null',
    'noDatasets': 'No Datasets',
    'noSearchFields': 'No valid search field',
    'addUpdateIndexTaskSucceed': 'Add update index task successfully!',
    'updateIndexFailed': 'update index failed\nbecause:',
    'updateIndex': 'update Index',
    'appendIndex': 'append Index',
    'ensureUpdateIndex': 'make sure to update index?',
    'datasourceImformationUnAvailable': 'Datasource information unavailable',
    'indexDir': 'index'
};

var ossRealspaceProviderSettingRes = {
    'ossWebsite': 'Website',
    'bucketName': 'Bucket Name',
    'configPath': 'Config Path',
    'notNull': 'is not null!'
};

var geotoolsProviderSettingRes = {
    'shapeDir': 'Shapefile Directory',
    'serverAddress': 'Service Address',
    'port': 'Port',
    'database': 'Database',
    'localDirectory': 'Local Directory',
    'username': 'Username',
    'password': 'Password',
    'styleFile': 'Style File',
    'mustNotNull': ' must not be null',
    'notExist': ' does not exist',
    'noSpecificKey': 'Do not enter special characters',
    'zookeeperAddress': 'ZooKeeper Address',
    'filePath': 'Distribute Spatial Format',
};

var providerRes = {
    'generalSetting': 'Basic settings',// add
    'advanceSetting': 'Advanced settings',// add
    'imageCollection': 'Image collection settings',
    'addProviderDialogTitle': 'Add service provider set',
    'providerTypeSpatialAnalyst': 'Spatial Analysis Provider',
    'providerAlert': 'Chinese and special characters cannot be contained in the name of the temporary data source.',
    'createProviderSettingAlert1': 'Chinese and special characters cannot be contained in the name of the temporary data source.',
    'createProviderSettingAlert2': 'Provider name already exists.',
    'providerTypeAggMap': 'Aggregation Map Provider',
    'providerTypeAggData': 'Aggregation Data Provider',
    'configAlert': 'The input is not in Json format',
    'providerTypeLocalData': 'UGC Data Provider',
    'providerTypeWFS': 'WFS Data Provider',
    'providerTypeLocalMap': 'UGC Map Provider',
    'providerTypeWMS': 'WMS Map Provider',
    'providerTypeWMTS': 'WMTS Map Provider',
    'providerTypeSMTiles': 'SMTiles Map Provider',
    'providerTypeTPK': 'TPK Map Provider',
    'providerTypeVTPK': 'VTPK Map Provider',
    'providerTypeArcGISREST': 'ArcGIS REST Map Provider',
    'providerTypeArcGISRESTData': 'ArcGIS REST Data Provider',
    'providerTypeArcGISRESTNetwork': 'ArcGIS REST Network Analysis Provider',
    'providerTypeArcGISRESTGeometry': 'ArcGIS REST Geometry Provider',
    'providerTypeArcGISCache': 'ArcGIS Cache Map Provider',
    'providerTypeArcGISCacheV2': 'ArcGIS CacheV2 Map Provider',
    'providerTypeLocal3DCache': 'Local 3D Realspace Provider',
    'providerTypeOssRealspace': 'OSS Realspace Provider',
    'providerTypeThreeDTilesCache': '3DTiles Realspace Provider',
    'providerTypeClusterMap': 'Cluster Map Provider',
    'providerTypeRESTMap': 'REST Map Provider',
    'providerTypeRESTData': 'REST Data Provider',
    'providerTypeRESTPlot': 'REST Plotting Provider',
    'providerTypeRESTTransportationAnalyst': 'REST Transportation Analysis Provider',
    'providerTypeAddressMatchProvider': 'Address Matching Provider',// add
    'providerTypeGeometryServiceProvider': 'Geometry Service Provider',
    'providerTypeRESTAddressMatch': 'REST Address Matching Provider',
    'providerTypeBingMaps': 'Bing Maps Provider',
    'providerTypeGoogleMaps': 'Google Maps Provider',
    'providerTypeTianditu': 'TianDiTu Map Provider',
    'providerTypeCloud': 'Supermap Cloud Map Provider',
    'providerTypeBaidu': 'Baidu Map Provider',
    'providerTypeOSM': 'OpenStreetMap Map Provider',
    'providerTypeTransportation': 'Transportation Analysis Provider',
    'providerTypeTrafficTransfer': 'Traffic Transfer Analysis Provider',
    'providerTypeGDPMap': "GDP Map Provider",
    'providerTypeSVTilesMap': "SVTiles Map Provider",
    'providerTypeMultiTiles': "Multi Tiles Map Provider",
    'providerTypeUGCV5': "UGCV5 Map Provider",
    'providerTypePlot': "Plotting Provider",
    'providerTypeGeoprocessing': "Geoprocessing Service Provider",
    'providerTypeGeopkgData': "GeoPackage Data Provider",
    'providerTypeGeopkgMap': "GeoPackage Map Provider",
    'providerTypeFastDFS': "FastDFS Map Provider",
    'providerTypeMongoDB': "MongoDB Map Provider",
    'providerTypeMongoDBMvt': "MongoDB MVT Map Provider",
    'providerTypeMongoDBRealspace': "MongoDB 3D Service Provider",
    'microsoftBlack': 'Segoe UI',
    'autoComputFromWorkspace': 'Automatically acquire settings from workspace',
    'tileMatrixSetLabel': " (TileMatrixSet):",
    'checkNetworkSucceed': "Check Network Successfully ",
    'checkNetworkFailed': "Check Network Failed,because of the following reasons:",
    'illegalSetting': "Illegal Setting",
    'checkNetworkButton': "Chek Network"
};

var providerRefRes = {
    'saveChangeConfirm': 'Are you sure you want to save the changes?'
};

var spsAndspsetsRes = {
    'spsetTypeName': 'Service Provider Set'
};

var providersRes = {
    'generalSetting': 'Basic settings',// add
    'advanceSetting': 'Advanced settings',// add
    'imageCollection': 'Image collection settings',
    'autoComputFromWorkspace': 'Automatically acquire settings from workspace',// add
    'addProviderDialogAlert1': 'Chinese and special characters cannot be contained in the name.',
    'providerTypeSpatialAnalyst': 'Spatial Analysis Provider',
    'addProviderDialogAlert2': 'Chinese and special characters cannot be contained in the name of the temporary data source.',
    'configAlert': 'The input is not in Json format',
    'deleteProvider': 'Delete',
    'deleteProviderConfirm1': 'Are you sure you want to delete the selected service provider(s)',
    'deleteProviderConfirm2': '?',
    'addProviderDialogTitle': 'Add service provider',
    'providerTypeAggMap': 'Aggregation Map Provider',
    'providerTypeLocalMap': 'UGC Map Provider',
    'providerTypeImageSevice': 'Image Service Provider',
    'providerTypeWMS': 'WMS Map Provider',
    'providerTypeWMTS': 'WMTS Map Provider',
    'providerTypeSMTiles': 'SMTiles Map Provider',
    'providerTypeTPK': 'TPK Map Provider',
    'providerTypeVTPK': 'VTPK Map Provider',
    'providerTypeArcGISREST': 'ArcGIS REST Map Provider',
    'providerTypeClusterMap': 'Cluster Map Provider',
    'providerTypeBingMaps': 'Bing Maps Provider',
    'providerTypeGoogleMaps': 'Google Maps Provider',
    'providerTypeTianditu': 'TianDiTu Map Provider',
    'providerTypeCloud': 'SuperMap Cloud Map Provider',
    'providerTypeBaidu': 'Baidu Map Provider',
    'providerTypeOSM': 'OpenStreetMap Map Provider',
    'providerTypeAggData': 'Aggregation Data Provider',
    'providerTypeLocalData': 'UGC Data Provider',
    'providerTypeRESTMap': 'REST Map Provider',
    'providerTypeRESTData': 'REST Data Provider',// add
    'providerTypeRESTPlot': 'REST Plotting Provider',
    'providerTypeTransportationAnalystProvider': 'Transportation Analysis Provider',
    'providerTypeTrafficTransferAnalystProvider': 'Traffic Transfer Analysis Provider',
    'providerTypeSpatialAnalystProvider': 'Spatial Analysis Provider',
    'providerTypeLocalRealspaceProvider': 'UGC 3D Provider',
    'providerTypeAddressMatchProvider': 'Address Matching Provider',// add
    'providerTypeGeometryServiceProvider': 'Geometry Service Provider',
    'providerTypeWFS': 'WFS Data Provider',
    'providerTypeRESTRealspaceProvider': 'REST 3D Provider',
    'providerTypeRESTSpatialAnalystProvider': 'REST SpatialAnalysis Provider',
    'providerTypeRESTTrafficTransferAnalystProvider': 'REST Traffic Transfer Analysis Provider',
    'providerTypeRESTransportationAnalystProvider': 'REST Transportation Analysis Provider',
    'providerTypeRESTAddressMatchProvider': "REST Address Matching Provider",
    'providerTypeUGCNetworkAnalyst3DProvider': "3D Network Analysis Provider",
    'providerTypeMongoDBRealspace': "MongoDB 3D Service Provider",
    'providerTypeArcGISRESTData': 'ArcGIS REST Data Provider',
    'providerTypeArcGISRESTNetwork': 'ArcGIS REST Network Provider',
    'providerTypeArcGISRESTGeometry': 'ArcGIS REST Geometry Provider',
    'providerTypeArcGISCache': 'ArcGIS Cache Map Provider',
    'providerTypeArcGISCacheV2': 'ArcGIS CacheV2 Map Provider',
    'providerTypeLocal3DCache': 'Local 3D Realspace Provider',
    'providerTypeOssRealspace': 'OSS Realspace Provider',
    'providerTypeGPKGMap': 'Geopackage Map Provider',
    'providerTypeGPKGData': 'Geopackage Data Provider',
    'providerTypeUGCV5': 'UGCV5 Map Provider',
    'providerTypeMVTTiles': 'UGCV5(MVT) Map Provider',
    'providerTypePlot': 'Plotting Provider',
    'providerTypeSVTiles': 'SVTiles Map Provider',
    'providerTypeGDPMap': 'GDP Map Provider',
    'providerTypeMultiTiles': 'Multi Tiles Map Provider',
    'providerTypeMongoDBMap': 'MongoDB Map Provider',
    'providerTypeImageservice': 'Image service provider',
    'datasource': 'Datasource ',
    'datasetName': 'Dataset',
    'noNetworkDatasets': 'No Network Datasets',
    'noScene': 'No Scene in workspace',
    "choose": "Please select ",
    "provider": "\'s service provider",
    "noLineDatasets": "No eligible datasets"
};

var providerSetRes = {
    'addToProviderDialogTitle': 'Add service provider',
    'checkedBoxRemoveProvider': 'Remove',
    'createProviderSetSettingAlert1': 'Chinese and special characters cannot be contained in the name.',
    'createProviderSetSettingAlert2': 'Provider set name already exists.',
    'createProviderSetSettingAlert3': 'Please select at least one service provider!'
};

var providerSetsRes = {
    'deleteProviderSetConfirm1': 'Are you sure you want to delete the selected service provider set(s)',
    'deleteProviderSetConfirm2': '?',
    'addProviderSetDialogTitle': 'Add service provider set',
    'addProviderSetDialogAlert1': 'Chinese and special characters cannot be contained in the name.',
    'addProviderSetDialogAlert2': 'Please select at least one service provider!',
    'deleteProviderSet': 'delete',
    'choose': 'Please select',
    'providerSet': 'the service component set'

};

var metaInfoRes = {
    'addCustomTypeDialogTitle': 'Add custom type',
    'addCustomTypeDialogAlert1': 'Metadata resource type cannot be null',
    'addCustomTypeDialogAlert2': 'Metadata resource type cannot be null',
    'addCustomTypeDialogAlert3': 'Metadata resource configuration class cannot be null',
    'selectTypeProvider': 'Provider type',
    'selectTypeComponent': 'Component type',
    'selectTypeInterface': 'Interface type',
    'addCustomTypeDialogAlert4': 'Chinese and special characters are not supported currently.',
    'addCustomTypeDialogAlert5': 'Chinese and special characters are not supported currently.',
    'addCustomTypeDialogAlert6': 'Service provider type',
    'addCustomTypeDialogAlert7': 'Service provider',
    'addCustomTypeDialogAlert8': 'Service component type',
    'addCustomTypeDialogAlert9': 'Service component',
    'addCustomTypeDialogAlert10': 'Service interface type',
    'addCustomTypeDialogAlert11': 'Service interface',
    'addCustomTypeDialogAlert12': 'already exists!',
    'editCustomTypeDialogTitle': 'Edit custom type',
    'metaInfoTypeProvider': 'Service provider type',
    'metaInfoTypeComponent': 'Service component type',
    'metaInfoTypeInterface': 'Service interface type',
    'editCustomTypeDialogAlert1': 'Metadata resource type cannot be null',
    'editCustomTypeDialogAlert2': 'Metadata resource type cannot be null',
    'editCustomTypeDialogAlert3': 'Metadata resource configuration class cannot be null',
    'deleteMetaInfoConfirm1': 'Are you sure you want to delete ',
    'deleteMetaInfoConfirm2': ' ?',
    'metaInfoTypeAlias': 'Type alias',
    'metaInfoType': 'Type',
    'metaInfoOperate': 'Operation'
};

var passwordSettingRes = {
    'verifyInfoText1': 'The password must be at least 8 characters.',
    'verifyInfoText2': 'The passwords you typed twice are not identical.'
};

var addMetaInfoRes = {
    'CustomTypeDialogTitle': 'Add custom type',
    'CustomTypeDialogNewAlias': 'Metadata resource type alias cannot be null',
    'CustomTypeDialogNewTypeName': 'Metadata resource type cannot be null',
    'CustomTypeDialogNewConfigClass': 'Metadata resource configuration class cannot be null',
    'CustomTypeDialogTypeDefinitionType': 'Type does not suport Chinese and special characters currently',
    'CustomTypeDialogTypeDefinitionConfigType': 'Configuration class does not suport Chinese and special characters currently',
    'CustomTypeDialogProviderType': 'Service provider type',
    'CustomTypeDialogIsExist': 'already exists',
    'CustomTypeDialogProvider': 'Service provider',
    'CustomTypeDialogCompoenntType': 'Service component type',
    'CustomTypeDialogCompoennt': 'Service component',
    'CustomTypeDialogInterfaceType': 'Service interface type',
    'CustomTypeDialogInterface': 'Service interface'
};

var addResourceRes = {
    'existed': ' existed',
    'choosePlease': 'Choose please',
    'NewObjectButtonRemoveObject': 'Remove',
    'AddConfigHtmlNecessary': 'Required',
    'AddConfigHtmlAdd': 'Add',
    'moveToUp': 'Up',
    'moveToDown': 'Down',
    'AddConfigHtmlItem': 'existing items',
    'ConstructConfigURL': 'URL',
    'ConstructConfigIsNotExist': 'not exist',
    'ConstructConfigIsNotUsed': 'not available',
    'workspaceFilePath': 'Workspace path on sever:'
};
var processingConfigRes = {
    'publishServiceTitle': 'check by default and analysis results will be published as data and map service',
    'noPublishServiceTitle': 'analysis results are not published as services without check'
};

var WMSServletRes = 'WMS Interface';
var WMTSServletRes = 'WMTS Interface';
var WFSServletRes = 'WFS Interface';
var WCSServletRes = 'WCS Interface';
var WPSServletRes = 'WPS Interface';
var RestServletRes = 'REST Service Interface';
var AGSRestServletRes = 'ArcGIS REST Service Interface';
var BaiduRestServletRes = 'Baidu REST Service Interface';
var GoogleRestServletRes = 'Google REST Service Interface';
var TMSRestServletRes = 'TMS REST Service Interface';
var OSMRestServletRes = 'OSM REST Service Interface';
var GeoprocessorServletRes = 'Geoprocessor Service Interface';
var TransportationAnalystImplRes = 'Transportation Analysis Component';
var TrafficTransferAnalystImplRes = 'Traffic Transfer Analysis Component';
var SpatialAnalystImplRes = 'Spatial Analysis Component';
var MapImplRes = 'Map Component';
var DataImplRes = 'Data Component';
var RealspaceImplRes = 'Realspace Component';
var NetworkAnalyst3DImplRes = '3D Network Analysis Component';
var GeoprocessorImplRes = 'Geoprocessor Component';
var JaxrsServletForJerseyRes = 'REST/JSR Service Interface';
var UGCMapProviderRes = 'UGC Map Provider';
var UGCDataProviderRes = 'UGC Data Provider';
var UGCRealspaceProviderRes = 'UGC 3D Provider';
var WMSMapProviderRes = 'WMS Map Provider';
var WMTSMapProviderRes = 'WMTS Map Provider';
var SMTilesMapProviderRes = 'SMTiles Map Provider';
var ArcGISRestMapProviderRes = 'ArcGIS REST Map Provider';
var AggregationMapProviderRes = 'Aggregation Map Provider';
var WFSDataProviderRes = 'WFS Data Provider';
var ClusterMapProviderRes = 'Cluster Map Provider';
var UGCTransportationAnalystProviderRes = 'Transportation Analysis Provider';
var UGCTrafficTransferAnalystProviderRes = 'Traffic Transfer Analysis Provider';
var RESTDataProviderRes = 'REST Data Provider';
var RESTPlotProciderRes = 'REST Plotting Provider';
var RESTMappingProviderRes = 'REST Map Provider';
var BingMapsMapProviderRes = 'Bing Maps Provider';
var GoogleMapsMapProviderRes = 'Google Maps Map Provider';
var TiandituMapProviderRes = 'TianDiTu Map Provider';
var CloudMapProviderRes = 'SuperMap Cloud Map Provider';
var SpatialAnalystProviderRes = 'Spatial Analysis Provider';
var AggregationDataProviderRes = 'Aggregation Data Provider';
var HandlerServletRes = 'Handler Service Interface';
var WeightedRoundBalancerRes = 'Weighted Round Balancer';
var RoundRobinBalancerRes = 'Round Robin Balancer';

var configRes = {
    'MapName': 'Map name',
    'ServiceDescription': 'Service description',
    'Version': 'Version',
    'ServiceDescriptionName': 'Service name',
    'ServiceDescriptionTitle': 'Title',
    'ServiceDescriptionServiceAbstract': 'Server description',
    'ServiceDescriptionKeywords': 'Keywords',
    'ServiceDescriptionOnlineResource': 'Online resource',
    'ServiceDescriptionContactInformation': 'Service provider contact information',
    'ServiceDescriptionOnlineFees': 'Fees',
    'ServiceDescriptionOnlineAccessConstraints': 'Access constraints',
    'ServiceContactInformationPerson': 'Contact person',
    'ServiceContactInformationOrganization': 'Organization',
    'ServiceContactInformationPosition': 'Position',
    'ServiceContactInformationAddressType': 'Address type',
    'ServiceContactInformationAddress': 'Address',
    'ServiceContactInformationCity': 'City',
    'ServiceContactInformationStateOrProvince': 'State or province',
    'ServiceContactInformationPostCode': 'Post code',
    'ServiceContactInformationCountry': 'Country',
    'ServiceContactInformationVoiceTelephone': 'Telephone',
    'ServiceContactInformationFacsimileTelephone': 'Fax',
    'ServiceContactInformationElectronicMailAddress': 'Email',
    'MappingComponentsOutputPath': 'Output path',
    'MappingComponentsOutputSite': 'Output site',
    'MapProviderMaps': 'Published maps',
    'MapProviderUgcMapSettings': 'Default settings for maps',
    'MapProviderWorkspacePath': 'Workspace',
    'MapProviderOutputPath': 'Output path',
    'MapProviderOutputSite': 'Output site',
    'MapProviderMultiThread': 'Enable multi-thread mode',
    'MapProviderCacheDisabled': 'Whether to disable caching',
    'MapProviderPoolSize': 'Pool size',
    'UgcMapSettings': 'Default map settings',
    'UgcMapSettingMapName': 'Map name',
    'UgcMapSettingPointStyle': 'Default highlight marker style',
    'UgcMapSettingLineStyle': 'Default highlight line style',
    'UgcMapSettingRegionStyle': 'Default highlight fill style',
    'LineStyleLineSymbolID': 'Line symbol ID',
    'LineStyleLineWidth': 'Line width',
    'LineStyleLineColor': 'Line color',
    'PointStyleMarkerSize': 'Marker size',
    'PointStyleMarkerAngle': 'Marker rotation',
    'PointStyleMarkerSymbolID': 'Marker symbol ID',
    'RegionStyleFillSymbolID': 'Fill symbol ID',
    'RegionStyleFillOpaqueRate': 'Fill opacity',
    'RegionStyleFillGradientOffsetRatioY': 'Gradient offset X',
    'RegionStyleFillGradientOffsetRatioX': 'Gradient offset Y',
    'RegionStyleFillGradientMode': 'Gradient mode',
    'RegionStyleFillGradientAngle': 'Gradient angle',
    'RegionStyleFillForeColor': 'Foreground',
    'RegionStyleFillBackOpaque': 'Transparent',
    'RegionStyleFillBackColor': 'Background',
    'ColorRed': 'Red component',
    'ColorGreen': 'Green component',
    'ColorBlue': 'Blue component',
    'DataProviderDatasourceNames': 'Datasource names',
    'DataProviderWorkspacePath': 'Workspace',
    'RealspaceProviderWorkspacePath': 'Workspace',
    'RealspaceProviderOutput': 'Realspace cache directory',
    'WMSMapProviderURL': 'WMS service root URL',
    'WMSMapProviderVersion': 'WMS service version',
    'WMSMapProviderUsername': 'Authorized user name',
    'WMSMapProviderPassword': 'Password',
    'WMSMapProviderCacheEnabled': 'Enable caching',
    'WMSMapProviderOutputPath': 'Output path',
    'WMSMapProviderOutputSite': 'Output site',
    'WMSMapProviderDefaultScale': 'Default scale',
    'AggregationMapProviderTargetName': 'Aggregation map name',
    'AggregationMapProviderName': 'Aggregation',
    'AggregationMapProviderMapNames': 'Aggregated maps',
    'AggregationMapProviderOutputPath': 'Output path',
    'AggregationMapProviderOutputSite': 'Output site',
    'ServiceInfosServiceInfo': 'Service info',
    'ServiceInfoType': 'Service info type',
    'ServiceInfoBinding': 'Service binding info',
    'ServiceInfoAddress': 'Service binding address',
    'WFSDataProviderServiceURL': 'WFS service root URL',
    'WFSDataProviderUserName': 'User name',
    'WFSDataProviderPassword': 'Password',
    'WFSDataProviderIdMappingClassName': 'Feature ID converter class',
    'ClusterMapProviderClusterNodeInfos': 'Cluster node info set',
    'ClusterNodeInfosClusterMapProviderNodeInfo': 'Cluster node info',
    'ClusterMapProviderNodeInfoProviderType': 'Service provider type',
    'ClusterMapProviderNodeInfoMapProviderSetting': 'Node map settings',
    'MapProviderSettingOutputPath': 'Output path',
    'MapProviderSettingOutputSite': 'Output site',
    'UGCTransportationAnalystProviderWorkspaceConnectString': 'Workspace path on server',
    'UGCTransportationAnalystProviderDatasourceName': 'Datasource name',
    'UGCTransportationAnalystProviderDatasetName': 'Dataset name',
    'UGCTransportationAnalystProviderEdgeIDField': 'Edge ID field',
    'UGCTransportationAnalystProviderEdgeNameField': 'Edge name field',
    'UGCTransportationAnalystProviderNodeIDField': 'Node ID field',
    'UGCTransportationAnalystProviderNodeNameField': 'Node name field',
    'UGCTransportationAnalystProviderFromNodeIDField': 'fromNode field',
    'UGCTransportationAnalystProviderToNodeIDField': 'toNode field',
    'UGCTransportationAnalystProviderWeightFieldInfos': 'Weight field collection',
    'UGCTransportationAnalystProviderTolerance': 'Tolerance',
    'UGCTransportationAnalystProviderTARuleConfig': 'Traffic rule settings',
    'UGCTransportationAnalystProviderTurnDatasetInfo': 'Turn dataset',
    'UGCTransportationAnalystProviderTABarrierConfig': 'Barrier settings',
    'UGCTrafficTransferAnalystProviderTransferLineSettings': 'Set of line environment settings',
    'UGCTrafficTransferAnalystProviderTransferStopSettings': 'Set of stop environment settings',
    'UGCTrafficTransferAnalystProviderTransferRelationSettings': 'Set of relationship settings between stops and lines',
    'TABarrierConfigBarrierEdges': 'Barrier edge ID array',
    'TABarrierConfigBarrierNodes': 'Barrier node ID array',
    'TARuleConfigRuleField': 'Traffic rule field',
    'TARuleConfigForwardSingleWayRuleValues': 'Forward single way string array',
    'TARuleConfigBackwardSingleWayRuleValues': 'Backward single way string array',
    'TARuleConfigTwoWayRuleValues': 'Two way string array',
    'TARuleConfigProhibitedWayRuleValues': 'Prohibited way string array',
    'RESTDataProviderRestServiceRootURL': 'REST service root URL',
    'RESTDataProviderUserName': 'User name',
    'RESTDataProviderPassword': 'Password',
    'RESTMappingProviderRestServiceRootURL': 'REST service root URL',
    'RESTMappingProviderUserName': 'User name',
    'RESTMappingProviderPassword': 'Password',
    'BingMapsMapProviderImagerySet': 'Map set',
    'BingMapsMapProviderMapVersion': 'Map version',
    'BingMapsMapProviderUseTileImage': 'Use tile cahes',
    'BingMapsMapProviderOutputPath': 'Output path',
    'BingMapsMapProviderOutputSite': 'Output site',
    'SpatialAnalystProviderWorkspacePath': 'Workspace path on server',
    'SpatialAnalystProviderDatasourceNames': 'Datasources involved',
    'SpatialAnalystProviderTmpDatasourceName': 'Temporary datasource',
    'DefaultMapParameterUseDefaultParameter': 'Use default parameter',
    'DefaultMapParameterBackgroundTransparent': 'Transparent background',
    'DefaultMapParameterBounds': 'Map bounds',
    'DefaultMapParameterCenter': 'Center',
    'DefaultMapParameterFormat': 'Format',
    'DefaultMapParameterScale': 'Scale',
    'DefaultMapParameterStyle': 'Map style',
    'DefaultMapParameterViewer': 'Viewer',
    'BoundsLeftBottom': 'Left bottom',
    'BoundsRightTop': 'Right top',
    'CenterX': 'X coordinate',
    'CenterY': 'Y coordinate',
    'StyleMarkerSize': 'Marker size',
    'StyleMarkerAngle': 'Marker rotation',
    'StyleMarkerSymbolID': 'Marker symbol ID',
    'StyleLineSymbolID': 'Line symbol ID',
    'StyleLineWidth': 'Line width',
    'StyleLineColor': 'Line color',
    'StyleFillSymbolID': 'Fill symbol ID',
    'StyleFillOpaqueRate': 'Fill opacity',
    'StyleFillGradientOffsetRatioY': 'Gradient offset X',
    'StyleFillGradientOffsetRatioX': 'Gradient offset Y',
    'StyleFillGradientMode': 'Gradient mode',
    'StyleFillGradientAngle': 'Gradient angle',
    'StyleFillForeColor': 'Foreground',
    'StyleFillBackOpaque': 'Transparent',
    'StyleFillBackColor': 'Background',
    'ViewerLeftTop': 'Left top',
    'ViewerRightBottom': 'Right bottom',
    'TurnDatasetInfoDatasourceName': 'Datasource name',
    'TurnDatasetInfoDatasetName': 'Dataset name',
    'TurnDatasetInfoFromEdgeIDField': 'TurnFromEdgeID field',
    'TurnDatasetInfoNodeIDField': 'TurnNodeID field',
    'TurnDatasetInfoToEdgeIDField': 'TurnToEdgeID field',
    'TurnDatasetInfoWeightFields': 'TurnCost field array',
    'WeightFieldInfosWeightFieldInfo': 'Weight field info',
    'WeightFieldInfoBackWeightField': 'Backward weight field',
    'WeightFieldInfoForwardWeightField': 'Forward weight field',
    'WeightFieldInfoName': 'Weight info name',
    'AggregationDataProviderName': 'Datasource after aggregation',
    'AggregationDataProviderDescription': 'Datasource description after aggregation'
};
// /////////////////////////////////////////////////////////////////////

var confirmRes = {
    'ConfirmDialogTitle': 'Confirm'
};

var securityManagerRes = {
    'UpdateCacheKeyMSG': 'Are you sure you want to change the cache access key',
    'informationOfRule': 'Rule info',
    'informationOfImpower': 'Authorization info',
    'ruleNameCannotNull': 'Rule name cannot be null',
    'nutSelectService': 'No service instance is selected',
    'clientInformationNull': 'Client infor is null',
    'UpdateCacheKeyTitle': 'Change 3D password',
    'PasswordLengthIllegal': 'Password length is not legal',
    'PasswordConfirmIllegal': 'The two passwords you entered did not match',
    'ChangeTokenKeyWarnMsg': 'Changing key will result in failure for the current Token. Are you sure you want to change the key?',
    'GetRandomKeyFailed': 'Failed to create random key.',
    'InvalidKey': 'Key error',
    'ChangeInstanceAuthorisationFailed': 'Failed to change the authorization settings of service instance {0}',
    'UserNameIsNull': 'The user name should not be null.',
    'UserNameInvalid': 'User name must be composed of numbers, letters, underscores or dash, and begin with a letter!',
    'RoleNameIsNull': 'The role name should not be null.',
    'RoleNameInvalid': 'Role name must be composed of numbers, letters, underscores or dash, and begin with a letter!',
    'descriptionInvalid': 'Role name Description contains special characters',
    'PasswordInvalid': 'The password must be at least 8 characters.',
    'PasswordInvalid1': 'The password must be at least 8 characters.',
    'PasswordDifference': 'The two passwords you entered did not match.',
    'PasswordIllegal': 'Password must be at least 8 characters, including at least three types of the uppercase' +
        ' letters, lowercase letters, numbers, or special characters.',
    'PasswordIllegal1': 'Password must include at least three types of the uppercase' +
        ' letters, lowercase letters, numbers, or special characters.',
    'PasswordIllegal2': 'The password shouldn\'t be the same as the username or its reverse.',
    'PasswordIllegal3': 'The password cannot contain three or more identical characters and numbers',
    'PasswordIllegal4': 'The password cannot contain three or more continuous characters and numbers',
    'PasswordIllegal5': 'The password cannot contain three or more continuous horizontal characters on the keyboard',
    'AlterRoleSystemUser': 'Users are not allowed to change role',
    'AuthorizeTip': '(The authorization message of selected service instance is inconsistent. You can not batch view!)',
    'inputShouldBeAnInteger': 'Input should be an integer.',
    'historyPwdCountMustBeInteger': 'History password count must be an integer.',
    'passwordErrorProtectEnable': 'Enable',
    'passwordErrorProtectNotEnable': 'Disable',
    'storagePathIsValid': 'Service address is invalid !',
    'usernameOrpasswordIsNull': 'Usename or password is null !',
    'switchSuccess': 'Database switch successfully'
};

var serverChartRes = {
    'QuickEditTitle': 'Quick edit',
    'DrawTitlesProviders': 'Provider (set)',
    'DrawTitlesComponents': 'Component (set)',
    'DrawTitlesInterface': 'Service interface',
    'DrawProviderSetsData': 'Provider set',
    'DrawComponentSetsData': 'Component set',
    'DrawProvidersInfoProviderName': 'Provider name',
    'DrawProvidersInfoProviderType': 'Provider type',
    'DrawProvidersInfoDatasourceType': 'Data source type',
    'DrawProvidersInfoDatasource': 'Data source',
    'DrawProviderSetsInfoContent': 'Provider set name',
    'DrawProviderSetsDtContent': 'Data source',
    'DrawComponentsInfoComponentName': 'Component name',
    'DrawComponentsInfoComponentType': 'Component type',
    'DrawComponentsInfoDtContent': 'Published service ',
    'DrawComponentSetsInfoComponentSetName': 'Component set name',
    'DrawComponentSetsInfoContent1': 'Type',
    'DrawComponentSetsInfoContent2': 'Component set',
    'DrawComponentSetsInfoDtContent': 'Published service ',
    'DrawInterfacesInfoInterfaceName': 'Interface name',
    'DrawInterfacesInfoInterfaceType': 'Interface type',
    'DrawInterfacesInfoDtContent': 'Published service ',
    'GetDatasourceTypeWorkspace': 'Workspace',
    'GetDatasourceTypeMBTilesService': 'MBTiles File',
    'GetDatasourceTypeSMTilesService': 'SMTiles File',
    'GetDatasourceTypeArcGIS': 'ArcGIS REST Service',
    'GetDatasourceTypeTPKMapProvider': 'TPK File',
    'GetDatasourceTypeVTPKMapProvider': 'VTPK File',
    'GetDatasourceTypeWMTSMapProvider': 'WMTS Service',
    'GetDatasourceTypeBingMapsMapProvider': 'Bing Maps Service',
    'GetDatasourceTypeTiandituMapProvider': 'TianDitu Service',
    'GetDatasourceTypeCloudMapProvider': 'SuperMap Cloud Service',
    'GetDatasourceTypeBaiduMapProvider': 'Baidu Map Service',
    'GetDatasourceTypeOSMMapProvider': 'OpenStreetMap Map Service',
    'GetDatasourceTypeWMSMapProvider': 'WMS Service',
    'GetDatasourceTypeWFSDataProvider': 'WFS Service',
    'GetDatasourceTypeRestProvider': 'REST Service',
    'GetDatasourceTypeAggregation': 'Aggregation type',
    'GetDatasourceTypeGeopkg': 'GeoPackage File',
    'GetDatasourceTypeGeoprocessorProvider': 'Geoprocessor Service',
    'GetDatasourceTypeFastDFSTileProvider': 'FastDFS Service',
    'GetDatasourceTypeSVTilesMapProvider': 'SVTiles File',
    'GetDatasourceTypeUGCV5TileProvider': 'UGCV5Tile File',
    'GetDatasourceTypeArcGISCacheProvider': 'ArcGIS Cache',
    'GetDatasourceTypeArcGISCacheV2Provider': 'ArcGIS CacheV2',
    'GetDatasourceTypeLocal3DCacheProvider': 'Local 3D Cache',
    'GetDatasourceTypeThreeDTilesCacheProvider': '3DTiles Cache',
    'GetDatasourceTypePlotProvider': 'Plot Service',
    'GetDatasourceTypeMongoDB': 'MongoDB Service',
    'GetDatasourceTypeGDPMapProvider': 'GDP File',
    'GetDatasourceTypeUnknown': 'Unknown type',
    'GetDatasourceTypeFromAdmin': 'Cantact Administrator',
    'GetDatasourceAggregation': 'Aggregation datasource',
    'GetComponentTypeUnknown': 'Component with unknown type',
    'GetInterfaceTypeUnknown': 'Interface with unknown type',
    'GetProviderDataWorkspace': 'Workspace',
    'MakeCommonProviderItemsItemName': 'Service provider name',
    'MakeCommonNecessary': 'Required',
    'MakeCommonProviderItemsItemType': 'Service provider type',
    'MakeCommonProviderSetItemsItemName': 'Service provider set name',
    'MakeCommonProviderSetItemsItemType': 'Serivice provider set type',
    'MakeCommonComponentItemsItemName': 'Service component name',
    'MakeCommonComponentItemsItemType': 'Service component type',
    'MakeCommonComponentSetItemsItemName': 'Service component set name',
    'MakeCommonInterfaceItemsItemName': 'Service interface name',
    'MakeCommonInterfaceItemsItemType': 'Service interface type',
    'MakeSpecificComponentItemsMapProviders': 'Map provider set',
    'MakeSpecificComponentItemsDataProviders': 'Data provider set',
    'MakeSpecificComponentItemsRealspaceProviders': '3D provider set',
    'MakeSpecificComponentItemsNetworkAnalystProviders': 'Transportation Analyst Provider Set',
    'MakeSpecificComponentItemsTrafficAnalystProviders': 'TrafficTransfer Analyst Provider Set',
    'MakeSpecificComponentItemsSpatialAnalystProviders': 'Spatial Analyst provider set',
    'CheckDatasourceWorkspacePath': 'Workspace',
    'CheckDatasourceIsNotExist': ' not exist',
    'CheckDatasourceAlert1': 'Please specify a workspace with the .smw, .smwu, .sxw, or .sxwu suffix.',
    'CheckDatasourceURL': 'URL',
    'CheckDatasourceIsNotUsed': ' not available',
    'CreateProviderPutEntityName': 'Please specify another name because a provider (set) with the specified name already exists.',
    'CreateComponentSetPutEntityName': 'Please specify another name because a component (set) with the specified name already exists.',
    'CreateProviderPutEntityIsValidName': 'Chinese and special characters cannot be contained in the name.',
    'CreateInterfacePutEntityName': 'Please specify another name because an interface with the specified name already exists.'
};

var workspaceRes = {
    'Start': 'Start',
    'Stop': 'Stop',
    'DeleteWorkspace1': 'Are you sure you want to delete the workspace ',
    'DeleteWorkspace2': ' ?',
    'ResetWorkspace': 'Are you sure you want to restart all services?'
};

var kmlStyleRes = {
    'fontFamily': 'Times New Roman',
    'datasource': 'Datasource',
    'dataset': 'Dataset',
    'remove': 'Remove',
    'selectDatasource': 'Please select datasource.',
    'selectDataset': "Please select dataset.",
    'linkDatasetAlreadyExist': "Link dataset already exists.",
    'pleaseInputLabelColorLikeffffff': "Please input the label color like ffffff.",
    'pleaseInputPositiveSacle': "Please input the positive scale.",
    'pleaseInputLineColorLikeffffff': "Please input the line color like ffffff.",
    'pleaseInputPositiveLineWidth': "Please input the positive line width.",
    'pleaseInputPolygonFillColorLikeffffff': "Please input the fill color like ffffff."
};

var kmlStylesRes = {
    'idIs': 'id ',
    'identifier': 'ID',
    'alreadyExist': ' already exists',
    'addKMLStyle': 'Add KML style',
    'pleaseInputStyleIdentifier': 'Please input style identifier',
    'identifierError': 'Identifier contains characters other than a-z and 0-9',
    'datasetNotExist': 'Dataset not exist',
    'styleNotExist': ' style not exist',
    'yes': 'Yes',
    'no': 'No',
    'remove': 'Delete'
};

var precacheRes = {
    'size': 'Size: ',
    'format': '<br> Format: ',
    'starting': 'Starting...',
    'stopping': 'Stopping...',
    'deleting': 'Deleting...',
    'compact': 'Compact',
    'origin': 'Original',
    'simple': 'Simple',
    'type': '<br> Type: ',
    'cacheType': '<br>Cache type: ',
    'isTranparent': '<br> Transparent: Yes',
    'bounds': '<br> Bounds: ',
    'workspace': '<br>Workspace: ',
    'total': 'There are ',
    'buildPicture': ' images. Finished: ',
    'pieces': ' images',
    'pieces2': ' images.',
    'start': 'Start',
    'remove': 'Delete',
    'edit': 'Edit',
    'stop': 'Stop',
    'cancle': 'Cancel',
    'waitForExecuting': 'Wait for executing',
    'taskError': 'Failed to start pre-caching task because of parameter error.',
    'pleaseSelectAHasBeenConfiguratedWorkspace': 'Please select a configured workspace',
    'pleaseSelectAMapNameToBeCached': 'Please select the map to be cached',
    'pleaseSelectCacheScale': 'Please select the cache scale',
    'pleaseValidateCacheBounds': 'Please make sure the cache bounds, which should be in the form of -180.0,-90.0,180.0,90.0, is correct',
    'pleaseAddFDFSTrackers': 'Please add FDFS Trackers',
    'pleaseAddFDHTGroups': 'Please add FDHT Groups',
    'hour': ' hours ',
    'minute': ' minutes ',
    'second': ' seconds ',
    'selectWorkspace': 'Select a workspace',
    'addOrEditPrecacheTask': 'Add/Edit precache task',
    'usingTrialVersion': 'You are using the trial license. The Unregister identification will exist in caches generated, do you want to proceed?',
    'cacheLevel': 'Cache level: ',
    'cacheScales': 'Cache scales：',
    'cache40Desc': 'Default. For all versions of iServer 6R.',
    'cache50Desc': 'For iServer 6R(2012) SP1 or higher version.',
    'cache31Desc': 'Simple. For all versions of iServer 6R.',
    'remind': 'Prompot',
    'map': "Map",
    'fixedMapInfo': 'Cache scales can only be selected from fixed scales specified.',
    'resetFixedScales': 'Restore',
    'add': 'Add',
    'levelTip': 'Input Level (interger)',
    'remainingTime': 'Remaining Time:',
    'waiting': 'Waiting...',
    'currentScales': 'Current Scale:',
    'toNextRunningTime': 'Next running time:',
    "later": "later"
};

var precacheCommonRes = {
    'varifyPositiveScale': 'Please make sure the scale is positive',
    'sacleHasBeenAdded': 'The scale had been added',
    'nullValue': 'Cannot add a null value',
    'levelInvalid': 'level is invalid, level value must be integer greater or equal to 0 and less than 21',
    'hasInvalidLevel': 'some level is invalid, level value must be integer greater or equal to 0 and less than 21',
    'hasValidLevelButRepeat': 'The level had been added',
    'visibleScalesMapUnsupportGlobal': 'The global tileType in this map is not supported',
    'notMatcheWithMessage': 'Menus and messages numbers do not match!',
    'selectLayersAlert': 'Please select layers',
    'connectionException': "Connect failed!please check storage is available."
};

var precacheTaskRes = {
    'selectWorkspace': 'Select a workspace'
};

var serviceCacheRes = {
    'newCacheTask': 'Create new cache task.'
};
var datastoreRes = {
    'instanceName': 'instanceName',
    'nodeName': 'nodeName',
    'fromPublic': 'fromPublic'
};

var moduleNames = {
    managerRoot: "Home",
    siteConfig: "Site Configuration",
    homeCustomize: "Home customization",
    buildinMap: "Default Base Maps",
    mycontent: "Personal Center",
    mapViewer: "Map Viewer",
    insights: "DataInsights",
    directoriesManage: "Directories Management",
    registerSetting: "Register Management",
    emailNotifier: "Email Notifier",

    resourceManage: "Resources Management",
    mapsManage: "Maps",
    servicesManage: "Services",
    scenesManage: "Scenes",
    datasManage: "Datas",
    appsManage: "Apps",
    groupsManage: "Groups",
    insightsManage: "DataInsights",
    mapDashboardsManage: "mapDashboards",

    serverManage: "Server Management",
    addServers: "Add server",
    hostServers: "Hosting server",
    monitorServers: "Monitor server",

    logManage: "Logs",
    systemLogs: "System Logs",
    operationLogs: "Operation Logs",
    logsHar: "Service Access Logs",
    logsConfig: "Log Configuration",

    securityManage: "Security",
    securityConfig: "Security Config",
    departments: "Departments",
    usesManage: "Users Management",
    userGroupsManage: "User Groups Management",
    rolesManage: "Roles Management",
    casConfig: "CAS Configuration",
    keycloakConfig: "Keycloak Configuration",
    ldapConfig: "LDAP Configuration",
    oauthConfig: "Third-party Configuration",

    portalStatisticsManage: "Portal Statistics",

    scheduledTaskManage: "Scheduled Task",
    scheduledRestart: "Resources Recovery Regularly"
};

var distributedCacheRes = {
    'pleaseSelectMapComponet': 'Select a service component',
    'pleaseSelectAMapNameToBeCached': 'Please select the map to be cached',
    'pleaseSelectCacheScale': 'Please select the cache scale',
    'pleaseValidateCacheBounds': 'Please make sure the cache bounds, which should be in the form of -180.0,-90.0,180.0,90.0, is correct',
    'pleaseAddFDFSTrackers': 'Please add FDFS Trackers',
    'pleaseAddFDHTGroups': 'Please add FDHT Groups',
    'deleteJobConfirm': 'Are you sure to delete this task?',
    'existTileVersion': 'Tile version is existing, and whether to create a new?',
    'createTileVersion': 'Please select a version as the parent of the new version!',
    'appendTileVersion': 'Please select a appended version!',
    'parentTileVersionIsNull': 'No',
    'pleaseInputOutputPath': 'Please input the tiles storage location',
    'pleaseSelectTileSourceType': 'Please select storage type',
    'pleaseSelectTileSourcePath': 'Please input storage path',
    'pleaseValidateCompressionQuality': 'Please make sure the PicCompressionQuality, which should be in the form of 0,1, is correct',
    'pleaseAddMongoDBServerAdresses': 'Please add the service address of MongoDB',
    'pleaseAddOTSInstanceName': 'Please add the instanceName of OTS',
    'pleaseAddOTSNodeName': 'Please add the nodename of OTS',
    'pleaseAddOTSAccessKeyId': 'Please add the AccessKeyId of OTS',
    'pleaseAddOTSAccessKeySecret': 'Please add the AccessKeySecret of OTS',
    'ColAndRowCannotBeNullAndShouldBeANum': 'The row and column in data processing must not be null and is a number'
};

var updateResourceRes = {
    'remove': 'Remove',
    'urlAddress': 'URL: ',
    'notAccessable': ' not available!',
    'add': 'Add',
    'hasBeenAdded': 'Added',
    'necessary': 'Required',
    'fileWorkspacePath': 'Workspace file path:',
    'geoprocessorIPError': 'Incorrect ip configuration in geoprocessor service!',
    'geoprocessorIPLocation': 'The ip of geoprocessor server:',
    'configError': ' Configuration is not correct',
    'geoprocessorIPPort': 'The port of geoprocessor server:',
    'geoprocessorConnectError': 'in geoprocessor service，the configuration can not connet，please check or update JDBC driver!',
    'cacheType': 'Cache type of raster tiles: ',
    'importStorageConfig': 'Import storage position',
    'howToPrepareFDFS': 'How to prepare the FastDFS environment',
    'mbtilesDefaultPath': 'Cache default path:',
    'isInteger': 'It must be an interger!',
    'isUseCache': 'Enable caching:',
    'isUseImageCache': 'Enable map tile caching:',
    'isUseVectorCache': 'Enable vector tile caching:',
    'isUseUTFGridCache': 'Enable attribute tile caching:',
    'isCacheReadOnly': 'Whether cache is read-only:',
    'expiredTime': 'Cache survival time:',
    'useCacheDescription': 'Whether to enable component caches, including map tile cache, property tile cache and vector tile cache.',
    'expiredDescription': 'Cache survival time is calculated from creating cache. The unit is minutes. 0 represents the cache never expires.',
    'smtilesDescriptionLink': 'The extended cache format based on MBTiles standard. After configuration, service will use the SMTiles or MBTiles caches in the storage location. If there are no tiles, it will create SMTiles caches dynamically. Please refer to <a href="#">SMTiles Tiles</a>.',//
    'smtilesDescription': 'The extended cache format based on MBTiles standard. After configuration, service will use the SMTiles or MBTiles caches in the storage location. If there are no tiles, it will create SMTiles caches dynamically.',//
    'utfgridDescription': 'The extended cache format based on UTFGrid standard.',
    'svtilesDescription': 'The extended cache format based on SQLite database.',
    'fastDFSDescription': 'The light weight distributed cache format based on FastDFS.',
    'mongoDBDescription': 'The light weight distributed cache format based on MongoDB.',
    'mongoDBVectorTileCacheCard': 'MongoDB only support MVT vector tile caches',
    'gdpDescription': 'GDP tile cache format.',
    'cacheOutuptPath': "Storage location:",
    'cacheVersion': "Cache Version:",
    'ugcDescripttion': "SuperMap UGC V5.0 cache format. After configuration, service will use the V5 caches. If there are no tiles, it will create V5 caches.",
    'dpiDescripttion': "If use default value 0, dpi will use map default value",
    'readOnlyDescripttion': "The parameter modification is invalid after the imagecollection is created"
};

var utilityRes = {
    'error': "Error",
    'warning': "Warning",
    'info': "Info",
    'confirmTitle': "Operating Tips",
    'confirmOK': "OK",
    'confirmCancel': "Cancel",
    'ButtonYES': 'Yes',
    'ButtonNO': 'No',
    'ButtonOK': 'OK',
    'DialogTitle': 'Warning',
    'dataComponents': 'Data Component',
    'dataService': 'Data Service',
    "ElasticsearchDataProvider": "Elasticsearch Provider",
    'localDataProvider': 'UGC Data Provider',
    'WFSDataProvider': 'WFS Data Provider',
    'GeoPackageDataProvider': 'GeoPackage Data Provider',
    'GeoPackageMapProvider': 'GeoPackage Map Provider',
    'ShapeFileDataProvider': 'Shapefile Data Provider',
    'ShapeFileMapProvider': 'Shapefile Map Provider',
    'DSFMapProvider': 'Distribute Spatial Format Map Provider',
    'DSFDataProvider': 'Distribute Spatial Format Data Provider',
    'PostgisDataProvider': 'PostGIS Data Provider',
    "PostgisMapProvider": "PostGIS Map Provider",
    "BlockchainMapProvider": "BlockchainMapProvider",
    "BlockchainDataProvider": "BlockchainDataProvider",
    "GeoTrellisMapProvider": "GeoTrellis Map Provider",
    "GeotrellisDataProvider": "GeoTrellis Data Provider",
    'aggregationDataProvider': 'Aggregation Data Provider',
    'RESTDataProvider': 'REST Data Provider',
    'RESTPlotProvider': 'REST Plotting Provider',
    'realspaceComponents': '3D Component',
    'realspaceService': '3D Service',
    'localRealspaceProvider': 'UGC 3D Provider',
    'transportationanalystComponent': 'Transportation Analysis Component',
    'transportationanalystService': 'Transportation Analysis Service',
    'transportationanalystProvider': 'Transportation Analysis Provider',
    'traffictransferanalystComponent': 'Traffic Transfer Analysis Component',
    'traffictransferanalystService': 'Traffic Transfer Analysis Service',
    'traffictransferanalystProvider': 'Traffic Transfer Analysis Provider',
    'addressMatchProvider': 'Address Matching Provider',
    'geometryServiceProvider': 'Geometry Service Provider',
    'addressMatchComponent': 'Address Matching Component',
    'addressMatchService': 'Address Matching Service',
    'geometryServiceComponent': 'Geometry Service Component',
    'geometryService': 'Geometry Service',
    'geoprocessorService': 'Geoprocessor Service',
    'geoprocessorComponent': 'Geoprocessor Component',
    'spatialanalystComponent': 'Spatial Analysis Component',
    'spatialanalystService': 'Spatial Aanalysis Service',
    'spatialanalystProvider': 'Spatial Analysis Provider',
    'mapComponent': 'Map Component',
    'mapService': 'Map Service',
    'imageComponent': 'Image Component',
    'imageService': 'Image Service',
    'networkAnalyst3DComponent': '3D Network Analysis Component',
    'networkAnalyst3DService': '3D Network Analysis Service',
    'localMapProvider': 'UGC Map Provider',
    'WMSMapProvider': 'WMS Map Provider',
    'WMTSMapProvider': 'WMTS Map Provider',
    'SMTilesMapProvider': 'SMTiles Map Provider',
    'ZXYTilesMapProvider': 'ZXYTiles Map Provider',
    'TPKMapProvider': 'TPK Map Provider',
    'TPKXMapProvider': 'TPKX Map Provider',
    'VTPKMapProvider': 'VTPK Map Provider',
    'ArcGISRestMapProvider': 'ArcGIS REST Map Provider',
    'ArcGISRestDataProvider': 'ArcGIS REST Data Provider',
    'ArcGISRestNetworkProvider': 'ArcGIS REST Network Analysis Provider',
    'ArcGISRestGeometryProvider': 'ArcGIS REST Geometry Provider',
    'ArcGISCacheProvider': 'ArcGIS Cache Map Provider',
    'ArcGISCacheV2Provider': 'ArcGIS CacheV2 Map Provider',
    'ArcGISRestGeocodeProvider': 'ArcGIS REST Geocode Provider',
    'Local3DRealspaceProvider': 'Local 3D Realspace Provider',
    'OssRealspaceProvider': 'OSS Realspace Provider',
    'SuperMapTilesRealspaceProvider': 'S3 3D Realspace Provider',
    'ThreeDTilesRealspaceProvider': '3DTiles Realspace Provider',
    'RESTMapProvider': 'REST Map Provider',
    'aggregationMapProvider': 'Aggregation Map Provider',
    'clusterMapProvier': 'Cluster Map Provider',
    'BingMapsMapProvider': 'Bing Maps Provider',
    'GoogleMapsMapProvider': 'Google Maps Map Provider',
    'TiandituMapProvider': 'TianDiTu Map Provider',
    'CloudMapProvider': 'SuperMap Cloud Map Provider',
    'BaiduMapProvider': 'Baidu Map Provider',
    'OpenStreetMapProvider': 'OpenStreetMap Map Provider',
    'RESTRealspaceProvider': "REST 3D Provider",
    'RESTSpatialAnalystProvider': "REST SpatialAnalysis Provider",
    'RESTTrafficTransferAnalystProvider': "REST Traffic Transfer Analysis Provider",
    'RESTTransportationAnalystProvider': "REST Transportation Analysis Provider",
    'RESTAddressMatchProvider': "REST Address Matching provider",
    'RESTGeometryServiceProvider': "Rest Geometry Service Provider",
    'UGCV5TileProvider': "UGCV5 Map Provider",
    'UGCPlotProvider': "Plotting Provider",
    'PlotService': "Plotting Service",
    'PlotComponent': "Plotting Component",
    'FastDFSTileProvider': "FastDFS Map Provider",
    'MongoDBTileProvider': "MongoDB Map Provider",
    'GDPMapProvider': "GDP Map Provider",
    'SVTilesMapProvider': "SVTiles Map Provider",
    'MultiTilesMapProvider': "Multi Tiles Map Provider",
    'MVTTilesMapProvider': "UGCV5(MVT) Map Provider",
    'GeoprocessingServer': "Geoprocessing Component",
    'workspace': 'Workspace: ',
    'failureReason': 'Operation failed\nCause: ',
    'repeatedClusterAddress' : 'The cluster service address is repeated',
    'clusterAddressError' : 'The cluster service address format is incorrect',
    'cannotConnectClusterAddress' : 'Unable to connect to the cluster service address <br>',
    'cannotConnectMultipleClusterAddresses' : 'Unable to connect to multiple cluster service addresses.',
    'continueSaving':'<br> Continue saving?',
    'necessary': ' is required!',
    'dontWannaSet': 'If there is no need for you to set ',
    'dontSelect': ', please do not select',
    'notExist': ' not exist!',
    'selectSuchTypeWorkspace': 'Please select a workspace with the .smw, .smwu, .sxw, or .sxwu suffix.',
    'selectSuchTypeSMTiles': 'Please select a file with .smtiles or .mbtiles suffix.',
    'selectSuchTypeTPK': 'Please select a file with the .tpk suffix.',
    'selectSuchTypeVTPK': 'Please select a file with the .vtpk suffix.',
    'selectSuchTypeSCI': 'Please select a file with the .sci suffix.',
    'selectSuchTypeXMLOrCDI': 'Please select a file with the .xml or .cdi suffix.',
    'selectSuchTypeSCP': 'Please select a file with the .scp or .sct or .sci3d suffix.',
    'selectSuchTypeJSON': 'Please select a file with the .json suffix.',
    'WFSServiceInterface': 'WFS Interface',
    'WCSServiceInterface': 'WCS Interface',
    'WPSServiceInterface': 'WPS Interface',
    'RESTServiceInterface': 'REST Service Interface',
    'RJServiceInterface': 'REST/JSR Service Interface',
    'WMSServiceInterface': 'WMS Interface',
    'WMTSServiceInterface': 'WMTS Interface',
    'AGSRESTServiceInterface': 'ArcGIS REST Service Interface',
    'BaiduRESTServiceInterface': 'Baidu REST Service Interface',
    'GoogleRESTServiceInterface': 'Google REST Service Interface',
    'TMSRESTServiceInterface': 'TMS REST Service Interface',
    'OSMRESTServiceInterface': 'OSM REST Service Interface',
    'GeoprocessorServiceInterface': 'Geoprocessor Service Interface',
    'upLoadNotAllowed': 'You are not allowed to load local files because of the security setting of your brower. To solve the problem, you can: (1) Input "about:config" in the address bar; (2) Right click and select New->Bool; (3) Input "signed.applets.codebase_principal_support" in the dialog box that pops up; (4) Click OK and reload the file.',
    'file': 'File ',
    'cannotLoad': '  cannot be loaded: relative path not accepted. Please specify the absolute path of the file.',
    'notFindFile': 'not found ',
    'overviewTabName': 'Overview',
    'sInstanceTabName': 'Instances',
    'workspaceTabName': 'Workspaces',
    'sInterfaceTabName': 'Service Interfaces',
    'sComponentTabName': 'Service Component(Set)s',
    'sProviderTabName': 'Service Provider(Set)s',
    'serverChartTabName': 'Diagram',
    'typeMetadataTabName': 'Types',
    'httpCacheTabName': 'HTTP Cache',
    'viewComponent': 'View details about service component(set)s',
    'viewInterface': 'View details about service interfaces'
};
var oAuthRes = {
    'connectWebPcess': '网站接入流程',//这段文本被拼凑在url中的，修改文本前，需要验证url是否可用
    'connectWebIntroduction': '网站接入介绍',//这段文本被拼凑在url中的，修改文本前，需要验证url是否可用
    'selectConfItemToDel': 'Please select the config item to delete.',
    'add3rdPartLoginConf': 'Add third part login configuration',
    'modify3rdPartLoginConf': 'Modify third part login configuration',
    'saveSuccess': 'Save successfully!',
    'canNotBeNull': 'Can not be null.',
    'modifiedByConfFiles': 'Modified by configuration files.',
    'edit': 'Edit',
    'deletetag': 'Delete',
    'enabled': 'Enabled',
    'deactivated': 'Deactivated',
    'loginWays': 'Login ways',
    'enableOrNot': 'Enable',
    'enable': 'Enable',
    'disable': 'Disable',
    'clienIdentification': 'Client identification',
    'callbackDomainName': 'Callback domain name',
    'operation': 'Operation',
    'confirmToDelConfSelected': 'Are you sure to delete the configuration selected?',
    'isBinding': 'Binding...',
    'bind': 'Bind',
    'isLoggingIn': 'Logging in...'
};

// 来自config.js


function configParam(name, chName, fileType, isNecessay, isGeneralSetting) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    this.isGeneralSetting = isGeneralSetting; // true, false
    if (arguments.length > 5) {
        this.otherParam = Array.prototype.slice.call(arguments, 5);
    }
}
function controlHiddenConfigParam(name, chName, fileType, isNecessay,hideIds,displayIds) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    //fileType为CheckBox时，值默认为false隐藏，为true时显示的id数组
    this.hideIds = hideIds;
    //fileType为CheckBox时，值默认为false显示，为true时隐藏的id数组
    this.displayIds = displayIds;
}

function ImageServiceConfigParam(name, chName, fileType, isNecessay, readonly, defaultValue, modifiy,hide) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    this.readonly = readonly;
    this.defaultValue = defaultValue;
    this.modifiy = modifiy;
    this.hide = hide;
    if (arguments.length > 8) {
        this.otherParam = Array.prototype.slice.call(arguments, 6);
    }
}


function optionsconfigParam(name, chName, fileType, isNecessay, options,
                            isGeneralSetting) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    this.options = options;
    this.isGeneralSetting = isGeneralSetting; // true, false
}

function readonlyoptionsconfigParam(name, chName, fileType, isNecessay, options,
                                    readonly) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    this.options = options;
    this.readonly = readonly; // true, false
}

// 有默认值的参数配置对象
function defaultconfigParam(name, chName, fileType, isNecessay, defaultValue,
                            isGeneralSetting, notes) {
    this.name = name;
    this.chName = chName;
    this.fileType = fileType; // "Text", "Select", "File", "Checkbox"，
    // “Custom”,"Password","Object","ObjectArray","Array"
    this.isNecessay = isNecessay; // true, false
    this.defaultValue = defaultValue;
    this.isGeneralSetting = isGeneralSetting; // true, false
    this.notes = notes; // 说明注释内容
}

// 通用配置对象,一个一个参数设置不好扩展，而且调用时参数顺序也容易写混。
// 格式
// {"name":name,"chName":chName,"fileType":fileType,"isNecessay":isNecessay,"defaultValue":defaultValue,"isGeneralSetting":isGeneralSetting}
function generalConfigParam(config) {
    for (var p in config) {
        this[p] = config[p];
    }
}

var layerStyles = {
    getHtml: function (itemValue, newOwnerId, argument, container, subItem) {
        var inputHtml = "";
        if (itemValue != null) {
            var newArray = new Array();
            if (typeof itemValue == "string") {
                newArray = stringConvertToArray(itemValue);
            } else {
                newArray = itemValue;
            }

            var selectId = newOwnerId + argument.name;
            var tempInputHtml = "<input class='new span4' type='text' id='"
                + newOwnerId
                + argument.name
                + "addSLDButton'/><button class='btn' id='browse_"
                + argument.name
                + "'>Browse</button><button class='addSLDButton btn' name='"
                + newOwnerId
                + argument.name
                + "'>"
                + updateResourceRes.add
                + "</button><br/><div style='margin-top:10px;'><label>"
                + updateResourceRes.hasBeenAdded
                + "</label><select name='select' multiple='multiple' size='5' class='col-md-4' id='"
                + selectId
                + "'></select><button class='removeButton btn' name='"
                + newOwnerId + argument.name + "'>"
                + updateResourceRes.remove + "</button></div>";
            inputHtml = "<div class='parameter'><label>" + argument.chName
                + ": </label>" + tempInputHtml + "</div>";
            $(container).append(inputHtml);
            if (subItem != null && subItem !== "") {
                subItem.htmlElements.input = document.getElementById(selectId);
            }

            // 在必填字段的名字后加"*"
            if (argument.isNecessay) {
                $("#" + newOwnerId + argument.name).parent().parent()
                    .children().eq(0).append(
                    "<span class='necessary' title='"
                    + updateResourceRes.necessary
                    + "'> * </span>");
            }

            for (var k = 0; k < newArray.length; k++) {
                $("#" + newOwnerId + argument.name).append(
                    "<option>" + newArray[k] + "</option>");
            }

        }
        return inputHtml;
    },
    getValue: function (itemValue) {
        var result = new Array();
        for (var k = 0; k < itemValue.length; k++) {
            var layerStyle = {};
            layerStyle = itemValue.eq(k).text();
            result[result.length] = layerStyle;
        }
        return result;
    }
};

// RestProvider相关的配置单独提取出来，避免重复的js代码
var restProviderConfigCommon = {
    "restServiceRootURL": new configParam("restServiceRootURL",
        "REST service URL", "Text", true, true),
    "token": new configParam("token", "Token or API-Key", "Text", false, false),
    "httpReferer": new generalConfigParam({
        "name": "httpReferer",
        "chName": "HTTP referer",
        "fileType": "Text",
        "isNecessay": false,
        "defaultValue": "",
        "isGeneralSetting": false,
        "tooltip": "When using the Token in the format of HTTP Referer, this value should be set."
    }),
    "useCache": new generalConfigParam({
        "name": "useCache",
        "chName": "Enable caching",
        "fileType": "CheckboxWithObject",
        "isNecessay": true,
        "isGeneralSetting": false,
        "object": "restProviderCacheConfig",
        "defaultValue": true,
        "isCacheConfig": true
    }),
    "userName": new configParam("userName", "Username for access service", "Text", false, false),
    "password": new configParam("password", "Password for access service", "Password", false,
        false)
};

var res = {
    // 服务接口, 组件, 组件集合
    // 服务接口
    "WMS Interface": [
        new configParam("mapName", "Map name", "Text", false),
        new configParam("serviceDescription", "Service description",
            "Object", false),
        new configParam("sld", "SLD configuration", "Object", false),
        new optionsconfigParam("version", "Version", "Select", false, [
            "1.1.1", "1.3.0"])],

    "WPS Interface": [new optionsconfigParam("version", "Version", "Select",
        false, ["1.0.0"])],

    "sld": [
        new configParam("pointStyles", "Point layer configuration information", layerStyles, false),
        new configParam("lineStyles", "Line layer configuration information", layerStyles, false),
        new configParam("polygonStyles", "Region layer configuration information", layerStyles, false),
        new configParam("textStyles", "Text layer configuration information", layerStyles, false)],

    "serviceDescription": [
        new configParam("name", "Service name", "Text", false),
        new configParam("title", "Title", "Text", false),
        new configParam("serviceAbstract", "Server description", "Text",
            false),
        new configParam("keywords", "Keywords", "Array", false), // String[]
        new configParam("onlineResource", "Online resource", "Text", false),
        new configParam("contactInformation",
            "Service provider contact information", "Object", false),
        new configParam("fees", "Fees", "Text", false),
        new configParam("accessConstraints", "Access constraints", "Text",
            false)],

    "空间处理建模服务接口": [
        new defaultconfigParam("gpEnabled", "Enable", "Checkbox", true, false),
        new configParam("gpip", "GP ip", "Text", true),
        new configParam("dbUser", "DB User", "Text", true),
        new configParam("dbPassword", "DB Password", "Password", true),
        new configParam("gpUser", "GP User", "Text", true),
        new configParam("gpPassword", "GP Password", "Password", true)],

    "contactInformation": [
        new configParam("person", "Contact person", "Text", false),
        new configParam("organization", "Organization", "Text", false),
        new configParam("position", "Position", "Text", false),
        new configParam("addressType", "Address type", "Text", false),
        new configParam("address", "Address", "Text", false),
        new configParam("city", "City", "Text", false),
        new configParam("stateOrProvince", "State or province", "Text",
            false),
        new configParam("postCode", "Post code", "Text", false),
        new configParam("country", "Country", "Text", false),
        new configParam("voiceTelephone", "Telephone", "Text", false),
        new configParam("facsimileTelephone", "Fax", "Text", false),
        new configParam("electronicMailAddress", "Email", "Text", false)],

    "WMTS Interface": [
        new configParam("identification", "Identification", "Object", false),
        new configParam("provider", "Provider", "Object", false)],

    "identification": [
        new configParam("title", "Title", "Text", false),
        new configParam("description", "Description", "Text", false),
        new configParam("keywords", "Keywords", "Array", false),
        new configParam("fees", "Fees", "Text", false),
        new configParam("accessConstraints", "Access constraints", "Text",
            false),
        new configParam("serviceType", "Service type", "Text", false),
        new configParam("serviceTypeVersion", "Service type version",
            "Text", false)],

    "provider": [
        new configParam("providerName", "Provider name", "Text", false),
        new configParam("providerSite", "Provider website", "Text", false),
        new configParam("serviceContact", "Contact information", "Object",
            false)],

    "serviceContact": [
        new configParam("individualName", "Contact person", "Text", false),
        new configParam("positionName", "Position", "Text", false),
        new configParam("phoneNumber", "Telephone", "Text", false),
        new configParam("faxNumber", "Fax", "Text", false),
        new configParam("deliveryPoint", "Delivery point", "Text", false),
        new configParam("addressCity", "City", "Text", false),
        // new configParam("addressStreet","Street","Text",false),
        new configParam("addressAdministrativeArea", "Administrative area",
            "Text", false),
        new configParam("addressPostalCode", "Postal code", "Text", false),
        new configParam("addressCountry", "Country", "Text", false),
        new configParam("addressElectronicMailAddress", "Email", "Text",
            false)],

    "WFS Interface": [new optionsconfigParam("version", "Version", "Select", false, ["1.0.0",
        "2.0.0"])],
    "WCS Interface": [
        new optionsconfigParam("version", "Version", "Select", false, [
            "1.1.1", "1.1.2"]),
        new configParam("identification", "Identification", "Object", false),
        new configParam("provider", "Provider", "Object", false)],

    "REST Service Interface": [],

    "ArcGIS REST Service Interface": [], // 暂时没有可配置的config

    "Baidu REST Service Interface": [], // 暂时没有可配置的config

    "Google REST Service Interface": [], // 暂时没有可配置的config

    "TMS REST Service Interface": [], // 暂时没有可配置的config

    "OSM REST Service Interface": [], // 暂时没有可配置的config

    "Transportation Analyst Component": [],

    "TrafficTransfer Analyst Component": [],

    // 服务组件
    "Map Component": // "com.supermap.services.components.impl.MapImpl" :
        [
            // new defaultconfigParam("outputPath", "Output path", "Text",
            // false,
            // "output/"),
            // new defaultconfigParam("outputSite", "Output site", "Text",
            // false,
            // "http://{ip}:{port}/iserver/output/")
            //new defaultconfigParam("useCache", "isUsingCache", "Checkbox",
            //		false, false, true),
            new configParam("tileCacheConfig", "Cache Storage", "CacheStorage", true,
                true)],
    // new optionsconfigParam("logLevel", "日志级别", "Select",
    // false,["DEBUG,INFO,WARN,ERROR,FATAL"])], // 级别select:
    "Image Component":
        [   new configParam("downloadable", "Downloadable", "Checkbox", false),
            new configParam("editable", "Editable", "Checkbox", false)],

    "Data Component": [new defaultconfigParam("editable", "Enable editing", "Checkbox", false, false,
        true)],
    // 暂时com.supermap.services.components.DataConfig没有内容

    "Plot Component": [],

    "Realspace Component": // "com.supermap.services.components.impl.RealspaceImpl"
    // :
        [], // 暂时没有可配置的config

    "Spatial Analyst Component": // "com.supermap.services.components.impl.SpatialAnalystImpl"
    // :
        [], // 暂时没有可配置的config

    "REST/JSR Service Interface": // "com.supermap.services.components.impl.SpatialAnalystImpl"
    // :
        [], // 暂时没有可配置的config

    "com.supermap.services.providers.UGCMapProvider": // UGCMapProvider
        [
            new configParam("workspacePath", "Workspace", "Workspace", true,
                true),
            new configParam("datasourceInfos", "datasourceInfo", "datasourceInfo", false, false),
            new configParam("mapEditable", "Editable", "Checkbox", false,
                true),
            new configParam("dpi", "DPI", "Text", false, true),
            new optionsconfigParam("cacheVersion", "Cache version", "Select",
                false, ["5.0", "4.0", "3.1"], false),
            new optionsconfigParam("preferedPNGType", "Prefered PNG Type",
                "Select", false, ["PNG", "PNG8"], false),
            new configParam("maps", "Published maps", "Text", false, false),
            new configParam("ugcMapSettings", "Default map settings",
                "ObjectArray", false, false),

            new defaultconfigParam("multiThread", "Enable multi-thread mode",
                "Checkbox", false, true, false),
            new defaultconfigParam("cacheDisabled", "Disable caching",
                "Checkbox", false, false, false),
            new defaultconfigParam("poolSize", "Pool size", "Text", false, "0",
                false)],

    "ugcMapSettings": [new configParam("ugcMapSetting",
        "Default map settings", "Object", false, false)],

    "ugcMapSetting": [
        new configParam("mapName", "Map name", "Text", false),
        new configParam("pointStyle", "Default highlight marker style",
            "Object", false),
        new configParam("lineStyle", "Default highlight line style",
            "Object", false),
        new configParam("regionStyle", "Default highlight fill style",
            "Object", false)],

    "lineStyle": [
        new configParam("lineSymbolID", "Line symbol ID", "Text", false),
        new configParam("lineWidth", "Line width", "Text", false),
        new configParam("lineColor", "Line color", "Object", false)],

    "pointStyle": [
        new configParam("markerSize", "Marker size", "Text", false),
        new defaultconfigParam("markerAngle", "Marker rotation", "Text",
            false, "0"),
        new configParam("markerSymbolID", "Marker symbol ID", "Text", false)],

    "regionStyle": [
        new configParam("fillSymbolID", "Fill symbol ID", "Text", false),
        new configParam("fillOpaqueRate", "Fill opacity", "Text", false),
        new defaultconfigParam("fillGradientOffsetRatioY",
            "Gradient offset X", "Text", false, "0"),
        new defaultconfigParam("fillGradientOffsetRatioX",
            "Gradient offset Y", "Text", false, "0"),
        new optionsconfigParam("fillGradientMode", "Gradient mode",
            "Select", false, ["CONICAL", "LINEAR", "NONE", "RADIAL",
                "SQUARE"]),
        new defaultconfigParam("fillGradientAngle", "Gradient angle",
            "Text", false, "0"),
        new configParam("fillForeColor", "Foreground", "Object", false),
        new configParam("fillBackOpaque", "Transparent", "Checkbox", false),
        new configParam("fillBackColor", " Background", "Object", false)],

    "lineColor": [
        new defaultconfigParam("red", "Red component", "Text", false, "0"),
        new defaultconfigParam("green", "Green component", "Text", false,
            "0"),
        new defaultconfigParam("blue", "Blue component", "Text", false, "0")],

    "fillForeColor": [
        new defaultconfigParam("red", "Red component", "Text", false, "0"),
        new defaultconfigParam("green", "Green component", "Text", false,
            "0"),
        new defaultconfigParam("blue", "Blue component", "Text", false, "0")],

    "fillBackColor": [
        new defaultconfigParam("red", "Red component", "Text", false, "0"),
        new defaultconfigParam("green", "Green component", "Text", false,
            "0"),
        new defaultconfigParam("blue", "Blue component", "Text", false, "0")],

    "com.supermap.services.providers.UGCImageServiceProvider":
        [new configParam("collectionConfigs", "Image collection  list", "NestObjectArray", false,
            false),
            new configParam("description", "Server description info", "DynamicText", false,true),
            new configParam("tileStoreConnectInfo", "Tile storage configuration information", "ImageServiceObject", false,true),
            new configParam("datasourceConnectionInfo", "DatasourceConnectionInfo configuration", "ImageServiceObject", false,
                true)],
    "tileStoreConnectInfo":[
        new optionsconfigParam("cacheType", "Storage Type", "TileStoreConnectInfo", false,["ORIGINAL", "COMPACT","MONGODB"])
    ],
    "datasourceConnectionInfo":[
        new readonlyoptionsconfigParam("engineType", "Datasource engineType", "TileStoreConnectInfo",
            false, ["UDBX", "POSTGIS","POSTGRESQL"],false)
    ],
    "collectionConfigs": [new configParam("imageCollectionSetting", "Image collection", "Object",
        false, false)],
    "imageCollectionSetting": [
        new ImageServiceConfigParam("id", "CollectionId", "Text", true),
        new ImageServiceConfigParam("title", "Title", "Text", false),
        new configParam("crs", "Coordinate system reference", "Text", false),
        new configParam("dataConnectionInfo", "dataConnectionInfo", "ImageServiceObject", false),
        new configParam("collectionProviders", "CollectionProviders", "NestObjectArray", false),
        new configParam("keywords", "Image collection keywords", "Text", false),
        new configParam("license", "Data use license agreement", "Text", false),
        // new configParam("monitoringSetting", "monitoringSetting", "Object", false),
         new configParam("optimizingSetting", "optimizingSetting", "ImageServiceObject", false),
        new configParam("editable", "editable", "Checkbox",false),
        new configParam("downloadable", "downloadable", "Checkbox",false),
        new configParam("assetHrefMap", "Asset Href", "AssetHrefMap", false),
        new controlHiddenConfigParam("TemplateEnable", "RenderingRule Template Enable", "ControlCheckbox",
            false,["remoteFileSystem","_renderingRuleTemplate"],["renderingRule","_renderingRule"]),
        new configParam("renderingRule", "renderingRule", "ImageServiceObject", false),
        new configParam("renderingRuleTemplate", "renderingRuleTemplate", "XMLTemplate", false),
        new configParam("cacheEnable", "cacheEnable", "Checkbox",false),
        new configParam("tileSchema", " Imagecollection tileSchema", "ImageServiceObject", false),
        new configParam("tilingTaskSetting", "tilingTaskSetting", "ImageServiceObject", false),
    ],
    "collectionProviders": [new configParam("collectionProvider", "CollectionProvider", "Object",
        false, false)],
    "assetHrefMap": [new configParam("assetHref", "AssetHref", "Object",
        false, false)],
    "assetHref": [
        new configParam("localPath", "LocalPath", "Text", false),
        new configParam("href", "Href", "Text", false)
    ],
    "collectionProvider": [
        new configParam("name", "name", "Text", false),
        new configParam("description", "description", "Text", false),
        new configParam("roles", "roles", "Text", false),
        new configParam("url", "url", "Text", false),
    ],
    "dataConnectionInfo": [
        new optionsconfigParam("type", "Add image data method", "DataConnectionInfo",
            false, ["SINGLEFILE", "IMAGEFOLDER","LISTFILE","DATASET"])
    ],
    // "monitoringSetting": [
    //     new configParam("paths", "paths", "Array", false),
    //     new configParam("startTime", "startTime", "Text", false),
    //     new configParam("intervalTime", "intervalTime", "Text", false),
    //     new optionsconfigParam("actions", "actions", "SelectArray",
    //         false, ["OPTIMIZE", "UPDATETILE","APPEND"])
    // ],
    "optimizingSetting": [
        new configParam("computeStats", "computeStats", "Checkbox", false),
        new controlHiddenConfigParam("createPyramid", "createPyramid", "ControlCheckbox", false,["pyramidOptions","_pyramidOptions"]),
        new ImageServiceConfigParam("pyramidOptions", "pyramidOptions", "ImageServiceObject", false,null,null,false,true)
    ],
    "pyramidOptions": [
        new optionsconfigParam("pyramidCompression", "pyramidCompression", "Select",
            false, [ "DEFLATE","LZW","JPEG"]),
        new optionsconfigParam("pyramidResamplingTech", "pyramidResamplingTech", "Select",
            false, ["NEAREST", "AVERAGE","GAUSS","CONJOINT"]),
        new defaultconfigParam("skipExistPyramid", "skipExistPyramid", "Checkbox", false,true),
        new configParam("taskCount", "CreatePyramid taskCount", "Text", false),
    ],
    "renderingRule": [
        new optionsconfigParam("displayMode", "displayMode", "Select",
            false, ["COMPOSITE", "STRETCHED"]),
        new configParam("displayBands", "displayBands", "Text", false),
        new configParam("stretchOption", "stretchOption", "ImageServiceObject",
            false),
        new optionsconfigParam("interpolationMode", "interpolationMode", "Select",
            false, ["NEARESTNEIGHBOR", "LOW","HIGH","DEFAULT"]),
        new configParam("brightness", "brightness", "Text", false),
        new configParam("contrast", "contrast", "Text", false),
        new defaultconfigParam("noDataTransparent", "noDataTransparent", "Checkbox", false,true),
        new configParam("noData", "noData", "Text", false),
        new configParam("backgroundTransparent", "backgroundTransparent", "Checkbox", false),
        new configParam("backgroundValue", "backgroundValue", "Text", false),
    ],
    "tileSchema": [
        new ImageServiceConfigParam("startLevel", "startLevel", "Text", false,null,"0",true),
        new ImageServiceConfigParam("endLevel", "endLevel", "Text", false,null,"23",true),
        new optionsconfigParam("tileFormat", "tileFormat", "DefaultSelect",
            false, ["JPG","PNG","WEBP"]),
        new readonlyoptionsconfigParam("tileSize", "tileSize", "DefaultSelect",
            false, ["SIZE256"],true),
        new ImageServiceConfigParam("dpi", "DPI", "Text", false,null,"96",true),
        new ImageServiceConfigParam("transparent", "isTransparent", "Checkbox",false,null,null,true),
    ],
    "tilingTaskSetting": [
        new configParam("startLevel", "startLevel", "Text", false),
        new configParam("endLevel", "endLevel", "Text", false),
        new configParam("parallelTaskCount", "parallelTaskCount", "Text", false),
        // new configParam("startTime", "startTime", "Text", false),
        // new configParam("endTime", "endTime", "Text", false),
    ],
    "stretchOption":[
        new optionsconfigParam("stretchType", "stretchType", "Select",
            false, ["NONE", "GAUSSIAN","PERCENTCLIP","MINIMUMMAXIMUM","STANDARDDEVIATION"]),
        new configParam("stdevCoefficient", "stdevCoefficient", "Text", false),
        new configParam("gaussianCoefficient", "gaussianCoefficient", "Text", false),
        new configParam("useMedianValue", "useMedianValue", "Checkbox", false),
    ],



    "com.supermap.services.providers.UGCDataProvider": // UGCDataProvider
        [
            new configParam("workspacePath", "Workspace", "Workspace", true,
                true),
            new configParam("datasourceInfos", "datasourceInfo", "datasourceInfo", false, false),
            new configParam("datasourceNames", "Datasource names", "Array", true, false),
            new generalConfigParam({
                "name": "attachmentsEnabled",
                "chName": "Enable attachment service",
                "fileType": "Checkbox",
                "isNecessay": false,
                "isGeneralSetting": false,
                "tooltip": "You can associate attachment for geographic features. The attachement can be files in either picture, word or other formats."
            }),
            new generalConfigParam({
                "name": "featureMetadatasEnabled",
                "chName": "Whether to record geographic feature meta information.",
                "fileType": "Checkbox",
                "isNecessay": false,
                "isGeneralSetting": false,
                "tooltip": "When enabled, the system will automatically record feature creator, creation time, editor and editing time."
            })
        ],

    "com.supermap.services.providers.UGCAddressMatchProvider": // UGCAddressMatchProvider
        [
            new configParam("workspacePath", "Workspace", "Workspace", true, true)
        ],


    /**
     * "UGC Data Provider" : // UGCDataProvider [ new
     * configParam("workspacePath", "Workspace", "Workspace", true, true), new
     * configParam("datasourceNames", "Datasource names", "Array", true, false) ],
     */

    "com.supermap.services.providers.UGCRealspaceProvider": // UGCRealspaceProvider
        [
            new configParam("workspacePath", "Workspace", "Workspace", true,
                true),

            new defaultconfigParam("output", "Realspace cache directory",
                "Text", true, "./output", true)
            // new configParam("name", "", "Text", false),

        ],

    /**
     * "UGC Realspace Provider" : // UGCRealspaceProvider [ new
     * configParam("workspacePath", "Workspace", "Workspace", true, true),
     * //TODO compare this to resouce_zh_CN.js new defaultconfigParam("output",
     * "Realspace cache directory", "Text", true, "./output",true) // new
     * configParam("name", "配置名称", "Text", false), ],
     */

    "com.supermap.services.providers.UGCPlotProvider": // UGCPlotProvider
        [
            new configParam("symbolLibPaths", "Symbol library paths", "Array", true, true)
        ],

    "com.supermap.services.providers.WMSMapProvider": // WMSMapProvider
        [
            new configParam("serviceRootURL", "WMS service root URL", "Text", true, true),
            new configParam("version", "WMS service version", "Text", false,
                true),
            new configParam("username", "Authorized user name", "Text", false,
                true),
            new configParam("password", "Password", "Password", false, true),
            new configParam("cacheEnabled", "Enable caching", "Checkbox", false, false)
            // new configParam("cacheMode", "缓存策略", "Text", false),
            // new configParam("name", "地图设置名称", "Text", false),
            // new defaultconfigParam("outputPath", "Output path", "Text", false,
            // "output/"),
            // new defaultconfigParam("outputSite", "Output site", "Text", false,
            // "http://{ip}:{port}/iserver/output/"),
        ],

    /**
     * "WMS Map Provider" : // WMSMapProvider [ new configParam("url", "WMS
     * service root URL", "Text", true, true), new configParam("version", "WMS
     * service version", "Text", false, true), new configParam("username",
     * "Authorized user name", "Text", false, true), new configParam("password",
     * "Password", "Password", false, true), new configParam("cacheEnabled",
     * "Enable caching", "Checkbox", false, false), // new
     * configParam("cacheMode", "缓存策略", "Text", false), // new
     * configParam("name", "地图设置名称", "Text", false), // new
     * defaultconfigParam("outputPath", "Output path", "Text", false, //
     * "output/"), // new defaultconfigParam("outputSite", "Output site",
     * "Text", false, // "http://{ip}:{port}/iserver/output/"), new
     * defaultconfigParam("defaultScale", "Default scale", "Text", true,
     * "0.00001",false)],
     */

    "com.supermap.services.providers.SMTilesMapProvider": // SMTilesMapProvider
        [new configParam("filePath", "File path", "SMTiles", true, true),
            new generalConfigParam({
                "fileType": "ImportTilesToProvider"
            })
        ],
    "com.supermap.services.providers.MBTilesMapProvider": // MBTilesMapProvider
        [new configParam("filePath", "File path", "MBTiles", true, true),
            new generalConfigParam({
                "fileType": "ImportTilesToProvider"
            })
        ],
    "com.supermap.services.providers.ZXYTilesMapProvider": // ZXYTilesMapProvider
        [new configParam("filePath", "File path", "ZXYTiles", true, true)

        ],
    "com.supermap.services.providers.GeoPackageDataProvider": // GeoPackageDataProvider
        [new generalConfigParam({
            "name": "filePath",
            "chName": "GeoPackage File",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "gpkg",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The file with gpkg suffix"
        })],
    "com.supermap.services.providers.GeoPackageMapProvider": // GeoPackageMapProvider
        [new generalConfigParam({
            "fileType": "GeoPackageProviderConfig"
        })],
    "com.supermap.services.providers.TPKMapProvider": [new configParam("tilePackagePath", "TPK file path", "TPK", true, true)],
    "com.supermap.services.providers.TPKXMapProvider":
        [new generalConfigParam({
            "name": "tilePackagePath",
            "chName": "TPKX file path",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "tpkx",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The file with tpkx suffix"
        })],
    "com.supermap.services.providers.VTPKMapProvider": [new configParam("vectorTilePackagePath", "VTPK file path", "VTPK", true, true)],
    "com.supermap.services.providers.ArcGISRestMapProvider": // ArcGISRestMapProvider
        [new configParam("restServiceRootURL", "URL of ArcGIS REST Map", "Text", true, true),
            new defaultconfigParam("cacheEnabled", "Enable caching", "Checkbox",
                false, true, false),
            new configParam("userName", "Username", "Text", false, false),
            new configParam("password", "Password", "Password", false, false),
            new generalConfigParam({
                "name": "getTokenUrl",
                "chName": "URL of ArcGIS Token Service",
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "",
                "isGeneralSetting": false,
                "tooltip": "This parameter only valid when the safety certification is in the format of username/password, and it can be null. When the parameter is null, the system will be {rootUrl}/tokens. For example: when the map service URL of REST is http://127.0.0.1:6080/arcgis/rest/services/Sample/MapServer, Token service URL is http://127.0.0.1:6080/arcgis/tokens",
                "placeholder": "http://{myserver}:{port}/arcgis/tokens"
            }),
            new generalConfigParam({
                "name": "token",
                "chName": "Token",
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "",
                "isGeneralSetting": false,
                "tooltip": "Access the Token of ArcGIS REST service."
            }), new generalConfigParam({
            "name": "httpReferer",
            "chName": "HTTP referer",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": false,
            "tooltip": "This value needs to be set when using Token in the format of HTTP Referer."
        })],
    "com.supermap.services.providers.ShapeFileDataProvider": // ShapeFileDataProvider
        [
            new configParam("shpDir", "Shapefile Directory", "Text", true, true),
            new optionsconfigParam("charset", "Shapefile Charset", "Select", false, [
                "GBK", "ASCII", "BIG5", "GB18030", "KOI8-R", "KOI8-U", "Shift_JIS", "UTF-8", "UTF-16", "UTF-32",
                "windows-1252", "x-MacCyrillic", "x-MacGreek", "x-MacHebrew", "x-Johab"], true)
        ],
    "com.supermap.services.providers.ShapeFileMapProvider": // ShapeFileMapProvider
        [
            new configParam("shpDir", "Shapefile Directory", "Text", true, true),
            new optionsconfigParam("charset", "Shapefile Charset", "Select", false, [
                "GBK", "ASCII", "BIG5", "GB18030", "KOI8-R", "KOI8-U", "Shift_JIS", "UTF-8", "UTF-16", "UTF-32",
                "windows-1252", "x-MacCyrillic", "x-MacGreek", "x-MacHebrew", "x-Johab"], true),
            new generalConfigParam({
                "name": "stylePath",
                "chName": "Style File",
                "fileType": "RemoteFile",
                "isNecessay": false,
                "extensions": "json",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .json"
            }),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.DSFMapProvider":
        [
            new configParam("filePath", "Distribute Spatial Format", "Text", true, true),
            new generalConfigParam({
                "name": "stylePath",
                "chName": "Style File",
                "fileType": "RemoteFile",
                "isNecessay": false,
                "extensions": "json",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .json"
            }),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.DSFDataProvider":
        [
            new configParam("filePath", "Distribute Spatial Format", "Text", true, true),
            new generalConfigParam({
                "name": "stylePath",
                "chName": "Style File",
                "fileType": "RemoteFile",
                "isNecessay": false,
                "extensions": "json",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .json"
            }),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.PostgisDataProvider": [
        new configParam("host", "Server Address", "Text", false, true),
        new configParam("port", "Port", "Text", false, true),
        new configParam("database", "Database", "Text", false, true),
        new configParam("user", "Username", "Text", false, true),
        new configParam("passwd", "Password", "Password", false, true),
    ],
    "com.supermap.services.providers.PostgisMapProvider":	// com.supermap.services.providers.PostgisMapProvider
        [new configParam("host", "Server Address", "Text", true, true),
            new configParam("port", "Port", "Text", true, true),
            new configParam("database", "Database", "Text", true, true),
            new configParam("user", "Username", "Text", true, true),
            new configParam("passwd", "Password", "Password", true, true),
            new generalConfigParam({
                "name": "stylePath",
                "chName": "Style File",
                "fileType": "RemoteFile",
                "isNecessay": false,
                "extensions": "json",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .json"
            }),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.BlockchainDataProvider":
        [
            new configParam("alise", "Datasource Alise", "Text", true, true),
            new configParam("blockchainSign", "Blockchain Sign", "Text", true, true),
            new generalConfigParam({
                "name": "networkConfigFile",
                "chName": "Network Config",
                "fileType": "RemoteFile",
                "isNecessay": true,
                "extensions": "yaml",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .yaml"
            }),
            new configParam("modifyUsers", "Modify Users", "Text", false, true),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.BlockchainMapProvider":
        [
            new configParam("alise", "Datasource Alise", "Text", true, true),
            new generalConfigParam({
                "name": "networkConfigFile",
                "chName": "Network Config",
                "fileType": "RemoteFile",
                "isNecessay": true,
                "extensions": "yaml",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .yaml"
            }),
            new generalConfigParam({
                "name": "stylePath",
                "chName": "Style File",
                "fileType": "RemoteFile",
                "isNecessay": false,
                "extensions": "json",
                "browserCaption": "Browser",
                "isGeneralSetting": true,
                "tooltip": "File with the extension of .json"
            }),
            new generalConfigParam({
                "name": "cacheDisabled",
                "chName": "Disable Cache",
                "fileType": "Checkbox",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false
            })
        ],
    "com.supermap.services.providers.HBaseDataProvider":
        [
            new configParam("catalog", "HBase DataCatalog", "Text", true, true),
            new configParam("zookeepers", "Zookeepers Address", "Text", true, true),
            new generalConfigParam({
                "name": "authentication",
                "chName": "HBase cluster has Kerberos authentication turned",
                "fileType": "CheckboxWithObject",
                "isNecessay": false,
                "defaultValue": false,
                "isGeneralSetting": false,
                "object": "hbaseKerberosSetting"
            })
        ],
    "hbaseKerberosSetting": [
        new configParam("coreXml", "Hadoop cluster core-site.xml file path", "Text", false),
        new configParam("hbaseXml", "HBase cluster hbase-site.xml file path", "Text", false),
        new configParam("hdfsXml", "HDFS cluster hdfs-site.xml file path", "Text", false),
        new configParam("krb5ConfPath", "Kerberos client configuration file path", "Text", false)],

    "com.supermap.services.providers.ElasticsearchDataProvider":
        [
            new configParam("connInfo", "Connection Information", "Object", false, true)
        ],
    "com.supermap.services.providers.ArcGISRestDataProvider": [
        new generalConfigParam({
            "name": "restServiceRootURL",
            "chName": "ArcGIS REST Feature Service URL",
            "fileType": "Text",
            "isNecessay": true,
            "defaultValue": "",
            "isGeneralSetting": true,
            "placeholder": "{restroot}/{serviceName}/FeatureServer"
        }), new generalConfigParam({
            "name": "token",
            "chName": "Token",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": false,
            "tooltip": "Access Token of ArcGIS REST service."
        }), new generalConfigParam({
            "name": "httpReferer",
            "chName": "HTTP referer",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": false,
            "tooltip": "When useing the Token in the format of HTTP Referer, this value should be set."
        })],
    "com.supermap.services.providers.ArcGISRestNetworkAnalystProvider": [new generalConfigParam({
        "fileType": "AGSNetworkAnalystProviderConfig"
    })],
    "com.supermap.services.providers.ArcGISCacheMapProvider":
        [new generalConfigParam({
            "name": "configFile",
            "chName": "Cache configuration file",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "xml|cdi",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The suffix is .xml or .cdi"
        })],
    "com.supermap.services.providers.ArcGISCacheV2MapProvider":
        [new generalConfigParam({
            "name": "configFile",
            "chName": "Cache configuration file",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "xml|cdi",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The suffix is .xml or .cdi"
        })],
    "com.supermap.services.providers.ArcGISRestGeocodeProvider": [
        new generalConfigParam({
            "name": "restServiceRootURL",
            "chName": "ArcGIS REST Geocode Service URL",
            "fileType": "Text",
            "isNecessay": true,
            "defaultValue": "",
            "isGeneralSetting": true,
            "placeholder": "{restroot}/{serviceName}/GeocodeServer"
        }), new generalConfigParam({
            "name": "token",
            "chName": "Token",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": false,
            "tooltip": "Access Token of ArcGIS REST service."
        }), new generalConfigParam({
            "name": "httpReferer",
            "chName": "HTTP referer",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": false,
            "tooltip": "When useing the Token in the format of HTTP Referer, this value should be set."
        })],
    "com.supermap.services.providers.LocalRealspaceProvider":
        [new generalConfigParam({
            "name": "configFile",
            "chName": "Cache configuration file",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "scp|sct|sci3d",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The suffix is .scp .sct .sci3d"
        })],
    "com.supermap.services.providers.OssRealspaceProvider":
        [
            new configParam("ossWebsite", "Website", "Text", true, true),
            new configParam("bucketName", "Bucket Name", "Text", true, true),
            new configParam("accessKeyId", "AccessKey Id", "Text", false, true),
            new configParam("accessKeySecret", "AccessKey Secret", "Text", false, true),
            new configParam("configPath", "Config Path", "Text", true, true),
            new configParam("cacheKey", "Cache Key", "Text", false, true),
        ],
    "com.supermap.services.providers.SuperMapTilesRealspaceProvider":
        [
            new configParam("s3ConnectionInfo", "S3 Config", "Object", false, true),
            new configParam("configFile", "Config File Path", "Text", true, true),
            new configParam("cacheKey", "3D Cache Key", "Text", false, true)
        ],
    "com.supermap.services.providers.ThreeDTilesRealspaceProvider":
        [new generalConfigParam({
            "name": "configFile",
            "chName": "Cache configuration file",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "json",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The suffix is .json"
        })],
    "com.supermap.services.providers.WMTSMapProvider": // WMTSMapProvider
        [
            new configParam("serviceRootURL", "WMTS service root URL", "Text",
                true, true),
            new configParam("version", "WMTS service version", "Text", false,
                true),
            new configParam("userName", "Authorized user name", "Text", false,
                true),
            new configParam("password", "Password", "Password", false, true),
            new configParam("dpi", "dpi", "Text", true, true),
            new configParam("token", "token", "Text", false, true),
            new generalConfigParam({
                "name": "resolutions",
                "chName": "Resolution Set",
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "",
                "isGeneralSetting": false,
                "tooltip": "Resolution Set and TileMatrix under the selected scale set should remain the same. The adjacent resolution is separated by , ."
            }),
            new defaultconfigParam("cacheEnabled", "Enable caching", "Checkbox",
                false, true, false)
        ],
    "com.supermap.services.providers.UGCV5TileProvider": [
        new generalConfigParam({
            "name": "configFile",
            "chName": "Tile configuration file",
            "fileType": "RemoteFile",
            "isNecessay": true,
            "extensions": "sci|inf",
            "browserCaption": "Browse",
            "isGeneralSetting": true,
            "tooltip": "The suffix is .sci or .inf"
        }),
        new generalConfigParam({
            "fileType": "ImportTilesToProvider"
        })
    ],
    "com.supermap.services.providers.MongoDBTileProvider": [
        new generalConfigParam({
            "fileType": "MongoDBProviderConfig"
        }),
        new generalConfigParam({
            "fileType": "ImportTilesToProvider"
        })
    ],
    "com.supermap.services.providers.MultiTilesProvider": [
        new generalConfigParam({
            "fileType": "MultiTilesProviderConfig"
        })
    ],
    "com.supermap.services.providers.MongoDBMVTTileProvider": [
        new generalConfigParam({
            "fileType": "MongoDBProviderConfig"
        }),
        new generalConfigParam({
            "fileType": "ImportTilesToProvider"
        })
    ],
    "com.supermap.services.providers.OTSTileProvider": [
        new generalConfigParam({
            "fileType": "OTSProviderConfig"
        }),
        new generalConfigParam({
            "fileType": "ImportTilesToProvider"
        })
    ],
    "com.supermap.services.providers.FastDFSTileProvider": [
        new generalConfigParam({
            "fileType": "FastDFSProviderConfig"
        }),
        new generalConfigParam({
            "fileType": "ImportTilesToProvider"
        })
    ],
    "com.supermap.services.providers.MongoDBRealspaceProvider": [
        new generalConfigParam({
            "fileType": "MongoDBRealspaceProviderConfig"
        })
    ],
    "com.supermap.services.providers.AggregationMapProvider": // AggregationMapProvider
        [
            new configParam("targetName", "Aggregation map name", "Text", true,
                true),
            new configParam("name", "Aggregation", "Text", false, true),
            new configParam("mapNames", "Aggregated maps", "Array", false, true) // ,
        ],

    "com.supermap.services.providers.WFSDataProvider": // WFSDataProvider
        [new configParam("serviceRootURL", "WFS service root URL", "Text", true, true),
            new configParam("userName", "User name", "Text", false, true),
            new configParam("password", "Password", "Password", false, true),
            new configParam("idMappingClassName", "Feature ID converter class", "Text",
                false, false)],


    "com.supermap.services.providers.UGCTransportationAnalystProvider": [
        new configParam("workspaceConnectString", "Workspace path on server", "Workspace", true, true),
        new configParam("datasourceName", "Datasource name", "Text", true, true),
        new configParam("datasetName", "Network dataset name", "Text", true, true),
        new configParam("edgeIDField", "Edge ID field", "Text", true, true),
        new configParam("edgeNameField", "Edge name field", "Text", false, true),
        new configParam("nodeIDField", "Node ID field", "Text", true, true),
        new configParam("nodeNameField", "Node name field", "Text", false, true),
        new configParam("fromNodeIDField", "fromNode field", "Text", true, true),
        new configParam("toNodeIDField", "toNode field", "Text", true, true),
        new configParam("weightFieldInfos", "Weight field collection", "ObjectArray", true, true),
        new configParam("tolerance", "Tolerance", "Text", false, false),
        new configParam("autoCheckNetwork", "Whether to check the network dataset automatically", "Checkbox", true, true),
        new configParam("TARuleConfig", "Traffic rule settings", "GroupedConfigItems", false, false),
        new configParam("turnDatasetInfo", "Turn dataset", "Object", false, false),
        new configParam("TABarrierConfig", "Barrier settings", "GroupedConfigItems", false, false)],
    "TABarrierConfig": [
        new configParam("barrierEdges", "Barrier edge ID array", "Array", false),
        new configParam("barrierNodes", "Barrier node ID array", "Array", false)],
    "TARuleConfig": [
        new configParam("ruleField", "Traffic rule field", "Text", true),
        new configParam("forwardSingleWayRuleValues", "Forward single way", "Array", false),
        new configParam("backwardSingleWayRuleValues", "Backward single way", "Array", false),
        new configParam("twoWayRuleValues", "Two way", "Array", false),
        new configParam("prohibitedWayRuleValues", "Prohibited way", "Array", false)],

    "connInfo": [
        new configParam("serverAdresses", "Service Address", "Array", true),
        new configParam("clusterName", "Cluster Name", "Text", false),
        new configParam("indexName", "index", "Text", false),
        new configParam("username", "Username", "Text", false),
        new configParam("password", "Password", "Password", false)
    ],
    "s3ConnectionInfo": [
        new configParam("accessKey", "Access Key ID", "Text", true),
        new configParam("secretKey", "Secret Access Key", "Text", true),
        new configParam("region", "Region", "Text", false),
        new configParam("endpoint", "Endpoint", "Text", true)],

    "turnDatasetInfo": [
        new configParam("datasourceName", "Datasource name", "Text", true),
        new configParam("datasetName", "Dataset name", "Text", true),
        new configParam("fromEdgeIDField", "TurnFromEdgeID field", "Text", true),
        new configParam("nodeIDField", "TurnNodeID field", "Text", true),
        new configParam("toEdgeIDField", "TurnToEdgeID field", "Text", true),
        new configParam("weightFields", "TurnCost field array", "Array", true)],

    "weightFieldInfos": [new configParam("WeightFieldInfo", "WeightFieldInfo", "Object", true)],
    "WeightFieldInfo": [new configParam("backWeightField", "Backward weight field", "Text", true),
        new configParam("forwardWeightField", "Forward weight field", "Text", true),
        new configParam("name", "Weight info name", "Text", true)],
    "weightFieldInfo3Ds": [new configParam("WeightFieldInfo3D", "Weight field info",
        "Object", true)],
    "WeightFieldInfo3D": [
        new configParam("ftWeightField", "Forward weight field", "Text", true),
        new configParam("tfWeightField", " Backward weight field", "Text", true),
        new configParam("name", "Weight info name", "Text", true)],
    "com.supermap.services.providers.UGCNetworkAnalyst3DProvider": [
        new configParam("workspaceConnectString", "Workspace path on server",
            "Workspace", true, true),
        new configParam("datasourceName", "Datasource names", "Text", true, true),
        new configParam("datasetName", "Network dataset name", "Text", true, true),
        new configParam("edgeIDField", "Edge ID field", "Text", true, true),
        new configParam("nodeIDField", "Node ID field", "Text", true, true),
        new configParam("fNodeIDfield", "from Node field", "Text",
            true, true),
        new configParam("tNodeIDField", "to Node field", "Text", true,
            true),
        new configParam("weightFieldInfo3Ds", "Weight field collection", "ObjectArray",
            true, true),
        new configParam("tolerance", "Tolerance", "Text", false, false),
        new configParam("TABarrierConfig", "Barrier settings", "GroupedConfigItems",
            false, false)],

    "com.supermap.services.providers.UGCTrafficTransferAnalystProvider": [
        new configParam("workspaceConnectString", "Workspace path on server", "Workspace", true, true),
        new configParam("loadWorkspace", "Load workspace information", "LoadWorkspace", false, true, ""),
        new defaultconfigParam("name", "Transfer network name", "Text", true, "transferNetwork-", true),
        new configParam("transferLineSetting", "Line environment settings", "Object", true, true, "loadWorkspaceType='transferLineSetting'"),
        new configParam("transferStopSetting", "Stop environment settings", "Object", true, true, "loadWorkspaceType='transferStopSetting'"),
        new configParam("transferRelationSetting", "Relationship settings", "Object", true, true, "loadWorkspaceType='transferRelationSetting'"),
        new defaultconfigParam("mergeTolerance", "Tolerance of stop merging", "Text", false, "100", false),
        new defaultconfigParam("snapTolerance", "Tolaerance of stop catching", "Text", false, "50", false),
        new defaultconfigParam("walkingTolerance", "Walk threshold", "Text", false, "1000", false),
        new optionsconfigParam("unit", "Unit", "Select", false, ["METER", "KILOMETER", "MILE", "YARD", "DEGREE", "MILIMETER", "CENTIMETER", "INCH", "DECIMETER", "FOOT", "SECOND", "MINUTE", "RADIAN"], false)],
    "transferLineSetting": [new configParam("datasourceName", "Datasource alias", "Text", true),
        new configParam("datasetName", "Dataset name", "Text", true),
        new configParam("lineIDField", "ID field of line", "Text", true),
        new configParam("nameField", "Line name field", "Text", true),
        new configParam("aliasField", "Line alias field", "Text", false),
        new configParam("lineTypeField", "Line type field", "Text", false),
        // new configParam("speedField", "标识线路行车速度的字段名", "Text", false),
        new configParam("firstTimeField", "Departure time field of first bus", "Text", false),
        new configParam("lastTimeField", "Departure time field of last bus", "Text", false),
        new configParam("intervalField", "Departure interval field", "Text", false)],
    "transferStopSetting": [new configParam("datasourceName", "Datasource alias", "Text", true),
        new configParam("datasetName", "Dataset name", "Text", true),
        new configParam("stopIDField", "ID field of stop", "Text", true),
        new configParam("nameField", "Stop name field", "Text", true),
        new configParam("aliasField", "Stop alias field", "Text", false)],
    "transferRelationSetting": [new configParam("datasourceName", "Datasource alias", "Text", true),
        new configParam("datasetName", "Dataset name", "Text", true),
        new configParam("lineIDField", "ID field of line", "Text", true),
        new configParam("stopIDField", "ID field of stop", "Text", true),
        new configParam("serialNumField", "Stop sequence number field", "Text", false),
        new configParam("datasetNetworkName", "Name of road network dataset", "Text", false),
        new configParam("edgeIDField", "Edge ID field", "Text", false),
        new configParam("nodeIDField", "Node ID field", "Text", false),
        new configParam("fNodeIDField", "ID field of edge start node", "Text", false),
        new configParam("tNodeIDField", "ID field of edge end node", "Text", false),
        new configParam("datasetPathName", "Stop and entrance dataset name", "Text", false),
        new configParam("exitIDField", "Entrance ID field ", "Text", false),
        new configParam("exitNameCField", " Entrance Chinese Name", "Text", false),
        new configParam("exitNamePYField", "Entrance pinyin", "Text", false),
        new configParam("stationIDField", "Stop ID field", "Text", false)],
    "com.supermap.services.providers.RestDataProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestPlotProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestMapProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],

    "com.supermap.services.providers.RestRealspaceProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestSpatialAnalystProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestTrafficTransferAnalystProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestTransportationAnalystProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "com.supermap.services.providers.RestAddressMatchProvider": [
        restProviderConfigCommon.restServiceRootURL,
        restProviderConfigCommon.token, restProviderConfigCommon.httpReferer, restProviderConfigCommon.userName,
        restProviderConfigCommon.password,
        restProviderConfigCommon.useCache],
    "restProviderCacheConfig": [
        new generalConfigParam(
            {
                "name": "maxSizeOnDisk",
                "chName": "maxSizeOnDisk",//
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "2048",
                "tooltip": "The maximum size of the disk.The unit is MB.0 means unlimited."
            }),
        new generalConfigParam(
            {
                "name": "timeToLiveSeconds",
                "chName": "timeToLiveSeconds",
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "0",
                "tooltip": "The default amount of time to live for an element from its creation date.The unit of time is seconds.0 means the element will be permanently alive."
            }),
        new generalConfigParam(
            {
                "name": "timeToIdleSeconds",
                "chName": "timeToIdleSeconds",
                "fileType": "Text",
                "isNecessay": false,
                "defaultValue": "0",
                "tooltip": "The default amount of time to live for an element from its last accessed or modifaied date.The unit of time is seconds.0 means the element will be permanently alive."
            })],
    "com.supermap.services.providers.BingMapsMapProvider": [
        new optionsconfigParam("imagerySet", "Map set", "Select", true, [
            "Aerial", "AerialWithLabels", "Road"]),
        new defaultconfigParam("mapVersion", "Map version", "Text", false,
            "v1", true),
        new configParam("apiKey", "BingMaps key", "Text", true, true),
        new defaultconfigParam("cacheEnabled", "Enable caching", "Checkbox", false,
            true, false)],

    "com.supermap.services.providers.GoogleMapsMapProvider": [
        new configParam("googleMapClientID", "Google Maps ClientID", "Text", true, true),
        new configParam("googleMapCryptoKey", "Google Maps CryptoKey", "Text", true, true),
        new optionsconfigParam("googleMapLanguage", "Language", "Select", true, ["zh-cn", "en-us"], true),
        new configParam("googleMapWidth", "Google Maps Width", "Text", false, true),
        new configParam("googleMapHeight", "Google Maps Height", "Text", false, true),
        new defaultconfigParam("cacheEnabled", "Enable caching", "Checkbox", false, false, false)
    ],

    "com.supermap.services.providers.TiandituMapProvider": [
        new generalConfigParam({
            "name": "servicesUrl",
            "chName": "Map service URL",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": true,
            "tooltip": "default\"http://t{0-7}.tianditu.gov.cn\"",
            "placeholder": "http://t{0-7}.tianditu.gov.cn"
        }),
        new generalConfigParam({
            "name": "key",
            "chName": "Key",
            "fileType": "Text",
            "isNecessay": true,
            "defaultValue": "",
            "isGeneralSetting": true
        }),
        new generalConfigParam({
            "name": "cacheEnabled",
            "chName": "Enable caching",
            "fileType": "Checkbox",
            "isNecessay": false,
            "defaultValue": true,
            "isGeneralSetting": false,
            "tooltip": ""
        })],

    "com.supermap.services.providers.CloudMapProvider": [
        new defaultconfigParam("servicesUrl", "Map service URL", "Text",
            false, "", true,
            "default\"http://t0.supermapcloud.com/FileService/image?\""),
        new defaultconfigParam("cacheEnabled", "Enable caching", "Checkbox", false,
            true, false)],
    "com.supermap.services.providers.BaiduMapProvider": [
        new generalConfigParam({
            "name": "mapUrl",
            "chName": "Map service URL",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": true,
            "tooltip": "Optional parameter. Default is\"http://online{0-9}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl\". It is should be a address template that can get the map tiles when customizing, where {x},{y} and {z} represent the column, row and level separately"
        }),
        new generalConfigParam({
            "name": "mapName",
            "chName": "Map name",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": true,
            "tooltip": "Optional parameter. Set the custom map name. When this parameter was not configured, the default is \"baidu\"."
        }),
        new generalConfigParam({
            "name": "cacheEnabled",
            "chName": "Enable caching",
            "fileType": "Checkbox",
            "isNecessay": false,
            "defaultValue": false,
            "isGeneralSetting": false
        }),
        new generalConfigParam({
            "name": "querySetting",
            "chName": "Query parameter",
            "fileType": "Object",
            "isGeneralSetting": false,
            "refer": "baiduQuerySetting"
        })
    ],
    "baiduQuerySetting": [
        new generalConfigParam({
            "name": "ak",
            "chName": "ak",
            "fileType": "Text",
            "isNecessay": false,
            "tooltip": "Baidu Web Service API Key. It is used in map query."
        }),
        new generalConfigParam({
            "name": "sn",
            "chName": "sn",
            "fileType": "Text",
            "isNecessay": false,
            "tooltip": "sn used in safety verification. If the verification mode of ak is sn, this parameter is required."
        })
    ],
    "com.supermap.services.providers.OpenStreetMapProvider": [
        new generalConfigParam({
            "name": "mapUrl",
            "chName": "Map service URL",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": true,
            "tooltip": "Optional parameter. Default is \"http://{random}.tile.openstreetmap.org/{z}/{x}/{y}.png\". It is should be a address template that can get the map tiles when customizing, where {x},{y} and {z} represent the column, row and level separately"
        }),
        new generalConfigParam({
            "name": "mapName",
            "chName": "Map name",
            "fileType": "Text",
            "isNecessay": false,
            "defaultValue": "",
            "isGeneralSetting": true,
            "tooltip": "Optional parameter. Set the custom map name. When this parameter was not configured, the default is \"OSM\"."
        }),
        new generalConfigParam({
            "name": "cacheEnabled",
            "chName": "cacheEnabled",
            "fileType": "Checkbox",
            "isNecessay": false,
            "defaultValue": false,
            "isGeneralSetting": false
        })
    ],


    "com.supermap.services.providers.UGCSpatialAnalystProvider": [new configParam("workspacePath", "Workspace path on server", "Workspace", true, true),
        new configParam("workspacePath", "Workspace path on server", "Workspace", true,
            true),
        new configParam("datasourceNames", "Datasources involved", "Array", false, false),
        new configParam("tmpDatasourceName", "Temporary datasource", "Text", false, false)],

    "com.supermap.services.providers.AggregationDataProvider": // AggregationDataProvider
        [new configParam("name", "Datasource after aggregation", "Text", true, true),
            new configParam("description", "Datasource description after aggregation", "Text", false,
                true)],
    "com.supermap.services.providers.GDPMapProvider": [new generalConfigParam({
        "name": "filesPath",
        "chName": "GDP file catalog",//
        "fileType": "Text",
        "isNecessay": true,
        "defaultValue": ""
    }),

        new generalConfigParam({
            "name": "dpi",
            "chName": "dpi",//
            "fileType": "Text",
            "isNecessay": true,
            "defaultValue": "96"
        }),
        new generalConfigParam({
            "name": "cacheVersion",
            "chName": "Cache version",//
            "fileType": "Select",
            "isNecessay": true,
            "options": ["5.0", "3.1"]
        }),
        new generalConfigParam({
            "name": "zoom0ScaleDenator",
            "chName": "Scale denominator of generation 0",//
            "fileType": "Text",
            "isNecessay": true,
            "defaultValue": "5.916587109091312E8"
        })
    ],
    "com.supermap.services.providers.SVTilesMapProvider": [
        new generalConfigParam({
            "name": "filePath",
            "chName": "SVTiles file path",
            "fileType": "RemoteFile",
            "extensions": "svtiles",
            "browserCaption": "Browse",
            "isNecessay": true
        })
    ],
    "com.supermap.services.providers.MVTTileProvider": // MVTTileProvider
        [new generalConfigParam({
            "name": "configFilePath",
            "chName": "Tile configuration file path",
            "fileType": "RemoteFile",
            "extensions": "sci",
            "browserCaption": "Browse",
            "isNecessay": true
        })
        ]

};

// 来自config.js
var enToZhMapping = {
    "com.supermap.services.providers.UGCDataProvider": "UGC Data Provider",
    "com.supermap.services.providers.UGCMapProvider": "UGC Map Provider",
    "com.supermap.services.providers.UGCImageServiceProvider":"Image service provider",
    "com.supermap.services.providers.UGCRealspaceProvider": "UGC 3D Provider",
    "com.supermap.services.providers.WMSMapProvider": "WMS Map Provider",
    "com.supermap.services.providers.WMTSMapProvider": "WMTS Map Provider",
    "com.supermap.services.providers.SMTilesMapProvider": "SMTiles Map Provider",
    "com.supermap.services.providers.MBTilesMapProvider": "MBTiles Map Provider",
    "com.supermap.services.providers.ZXYTilesMapProvider": "ZXYTiles Map Provider",
    "com.supermap.services.providers.TPKMapProvider": "TPK Map Provider",
    "com.supermap.services.providers.TPKXMapProvider": "TPKX Map Provider",
    "com.supermap.services.providers.VTPKMapProvider": "VTPK Map Provider",
    "com.supermap.services.providers.ArcGISRestMapProvider": "ArcGIS REST Map Provider",
    "com.supermap.services.providers.ArcGISRestDataProvider": "ArcGIS REST Data Provider",
    "com.supermap.services.providers.ArcGISRestNetworkAnalystProvider": "ArcGIS REST Network Analysis Provider",
    "com.supermap.services.providers.GeoToolsGeometryProvider": "ArcGIS REST Geometry Provider",
    "com.supermap.services.providers.ArcGISCacheMapProvider": "ArcGIS Cache Map Provider",
    "com.supermap.services.providers.ArcGISCacheV2MapProvider": "ArcGIS CacheV2 Map Provider",
    "com.supermap.services.providers.ArcGISRestGeocodeProvider": "ArcGIS REST Geocode Provider",
    "com.supermap.services.providers.LocalRealspaceProvider": "Local 3D Realspace Provider",
    "com.supermap.services.providers.OssRealspaceProvider": "OSS Realspace Provider",
    "com.supermap.services.providers.SuperMapTilesRealspaceProvider": "S3 3D Realspace Provider",
    "com.supermap.services.providers.ThreeDTilesRealspaceProvider": "3DTiles Realspace Provider",
    "com.supermap.services.providers.AggregationMapProvider": "Aggregation Map Provider",
    "com.supermap.services.providers.BingMapsMapProvider": "Bing Maps Provider",
    "com.supermap.services.providers.GoogleMapsMapProvider": "Google Maps Map Provider",
    "com.supermap.services.providers.TiandituMapProvider": "TianDiTu Map Provider",
    "com.supermap.services.providers.CloudMapProvider": "SuperMap Cloud Map Provider",
    "com.supermap.services.providers.BaiduMapProvider": "Baidu Map Provider",
    "com.supermap.services.providers.OpenStreetMapProvider": "OpenStreetMap Map Provider",
    "com.supermap.services.providers.WFSDataProvider": "WFS Data Provider",
    "com.supermap.services.providers.UGCTransportationAnalystProvider": "Transportation Analysis Provider",
    "com.supermap.services.providers.UGCTrafficTransferAnalystProvider": "Traffic Transfer Analysis Provider",
    "com.supermap.services.providers.AggregationDataProvider": "Aggregation Data Provider",
    "com.supermap.services.providers.UGCSpatialAnalystProvider": "Spatial Analysis Provider",
    "com.supermap.services.providers.UGCAddressMatchProvider": "Address Matching Provider",
    "com.supermap.services.providers.GeoToolsGeometryProvider": "Geometry Service Provider",
    "com.supermap.services.providers.RestDataProvider": "REST Data Provider",
    "com.supermap.services.providers.RestPlotProvider": 'REST Plotting Provider',
    "com.supermap.services.providers.RestMapProvider": "REST Map Provider",
    "com.supermap.services.providers.RestRealspaceProvider": "REST 3D Provider",
    "com.supermap.services.providers.RestSpatialAnalystProvider": "REST SpatialAnalysis Provider",
    "com.supermap.services.providers.RestTrafficTransferAnalystProvider": "REST TrafficTransfer Analysis Provider",
    "com.supermap.services.providers.RestTransportationAnalystProvider": "REST Transportation Analysis Provider",
    "com.supermap.services.providers.RestAddressMatchProvider": "REST Address Matching Provider",
    "com.supermap.geoprocessor.services.providers.GeoprocessorProvider": "Geoprocessor Provider",
    "com.supermap.services.providers.GDPMapProvider": "GDP Map Provider",
    "com.supermap.services.providers.SVTilesMapProvider": "SVTiles Map Provider",
    "com.supermap.services.providers.MultiTilesProvider": "Multi Tiles Map Provider",
    "com.supermap.services.providers.MongoDBRealspaceProvider": "MongoDB 3D Service Provider",
    "com.supermap.services.providers.MongoDBTileProvider": "MongoDB Map Provider",
    "com.supermap.services.providers.MongoDBMVTTileProvider": "MongoDB MVT Map Provider",
    "com.supermap.services.providers.OTSTileProvider": "OTS Map Provider",
    "com.supermap.services.providers.GeoPackageMapProvider": "GeoPackage Map Provider",
    "com.supermap.services.providers.UGCV5TileProvider": "UGCV5 Map Provider",
    "com.supermap.services.providers.UGCPlotProvider": "Plotting Provider",
    "com.supermap.services.providers.ElasticsearchDataProvider": "Elasticsearch Provider",
    "com.supermap.services.providers.PostgisDataProvider": "PostGIS Data Provider",
    "com.supermap.services.providers.PostgisMapProvider": "PostGIS Map Provider",
    "com.supermap.services.providers.BlockchainMapProvider": "Blockchain Map Provider",
    "com.supermap.services.providers.BlockchainDataProvider": "Blockchain Data Provider",
    "com.supermap.services.providers.ShapeFileDataProvider": "Shapefile Data Provider",
    "com.supermap.services.providers.ShapeFileMapProvider": "Shapefile Map Provider",
    "com.supermap.services.providers.DSFMapProvider": "Distribute Spatial Format Map Provider",
    "com.supermap.services.providers.FastDFSMapProvider": "FastDFS Map Provider",
    "com.supermap.services.providers.GeoPackageDataProvider": "GeoPackage Data Provider",
    "com.supermap.services.providers.UGCNetworkAnalyst3DProvider": "3D Network Analysis Provider",
    "com.supermap.services.providers.MVTTileProvider": "UGCV5(MVT) Map Provider",
    "com.supermap.services.providers.MVTTileRealspaceProvider": "UGCV5(MVT) 3D Provider",
    "com.supermap.services.providers.DSFDataProvider": "Distribute Spatial Format Data Provider",
    "com.supermap.services.providers.GeoTrellisMapProvider": "GeoTrellis Map Provider",
    "com.supermap.services.providers.GeotrellisDataProvider": "GeoTrellis Data Provider",
    // 服务接口的类�?
    "com.supermap.services.wms.WMSServlet": "WMS Interface",
    "com.supermap.services.wfs.WFSServlet": "WFS Interface",
    "com.supermap.services.wcs.WCSServlet": "WCS Interface",

    "com.supermap.services.wps.WPSServlet": "WPS Interface",
    "com.supermap.services.rest.RestServlet": "REST Service Interface",
    "com.supermap.services.rest.JaxrsServletForJersey": "REST/JSR Service Interface",
    "com.supermap.services.wmts.WMTSServlet": "WMTS Interface",
    "com.supermap.services.handler.HandlerServlet": "Handler Service Interface",
    "com.supermap.geoprocessor.services.GeoprocessorServlet": "Geoprocessor Service Interface",
    "com.supermap.services.rest.AGSRestServlet": "ArcGIS REST Service Interface",
    "com.supermap.services.rest.BaiduRestServlet": "Baidu REST Service Interface",
    "com.supermap.services.rest.GoogleRestServlet": "Google REST Service Interface",
    "com.supermap.services.rest.TMSRestServlet": "TMS REST Service Interface",
    "com.supermap.services.rest.OSMRestServlet": "OSM REST Service Interface",

    // 服务组件类型
    "com.supermap.services.components.impl.MapImpl": "Map Component",
    "com.supermap.services.components.impl.ImageImpl": "Image Component",
    "com.supermap.services.components.impl.DataImpl": "Data Component",
    "com.supermap.services.components.impl.PlotImpl": "Plotting Component",
    "com.supermap.processing.jobserver.ProcessingServer": "Processing Component",
    "com.supermap.services.components.impl.DataCatalogImpl": "DataCatalog Component",
    "com.supermap.services.components.impl.WebPrintingImpl": "WebPrinting Component",
    "com.supermap.services.components.impl.RealspaceImpl": "3D Component",
    "com.supermap.services.components.impl.TransportationAnalystImpl": "Transportation Analysis Component",
    "com.supermap.services.components.impl.TrafficTransferAnalystImpl": "Traffic Transfer Analysis Component",
    "com.supermap.services.components.impl.SpatialAnalystImpl": "Spatial Analysis Component",
    "com.supermap.services.components.impl.AddressMatchImpl": "Address Matching Component",
    "com.supermap.services.components.impl.GeometryComponentImpl": "Geometry Service Component",
    "com.supermap.server.host.webapp.handlers.geoprocessing.GeoprocessingServer": "Geoprocessing Component",
    "com.supermap.machinelearning.handler.MachineLearningServer": "MachineLearning Component",
    "com.supermap.services.components.impl.NetworkAnalyst3DImpl": "3D Network Analysis Component",

    // 负载均衡
    "com.supermap.services.cluster.WeightedRoundBalancer": "Weighted Round Balancer",
    "com.supermap.services.cluster.RoundRobinBalancer": "Round Robin Balancer",

    //影像服务
    "SIZE256": "256*256 pixel",
    "SIZE512": "512*512 pixel",
    "SIZE1024": "1024*1024 pixel",
    "SIZE2048": "2048*2048 pixel",
    "STRETCHED": "Single band stretch display",
    "COMPOSITE": "Band combinationdisplay",
    "DEFAULT": "Default interpolation",
    "HIGH": "High-quality interpolation",
    "LOW": "Low-quality interpolation",
    "NEARESTNEIGHBOR": "Nearest interpolation",
    "GAUSSIAN": "Gaussian stretch",
    "STANDARDDEVIATION": "Standard deviation stretch",
    "MINIMUMMAXIMUM": "Maximum stretch",
    "PERCENTCLIP": "Percent truncated stretch",
    "serviceManagement": "Service Management",
    "NEAREST": "Nearest neighbor method",
    "GAUSS": "Gaussian kernel calculation method",
    "CONJOINT": "Average joint data method",
    "AVERAGE": "Average method",
};

// 来自config.js

/**
 * 重新命名 将服务提供者类型映射到本地化的信息
 */
var typeToDisplayMapping = {
    "com.supermap.services.providers.UGCDataProvider": "UGC Data Provider",
    "com.supermap.services.providers.UGCMapProvider": "UGC Map Provider",
    "com.supermap.services.providers.UGCImageServiceProvider":"Image service provider",
    "com.supermap.services.providers.UGCRealspaceProvider": "UGC 3D Provider",
    "com.supermap.services.providers.WMSMapProvider": "WMS Map Provider",
    "com.supermap.services.providers.WMTSMapProvider": "WMTS Map Provider",
    "com.supermap.services.providers.SMTilesMapProvider": "SMTiles Map Provider",
    "com.supermap.services.providers.MBTilesMapProvider": "MBTiles Map Provider",
    "com.supermap.services.providers.ZXYTilesMapProvider": "ZXYTiles Map Provider",
    "com.supermap.services.providers.TPKMapProvider": "TPK Map Provider",
    "com.supermap.services.providers.TPKXMapProvider": "TPKX Map Provider",
    "com.supermap.services.providers.VTPKMapProvider": "VTPK Map Provider",
    "com.supermap.services.providers.ArcGISRestMapProvider": "ArcGIS REST Map Provider",
    "com.supermap.services.providers.ArcGISRestDataProvider": "ArcGIS REST Data Provider",
    "com.supermap.services.providers.ArcGISRestNetworkAnalystProvider": "ArcGIS REST Network Analysis Provider",
    "com.supermap.services.providers.ArcGISCacheMapProvider": "ArcGIS Cache Map Provider",
    "com.supermap.services.providers.ArcGISCacheV2MapProvider": "ArcGIS CacheV2 Map Provider",
    "com.supermap.services.providers.ArcGISRestGeocodeProvider": "ArcGIS REST Geocode Provider",
    "com.supermap.services.providers.LocalRealspaceProvider": "Local 3D Realspace Provider",
    "com.supermap.services.providers.OssRealspaceProvider": "OSS Realspace Provider",
    "com.supermap.services.providers.SuperMapTilesRealspaceProvider": "S3 3D Realspace Provider",
    "com.supermap.services.providers.ThreeDTilesRealspaceProvider": "3DTiles Realspace Provider",
    "com.supermap.services.providers.AggregationMapProvider": "Aggregation Map Provider",
    "com.supermap.services.providers.RestRealspaceProvider": "REST 3D Provider",
    "com.supermap.services.providers.RestSpatialAnalystProvider": "REST Spatial Analysis Provider",
    "com.supermap.services.providers.RestTrafficTransferAnalystProvider": "REST Traffic Transfer Analysis Provider",
    "com.supermap.services.providers.RestTransportationAnalystProvider": "REST Transportation Analysis Provider",
    "com.supermap.services.providers.RestAddressMatchProvider": "REST Address Matching Provider",
    "com.supermap.services.providers.BingMapsMapProvider": "Bing Maps Provider",
    "com.supermap.services.providers.GoogleMapsMapProvider": "Google Maps Map Provider",
    "com.supermap.services.providers.TiandituMapProvider": "TianDiTu Map Provider",
    "com.supermap.services.providers.CloudMapProvider": "SuperMap Cloud Map Provider",
    "com.supermap.services.providers.BaiduMapProvider": "Baidu Map Provider",
    "com.supermap.services.providers.OpenStreetMapProvider": "OpenStreetMap Map Provider",
    "com.supermap.services.providers.WFSDataProvider": "WFS Data Provider",
    "com.supermap.services.providers.GDPMapProvider": "GDP Map Provider",
    "com.supermap.services.providers.SVTilesMapProvider": "SVTiles Map Provider",
    "com.supermap.services.providers.MultiTilesProvider": "Multi Tiles Map Provider",
    "com.supermap.services.providers.UGCV5TileProvider": "UGCV5 Map Provider",
    "com.supermap.services.providers.FastDFSTileProvider": "FastDFS Map Provider",
    "com.supermap.services.providers.UGCPlotProvider": "Plotting Provider",
    "com.supermap.services.providers.ElasticsearchDataProvider": "Elasticsearch Provider",
    "com.supermap.services.providers.PostgisDataProvider": "PostGIS Data Provider",
    "com.supermap.services.providers.PostgisMapProvider": "PostGIS Map Provider",
    "com.supermap.services.providers.BlockchainMapProvider": "Blockchain Map Provider",
    "com.supermap.services.providers.BlockchainDataProvider": "Blockchain Data Provider",
    "com.supermap.services.providers.MongoDBTileProvider": "MongoDB Map Provider",
    "com.supermap.services.providers.MongoDBMVTTileProvider": "MongoDB MVT Map Provider",
    "com.supermap.services.providers.OTSTileProvider": "OTS Map Provider",
    "com.supermap.services.providers.MongoDBRealspaceProvider": "MongoDB 3D Service Provider",
    "com.supermap.services.providers.GeoPackageDataProvider": "GeoPackage Data Provider",
    "com.supermap.services.providers.GeoPackageMapProvider": "GeoPackage Map Provider",
    "com.supermap.services.providers.ShapeFileDataProvider": "Shapefile Data Provider",
    "com.supermap.services.providers.ShapeFileMapProvider": "Shapefile Map Provider",
    "com.supermap.services.providers.DSFMapProvider": "Distribute Spatial Format Map Provider",
    "com.supermap.services.providers.UGCNetworkAnalyst3DProvider": "3D Network Analysis Provider",
    "com.supermap.services.providers.UGCTransportationAnalystProvider": "Transportation Analysis Provider",
    "com.supermap.services.providers.UGCTrafficTransferAnalystProvider": "Traffic Transfer Analysis Provider",
    "com.supermap.services.providers.AggregationDataProvider": "Aggregation Data Provider",
    "com.supermap.services.providers.UGCSpatialAnalystProvider": "Spatial Analysis Provider",
    "com.supermap.services.providers.UGCAddressMatchProvider": "Address Matching Provider",
    "com.supermap.services.providers.GeoToolsGeometryProvider": "Geometry Service Provider",
    "com.supermap.services.providers.RestDataProvider": "REST Data Provider",
    "com.supermap.services.providers.RestPlotProvider": 'REST Plotting Provider',
    "com.supermap.services.providers.RestMapProvider": "REST Map Provider",
    "com.supermap.geoprocessor.services.providers.GeoprocessorProvider": "Geoprocessor Provider",
    "com.supermap.services.providers.MVTTileProvider": "UGCV5(MVT) Map Provider",
    "com.supermap.services.providers.MVTTileRealspaceProvider": "UGCV5(MVT) 3D Provider",
    "com.supermap.services.providers.DSFDataProvider": "Distribute Spatial Format Data Provider",
    "com.supermap.services.providers.GeoTrellisMapProvider": "GeoTrellis Map Provider",
    "com.supermap.services.providers.GeotrellisDataProvider": "GeoTrellis Data Provider",
    // 服务接口的类�?
    "com.supermap.services.wms.WMSServlet": "WMS Interface",
    "com.supermap.services.wfs.WFSServlet": "WFS Interface",
    "com.supermap.services.wcs.WCSServlet": "WCS Interface",
    "com.supermap.services.wps.WPSServlet": "WPS Interface",
    "com.supermap.services.rest.RestServlet": "REST Service Interface",
    "com.supermap.services.rest.JaxrsServletForJersey": "REST/JSR Service Interface",
    "com.supermap.services.wmts.WMTSServlet": "WMTS Interface",
    "com.supermap.services.handler.HandlerServlet": "Handler Service Interface",
    "com.supermap.geoprocessor.services.GeoprocessorServlet": "Geoprocessor Service Interface",
    "com.supermap.services.rest.AGSRestServlet": "ArcGIS REST Service Interface",
    "com.supermap.services.rest.BaiduRestServlet": "Baidu REST Service Interface",
    "com.supermap.services.rest.GoogleRestServlet": "Google REST Service Interface",
    "com.supermap.services.rest.TMSRestServlet": "TMS REST Service Interface",
    "com.supermap.services.rest.OSMRestServlet": "OSM REST Service Interface",
    // 服务组件类型
    "com.supermap.services.components.impl.MapImpl": "Map Component",
    "com.supermap.services.components.impl.ImageImpl": "Image Component",
    "com.supermap.services.components.impl.DataImpl": "Data Component",
    "com.supermap.services.components.impl.PlotImpl": "Plotting Component",
    "com.supermap.processing.jobserver.ProcessingServer": "Processing Component",
    "com.supermap.services.components.impl.DataCatalogImpl": "Data Catalog Component",
    "com.supermap.services.components.impl.RealspaceImpl": "3D Component",
    "com.supermap.services.components.impl.TransportationAnalystImpl": "Transportation Analysis Component",
    "com.supermap.services.components.impl.TrafficTransferAnalystImpl": "Traffic Transfer Analysis Component",
    "com.supermap.services.components.impl.SpatialAnalystImpl": "Spatial Analysis Component",
    "com.supermap.server.host.webapp.handlers.geoprocessing.GeoprocessingServer": "Geoprocessing Component",
    "com.supermap.machinelearning.handler.MachineLearningServer": "MachineLearning Component",
    "com.supermap.services.components.impl.NetworkAnalyst3DImpl": "3D Network Analysis Component",

    // 负载均衡
    "com.supermap.services.cluster.WeightedRoundBalancer": "Weighted Round Balancer",
    "com.supermap.services.cluster.RoundRobinBalancer": "Round Robin Balancer"
};

var zhToEnMapping = {
    "UGC Data Provider": "com.supermap.services.providers.UGCDataProvider",
    "UGC Map Provider": "com.supermap.services.providers.UGCMapProvider",
    "Image service provider":"com.supermap.services.providers.UGCImageServiceProvider",
    "UGC 3D Provider": "com.supermap.services.providers.UGCRealspaceProvider",
    "WMS Map Provider": "com.supermap.services.providers.WMSMapProvider",
    "WMTS Map Provider": "com.supermap.services.providers.WMTSMapProvider",
    "ArcGIS REST Map Provider": "com.supermap.services.providers.ArcGISRestMapProvider",
    "ArcGIS REST Data Provider": "com.supermap.services.providers.ArcGISRestDataProvider",
    "ArcGIS REST Network Analysis Provider": "com.supermap.services.providers.ArcGISRestNetworkAnalystProvider",
    "ArcGIS Cache Map Provider": "com.supermap.services.providers.ArcGISCacheMapProvider",
    "ArcGIS CacheV2 Map Provider": "com.supermap.services.providers.ArcGISCacheV2MapProvider",
    "ArcGIS REST Geocode Provider": "com.supermap.services.providers.ArcGISRestGeocodeProvider",
    "Local 3D Realspace Provider": "com.supermap.services.providers.LocalRealspaceProvider",
    "OSS Realspace Provider": "com.supermap.services.providers.OssRealspaceProvider",
    "S3 3D Realspace Provider": "com.supermap.services.providers.SuperMapTilesRealspaceProvider",
    "3DTiles Realspace Provider": "com.supermap.services.providers.ThreeDTilesRealspaceProvider",
    "SMTiles Map Provider": "com.supermap.services.providers.SMTilesMapProvider",
    "MBTiles Map Provider": "com.supermap.services.providers.MBTilesMapProvider",
    "ZXYTiles Map Provider": "com.supermap.services.providers.ZXYTilesMapProvider",
    "TPK Map Provider": "com.supermap.services.providers.TPKMapProvider",
    "TPKX Map Provider": "com.supermap.services.providers.TPKXMapProvider",
    "VTPK Map Provider": "com.supermap.services.providers.VTPKMapProvider",
    "Aggregation Map Provider": "com.supermap.services.providers.AggregationMapProvider",
    "Bing Maps Provider": "com.supermap.services.providers.BingMapsMapProvider",
    "Google Maps Map Provider": "com.supermap.services.providers.GoogleMapsMapProvider",
    "TianDiTu Map Provider": "com.supermap.services.providers.TiandituMapProvider",
    "SuperMap Cloud Map Provider": "com.supermap.services.providers.CloudMapProvider",
    "Baidu Map Provider": "com.supermap.services.providers.BaiduMapProvider",
    "OpenStreetMap Map Provider": "com.supermap.services.providers.OpenStreetMapProvider",
    "WFS Data Provider": "com.supermap.services.providers.WFSDataProvider",
    "Transportation Analysis Provider": "com.supermap.services.providers.UGCTransportationAnalystProvider",
    "Traffic Transfer Analysis Provider": "com.supermap.services.providers.UGCTrafficTransferAnalystProvider",
    "Aggregation Data Provider": "com.supermap.services.providers.AggregationDataProvider",
    "Spatial Analysis Provider": "com.supermap.services.providers.UGCSpatialAnalystProvider",
    "Address Matching Provider": "com.supermap.services.providers.UGCAddressMatchProvider",
    "Geometry Service Provider": "com.supermap.services.providers.GeoToolsGeometryProvider",
    "REST Data Provider": "com.supermap.services.providers.RestDataProvider",
    "REST Plotting Provider": "com.supermap.services.providers.RestPlotProvider",
    "REST Map Provider": "com.supermap.services.providers.RestMapProvider",
    "REST 3D Provider": "com.supermap.services.providers.RestRealspaceProvider",
    "REST Spatial Analysis Provider": "com.supermap.services.providers.RestSpatialAnalystProvider",
    "REST Traffic Transfer Analysis Provider": "com.supermap.services.providers.RestTrafficTransferAnalystProvider",
    "REST Transportation Analysis Provider": "com.supermap.services.providers.RestTransportationAnalystProvider",
    "REST Address Matching Provider": "com.supermap.services.providers.RestAddressMatchProvider",
    "Geoprocessor Provider": "com.supermap.geoprocessor.services.providers.GeoprocessorProvider",
    "SVTiles Map Provider": "com.supermap.services.providers.SVTilesMapProvider",
    "Multi Tiles Map Provider": "com.supermap.services.providers.MultiTilesProvider",
    "UGCV5 Map Provider": "com.supermap.services.providers.UGCV5TileProvider",
    "MongoDB Map Provider": "com.supermap.services.providers.MongoDBTileProvider",
    "MongoDB MVT Map Provider": "com.supermap.services.providers.MongoDBMVTTileProvider",
    "OTS Map Provider": "com.supermap.services.providers.OTSTileProvider",
    "MongoDB 3D Service Provider": "com.supermap.services.providers.MongoDBRealspaceProvider",
    "FastDFS Map Provider": "com.supermap.services.providers.FastDFSTileProvider",
    "Plotting Provider": "com.supermap.services.providers.UGCPlotProvider",
    "Elasticsearch Provider": "com.supermap.services.providers.ElasticsearchDataProvider",
    "PostGIS Data Provider": "com.supermap.services.providers.PostgisDataProvider",
    "PostGIS Map Provider": "com.supermap.services.providers.PostgisMapProvider",
    "Blockchain Map Provider": "com.supermap.services.providers.BlockchainMapProvider",
    "Blockchain Data Provider": "com.supermap.services.providers.BlockchainDataProvider",
    "Shapefile Data Provider": 'com.supermap.services.providers.ShapeFileDataProvider',
    "Shapefile Map Provider": 'com.supermap.services.providers.ShapeFileMapProvider',
    "Distribute Spatial Format Map Provider": "com.supermap.services.providers.DSFMapProvider",
    "GDP Map Provider": 'com.supermap.services.providers.GDPMapProvider',
    "GeoPackage Data Provider": 'com.supermap.services.providers.GeoPackageDataProvider',
    "GeoPackage Map Provider": 'com.supermap.services.providers.GeoPackageMapProvider',
    "3D Network Analysis Provider": 'com.supermap.services.providers.UGCNetworkAnalyst3DProvider',
    "UGCV5(MVT) Map Provider": "com.supermap.services.providers.MVTTileProvider",
    "UGCV5(MVT) 3D Provider": "com.supermap.services.providers.MVTTileRealspaceProvider",
    "Distribute Spatial Format Data Provider": "com.supermap.services.providers.DSFDataProvider",
    "GeoTrellis Map Provider": "com.supermap.services.providers.GeoTrellisMapProvider",
    "GeoTrellis Data Provider": "com.supermap.services.providers.GeotrellisDataProvider",
    // 服务接口
    "WMS Interface": "com.supermap.services.wms.WMSServlet",
    "WFS Interface": "com.supermap.services.wfs.WFSServlet",
    "WCS Interface": "com.supermap.services.wcs.WCSServlet",
    "WPS Interface": "com.supermap.services.wps.WPSServlet",
    "REST Service Interface": "com.supermap.services.rest.RestServlet",
    "REST/JSR Service Interface": "com.supermap.services.rest.JaxrsServletForJersey",
    "WMTS Interface": "com.supermap.services.wmts.WMTSServlet",
    "Handler Service Interface": "com.supermap.services.handler.HandlerServlet",
    "Geoprocessor Service Interface": "com.supermap.geoprocessor.services.GeoprocessorServlet",
    "ArcGIS REST Service Interface": "com.supermap.services.rest.AGSRestServlet",
    "Baidu REST Service Interface": "com.supermap.services.rest.BaiduRestServlet",
    "Google REST Service Interface": "com.supermap.services.rest.GoogleRestServlet",
    "TMS REST Service Interface": "com.supermap.services.rest.TMSRestServlet",
    "OSM REST Service Interface": "com.supermap.services.rest.OSMRestServlet",

    // 服务组件类型
    "Map Component": "com.supermap.services.components.impl.MapImpl",
    "Image Component":"com.supermap.services.components.impl.ImageImpl" ,
    "Data Component": "com.supermap.services.components.impl.DataImpl",
    "Plotting Component": "com.supermap.services.components.impl.PlotImpl",
    "Processing Component": "com.supermap.processing.jobserver.ProcessingServer",
    "Data Catalog Component": "com.supermap.services.components.impl.DataCatalogImpl",
    "WebPrinting Component": "com.supermap.services.components.impl.WebPrintingImpl",
    "3D Component": "com.supermap.services.components.impl.RealspaceImpl",
    "Transportation Analysis Component": "com.supermap.services.components.impl.TransportationAnalystImpl",
    "Traffic Transfer Analysis Component": "com.supermap.services.components.impl.TrafficTransferAnalystImpl",
    "Spatial Analysis Component": "com.supermap.services.components.impl.SpatialAnalystImpl",
    "Geoprocessing Component": "com.supermap.server.host.webapp.handlers.geoprocessing.GeoprocessingServer",
    "MachineLearning Component": "com.supermap.machinelearning.handler.MachineLearningServer",
    "3D Network Analysis Component": "com.supermap.services.components.impl.NetworkAnalyst3DImpl",
    "Geometry Service Component": "com.supermap.services.components.impl.GeometryComponentImpl",
    "Address Matching Component": "com.supermap.services.components.impl.AddressMatchImpl",

    // 负载均衡
    "Weighted Round Balancer": "com.supermap.services.cluster.WeightedRoundBalancer",
    "Round Robin Balancer": "com.supermap.services.cluster.RoundRobinBalancer",

    //影像服务相关
    "Compact Cache": "COMPACT",
    "Original Cache": "ORIGINAL",
    "MongoDB Cache": "MONGODB",
    "256*256 pixel": "SIZE256" ,
    "512*512 pixel": "SIZE512" ,
    "1024*1024 pixel":"SIZE1024",
    "2048*2048 pixel":"SIZE2048",
    "Single band stretch display": "STRETCHED" ,
    "Band combinationdisplay": "COMPOSITE" ,
    "Default interpolation": "DEFAULT",
    "High-quality interpolation":"HIGH" ,
    "Low-quality interpolation":  "LOW" ,
    "Nearest interpolation": "NEARESTNEIGHBOR",
    "Gaussian stretch":"GAUSSIAN" ,
    "Standard deviation stretch":"STANDARDDEVIATION" ,
    "Maximum stretch": "MINIMUMMAXIMUM" ,
    "Percent truncated stretch": "PERCENTCLIP",
    "Nearest neighbor method":"NEAREST" ,
    "Gaussian kernel calculation method":"GAUSS",
    "Average joint data method": "CONJOINT" ,
    "Average method":"AVERAGE",
    "UDBX file datasource": "UDBX"
};
/*------------------------>
 |
 |
 |   以上的资源为6.0SP1阶段，
 |   以后添加的部分放到下面。
 |
 |
 */
var backupRes = {
    'fileNameNotNULL': 'File name cannot be null',
    'backupFailed': 'Failed to backup server configuration',
    'failedReason': 'Cause',
    'backupSuccessed': 'Backup server configuration successfully'
};

var httpCacheRes = {
    'startStopEnabled': 'Enable',
    'startStopDescription': 'The standard edition of iServer does not support cluster services',
    'startStopDisabled': 'Disable'
};

var restoreRes = {
    'ServerIsRestoring': 'Server is restoring',
    'ResotreFailure': 'Failed to restore server configuration',
    'enter': '\n',
    'FailureReason': 'Cause: ',
    'ServerIsRestoreSucess': 'Restore server configuration successfully',
    'ServerIsRestoreDefaultSucess': 'Restore default server configuration successfully',
    'selected': 'Selected ',
    'restoreFileNameNull': 'Please select the configuration to restore. ',
    'confirmCommit': 'It will restore all the service configuration and security configuration information except the system administrator. Do you want to continue?'
};

var setupAdminRes = {
    'usernameErrorInfo1': 'User name cannot be null.',
    'usernameErrorInfo2': 'Only letters (a-z), numbers (0-9), and underscores (_) are allowed.',
    'passwordErrorInfo1': 'The password must be at least 8 characters.',
    'passwordErrorInfo2': 'Passwords you entered are different.',
    'passwordErrorInfo3': 'Password must include at least three types of the uppercase letters, lowercase letters,' +
        ' numbers, or special characters.',
    'passwordErrorInfo4': 'The password shouldn\'t be the same as the username or its reverse.'
};

var setupLicenseRes = {
    'expireDateTime': 'The expiration time is ',
    'masterServerAddress': 'Master Address',
    'colon': ':',
    'leftBracket': '(',
    'rightBracket': ')',
    'ByNumber': 'By Number',
    'ByQuota': 'By Quota',
    'ByExtendLicense': 'By Extend License',
    'activeLicenseAndWait': 'Server is to enable licensing modules, please wait.',
    'licenseCenterNotNull': 'The license center is not null!',
    'masterServerAddressNotNull': 'The master address is not null!',
    'enabledmodulesNotNull': 'The modules is not null!',
    'next': 'Next'
};

var licenseMapping = {
    "11000": {"type": "STANDARD", "name": "SuperMap iServer Standard Edition"},
    "11001": {"type": "PROFESSIONAL", "name": "SuperMap iServer Professional Edition"},
    "11002": {"type": "ENTERPRISE", "name": "SuperMap iServer Advanced Edition"},
    "11051": {"type": "EXPRESS", "name": "SuperMap iEdge"},
    "11031": {"type": "IPORTAL", "name": "SuperMap iPortal"},
    "11003": {"type": "SPATIAL", "name": "SuperMap iServer Spatial Analysis Service"},
    "11004": {"type": "NETWORK", "name": "SuperMap iServer Network Analysis Service"},
    "11005": {"type": "TRAFFIC_TRANSFER", "name": "SuperMap iServer Traffic Transfer Analysis Service"},
    "11006": {"type": "SPACE", "name": "SuperMap iServer 3D Service"},
    "11007": {"type": "CHART", "name": "SuperMap iServer Nautical Chart Service"},
    "11008": {"type": "SERVICE_NODE_ADDITION", "name": "SuperMap iServer Service Node Addition"},
    "11009": {"type": "SITUATIONEVOLUTION", "name": "SuperMap iServer Situation Evolution Service"},
    "11010": {"type": "PLOT", "name": "SuperMap iServer Plotting Service"},
    "11011": {"type": "SPATIAL_PROCESSING", "name": "SuperMap iServer Distributed Analyst Service"},
    "11014": {"type": "GEO_BLOCKCHAIN_SERVICE", "name": "SuperMap iServer GeoBlockchain Service"},
    "11012": {"type": "SPATIAL_STREAMING", "name": "SuperMap iServer Streaming Service"},
    "11033": {"type": "IDATAINSIGHTS", "name": "数据洞察扩展模块"},
    "11013": {"type": "MACHINE_LEARNING_SERVICE", "name": "SuperMap iServer Machine Learning Service"},
    "65400": {"type": "", "name": "SuperMap Free Trial License"}
};

var coreLicMapping = {
    "ENTERPRISE_CORES": "SuperMap iServer Advanced Edition(Cores)",
    "PROFESSIONAL_CORES": "SuperMap iServer Professional Edition(Cores)",
    "STANDARD_CORES": "SuperMap iServer Standard Edition(Cores)",
    "SPATIAL_CORES": "SuperMap iServer Spatial Analysis Service(Cores)",
    "NETWORK_CORES": "SuperMap iServer Network Analysis Service(Cores)",
    "TRAFFIC_TRANSFER_CORES": "SuperMap iServer Traffic Transfer Analysis Service(Cores)",
    "SPACE_CORES": "SuperMap iServer 3D Service(Cores)",
    "SPATIAL_PROCESSING_CORES": "SuperMap iServer Distributed Analyst Service(Cores)",
    "GEO_BLOCKCHAIN_SERVICE_CORES": "SuperMap iServer GeoBlockchain Service(Cores)",
    "SPATIAL_STREAMING_CORES": "SuperMap iServer Streaming Service(Cores)",
    "MACHINE_LEARNING_SERVICE_CORES": "SuperMap iServer Machine Learning Service(Cores)",
    "CHART_CORES": "SuperMap iServer Nautical Chart Service(Cores)",
    "PLOT_CORES": "SuperMap iServer Plotting Service(Cores)",
    "SITUATIONEVOLUTION_CORES": "SuperMap iServer Situation Evolution Service(Cores)",

    "SPATIAL": "SuperMap iServer Spatial Analysis Service",
    "NETWORK": "SuperMap iServer Network Analysis Service",
    "TRAFFIC_TRANSFER": "SuperMap iServer Traffic Transfer Analysis Service",
    "SPACE": "SuperMap iServer 3D Service",
    "CHART": "SuperMap iServer Nautical Chart Service",
    "SITUATIONEVOLUTION": "SuperMap iServer Situation Evolution Service",
    "PLOT": "SuperMap iServer Plotting Service",
    "SPATIAL_PROCESSING": "SuperMap iServer Distributed Analyst Service",
    "GEO_BLOCKCHAIN_SERVICE": "SuperMap iServer GeoBlockchain Service",
    "SPATIAL_STREAMING": "SuperMap iServer Streaming Service",
    "IDATAINSIGHTS": "数据洞察扩展模块",
    "MACHINE_LEARNING_SERVICE": "SuperMap iServer Machine Learning Service",
    "65400": "SuperMap Free Trial License"
};

var authorSettingRes = {
    'authorNameInvalid': 'Author name is invalid.',
    'authoNameAlreadyExist': 'Author name already exists',
    'ruleListIsNull': 'Rule list is null'
};

var tokenRuleSettingRes = {
    'ruleNameIllegal': 'Rule name is invalid',
    'ruleNameExisted': 'Rule name already exists',
    'instanceListNull': 'instances list is null'
};

var precacheNewRes = {
    'detail': 'Details',
    'cacheScales': 'Cache scales',
    'start': 'Start',
    'clear': 'Clear',
    'edit': 'Edit',
    'carryOn': 'Continue',
    'pause': 'Pause'
};

var precacheSchemeRes = {
    'autoCompute': '自动计算',
    'BingMapsScheme': 'BingMapsCacheScheme.xml',
    'TiandituScheme': 'TianDiTuCacheScheme.xml',
    'SMCScheme': 'CloudServiceMapCacheScheme1.xml',
    'AnthorSMCScheme': 'CloudServiceMapCacheScheme2.xml',
    'accordTo': 'According to ',
    'whetherViewEntire': 'Full extent',
    'warn': 'Warning',
    'map': 'Map',
    'infoMessage': 'Scales in the scheme will be ignored because visible scale set has been set for the display of the map.',
    'suggestMessage': 'You can set the visible scale set of the map ',
    'setToScheme': 'to a scheme',
    'onlyCanRemove': 'You can only remove fixed scales.',
    'compact': 'Compact',
    'orign': 'Original',
    'defaultCacheFormat': 'Default',
    'simple': 'Simple',
    'left': 'Left: ',
    'down': 'Bottom: ',
    'right': 'Right: ',
    'up': 'Top: ',
    'cacheImageType': 'Format: ',
    'size': 'Size: ',
    'backgroundOpaque': 'Transparent: ',
    'storeType': 'Storage type: ',
    'cacheFormat': 'Cache format: ',
    'autoComputeScale': 'Scales automatically calculated must be positive integers',
    'autoComputeMapNameIsNull': 'Map name automatically calculated is null!',
    'workspaceOrMapNotNull': 'Workspace or map name for the cache task cannot be null!',
    'tryToRunResult': 'Result for test run',
    'saveNameNotNull': 'Name of file for saving configuration cannot be null',
    'cannotModifyTemplateScheme': 'You can save the scheme as another file!',
    'saveSucceed': 'Save configuration successfully!',
    'nothingCanSave': 'Noting to save!',
    'noScheme': 'No precache scheme'
};

var scsAndscsetsRes = {
    'scsetTypeName': 'Service component set'
};

// 在ugcTrafficTransferAnalystProviderConfigForm中使用
var TrafficTransferAnalystFormResource = {
    workspace: "Workspace path on server",
    networkName: "Transfer network name",
    datasourceName: "Datasource name",
    datasourceNameErrMsg: "Datasource alias error",
    datasetName: "Dataset name",
    datasetNameErrMsg: "Dataset name error",
    lineIdField: "ID field of line",
    lineIdFieldErrMsg: "ID field of line error",
    stopIdField: "ID field of stop",
    stopIdFieldErrMsg: "ID field of stop error",
    serialNumField: "Stop sequence number field",
    serialNumFieldErrMsg: "Stop sequence number field error",
    datasetNetworkName: "Name of road network dataset",
    datasetNetworkNameErrMsg: "Name of road network dataset is error",
    edgeIdField: "Edge ID field",
    edgeIdFieldErrMsg: "Edge ID field is error",
    nodeIdField: "Node ID field",
    nodeIdFieldErrMsg: "Node ID field is error",
    fNodeIdField: "ID field of edge start node",
    fNodeIdFieldErrMsg: "ID field of edge start node is error",
    tNodeIdField: "ID field of edge end node",
    tNodeIdFieldErrMsg: "ID field of edge end node is error",
    datasetPathName: "Stop and entrance dataset name",
    datasetPathNameMsg: "Stop and entrance and exit dataset name error",
    exitIdField: "Entrance ID field",
    exitIdFieldMsg: "Entrace and exit ID error in stop and entrance and exit dataset",
    exitNameCField: "Entrance Chinese Name",
    exitNameCFieldMsg: "Entrace and exit name in stop and entrance and exit dataset",
    exitNamePYField: "Entrance pinyin",
    exitNamePYFieldMsg: "Entrace and exit pinyin error in stop and entrance and exit dataset",
    stationIdField: "Stop ID field",
    stationIdFieldMsg: "Stop ID field error in stop and entrance and exit dataset",
    mergeTolerance: "Tolerance of stops merging",
    mergeToleranceErrMsg: "Tolerance of stops merging should be positive",
    snapTolerance: "Tolerance of stops catching",
    snapToleranceErrMsg: "Tolerance of stops catching should be positive",
    walkingTolerance: "Walk threshold",
    walkingToleranceErrMsg: "Walk threshold should be positive",
    unit: "Unit",
    transferStopSettings: "Stop environment settings collection",
    stopNameField: "Stop field name",
    stopNameFieldErrMsg: "Stop name field error",
    stopAliasField: "Stop alias field",
    stopAliasFieldErrMsg: "Stop alias field error",
    transferStopSetting: "Bus stops environment set",
    transferLineSettings: "Line environment settings collection",
    lineNameField: "Line name field",
    lineNameFieldErrMsg: "Line name field error",
    lineAliasField: "Line alias field",
    lineAliasFieldErrMsg: "Line alias field error",
    lineTypeField: "Line type field",
    lineTypeFieldErrMsg: "Line type field error",
    speedField: "Field name to identify the driving speed",
    speedFieldErrMsg: "Field name to identify the driving speed error",
    firstTimeField: "Departure time field of first bus",
    firstTimeFieldErrMsg: "Departure time field of first bus error",
    lastTimeField: "Departure time field of last bus",
    lastTimeFieldErrMsg: "Departure time field of last bus error",
    intervalField: "Departure interval field",
    intervalFieldErrMsg: "Departure interval field error",
    transferLineSetting: "Bus line environment settings",
    transferRelationSetting: "Relationship settings",
    transferRelationSettings: "Set of relationship settings between stops and lines"
};

// 在ProviderConfigForm.js中使用
var ProviderConfigFormResource = {
    providerType: "Service Provider Type",
    localMapProvider: "UGC Map Provider",
    loacalDataProvider: "UGC Data Provider",
    wmsMapProvider: "WMS Map Provider",
    wmtsMapProvider: "WMTS Map Provider",
    smTilesMapProvider: "SMTiles Map Provider",
    mbTilesMapProvider: "MBTiles Map Provider",
    zXYTilesMapProvider: "ZXYTiles Map Provider",
    arcgisRestMapProvider: "ArcGIS REST Map Provider",
    wfsDataProvider: "WFS Data Provider",
    localReaspaceProvider: "UGC 3D provider",
    aggregationMapProvider: "Aggregation Map Provider",
    aggregationDataProvider: "Aggregation Data Provider",
    transportationAnalystProvider: "Transportation Analyst Provider",
    trafficTransferAnalystProvider: "TrafficTransfer Analyst Provider",
    restDataProvider: "REST Data Provider",
    restPlotProvider: "REST Plotting Provider",
    restMapProvider: "REST Map Provider",
    spatialAnalystProvider: "Spatial Analysis Provider",
    tiandituMapProvider: "TianDiTu Map Provider",
    bingMapsMapProvider: "Bing Maps Provider",
    googleMapsMapProvider: "Google Maps Map Provider",
    cloudMapProvider: "SuperMap Cloud Service Map Provider",
    addressMatchProvider: "Address Match Provider",
    geometryServiceProvider: "Geometry Service Provider",
    providerName: "Provider Name"
};

// 在ConfigElements.js中使用
var ConfigElementsResource = {
    // 显示在下拉列表框中的第一项
    defaultOption: "Please select",
    autoComputFromWorkspace: 'Automatically acquire settings from workspace'
};

var workspaceDialogConentResource = {
    browseTips: "Current browser does not support this function, please select the Remote browse"
};

var LicenseCheckMsg = {
    PlatformLicExpected: "Need SuperMap iServer platform license",
    EnterpriseExpected: "Advanced SuperMap iServer version is required",
    EnterpriseOrProfessionalExpected: "Advanced or professional SuperMap iServer version are required",
    SpaceExtensionExpected: "SuperMap iServer 3D extended license is required",
    SpatialExtensionExpected: "SuperMap iServer spatial analysis extended license is required",
    TrafficTransferExtensionExpected: "SuperMap iServer traffic transfer analysis extended license is required",
    PlotExtensionExpected: "SuperMap iServer plot extended license is required",
    NetworkExtensionExpected: "SuperMap iServer network analysis extended license is required",
    Network3DExtensionExpected: "SuperMap iServer 3D network analysis extended license is required",
    DeliveryExtensionExpected: "SuperMap iServer Advanced license is required",
    notSelectAnyConnect: "Have not selected any mobile connection to delete",
    confirmDeleteConnection: "Are you sure to delete the mobile connection?",
    mobileAccessRule: 'Online access rule',
    alreadyExisted: 'This rule exists!',
    authorize: "Authorization",
    deny: "Deny",
    notSuchItem: "Marches not found",
    startDate: "Start time",
    endDate: "End time",
    descMeg: "Description",
    licensePeriod: "License period (days)",
    totalcount: "Total:",
    record: "records",
    queryResult: "Results are as follows:",
    retunback: "Return",
    licServerAddressRequired: "License service address is a required field",
    applySuccess: 'Successfully!',
    previous: '<<Back',
    next: 'Next>>',
    reApply: 'License permission is denied. You need to apply again.',
    deviceNumber: 'Device ID',
    authorizationCode: 'Authorization code',
    licServer: 'License Server',
    licExpired1: 'License period',
    licExpired2: ' (day)'
};

var WorkspaceCheckMsg = {
    WorkspaceError: "Workspace does not meet the requirements",
    WorkspaceHasWebDatasource: "Publishing workspace with some web datasources as map service is not supported",
    NoLineDataset: "No line dataset",
    NoPointDataset: "No point dataset",
    NoTabularDataset: "No attribute table dataset",
    NoNetworkDataset3D: "No 3D network dataset "
};

// 在FileManager相关脚本中使用
var fileManagerRes = {
    fileUploadDialogTitle: "Progress",
    fileUploadSuccess: "The file uploaded with success",
    fileUploadUnziping: "The file has been uploaded and it is being decompressed",
    fileUploading: "Uploading",
    NotAutoUnzip: "It is not a zip file and will be not decompressed automatically.",
    AutoUnzipSuccess: "It has been decompressed automatically."
};

var WellKnownScaleSets = {
    GlobalCRS84Scale: {
        name: "GlobalCRS84Scale",
        description: "This well-known scale set has been defined for global cartographic products. Rounded scales have been chosen for intuitive cartographic representation of vector data."
    },
    GlobalCRS84Pixel: {
        name: "GlobalCRS84Pixel",
        description: "This well-known scale set has been defined for global cartographic products. Rounded pixel sizes have been chosen for intuitive cartographic representation of raster data. Some values have been chosen to coincide with original pixel size of commonly used global products like STRM (1\" and 3\"), GTOPO (30\") or ETOPO (2' and 5')."
    },
    GoogleMapsCompatible: {
        name: "GoogleMapsCompatible",
        description: "This well-known scale set has been defined to be compatible with Google Maps and Microsoft Live Map projections and zoom levels. Level 0 allows representing the whole world in a single 256x256 pixels. The next level represents the whole world in 2x2 tiles of 256x256 pixels and so on in powers of 2. "
    },
    GoogleCRS84Quad: {
        name: "GoogleCRS84Quad",
        description: "This well-known scale set has been defined to allow quadtree pyramids in CRS84. Level 0 allows representing the whole world in a single 256x256 pixels (where the first 64 and last 64 lines of the tile are left blank). The next level represents the whole world in 2x2 tiles of 256x256 pixels and so on in powers of 2."
    },
    ChinaPublicServices: {
        name: "ChinaPublicServices",
        description: "This scale set has been defined for china Web map tile service."
    },
    ChinaPublicServicesCGCS2000: {
        name: "ChinaPublicServicesCGCS2000",
        description: "This scale set has been defined for the normal china Web map tile service, with CGCS2000."
    },
    Custom: {
        name: "Custom",
        description: "This scale set uses the orginal coordinate system of the map. If scales are null, Level 0 allows representing the whole world in a single 256x256 pixels, The next level represents the whole world in 2x2 tiles of 256x256 pixels and so on in powers of 2."
    }
};

var TileMatrixSetRes = {
    DefaultAddTileMatrixLabel: "Please select scale set"
};

var logConfigRes = {
    RepeatedAddURL: "It already exists, please do not repeat to add.",
    InvalidServicesURL: " is not a valid URL address, please add again.",
    logLevalText: "Level",
    logSummaryText: "Abstract",
    logTimeText: "Time",
    fileSize: "File size",
    fileName: "File name",
    logLevel: {
        WARN: "WARN",
        INFO: "INFO",
        ERROR: "ERROR",
        DEBUG: "DEBUG",
        ALL: "ALL"
    }
};

var exportSMTilesRes = {
    NoScalesSelected: "Please select the scale to export!",
    NoOutPutPathToExport: "Please input the export directory!",
    ExportBoundsError: "Error range. Please enter again!",
    HasCutternExportJob: "There are unfinished export task in the record set.Please wait...",
    MbtilesExisted: "The MBTiles file with same name is in the export directory. Whether to replace this MBTiles file with new MBTiles file?",
    SMtilesExisted: "The SMTiles file with same name is in the export directory. Whether to replace this SMTiles file with new SMTiles file?"
};

var wmtsDefaultDpi = 90.7142857142857;

var ScheduledRestartRes = {
    PleaseSetIntervalMsg: "Please set the interval!",
    PleaseSetDateMsg: "Please set the date!",
    buttonText: "Select date",
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
        'November', 'December'],
    dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    showMonthAfterYear: true,
    yearSuffix: ' '
};

var ServerMonitorRes = {
    InstanceRequests: {
        QueryInstanceRequestsStatisticsFailed: "Need more permission to query the service access statistics.",
        EndTimeMustGreaterThanStartTime: "End time must be greater than start time.",
        QueryAllUserNamesFailed: "Failed to get all users.",
        AllUser: "All Users",
        QueryInstanceRequestsFailed: "Need more permission to query service access information.",
        Others: "Others",
        Anonymous: "Anonymous",
        User: "Users",
        Of: " of",
        InstanceNameStatisticsChart: "Service instances",
        ComponentTypeStatisticsChart: "Service types",
        ViewRequestRecord: "View access logs",
        ViewStatisticsChart: "View statistics",
        PageNumberIllegal: "Please enter the correct page number.",
        NoQueryResult: "No access log"
    },
    EmailNotifier: {
        InvalidMailAddress: "Invalid E-mail notification!",
        RequiredField: " is/are required!",
        InvalidPort: "SMTP port must be positive integer!"
    },
    ServicesLoad: {
        CurrentServiceLoads: "Server performance: ",
        RequestUnit: " requests/sec",
        ServiceLoadNow: "Server performance: ",
        NoFindRecords: "Did not find related records",
        NowLoads: "Performance:",
        ClusterLoads: "Cluster server performance:",
        ClusterAaverageLoads: "Average Performance:"
    }
};

var PropertiesRes = {
    importConfigDialogTitle: "Import Settings",
    saveSuccessed: "Save successfully",
    saveSuccessedAndRestart: "Save successfully, please restart.",
    saveFailed: "Save failed",
    pathErrorInfo: "The output path length of cache images should be greater than 0",
    siteErrorInfo: "The publishing site length should be greater than 0",
    hostErrorInfo: "The Server Address can not be empty",
    userErrorInfo: "The username can not be empty",
    dbNameErrorInfo: "The dbName can not be empty",
    passwordErrorInfo: "The passworld can not be empty",
    serverAddressFormatErrorInfo: "The Server Address format error",
    maxBytesLocalDiskErrorInfo: "The Max Bytes Local Disk can not be empty",
    maximumSizeErrorInfo: "The max size is illegal."
};

var SetupCommonRes = {
    userNameRule: "User name must be numbers, letters or underlines!",
    passwordRule: "The password must be at least 8 characters",
    passwordVerify: "The two passwords you typed do not match",
    errorLicInfo: "Failed to configure. Please check the license you entered, or you can use the license manager to configure.",
    physicalCardItem: "Physical network card:",
    computerNameItem: "Computer name:",
    adminCreateFailed: "Failed to create the administrator account.",
    buttonUseless: "Button not available"
};

var SearchTips = {
    'search': 'Search '
};

var MultiTilesRes = {
    'selectMongoDB': 'Select MongoDB Tiles',
    'selectSMTiles': 'Select SMTiles Tiles',
    'selectUGCV5': 'Select UGCV5 Tiles',
    'smtilesFilePathNotNull': 'SMtiles file path is not null!',
    'UGCV5FilePathNotNull': 'UGCV5 file path is not null!',
    'customScaleIllegal': 'The custom scale is illegal!',
    'queryNoTiles': 'Find no tiles, please check the connection info.',
    'connectTileSourceFailed': 'Connect the tile source failed!',
    'mapNameNull': 'The map Name can not be null!',
    'notSelectTileset': 'You do not select any tilesets!',
    'tilesetsNull': 'The tilesets can not be null!',
    'trueFlag': 'True',
    'falseFlag': 'False'
};

var TileServerRes = {
    'ChineseBracket1': '(',
    'ChineseBracket2': ')',
    'ChineseComma': ',',
    'piece': '',
    'together': 'Total',
    'yes': 'Yes',
    'no': 'No',
    'hasBuilt': 'Finish',
    'hasExported': 'Exported',
    'hasFinished': 'Completed:',
    'speedOfBuildingMapImage': 'Tiling speed',
    'hasJustBuilt': 'New',
    'inComputing': 'Calculating',
    'pic': 'Picture',
    'picSize': 'Picture size',
    'picFormat': 'Picture format',
    'tileFormat': 'Tile format:',
    'tileSize': 'Tile size:',
    'isTransparentOrNot': 'Transparent:',
    'picTransparent': 'Transparent: Yes',
    'picUntransparent': 'Transparent: No',
    'outputMapBounds': 'Tile range:',
    'leftDownCorner': 'Lower Left',
    'rightUpCorner': 'Lower Right',
    'addStorageAddress': 'Add a storage location',
    'getMapStatusError': 'Failed to get map status',
    'getMapServiceComponentError': 'Map {mapName} doesn\'t exist, failed to get map service component, please confirm if the service is available',
    'getServiceComponentStatusError': 'Failed to get service component status',
    'remove': 'Delete',
    'edit': 'Edit',
    'addNewTileVersion': 'New a tile version',
    'selectTileVersion': 'Select a tile version',
    'pleaseEnterStorageID': 'Please enter the store ID',
    'selectStorageAddress': 'Please select the storage location',
    'noAvailableStoragePleaseBuildOne': 'Available tile stroage is not detected. Please build a storage before tiling.',
    'howToPrepareStorage': 'How to prepare the FastDFS environment',
    'noAvailableMapServicePleasePublishOne': 'No map service is detected. You should publish the map services before tiling.',
    'toPublish': 'Go to the home page for instance publishing',
    'noAvailableWorkerNode': 'Available tile node is not detected:',
    'howToAddWorkerNode': 'How to add the tile node',
    'onlyOneWorkerNodeDetected': 'Only one tile node can be detected on ',
    'weCanDoBetterAfter': ', and one tile can not show the advantages of distributed tiles',
    'ipCannotBeNull': 'IP info can not be empty',
    'keyCannotBeNull': 'Key info can not be empty',
    'tianDiTuDefaultUrl': 'Default url is http://t{0-7}.tianditu.gov.cn',
    'pleaseEnterAvailableIpWithHost': 'Please enter the legal IP address with port number',
    'mapName': 'Map name:',
    'sceneName': 'Scene name:',
    'sceneLayerName': 'Layer name:',
    'exportSMTiles': 'Export smtiles',
    'addFDHTGroup': 'Add FDHTGroup',
    'pleaseAddFDHTGroup': 'Please add FDHT Group',
    'editFDHTGroup': 'Edit FDHTGroup ',
    'piecePerSecond': 'requests/sec',
    'pushingData': 'Pushing data',
    'pushDataOver': 'Finish pushing',
    'loseConnect': 'Lost connection',
    'hasFinishTile': 'Finished :',
    'hasDataPreProcessTile': 'Finish data preprocessing tiles',
    'zhang': ' ',
    'node': 'node',
    'again': 'Retile',
    'cutting': 'Retile the problem tiles, please refer to:',
    'allBlank': 'Detect white area in all current',
    'block': 'Block',
    'currentBlank1': 'Common white region in current scale',
    'currentBlank2': ' blocks. Marked as problem region.',
    'currentBlank3': ' blocks, Marked as normal region.',
    'currentBlank4': ' blocks. Waiting process.',
    'currentBlank5': 'Normal region',
    'currentBlank6': 'Problem region',
    'blankRegion': 'White area',
    'currentNoBlank': 'No information of white region in current scale',
    'createBlankError': 'Failed to get white region information',
    'hasBlank': 'Uncommitted white region',
    'current': 'Page ',
    'page': '',
    'updateTask': 'Update task',
    'startingTask': 'Will retile, please refer to',
    'currentNoBlankToUpdate': 'No white region. Do not need to update.',
    'remarked': ' (marked)',
    'accepted': 'Marking tile request has been accepted!',
    'processInfo1': 'Total: ',
    'processInfo2': ' blocks',
    'processInfo3': 'Current scale:',
    'processInfo4': 'Remain: ',
    'processInfo5': ' blocks (being processed included)',
    'processInfo6': ', common white region',
    'processInfo7': 'No problem tiles.',
    'processInfo8': 'Suspected white region in all scales.',
    'cuttedTask': 'Has been retiled, please refer to:',
    'updatingBlank': 'Updating the information of white region, please wait...',
    'tileType': 'Tile type:',
    "utfGridLayer": "Layer:",
    "utfGridPixCell": "Grid size:",
    "componentName": "Service component:",
    "dataName": "Data name:",
    "tileSourceType": "Storage type:",
    "MongoDBServerAddress": "Service URL:",
    "OTSInstanceName": "Instance Name:",
    "OTSNodeName": "Node Name:",
    "deployingError": "Failed to deploy tile task.",
    "deployingErrorAndRetry": "Failed to deploy tile task (retry again after {0} seconds)",
    "redeployJobButtonTitle": "Retry",
    "unset": "Not set",
    "notTransparent": "No",
    "unSupportTransparent": "No (Current image format does not support transparent image)",
    "isTransparent": "Yes",
    "illegalNum": "Invalid number",
    "originalPointXorYUnsetted": "Please set the X and Y of the start point",
    "originalPointXisNaN": "The X isn't number, please input again.",
    "originalPointYisNaN": "The Y isn't number, please input again.",
    "alertMsgKMLFileNotSet": "Please set the position of KML file",
    "MongoDBDatabase": "Database:",
    "MongoDBUsername": "User:",
    "ChooseScene": "Please select scene.",
    "ChooseLayer": "Please select layer.",
    "AutoChose": "Auto chose accord to layer.",
    "ChooseTileType": "Please select tile type.",
    "TilesTotal": "Tiles total:",
    "StartTime": "Start time:",
    "Details": "Details:",
    "datapreprossing": "Data preprossing: ",
    "toNextRunningTime": "Next running time:",
    "later": "later",
    "selectMapDialogAlert": "Service component with this interface do not support automatic acquisition of cache scale, cache bounds and original point. Please set these parameters manually."
};

var SecurityRes = {
    'selectPrivilegeToDelete': 'Please select the permissions to delete.',
    'confirmToDeleteSelectedPrivilege': 'Are you sure you want to delete selected permissions?',
    'addPrivilegeInfo': 'Add permisssion info',
    'editInstanceAccessPrivilege': 'Modify the service access permission',
    'editInstanceManagerPrivilege': 'Modify the service management permission',
    'serviceUnavailableAnonymous': 'The service instance can not be accessed anonymously',
    'addRoleInfo': 'Add role info',
    'selectRoleToDelete': 'Please select roles which you want to delete.',
    'cannotDeleteSysRole': 'You can not delete the system role.',
    'confirmToDeleteSelectedRole': 'Are you sure you want to delete selected roles?',
    'addRole': 'Add Role',
    'viewMap': 'Map Browsing',
    'queryMap': 'Map Query',
    'measureMap': 'Map Measurement',
    'viewData': 'Data Browsing',
    'editData': 'Data Editing',
    'selectDataOperationPrivilege': 'Please select the data operating authorization.',
    'selectFunctionOperationPrivilege': 'Please select the function operating authorization',
    'serviceInstanceInfoNull': 'Service instance info is null.',
    'typeUnsupported': 'Unsupported types.',
    'noRulesSelected': 'No rules are selected',
    'confirmToDeleteSelectedRules': 'Are you sure you want to delete the selected rules?',
    'addURLRules': 'Add URL accessing rule',
    'connotModifySysRoleAdmin': 'You can not modify the role of system admin.',
    'addUser': 'Add user',
    'selectUserToDelete': 'Please select users which you want to delete.',
    'connotDeleteSelectedUser': 'You can not delete current user ',
    'confirmToDeleteSelectedUser': 'Are you sure you want to delete the selected users?',
    'authorization': 'Authorize',
    'roleName': 'Role Name',
    'roleDescription': 'Description',
    'userName': 'User name',
    'relateRole': 'Association role',
    'relateBcUserCert': 'Association blockchain user certificate',
    'status': 'status',
    'locked': 'locked',
    'noLocked': 'normal',
    'expired': 'expired',
    'whether': 'whether',
    'statusTipUnlockUser': 'ensure unlock user',
    'statusTipLockUser': 'ensure lock user',
    'locked_en': 'lock',
    'noLocked_en': 'noLocked',
    'addRuleInfo': 'Add attribute configuration',
    'editRuleInfo': 'Change attribute configuration',
    'addRuleMapping': 'Add role mapping',
    'editRuleMapping': 'Change role mapping',
    'maxSkew': 'The maximum skew value cannot exceed 2147483647s',
    'cannotDeleteSysCasRule': 'Can not delete system configuration',
    'cannotmodifySysCasRule': 'Can not modify the system configuration',

    'AttributeValueIsNull': 'Attribute can not be null.',
    'AttributeValueInvalid': 'Attribute contains illegal characters (letters, numbers and underscore).',
    'AttributeValueExists': 'Configuration of this attribute already exists.',
    'AttributeValue': 'Attribute',
    'selectCasRuleToDelete': 'Please select configuration to delete.',
    'selectCasRuleToEdit': 'Please select configuration to change.',
    'enableBuiltInRoleHint': 'The token will be unusable if you do not start using built-int account, and you will be unable to visit manager by the time CAS service become invalid. So are you sure to not use built-in account?',
    'addRolesMapping': 'add roles mapping',
    'edit': 'edit',
    'deletetag': 'delete',
    'groupOfLDAP': 'group of LDAP',
    'roleMapping': 'roles mapping',
    'operation': 'operation',
    'selectConfigItemToDelete': 'Please select the configuration item to delete.',
    'confirmToDeleteSelectedConfig': 'Are you sure to delete the configuration selected?',
    'modifyRoleMapping': 'modify roles mapping.',
    'LDAPGroupNameCanNotBeNull': 'The name of LDAP group can not be null.',
    'confirmLDAPServerAvailable': 'Please ensure  LDAP Server deployed available  and has proper configuration infomation!',
    'userGroup': {
        'addUserGroup': 'Add user group',
        'userGroupName': 'Name',
        'userGroupDescription': 'Description',
        'containUsers': 'Member',
        'userGroupNameIsNull': 'User group name can not be null',
        'userGroupNameInvalid': 'User group name must be composed of numbers, letters, underscores or dash, and begin with a letter!',
        'userGroupDescriptionInvalid': 'User Group Description contains special characters',
        'selectUserGroupToDelete': 'Please select the user group to delete',
        'confirmToDeleteSelectedUserGroup': 'Are you sure you want to delete all selected user groups?',
        'relateUserGroup': 'Related UserGroup',
        'relateDeparement': 'Related Department',
        'selectBcUserCertNotRepeat': 'Blockchain user certificate selection can not be repeated, the following blockchain user certificate can only choose to unbind or bind '
    },
    'maxDataCapacity': "max data capacity",
    'dataCapacityLargerThanZero': "Please input value which is larger than zero.",
    'updateDataCapacityDialogTitle': "update user's max data capacity"
};

var ShiroConfig = {
    "roleDescription": {
        "ADMIN": "Built-in system administrator role. This role has administration rights for whole {PRODUCT_TYPE} by default.",
        "PUBLISHER": "Built-in service publisher. This role has administration rights for publishing and managing services.",
        "NOPASSWORD": "Built-in role, representing that a user is authenticated by third party.",
        "USER": "Built-in user role",
        "PORTAL_USER": "Built-in iPortal user role.",
        "PORTAL_VIEWER": "Built-in iPortal viewer role."
    }
};

var DynamicTable = {
    oLanguage: {
        "sLengthMenu": "Page length: _MENU_",
        "sInfo": "From _START_ to _END_, there are _TOTAL_ records",
        "sInfoEmpty": "No data",
        "sInfoFiltered": "(Search from _MAX_ records)",
        "sZeroRecords": "No data retrieved!",
        "sLoadingRecords": "Loading...",
        "sSearch": "Search",
        "oPaginate": {
            "sFirst": "First",
            "sPrevious": "<",
            "sNext": ">",
            "sLast": "Last"
        }
    },
    accredit: "Module authorization",
    aLengthMenu: "All",
    selectReverse: "Inverse",
    deleteSelected: "Delete"
};

var addWorkspaceRes = {
    'workspaceType': 'Workspace Type',
    'oracleWorkspace': 'Oracle Workspace',
    'sqlWorkspace': 'SQL Server Workspace',
    'pgsqlWorkspace': 'PGSQL Workspace',
    'fileWorkspace': 'File',
    'workspacePath': 'Workspace path:',
    'workspacePwd': 'Workspace password:',
    'remoteServerFile': 'Remote server file system:',
    'localFile': 'Local file system:',
    'browse': 'Browse...',
    'help': 'FAQ',
    'errorInfo': 'Unavailable'
};

var instanceRequestsRes = {
    'id': 'No.',
    'instanceName': 'Instance name',
    'userName': 'User name',
    'remoteAddress': 'Client IP',
    'requestURL': 'Request address',
    'method': 'Method',
    'responseCode': 'Response code',
    'componentType': 'Service type',
    'interfaceType': 'Interface type',
    'accessTime': 'Access time',
    'calendarLanguage': '1'
};

var TileWorkerConnectionState = {
    FOUND: 'Prepare connecting',
    CONNECTING: 'Connecting',
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    CONNECTION_EXCEPTION: 'Exception',
    QUIT: 'Quit'
};

var VectorLayersSelectorRes = {
    TITLE: "Please select a vector layer",
    DEFAULT: "Default",
    EXPAND_PIXELS_LABEL: "Extension Pixel:",
    EXPAND_PIXELS_DES: "Cut the geometric features after extending the pixel to the pixel. Extension pixel can avoid geometric features generating repeat boundaries at the edge of tiles.",
    FIELDS_LABEL: "Property: ",
    FIELDS_DES: "Please the properties contained in the tile layer.",
    SEARCH_FIELDS_LABEL: "Query properties;",
    SEARCH_FIELDS_DES: "The query property is used to create the query contents (search_values). According to search_values, it can query the key word.",
    SELECT_ALL: "Select All",
    SELECT_SLIBLINGS: "Inverse All",
    LAYERS_LABEL: ["Total: ", " layers. ", " selected."]
};

var TileSource2TileTypesMapping = {
    "FastDFS": ["Image"],
    "SMTiles": ["Image"],
    "MongoDB": ["Image", "RealspaceImage", "Terrain"],
    "OTS": ["Image"],
    "SVTiles": ["Vector"],
    "UGCV5": ["Image"],
    "UTFGrid": ["UTFGrid"]
};

var TileType2TileSourcesMapping = {
    "Image": ["SMTiles", "MBTiles", "MongoDB", "OTS", "UGCV5", "GeoPackage"],
    "UTFGrid": [],
    "Vector": ["SVTiles"],
    "RealspaceImage": ["MongoDB"],
    "Terrain": ["MongoDB"]
};

var ComponentType2TileTypeMapping = {
    "Map": ["Image", "Vector"],
    // Realspace服务组件使用图层来选择TileType
    "Realspace": ["RealspaceImage", "Terrain"]
};

var RealspaceLayerType2TileTypeMapping = {
    "ImageFileLayer": ["RealspaceImage"],
    "TerrainFileLayer": ["Terrain"]
};

var TileSource2TileSourceDescriptionMapping = {
    "FastDFS": ["FastDFS：Based on the specific logic, split the map into map tiles, and save to the configured FastDFS distributed file system. The tile results are identified by the storage ID. If you use this storage method, you should set the available FastDFS distributed file server address."],
    "SMTiles": ["SMTiles: Spilt the map into map tiles based on MBTiles standard, and save to SQLite database. The result is the local *.smtiles file."],
    "MBTiles": ["MBTiles: Spilt the map into map tiles based on MBTiles standard, and save to SQLite database. The result is the local *.mbtiles file."],
    "SVTiles": ["SVTiles: Spilt the map vector layer into vector tiles based on specific logic, and save to SQLite database. The result is the local *.svtiles file."],
    "GeoPackage": ["GeoPackage: Split the map into map tiles based on GeoPackage standard, and save to SQLite database. The result is the local *.gpkg file."],
    "GeoPackageWarning": "<br>Can not create the tile task. The map projection should be Mercator projection in the GeoPackage standard. The current map projection does not meet the requirement.",
    "OTS": ["OTS: Split the map into map tiles according to specified logic, and save to OTS database of Ali cloud. The result is identified by a storage ID."],
    "UGCV5": ["UGCV5: Split map into map tile based on SuperMap V5.0 cache strategy, and save to local disk. The result is the specified directory of local disk. It is recommended to use the default storage path."],
    "UTFGrid": ["UTFGrid: Split the map attribute into attribute tiles based on the extension UTFGrid standard, and save to rhe SQLite database. The result is local *.utfgrid file."],
    "MongoDB": ["MongoDB：Split the map into map tiles based on specific logic, and save to the configured MongoDB distributed file storage database. The tile results are identified by the storage ID. MongoDB is an open database based on document NOSQL. If you use this storage method, you should set the available MongoDB service address."],
    "MBTilesWarning": "<br>Can not create the tile task. The map projection should be Mercator projection in the MBTiles standard. The current map projection does not meet the requirement.",
    "MBTilesDpiWarning": "<br>Can not create the tile task. The map dpi should be 96 in in the MBTiles standard. The current map dpi does not meet the requirement.",
    "": [""]
};

var TileTypeRes = {
    "Image": "Image",
    "Vector": "Vector",
    "UTFGrid": "UTFGrid",
    "RealspaceImage": "3D image",
    "Terrain": "3D terrain",
    "OSGB": "OSGB model"
};

var ScaleSchemas = [
    "googleMap",
    "tiandituScales",
    "geopackageScales",
    "suggestScales",
    "userDefined"
];

var SchemaNames = {
    "userDefined": ["Custom"],
    "suggestScales": ["Recommended scale"],
    "tiandituScales": ["Tianditu"],
    "geopackageScales": ["GeoPackage scale"],
    "googleMap": ["SuperMap Cloud/Google Maps/Bing Maps"]

};

var SchemaScales = {
    "googleMap": [591658710.9091312, 295829355.4545656, 147914677.7272828, 73957338.8636414, 36978669.4318207, 18489334.71591035, 9244667.357955175, 4622333.678977587, 2311166.8394887936, 1155583.4197443968, 577791.7098721984, 288895.8549360992, 144447.9274680496, 72223.9637340248, 36111.9818670124, 18055.9909335062, 9027.9954667531, 4513.99773337655, 2256.998866688275, 1128.4994333441375],
    "tiandituScales": [591658710.9091312, 295829355.45456564, 147914677.72728282, 73957338.86364141, 36978669.431820706, 18489334.715910353, 9244667.357955176, 4622333.678977588, 2311166.839488794, 1155583.419744397, 577791.7098721985, 288895.85493609926, 144447.92746804963, 72223.96373402482, 36111.98186701241, 18055.990933506204, 9027.995466753102, 4513.997733376551, 2256.9988666882755, 1128.4994333441377],
    "suggestScales": [250000000, 125000000, 64000000, 32000000, 16000000, 8000000, 4000000, 2000000, 1000000, 500000, 250000, 125000, 64000, 32000, 16000, 8000, 4000, 2000, 1000, 500],
    "geopackageScales": [],
    "userDefined": []
};

var ProxyNodeRes = {
    proxyNodeAddress: "Address",
    proxyNodeAliases: "Alias",
    proxyNodeStatus: "Status",
    statusOnLine: "On-line",
    statusOffLine: "Off-line",
    proxyService: "Proxy Service",
    operate: "Operation",
    detailed: "Details",
    proxyNode: "Agent node",
    allProxyNode: "All nodes",
    proxiedService: "Proxy Service"
};

var bcCertsRes = {
    certName: "Certificate name",
    organization: "Organization",
    channel: "Channel",
    chainCode: "Chain code",
    status: "Status",
    operate: "Operation",
    adminCertName: "Management certificate name",
    userCertName: "User certificate name",
    bcCertName: "Blockchain certificate name",
    bcCertAlias: "Certificate alias",
    userGroupId: "User group ID",
    userGroupName: "User group Name",
    principal: "Principal",
    member: "Member",
    bindCert: "Bind certificate",
    untieCert: "Unbind certificate",
    addUser: "Add user",
    available: "Available",
    unAvailable: "Not available",
    failed: "Failed",
    invalid: "Invalid",
    userName: "User name",
    bcUserGroup: "Blockchain user group",
    addBcUserGroup: "Add blockchain user group",
    bindBcCertsToBcUsers: "Bind blockchain certificate to blockchain user",
    untieBcCertsToBcUsers: "Untie blockchain certificate to blockchain user",
    addUsersToBcUserGroup: "ADD user to blockchain user group",
    addBcUser: "Add blockchain user",
    userGroupNameIsNull: "User group name can not be null",
    userGroupPrincipalIsNull: "User group principal can not be null",
    userGroupNameInvalid: "User group name must be composed of numbers, letters, underscores or dash, and begin with a letter!",
    userGroupPrincipalInvalid: "User group principal must be composed of numbers, letters, underscores or dash, and begin with a letter!",
    userGroupDescriptionInvalid: "User Group Description contains special characters",
    selectUserGroupIsNull: "User group select item can not be null",
    selectedUnbindCerts: "The following certificates have been selected for unbinding and a blockchain user certificate can only be bind or unbind",
    selectedBindCerts: "The following certificates have been selected for binding and a blockchain user certificate can only be bind or unbind",
    selectedUnbindUserGroups: "The following user group have been selected for unbinding and a user group can only be bind or unbind",
    selectedBindUserGroups: "The following user group have been selected for binding and a user group can only be bind or unbind",
    publishService: "Publish services",
    bcAdminCerts: {
        applyUserCert: "Apply for a user certificate",
        exportCert: "Export certificate",
        importAdminCert: "Import  admin certificate",
        bcCertNameIsNull: "Certificate name can not be empty",
        bcCertFileIsNull: "Certificate file can not be empty",
        bcUserCertNameIsNull: "User certificate name can not be empty",
        bcUserCertNameInvalid: "User certificate name must be composed of numbers, letters, underscores or dash, and begin with a letter!",
        bcUserCertPwdIsNull: "User certificate password can not be empty",
        bcUserCertPwdInvalid: "User certificate password must be composed of numbers, letters, underscores or dash, and begin with a letter!",
        pwdNotEqual: "The two passwords are not equal",
        dateTimeIsNull: "Expiration time can not be empty",
        bcAdminCertDescriptionInvalid: "Management certificate description contains special characters",
        selectAdminCertsIsNull: "Admin certificate select item can not be null",
        confirmDeleteSelectedBcAdminCerts: "Are you sure you want to delete selected admin certificate rules",
    },
    bcUserCerts: {
        lockCert: "lock",
        unlockCert: "unlock",
        exportUserCert: "Export certificate",
        whether: " Whether to ",
        theCert: " the certificate ",
        bind: "bind",
        unbind: "unbind",
        user: "User",
        usergroup: "User group",
        confirmDeleteSelectedBcUserCerts: "Are you sure you want to delete selected user certificate rules",
        selectUserCertsIsNull: "User certificate select item can not be null",
        bcUserGroupSelectNotRepeat: "The user group selection can not be repeated, the following user groups can only choose to unbind or bind ",
        bcUserCertDescriptionInvalid: "User certificate description contains special characters",
    },
    users: {
        addUserGroup: "Add user group",
    }
}

var blockchainRes = {
    networkConfig: "Blockchain configuration file",
    datasourceAlise: "Data source alias",
    mustNotNull: " must not be null",
    bcCertName: "Certificate name",
    channelAndChaincode: "Channel and chaincode",
    bcCertsDetailList: "Certificate detail list",
    bcCertsUserAssociateList: "Certificate user associate list",
}

var MessageQueueRes = {
    deleteSomething: 'Delete',
    deleteMessage: "Are you sure you want to delete the selected infos?",
    deleteWithWaittingMessage: "There is uncommitted info in the selected info. Are you sure to delete?",
    operate: "Operation",
    instanceName: "Instance name",
    status: "Info status",
    commitTime: "Submission time",
    setCommitTimeTip: "Whether to set the timing submit. If set, it will submit the message in the specified time. If not, Message queue to submit in real time."
};

var TileSetDesRes = {
    mapBounds: "Map extent",
    format: "Image format",
    tileSize: "Tile size",
    scales: "Scale",
    scalesCount: "Scales count",
    transparent: "Transparent",
    yes: "Yes",
    no: "No"
};

//标点符号
var PunctuationRes = {
    Comma: ", ",//逗号
    Period: ".",//句号
    Colon: ":",//冒号
    Backquote: ")"
};

//服务类型
//仅用于manager/services及其子资源
var ServiceManagerRes = {
    'serviceUseless': 'Service not available',
    'serviceLinkUseless': 'Service link not available',
    "servicesCount": "Service count",
    "serviceInterfaces": "Service interface: ",
    "serviceRequestCount": "Visit count",
    "serviceStatisticsInfo": "Click to view details",
    "serviceStart": "Start service",
    "serviceStop": "Stop service",
    "serviceRemove": "Delete",
    "cluster": "Cluster",
    "editable": "Enable editing:",
    "mapsList": "Map list:",
    "browse": "View with ",
    "add": "Add",
    "remove": "Remove",
    "providerNamesList": "Service provider list:",
    "choosenProviders": "Selected service provider",
    "choosingProviders": "Service providers to select",
    "sureRemoveProvider": "Are you sure you want to delete this Provider?",
    "sureRemoveService": "Are you sure you want to delete this service?",
    "noservices": "No services available!",
    "batchAuthorize": "Batch Authorize",
    "authenticate": "Authorization Service",
    "unset": "Unset",
    "notSupportMapboxGL": "The current browser not support MapboxGL"
};

var ServiceManagerTypeRes = {
    "com.supermap.services.components.impl.MapImpl": "Map Services",
    "com.supermap.services.components.impl.ImageImpl": "Image Services",
    "com.supermap.services.components.impl.DataImpl": "Data Services",
    "com.supermap.services.components.impl.DataHistoryImpl": "DataHistory Services",
    "com.supermap.services.components.impl.PlotImpl": "Plotting Services",
    "com.supermap.processing.jobserver.ProcessingServer": "Distributed Analysis Services",
    "com.supermap.services.components.impl.DataCatalogImpl": "Data Catalog Services",
    "com.supermap.services.components.impl.WebPrintingImpl": "Web Printing Services",
    "com.supermap.services.components.impl.ImageImpl": "Image Services",
    "com.supermap.service.dataflow.DataFlowServiceInstance": "Data Flow Services",
    "com.supermap.processing.jobserver.StreamingServiceServer": "Stream Processing Model",
    "com.supermap.server.host.webapp.handlers.geoprocessing.GeoprocessingServer": "Processing Automation Services",
    "com.supermap.machinelearning.handler.MachineLearningServer": "Machine Learning Services",
    "com.supermap.services.components.impl.RealspaceImpl": "3D Services",
    "com.supermap.services.components.impl.TransportationAnalystImpl": "Transportation Analysis Services",
    "com.supermap.services.components.impl.TrafficTransferAnalystImpl": "Traffic Transfer Analysis Services",
    "com.supermap.services.components.impl.SpatialAnalystImpl": "Spatial Analysis Services",
    "com.supermap.services.components.impl.AddressMatchImpl": "Address Matching Services",
    "com.supermap.services.components.impl.NetworkAnalyst3DImpl": "3D Network Analysis Services",
    "com.supermap.services.components.impl.GeometryComponentImpl": "Geometry Services",
    "serviceSet": "Service Set",
    "otherServices": "Other services"
};

//配置信息中的缓存类型配置参数
//manager/services中会将provider、component中的缓存配置整合在一起，方便构建前台页面时过滤掉缓存配置参数
var ServiceCacheConfigResource = {
    "com.supermap.services.providers.UGCMapProvider": ["cacheVersion", "cacheDisabled", "preferedPNGType"],
    "com.supermap.services.providers.UGCImageServiceProvider": ["cacheEnabled"],
    "com.supermap.services.providers.UGCRealspaceProvider": ["output"],
    "com.supermap.services.providers.WMSMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.ArcGISRestMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.WMTSMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.BingMapsMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.GoogleMapsMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.TiandituMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.CloudMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.BaiduMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.OpenStreetMapProvider": ["cacheEnabled"],
    "com.supermap.services.providers.RestDataProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestPlotProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestRealspaceProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestSpatialAnalystProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestTrafficTransferAnalystProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestTransportationAnalystProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.RestAddressMatchProvider": ["useCache", "restProviderCacheConfig"],
    "com.supermap.services.providers.ShapeFileMapProvider": ["cacheDisabled"],
    "com.supermap.services.providers.DSFMapProvider": ["cacheDisabled"],
    "com.supermap.services.providers.DSFDataProvider": ["cacheDisabled"],
    "com.supermap.services.providers.PostgisMapProvider": ["cacheDisabled"],
    "com.supermap.services.providers.BlockchainMapProvider": ["cacheDisabled"]
};

var TilesetSelectResource = {
    alertMsgNullUGCV5ConfigFile: "Please select UGC5.0 tile configuration file",
    alertMsgNullSMTileFile: "Please select SMTiles file"
};

var TilesetUpdateRes = {
    UpdateTiles: "Update tile",
    alertMsgNotSelectTileset: "No selected tile set",
    alertMsgMapDoesnotHasTilecacheConfig: "There are no tile configuration in the map component",
    alertMsgTileWidthNotSame: "The widths of tiles are different. It can not update the tiles. (The input tile width is {sTileWidth}; the target tile width is {tTileWidth})",
    alertMsgTileHeightNotSame: "The Heights of tiles are different. It can not update the tiles. (The input tile height is {sTileHeight}; the target tile height is {tTileHeight})",
    alertMsgTileFormatNotSame: "The formats of tiles are different. It can not update the tiles. (The input tile format is {sTileFormat}; the target tile format is {tTileFormat})",
    alertMsgSourceTilesetScalesNull: "No scales in the tile set",
    msgOriginNotSame: "The original points of inputting tile set and target tile set are different. It can not update the tiles",
    sourceTilesetNotSet: "No inputting tile set",
    targetTilesetNotSet: "No target tile set",
    scalesNotSet: "No scales to update",
    StateMap: {
        "RUNNING": "Executing task:",
        "COMPLETED": "Task has been completed, "
    },
    SetTilesetTitle: "Set tile set"
};

var RelayServiceRes = {
    RelayTitle: "Relay agent service",
    RelayServiceURL: "Remote service URL",
    Operation: "Operation",
    Edit: "Edit",
    Up: "Improve priority",
    Down: "Reduce priority",
    Delete: "Delete",
    AddRemoteService: "Add remote service",
    EditRemoteService: "Edit remote service",
    AlreadyExists: "This remote service has already exist",
    RelayServicePriority: "Priority",
    URLIllegal: "The URL of relay service is illegal. It is should be valid URL",
    LocalPriorityMessage: "When the local and relay agent services have service with same name. if checked, It has the priority to access the local agent service.",
    ServiceURLMessage: "Remote service root path. You can get the valid address of remote service list. For example, iServer is http://{ip}:{port}/iserver/services"
};

var OneClickProxyRes = {
    NoChooseedServices: "Please select the proxy service.",
    ProxyFailed: "Failed to publish the service, please check the remote service configuration.",
    GetServiceFailed: "Failed to get the service information, please check the remote service address.",
    ServiceURLMessage: "Get the valid address of remote service list.",
    TokenTip: "Optional parameter. For example, configure the interface information that can synchronize remote service."
};

var TileDeliveryRes = {
    FALSEFILE: "Wrong file",
    RUNNING: "Performing the task: ",
    STOPPED: "Task has been suspended, ",
    WAITTING: "Task is waiting, ",
    COMPLETED: "Task has been finished, ",
    WAIT: "Task is waiting",
    EXCEPTED: "Task exception",
    RESTARTTASK: "whether to restart the task?",
    NodeDescription: "Node: {x}; Service: {y}; Cache bounds: {z}",
    NodeRealspaceDescription: "Node: {x}; Tile storage: {y}; Cache bounds: {z}",
    NodeHistoryDescription: "Start time: {z}; Running time: {a}; Total: {x}; Finished: {y};",
    WaitingDescription: "Waiting...",
    CalculationDescription: "Calculating",
    Second: "seconds",
    CountPerSecond: "per second",
    RunTime: "Running time:",
    Speed: "Speed: ",
    Finish: "Finished: ",
    ZhangAndAll: ' (Total:',
    Zhang: ' ',
    ChooseCache: 'Please select the caches',
    ChooseNode: 'Please select the distribution node',
    ChooseService: 'Please select the distribution service',
    WrongBounds: 'The format of distribution range is error. It should be {left},{bottom},{right},{top}',
    AddNode: 'Add the target node',
    EditNode: 'Modify the target node',
    DeleteNode: 'Are you sure to delete this node?',
    TargetNode: 'Target node',
    TargetService: 'Target service',
    TargetBounds: 'Cache range',
    TargetScales: 'Cache scale',
    Operation: 'Operation',
    Rectangle: 'Rectangle',
    KMLFile: 'KML file',
    XMLFile: 'XML file',
    JSONFile: 'JSON file',
    ScheduledTask: 'Timing task',
    WrongScheduledSetting: 'Timing distribution configuration is error',
    1: 'Sunday',
    2: 'Monday',
    3: 'Tuesday',
    4: 'Wednesday',
    5: 'Thursday',
    6: 'Friday',
    7: 'Saturday',
    NUll: 'None',
    RealspaceTip: "3D cache only supports MongoDB storage, please configure the distributed tile library in node.",
    ExistNodeMsg: "The current distributed node and service already exist.",
    RemainingTimeDesDay: '{x}days, {y} hours, {z} minutes',
    RemainingTimeDesHour: '{y} hours, {z} minutes',
    RemainingTimeDesMinute: '{z} minutes',
    RemainingTimeDesSecond: '{k} seconds',
    PleaseSelectCache: 'Please Select Cache',
    PleaseEnteriEdgeAddress: 'Please Enter iEdge Address',
    TargetAddress: 'Target Address ',
    CorrectedAddress: ' not avilable,please ensure the address : {ip}:{port}, such as 127.0.0.1:8290',
    PleaseEnter3DCacheServiceName: 'Please Enter 3DCache ServiceName',
    Service: 'service ',
    NotExist: ' not exist',
};

var ScheduledTaskRes = {
    ExecuteInfo_Week: '{x}  {y} execute task every week',
    ExecuteInfo_Day: '{y} execute task every day',
    ExecuteInfo_Date: '{x}  {y} execute task'
};

var AGSNetworkRes = {
    Token: 'The Token to access ArcGIS REST service.',
    HTTPReferer: 'This value needs to be set when using Token in the format of HTTP Referer.'
};

//地图类型的提供者，设置该值可以控制添加地图组件时过滤的Provider列表
var MapProviders = [utilityRes.localMapProvider, utilityRes.WMSMapProvider, utilityRes.WMTSMapProvider
    , utilityRes.ArcGISRestMapProvider, providerRes.providerTypeArcGISCache, providerRes.providerTypeArcGISCacheV2, utilityRes.SMTilesMapProvider, utilityRes.ZXYTilesMapProvider, utilityRes.RESTMapProvider
    , utilityRes.aggregationMapProvider, utilityRes.clusterMapProvier, utilityRes.GDPMapProvider, utilityRes.MultiTilesMapProvider
    , utilityRes.BingMapsMapProvider, utilityRes.GoogleMapsMapProvider, utilityRes.TiandituMapProvider, utilityRes.CloudMapProvider, utilityRes.BaiduMapProvider, utilityRes.OpenStreetMapProvider
    , utilityRes.TPKMapProvider, utilityRes.TPKXMapProvider, utilityRes.VTPKMapProvider, utilityRes.SVTilesMapProvider, utilityRes.MVTTilesMapProvider
    , providerRes.providerTypeUGCV5, providerRes.providerTypeMongoDB, providerRes.providerTypeFastDFS, providerRes.providerTypeGeopkgMap
    , providerRes.providerTypeMongoDBMvt, utilityRes.ShapeFileMapProvider, utilityRes.DSFMapProvider, utilityRes.PostgisMapProvider, utilityRes.BlockchainMapProvider];
//数据类型的提供者，设置该值可以控制添加数据组件或聚合数据提供者时过滤的Provider列表
var DataProviders = [utilityRes.localDataProvider, utilityRes.WFSDataProvider, utilityRes.aggregationDataProvider, utilityRes.RESTDataProvider, utilityRes.GeoPackageDataProvider, utilityRes.ArcGISRestDataProvider,
    utilityRes.ShapeFileDataProvider, utilityRes.PostgisDataProvider, utilityRes.ElasticsearchDataProvider, utilityRes.BlockchainDataProvider, utilityRes.DSFDataProvider];

var MethodStatistics = {
    'notClickMe': 'Not available method!',
    'disabled': 'Disable successfully! (Take effect after restarting)',
    'enabled': 'Open successfully! (Take effect after restarting)',
    'getDetail': 'View',
    'requestURL': 'Request address',
    'requestTime': 'Request time',
    'revokeCount': 'Calling number',
    'id': 'ID',
    'methodDescription': 'Description',
    'cost': 'Time cost(ms)',
    'isError': 'exception?'
};

//节点监控
var MonitorNodesRes = {
    nodeOffline: 'NodeOffline',
    column_Alias: 'Alias',
    column_Address: 'Address',
    cloumn_Enabled: 'Operate',
    column_CpuRatio: 'CPU usage',
    column_MemRatio: 'Memory usage/total (usage)',
    column_AccessCount: 'Service access',
    column_UnreadExceptionCount: 'Total number of unread anomalies',
    column_Edit: 'Edit',
    startMonitor: 'Start monitor',
    stopMonitor: 'Stop monitor',
    notSelectAnyNode: 'Did not select any servers',
    deleteConfirm: 'Are you sure you want to delete the selected servers?',
    addMonitorNode: 'Add GIS server',
    editMonitorNode: 'Edit the GIS server',
    accessStatistics_Day: '1 day',
    accessStatistics_Week: '7 days',
    accessStatistics_Month: '30 days',
    accessStatistics_Year: '12 months',
    addressLack: 'Service address is required.',
    addressNotURL: 'Service url is not the valid url.',
    addressOfflineOrInvalid: 'Service address can not access or irregular',
    nodeAliasLack: 'Server alias is required.',
    managerAccountLack: 'The administrator account is required.',
    managerPasswordLack: 'Administraor account password is the required.',
    addressDuplicate: 'Service address has been added.',
    managerAccountPassInValid: 'Administrator account or password are not correct.',
    managerAccountPassInValidOrCloudNativeEnvInvalid: 'Administrator account or password is not correct, or cloud native environment is abnormal.',
    portalnotProxy: 'You can not publish any services by node server until enable the agent in iPortal.',
    nodeAliasDuplicate: 'Server Aias has been used.',
    alreadyMonitored: "Monitored",
    servicePrecheckAvailable: "Precheck server",
    alreadyHosted: "Hosted",
    status_yes: "Yes",
    status_no: "No",
    hostedServerHasLowerVersion: 'Host server version is lower than 8.0.2, and you need to confirm the storage configuration of the host server manually. Please ignore the message if the configuration is correct.',
    serverIsUnder8C: "Server version is lower than 8C, cannot be monitored.",
    serverIsUnder7C: "Server version is lower than 7C, cannot be hosted.",
    deployRabbitmqFailed: "Rabbit message server configuration failed, server cannot enable monitoring.",
    notSelectAnyNews: "No message records selected"
};

var MonitorNodeRes = {
    accessCount: 'Access times: ',
    labelMemRatio: 'Memory usage',
    labelCpuRatio: 'CPU usage',
    accessCounts: 'Access times',
    accessHourUnit: ' (Unit:  /per hour)',
    accessDayUnit: ' (Unit: /per day)',
    accessMonthUnit: ' (Unit: /per month)',
    ratioYTitle: 'Usage rate (unit: percentage)',
    endLargerThanStart: 'End time must be greater than start time.',
    timeRangeLargerThan30Days: 'Time range cannot exceed 30 days.',
    startTimeIsNull: 'Satrt time is empty.',
    endTimeIsNull: 'End time is empty.',
    lastMonth: 'last month',
    nextMonth: 'next month',
    time: 'time',
    internalStorage: 'internal storage',
    deployRabbitFail: "Failed to deploy Rabbit message server.",
    senderOrReceiverIsUsing: "Cannot be modified bacause the message server configuration is in use."
};
var MonitorMQServerRes = {
    validSetting: 'Valid setting,you can connect to the message server.',
    invalidSetting: 'Invalid setting,please check the arguments.',
    saveConfigFailed: 'Configuration save failed,please stop monitor and then modify and save the configuration of message server.',
    necessaryArgument: 'Necessary argument',
    canNotBeNull: 'Can not be null',
    msgServerHostBeSetAs: 'When the message server host is set as',
    canNotAccessServer: ',local child servers can not access message server,please changed it to ip address.',
    appointAnotherUserWhenUserNameIsGuset: 'When user name is set as "guest" local child servers can not access message server,please changed it to ip address',
    invalidMsgServerPort: 'Invalid message server port, it should be an integer.'
};
var MonitorAlarmConfigsRes = {
    applyNodeIds: 'Server alias',
    configRules: 'Rules enabled',
    editAlarmConfig: 'Edit',
    hardware: 'Hardware resource occupied',
    instanceAccess: 'Service access',
    nodeServer: 'Server connection and service log',
    systemAlarmConfig: 'Server without custom rules',
    addAlarmDialog: 'Add custom alarm rule',
    notSelectAnyConfig: 'No alarm rule selected',
    deleteConfirm: 'Are you sure you want to delete selected alarm rules?',
    editAlarmDialog: 'Modify custom alarm rule',
    configZeroRule: 'No rules enabled',
    needNumber: 'Please input number',
    ratioThreshold: 'Threshold ranges from 0 to 100',
    positiveInteger: 'Please input positive integer',
    cpuSeverityGTWarn: 'CPU seroius warning threshold must be larger than that of warn',
    memSeverityGTWarn: 'Memory seroius warning threshold must be larger than that of warn',
    selectedNodeIdsIsNull: 'Selected server cannot be null',
    configConflictWord: 'Wait',
    configConflictTip: 'Node already has warning rules configured. Are you sure to apply new warn rules to node? <br><br>Click Yes to apply new warning rules and No to continue editing.',
    configApplyToZeroNode: 'Not assigned to any node',
    selectedRulesIsNull: 'Please select at leaset one type of warning rules'
};
var MonitorExceptionsRes = {
    column_nodeAliasOrAddress: 'Server alias and address',
    column_exType: 'Exception type',
    column_exLevel: 'Exception level',
    column_exStatus: 'Exception status',
    column_exOccurTime: 'Occur time',
    column_operation: 'Operation',
    unread: 'Unread',
    read: 'Read',
    allStatus: 'All',
    warning: 'Warning',
    severity: 'Serious warning',
    hardwareUtilization: 'Hardware resource occupied',
    serverConnection: 'Server connection',
    nodeServices: 'Service log',
    instanceAccess: 'Service access',
    viewExDetail: 'View'
};
var MonitorReceiverRes = {
    queueNecessary: 'Queue name is requried.'
};
var PortalManagerRootRes = {
    time: 'Time',
    totalCountFail_maps: 'Failed to get the map count!',
    totalCountFail_services: "Failed to get the service count!",
    totalCountFail_apps: "Failed to get the application count!",
    totalCountFail_groups: "Failed to get the group count!",
    totalCountFail_dataitems: "Failed to get the data count!",
    totalCountFail_scenes: "Failed to get the scene count!",
    totalCountFail_servicesNeedCheck: "Failed to get the pending audit count!",
    totalCountFail_mapsNeedCheck: "Failed to get the total number of maps for auditing!",
    totalCountFail_usersNeedCheck: "Failed to get the total number of users for auditing!",
    totalCountFail_users: "Failed to get the iPortal user count!",
    getMonitorLiveInfoFail: "Failed to get the real-time info of monitoring node!",
    jtopoAlarm_warning: "Warning",
    jtopoAlarm_severity: "Serious warning",
    jtopoAlarm_offline: "Offline",
    accessGraphYTitle: "Page view(/hour)",
    mqServerStatus_get_Failed: "Failed to get message server status!",
    mqServerStatus_ok: "Available",
    mqServerStatus_invalid: "Unavailable",
    session_lost: "Current session has expired,please login!",
    mqReceiverEnabled_get_failed: "Failed to get monitor setting information.",
    todoTitle: "Pending Items",
    youHave: "You currently have",
    needCheck: " to be audited.",
    todoMapItems: " maps",
    todoServiceItems: " services",
    todoUserItems: " users"
};
var MonitorHostedNodesRes = {
    column_alias: "Server Alias",
    column_address: "Server address",
    column_hostedServices: "Managed service",
    notHostedService: "Unmanaged any services",
    search_title: "Alias/address/services name"
};

//多节点管理
var MultiworkersRes = {
    updateConfim: 'Are you sure you want to modify multi-node settings?',
    restartAfterDisabled: 'Disable multi-thread mode will take effect only when iServer restarts',
    restartAfterEnabled: 'Enable multi-thread mode will take effect only when iServer restarts',
    restartAfterPortUpdated: 'Port range change will take effect only when iServer restarts',
    pleaseWaitPatient: 'After multi-node configuration change, you need to taks a relatively long time for service migration, please wait patiently',
    operationIsPerformming: 'Operation in process',
    port: 'port',
    servicesCount: 'services count'
};
var ProxyNetworkSegmentRes = {
    LBTitle: "Segment settings",
    ClientIP: "Client segment",
    Operation: "Operation",
    Edit: "Edit",
    Up: "Up",
    Down: "Down",
    Delete: "Delete",
    AddLBConfig: "Add segment",
    EditLBConfig: "Edit segment",
    Priority: "Priority",
    SegmentNotNull: "Client segment cannot be null.",
    NodeNotNull: "Proxy node cannot be null."
};
var CloudLicense = {
    title_logout: "Logout",
    msg_logout: "Logout will delete and return the current license. Please make sure that you can access the license server!",
    title_offline: "Offline",
    msg_offline: "Offline will delete and return the current license.  Please make sure that you can access the license server!",
    title_online: "Online",
    title_useable: "Available",
    msg_online: "Online will delete and return the current license.  Please make sure that you can access the license server!",
    msg_loginFailed: "Cloud license login failed!",
    msg_enterUserNameAndPassword: "Please enter your user name and password!",
    msg_userNameOrPasswordError: "Login failed. Please check the user name and password!",
    msg_authorizerFailed: "Authorization failed!",
    msg_activateFailed: "License activation failed!",
    msg_logoutFailed: "Logout failed!",
    productInfo: "Product info: ",
    licenseModule: "License module: ",
    remainingTime: "Time remaining: ",
    licenseStatus: "License status: ",
    remainingDays: ", remaining days: ",
    msg_noLicense: "No available license",
    staffLicense: "Staff License",
    iServerAdvanced: "iServer Advanced",
    iPortalAdvanced: "iPortal Advanced",
    unlimited: "Unlimited"
};
var CloudLicenseModuleNames = {
    "试用许可": "SuperMap trial license"
};
var CloudLicenseProductInfos = {
    "试用版": "SuperMap trial version"
};
var SparkServerRes = {
    "configureSpark": "Need to Configure Spark",
    "ensureConfigureSpark": " ensure configure spark?",
    "configureSparkSucceed": "configure spark succeed!",
    "configureSparkFailed": "configure spark failed!",
    "reason": "reason:"
};
var StringmingSerivceRes = {
    "serviceName": "Service name",
    "configFilePath": "Configuration file address",
    "configContent": "Configuration information",
    "notNull": " can not be null!",
    "createServiceFailed": "Create service failed"
};
var StreamingApplicationRes = {
    NotRunning: "Not Running",
    Running: "Running",
    RunningFailed: "Startup Failed"
};
var ProductType = {iPortal: "iPortal", iServer: "iServer", iEdge: "iEdge"};
var datasetFileterProvider = {
    Open: "More",
    Close: "Close",
    Datasource: "Datasource",
    DatasourceTitle: ""
};

var imageServiceRes = {
    "configureImageServiceTitle": "Configure Image Service",
    "configureImageCollectionTitle": "Configure Image Collection",
    "alertImageServiceID":"Service name can not be null",
    "alertImageServiceDes":"Service Description can not be null",
    "alertCollectionID":"Collection ID can not be null",
    "alertTitle":"Title can not be null",
    "alertEPGGCode":"EPSG code can not be null",
    "alertFilePath":"Image file path can not be null",
    "alertDirPath":"Directory path can not be null",
    "alertListPath":"List files path can not be null",
    "alertDatasourcePath":"Datasource file path can not be null",
    "alertServer":"Server can not be null",
    "alertDatabase":"Datasource name can not be null",
    "alertUser":"User name can not be null",
    "alertPassword":"Password can not be null",
    "alertImageStyle":"Image display style template can not be null",
    "alertFileType":"File type can not be null",
    "alertDatasetName":"Dataset name can not be null",
    "alertChooseFile":"Please select file",
    //影像服务相关
    "COMPACT": "Compact Cache",
    "ORIGINAL": "Original Cache",
    "MONGODB": "MongoDB Cache",
    "storageDirectory":"Storage Directory",
    "datasourcePath":"Datasource Path",
    "datasetName":"Dataset Name",
    "dataBaseType":"DataBase Type",
    "datasourceType":"Datasource Type",
    "imageFilePath":"ImageFile Path",
    "listFilePath":"ListFile Path",
    "UDBX": "UDBX",
    "POSTGIS": "POSTGIS",
    "POSTGRESQL": "POSTGRESQL",
    "imageDirectoryPath":"ImageDirectory Path",
    "FileType":"FileType",
    "imgFile":"IMG File",
    "ecwFile":"ECW File",
    "tiffFile":"TIFF File",
    "ImageSearch":"Image Search",
    "confirmTile":"Prompt",
    "confirmWhetherToSave" : "The following configuration of the image service provider cannot be modified after being saved, please confirm whether to save it",
    "tilestorageConfiguration" : "1. Tile storage configuration: including storage type and storage directory.",
    "imagecollectionConfiguration" : "2. Image collection configuration, including: collection ID, coordinate system reference, image data configuration, image collection tile scheme.",
    "isSearchSubfolders" : "Search Subfolders",
    "fileBrowser":"File Browser",
    "Add":"Add",
    "Delete":"Delete",
    "uploadTemplate" : "Upload Template...",
    "ServerPath" : "ServerPath",
    "ServerPath" : "ServerPath",
    "User" : "User",
    "Password" : "Password",
    "dataBaseType" : "dataBaseType",
    "SINGLEFILE" : "SINGLEFILE",
    "IMAGEFOLDER" : "IMAGEFOLDER",
    "LISTFILE" : "LISTFILE",
    "DATASET" : "DATASET",
}

var geoProcessRes = {
    "geoProcess": "Processing Automation (WebUI):",
    "serviceName": "processing automation"
}

var listServiceRes = {
    "serviceAlias": "Service Alias",
    "serviceName": "Service Name",
    "serviceInterfaceType": "Service Interface Type",
    "serviceComponentType": "Service Component Type",
    "serviceStatus": "Service Status",
    "service": "Service",
    "otherServices": "Other Services",
    "allServices": "All Services",
    "created": "Created",
    "started": "Started",
    "noServices": "No data retrieved!",
    "nodata": "No Data",
    "allInterfaces": "All Service Interface Types",
    "lengthErrMsg": "This field cannot exceed 1,000 characters",
    "CRLFErrMsg": "Line breaks and carriage returns are not allowed"
}

var imageCaptchaRes = {
    nullCaptcha: "Verification cannot be empty.",
    enterCaptchaError: "Please enter the correct verification code, case insensitive.",
    tooManyCaptchaRequests: "Too frequent request, please try again later."
};
