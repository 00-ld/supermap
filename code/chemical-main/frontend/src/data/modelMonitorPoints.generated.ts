// 本文件由 scripts/generate-model-monitor-points.cjs 自动生成，勿手改。
// 数据源：public/data/DevicePoint_2D.geojson（iServer MonitorPoints_4490，
// 模型绑定点位，Wgs84 经纬高）。气体点位高低位同坐标配对去重后保留低位。
// 坐标已换算为算法系（x=east+80, y=-north+420，见 supermapGeoreference.js ALGORITHM_FRAME）。

export interface ModelMonitorPoint {
  id: string
  modelName: string
  facilityId: string
  sensorModel: string
  x: number
  y: number
  mapPoint: { x: number; y: number }
  priority: number
  risk: number
  installationHeight: number
  effectiveRange: number
  observedProps: string
  gasCodes: string[]
  wgs84: { longitude: number; latitude: number }
  alarmLow: number
  alarmHigh: number
}

export const MODEL_MONITOR_POINTS: ModelMonitorPoint[] = [
  {
    "id": "EQ-001L",
    "modelName": "EQUIPMENT_0200",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 563,
    "y": 165,
    "mapPoint": {
      "x": 563,
      "y": 165
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541058,
      "latitude": 34.820968
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-002L",
    "modelName": "EQUIPMENT_0202",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 566,
    "y": 164,
    "mapPoint": {
      "x": 566,
      "y": 164
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541085,
      "latitude": 34.820972
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-003L",
    "modelName": "EQUIPMENT_0205",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 552,
    "y": 143,
    "mapPoint": {
      "x": 552,
      "y": 143
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540939,
      "latitude": 34.821165
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-004L",
    "modelName": "EQUIPMENT_0206",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 552,
    "y": 161,
    "mapPoint": {
      "x": 552,
      "y": 161
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54094,
      "latitude": 34.821002
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-005L",
    "modelName": "EQUIPMENT_0297",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 46,
    "y": 172,
    "mapPoint": {
      "x": 46,
      "y": 172
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535403,
      "latitude": 34.820899
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-006L",
    "modelName": "EQUIPMENT_0299",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 49,
    "y": 172,
    "mapPoint": {
      "x": 49,
      "y": 172
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53543,
      "latitude": 34.820903
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-007L",
    "modelName": "EQUIPMENT_0301",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 36,
    "y": 168,
    "mapPoint": {
      "x": 36,
      "y": 168
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535285,
      "latitude": 34.820933
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-008L",
    "modelName": "EQUIPMENT_0305",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 36,
    "y": 150,
    "mapPoint": {
      "x": 36,
      "y": 150
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535285,
      "latitude": 34.821096
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-009L",
    "modelName": "EQUIPMENT_0314",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 85,
    "y": 349,
    "mapPoint": {
      "x": 85,
      "y": 349
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535828,
      "latitude": 34.819313
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-010L",
    "modelName": "EQUIPMENT_0316",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 86,
    "y": 352,
    "mapPoint": {
      "x": 86,
      "y": 352
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535835,
      "latitude": 34.819282
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-011L",
    "modelName": "EQUIPMENT_0319",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 116,
    "y": 333,
    "mapPoint": {
      "x": 116,
      "y": 333
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536168,
      "latitude": 34.819453
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-012L",
    "modelName": "EQUIPMENT_0320",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 91,
    "y": 333,
    "mapPoint": {
      "x": 91,
      "y": 333
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535887,
      "latitude": 34.819452
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-013L",
    "modelName": "EQUIPMENT_0988",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 101,
    "y": 257,
    "mapPoint": {
      "x": 101,
      "y": 257
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536004,
      "latitude": 34.820138
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-014L",
    "modelName": "EQUIPMENT_0553",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 656,
    "y": 406,
    "mapPoint": {
      "x": 656,
      "y": 406
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54207,
      "latitude": 34.818801
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-015L",
    "modelName": "EQUIPMENT_0554",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 597,
    "y": 465,
    "mapPoint": {
      "x": 597,
      "y": 465
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541432,
      "latitude": 34.81827
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-016L",
    "modelName": "EQUIPMENT_0555",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 594,
    "y": 465,
    "mapPoint": {
      "x": 594,
      "y": 465
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5414,
      "latitude": 34.81827
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-017L",
    "modelName": "EQUIPMENT_0556",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 595,
    "y": 479,
    "mapPoint": {
      "x": 595,
      "y": 479
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541401,
      "latitude": 34.818144
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-018L",
    "modelName": "EQUIPMENT_0557",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 597,
    "y": 479,
    "mapPoint": {
      "x": 597,
      "y": 479
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541433,
      "latitude": 34.818144
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-019L",
    "modelName": "EQUIPMENT_0558",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 322,
    "mapPoint": {
      "x": 748,
      "y": 322
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543077,
      "latitude": 34.819551
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-020L",
    "modelName": "EQUIPMENT_0559",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 745,
    "y": 322,
    "mapPoint": {
      "x": 745,
      "y": 322
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543045,
      "latitude": 34.81955
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-021L",
    "modelName": "EQUIPMENT_0560",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 745,
    "y": 339,
    "mapPoint": {
      "x": 745,
      "y": 339
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543046,
      "latitude": 34.819403
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-022L",
    "modelName": "EQUIPMENT_0561",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 339,
    "mapPoint": {
      "x": 748,
      "y": 339
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543078,
      "latitude": 34.819403
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-023L",
    "modelName": "EQUIPMENT_1062",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 935,
    "y": 163,
    "mapPoint": {
      "x": 935,
      "y": 163
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545131,
      "latitude": 34.820978
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-024L",
    "modelName": "EQUIPMENT_1089",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 477,
    "y": 292,
    "mapPoint": {
      "x": 477,
      "y": 292
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540119,
      "latitude": 34.81982
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-025L",
    "modelName": "EQUIPMENT_3135",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 515,
    "y": 267,
    "mapPoint": {
      "x": 515,
      "y": 267
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540535,
      "latitude": 34.820049
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-026L",
    "modelName": "EQUIPMENT_0692",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 901,
    "y": 195,
    "mapPoint": {
      "x": 901,
      "y": 195
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544756,
      "latitude": 34.820693
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-027L",
    "modelName": "EQUIPMENT_0693",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 871,
    "y": 195,
    "mapPoint": {
      "x": 871,
      "y": 195
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544428,
      "latitude": 34.820692
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-028L",
    "modelName": "EQUIPMENT_0694",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 871,
    "y": 177,
    "mapPoint": {
      "x": 871,
      "y": 177
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544421,
      "latitude": 34.820854
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-029L",
    "modelName": "EQUIPMENT_0695",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 894,
    "y": 177,
    "mapPoint": {
      "x": 894,
      "y": 177
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544677,
      "latitude": 34.820855
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-030L",
    "modelName": "EQUIPMENT_0696",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 51,
    "mapPoint": {
      "x": 772,
      "y": 51
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543343,
      "latitude": 34.821986
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-031L",
    "modelName": "EQUIPMENT_0697",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 795,
    "y": 51,
    "mapPoint": {
      "x": 795,
      "y": 51
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543598,
      "latitude": 34.821987
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-032L",
    "modelName": "EQUIPMENT_0698",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 818,
    "y": 51,
    "mapPoint": {
      "x": 818,
      "y": 51
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543843,
      "latitude": 34.821988
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-033L",
    "modelName": "EQUIPMENT_0699",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 76,
    "mapPoint": {
      "x": 772,
      "y": 76
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543344,
      "latitude": 34.82176
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-034L",
    "modelName": "EQUIPMENT_0700",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 802,
    "y": 76,
    "mapPoint": {
      "x": 802,
      "y": 76
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543672,
      "latitude": 34.821761
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-035L",
    "modelName": "EQUIPMENT_0701",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 831,
    "y": 76,
    "mapPoint": {
      "x": 831,
      "y": 76
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543993,
      "latitude": 34.821762
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-036L",
    "modelName": "EQUIPMENT_0702",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 742,
    "y": 188,
    "mapPoint": {
      "x": 742,
      "y": 188
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543013,
      "latitude": 34.820758
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-037L",
    "modelName": "EQUIPMENT_0703",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 188,
    "mapPoint": {
      "x": 772,
      "y": 188
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543339,
      "latitude": 34.820759
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-038L",
    "modelName": "EQUIPMENT_0704",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 743,
    "y": 163,
    "mapPoint": {
      "x": 743,
      "y": 163
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543027,
      "latitude": 34.820979
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-039L",
    "modelName": "EQUIPMENT_0705",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 761,
    "y": 163,
    "mapPoint": {
      "x": 761,
      "y": 163
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543221,
      "latitude": 34.820978
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-040L",
    "modelName": "EQUIPMENT_0794",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 242,
    "y": 155,
    "mapPoint": {
      "x": 242,
      "y": 155
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537542,
      "latitude": 34.821053
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-041L",
    "modelName": "EQUIPMENT_0799",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 242,
    "y": 132,
    "mapPoint": {
      "x": 242,
      "y": 132
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537541,
      "latitude": 34.821256
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-042L",
    "modelName": "EQUIPMENT_0800",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 188,
    "y": 102,
    "mapPoint": {
      "x": 188,
      "y": 102
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536958,
      "latitude": 34.821529
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-043L",
    "modelName": "EQUIPMENT_0879",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 243,
    "y": 330,
    "mapPoint": {
      "x": 243,
      "y": 330
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53755,
      "latitude": 34.819479
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-044L",
    "modelName": "EQUIPMENT_0884",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 243,
    "y": 353,
    "mapPoint": {
      "x": 243,
      "y": 353
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537552,
      "latitude": 34.819276
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-045L",
    "modelName": "EQUIPMENT_0885",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 190,
    "y": 384,
    "mapPoint": {
      "x": 190,
      "y": 384
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536972,
      "latitude": 34.818998
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-046L",
    "modelName": "EQUIPMENT_0948",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 256,
    "y": 421,
    "mapPoint": {
      "x": 256,
      "y": 421
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537699,
      "latitude": 34.818668
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-047L",
    "modelName": "EQUIPMENT_0949",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 256,
    "y": 423,
    "mapPoint": {
      "x": 256,
      "y": 423
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537699,
      "latitude": 34.818644
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-048L",
    "modelName": "EQUIPMENT_0954",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 259,
    "y": 331,
    "mapPoint": {
      "x": 259,
      "y": 331
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53773,
      "latitude": 34.81947
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-049L",
    "modelName": "EQUIPMENT_0955",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 256,
    "y": 332,
    "mapPoint": {
      "x": 256,
      "y": 332
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537697,
      "latitude": 34.819465
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-050L",
    "modelName": "EQUIPMENT_0957",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 258,
    "y": 159,
    "mapPoint": {
      "x": 258,
      "y": 159
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537722,
      "latitude": 34.821016
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-051L",
    "modelName": "EQUIPMENT_0959",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 255,
    "y": 160,
    "mapPoint": {
      "x": 255,
      "y": 160
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537689,
      "latitude": 34.821011
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-052L",
    "modelName": "EQUIPMENT_1023",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 384,
    "y": 314,
    "mapPoint": {
      "x": 384,
      "y": 314
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539092,
      "latitude": 34.819626
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-053L",
    "modelName": "EQUIPMENT_1026",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 411,
    "y": 317,
    "mapPoint": {
      "x": 411,
      "y": 317
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539397,
      "latitude": 34.819602
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-054L",
    "modelName": "EQUIPMENT_1027",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 420,
    "y": 317,
    "mapPoint": {
      "x": 420,
      "y": 317
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53949,
      "latitude": 34.819594
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-055L",
    "modelName": "EQUIPMENT_1033",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 418,
    "y": 327,
    "mapPoint": {
      "x": 418,
      "y": 327
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539471,
      "latitude": 34.819508
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "EQ-056L",
    "modelName": "EQUIPMENT_1052",
    "facilityId": "production-area",
    "sensorModel": "fixed-gas-low",
    "x": 418,
    "y": 331,
    "mapPoint": {
      "x": 418,
      "y": 331
    },
    "priority": 1,
    "risk": 0.8,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539471,
      "latitude": 34.819474
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-001L",
    "modelName": "TANK_002",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 577,
    "y": 83,
    "mapPoint": {
      "x": 577,
      "y": 83
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541206,
      "latitude": 34.821697
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-002L",
    "modelName": "TANK_004",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 577,
    "y": 97,
    "mapPoint": {
      "x": 577,
      "y": 97
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541206,
      "latitude": 34.821572
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-003L",
    "modelName": "TANK_005",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 563,
    "y": 164,
    "mapPoint": {
      "x": 563,
      "y": 164
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541058,
      "latitude": 34.820969
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-004L",
    "modelName": "TANK_006",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 182,
    "mapPoint": {
      "x": 544,
      "y": 182
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540846,
      "latitude": 34.820811
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-005L",
    "modelName": "TANK_007",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 566,
    "y": 197,
    "mapPoint": {
      "x": 566,
      "y": 197
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541093,
      "latitude": 34.82068
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-006L",
    "modelName": "TANK_008",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 576,
    "y": 147,
    "mapPoint": {
      "x": 576,
      "y": 147
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541197,
      "latitude": 34.821128
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-007L",
    "modelName": "TANK_009",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 566,
    "y": 179,
    "mapPoint": {
      "x": 566,
      "y": 179
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541092,
      "latitude": 34.820836
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-008L",
    "modelName": "TANK_010",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 557,
    "y": 151,
    "mapPoint": {
      "x": 557,
      "y": 151
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540985,
      "latitude": 34.821089
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-009L",
    "modelName": "TANK_012",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 545,
    "y": 130,
    "mapPoint": {
      "x": 545,
      "y": 130
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540855,
      "latitude": 34.82128
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-010L",
    "modelName": "TANK_013",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 678,
    "y": 65,
    "mapPoint": {
      "x": 678,
      "y": 65
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542314,
      "latitude": 34.821859
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-011L",
    "modelName": "TANK_015",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 678,
    "y": 63,
    "mapPoint": {
      "x": 678,
      "y": 63
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542313,
      "latitude": 34.821878
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-012L",
    "modelName": "TANK_016",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 564,
    "y": 153,
    "mapPoint": {
      "x": 564,
      "y": 153
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541062,
      "latitude": 34.821068
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-013L",
    "modelName": "TANK_017",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 678,
    "y": 81,
    "mapPoint": {
      "x": 678,
      "y": 81
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542315,
      "latitude": 34.821719
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-014L",
    "modelName": "TANK_019",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 678,
    "y": 83,
    "mapPoint": {
      "x": 678,
      "y": 83
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542314,
      "latitude": 34.8217
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-015L",
    "modelName": "TANK_020",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 652,
    "y": 373,
    "mapPoint": {
      "x": 652,
      "y": 373
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542025,
      "latitude": 34.819099
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-016L",
    "modelName": "TANK_022",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 373,
    "mapPoint": {
      "x": 654,
      "y": 373
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542048,
      "latitude": 34.819099
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-017L",
    "modelName": "TANK_023",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 636,
    "y": 373,
    "mapPoint": {
      "x": 636,
      "y": 373
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541854,
      "latitude": 34.819098
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-018L",
    "modelName": "TANK_025",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 634,
    "y": 373,
    "mapPoint": {
      "x": 634,
      "y": 373
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541832,
      "latitude": 34.819098
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-019L",
    "modelName": "TANK_026",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 46,
    "y": 172,
    "mapPoint": {
      "x": 46,
      "y": 172
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535403,
      "latitude": 34.820901
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-020L",
    "modelName": "TANK_027",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 59,
    "y": 154,
    "mapPoint": {
      "x": 59,
      "y": 154
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535542,
      "latitude": 34.82106
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-021L",
    "modelName": "TANK_028",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 50,
    "y": 187,
    "mapPoint": {
      "x": 50,
      "y": 187
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535438,
      "latitude": 34.820767
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-022L",
    "modelName": "TANK_032",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 48,
    "y": 203,
    "mapPoint": {
      "x": 48,
      "y": 203
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53542,
      "latitude": 34.820624
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-023L",
    "modelName": "TANK_030",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 40,
    "y": 159,
    "mapPoint": {
      "x": 40,
      "y": 159
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53533,
      "latitude": 34.82102
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-024L",
    "modelName": "TANK_031",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 27,
    "y": 190,
    "mapPoint": {
      "x": 27,
      "y": 190
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535191,
      "latitude": 34.820742
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-025L",
    "modelName": "TANK_033",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 47,
    "y": 161,
    "mapPoint": {
      "x": 47,
      "y": 161
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535408,
      "latitude": 34.820999
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-026L",
    "modelName": "TANK_034",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 28,
    "y": 137,
    "mapPoint": {
      "x": 28,
      "y": 137
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5352,
      "latitude": 34.821211
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-027L",
    "modelName": "TANK_040",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 354,
    "y": 39,
    "mapPoint": {
      "x": 354,
      "y": 39
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538774,
      "latitude": 34.822093
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-028L",
    "modelName": "TANK_057",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 354,
    "y": 42,
    "mapPoint": {
      "x": 354,
      "y": 42
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538764,
      "latitude": 34.822071
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-029L",
    "modelName": "TANK_059",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 85,
    "y": 349,
    "mapPoint": {
      "x": 85,
      "y": 349
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535831,
      "latitude": 34.819313
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-030L",
    "modelName": "TANK_060",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 60,
    "y": 321,
    "mapPoint": {
      "x": 60,
      "y": 321
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535556,
      "latitude": 34.819562
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-031L",
    "modelName": "TANK_061",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 111,
    "y": 367,
    "mapPoint": {
      "x": 111,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536106,
      "latitude": 34.81915
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-032L",
    "modelName": "TANK_062",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 64,
    "y": 353,
    "mapPoint": {
      "x": 64,
      "y": 353
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5356,
      "latitude": 34.819273
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-033L",
    "modelName": "TANK_063",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 104,
    "y": 339,
    "mapPoint": {
      "x": 104,
      "y": 339
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536037,
      "latitude": 34.819399
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-034L",
    "modelName": "TANK_064",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 42,
    "y": 351,
    "mapPoint": {
      "x": 42,
      "y": 351
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535353,
      "latitude": 34.819294
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-035L",
    "modelName": "TANK_065",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 135,
    "y": 322,
    "mapPoint": {
      "x": 135,
      "y": 322
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536368,
      "latitude": 34.819552
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-036L",
    "modelName": "TANK_066",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 40,
    "y": 353,
    "mapPoint": {
      "x": 40,
      "y": 353
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535331,
      "latitude": 34.819272
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-037L",
    "modelName": "TANK_067",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 101,
    "y": 349,
    "mapPoint": {
      "x": 101,
      "y": 349
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536001,
      "latitude": 34.819308
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-038L",
    "modelName": "TANK_069",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 126,
    "y": 444,
    "mapPoint": {
      "x": 126,
      "y": 444
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536273,
      "latitude": 34.81846
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-039L",
    "modelName": "TANK_071",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 140,
    "y": 444,
    "mapPoint": {
      "x": 140,
      "y": 444
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536425,
      "latitude": 34.818461
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-040L",
    "modelName": "TANK_072",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 49,
    "y": 464,
    "mapPoint": {
      "x": 49,
      "y": 464
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535434,
      "latitude": 34.818281
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-041L",
    "modelName": "TANK_075",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 49,
    "y": 430,
    "mapPoint": {
      "x": 49,
      "y": 430
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535433,
      "latitude": 34.818584
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-042L",
    "modelName": "TANK_076",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 49,
    "y": 468,
    "mapPoint": {
      "x": 49,
      "y": 468
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535435,
      "latitude": 34.818241
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-043L",
    "modelName": "TANK_077",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 49,
    "y": 425,
    "mapPoint": {
      "x": 49,
      "y": 425
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535433,
      "latitude": 34.818624
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-044L",
    "modelName": "TANK_078",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 639,
    "y": 424,
    "mapPoint": {
      "x": 639,
      "y": 424
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541884,
      "latitude": 34.818641
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-045L",
    "modelName": "TANK_079",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 643,
    "y": 419,
    "mapPoint": {
      "x": 643,
      "y": 419
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54193,
      "latitude": 34.818678
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-046L",
    "modelName": "TANK_080",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 636,
    "y": 426,
    "mapPoint": {
      "x": 636,
      "y": 426
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541855,
      "latitude": 34.818623
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-047L",
    "modelName": "TANK_081",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 641,
    "y": 426,
    "mapPoint": {
      "x": 641,
      "y": 426
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541908,
      "latitude": 34.818623
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-048L",
    "modelName": "TANK_082",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 645,
    "y": 422,
    "mapPoint": {
      "x": 645,
      "y": 422
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541948,
      "latitude": 34.818659
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-049L",
    "modelName": "TANK_083",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 645,
    "y": 424,
    "mapPoint": {
      "x": 645,
      "y": 424
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54195,
      "latitude": 34.818637
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-050L",
    "modelName": "TANK_084",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 649,
    "y": 406,
    "mapPoint": {
      "x": 649,
      "y": 406
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542002,
      "latitude": 34.818799
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-051L",
    "modelName": "TANK_085",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 627,
    "y": 434,
    "mapPoint": {
      "x": 627,
      "y": 434
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541758,
      "latitude": 34.818547
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-052L",
    "modelName": "TANK_086",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 399,
    "mapPoint": {
      "x": 654,
      "y": 399
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542055,
      "latitude": 34.818862
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-053L",
    "modelName": "TANK_088",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 406,
    "mapPoint": {
      "x": 654,
      "y": 406
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542053,
      "latitude": 34.8188
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-054L",
    "modelName": "TANK_090",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 562,
    "y": 474,
    "mapPoint": {
      "x": 562,
      "y": 474
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541044,
      "latitude": 34.818186
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-055L",
    "modelName": "TANK_091",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 543,
    "y": 474,
    "mapPoint": {
      "x": 543,
      "y": 474
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540838,
      "latitude": 34.818189
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-056L",
    "modelName": "TANK_092",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 597,
    "y": 464,
    "mapPoint": {
      "x": 597,
      "y": 464
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541432,
      "latitude": 34.818275
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-057L",
    "modelName": "TANK_093",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 560,
    "y": 472,
    "mapPoint": {
      "x": 560,
      "y": 472
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541021,
      "latitude": 34.818206
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-058L",
    "modelName": "TANK_094",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 562,
    "y": 470,
    "mapPoint": {
      "x": 562,
      "y": 470
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541044,
      "latitude": 34.818222
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-059L",
    "modelName": "TANK_095",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 597,
    "y": 478,
    "mapPoint": {
      "x": 597,
      "y": 478
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541433,
      "latitude": 34.818149
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-060L",
    "modelName": "TANK_1039",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 441,
    "y": 141,
    "mapPoint": {
      "x": 441,
      "y": 141
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539719,
      "latitude": 34.821183
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-061L",
    "modelName": "TANK_098",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 218,
    "y": 143,
    "mapPoint": {
      "x": 218,
      "y": 143
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537284,
      "latitude": 34.821158
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-062L",
    "modelName": "TANK_099",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 322,
    "mapPoint": {
      "x": 748,
      "y": 322
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543077,
      "latitude": 34.819555
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-063L",
    "modelName": "TANK_100",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 338,
    "mapPoint": {
      "x": 748,
      "y": 338
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543078,
      "latitude": 34.819408
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-064L",
    "modelName": "TANK_108",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 784,
    "y": 340,
    "mapPoint": {
      "x": 784,
      "y": 340
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543472,
      "latitude": 34.819394
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-065L",
    "modelName": "TANK_103",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 340,
    "mapPoint": {
      "x": 772,
      "y": 340
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543339,
      "latitude": 34.819396
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-066L",
    "modelName": "TANK_104",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 784,
    "y": 337,
    "mapPoint": {
      "x": 784,
      "y": 337
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543472,
      "latitude": 34.819418
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-067L",
    "modelName": "TANK_105",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 789,
    "y": 330,
    "mapPoint": {
      "x": 789,
      "y": 330
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543534,
      "latitude": 34.819478
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-068L",
    "modelName": "TANK_107",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 773,
    "y": 344,
    "mapPoint": {
      "x": 773,
      "y": 344
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543349,
      "latitude": 34.819353
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-069L",
    "modelName": "TANK_109",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 571,
    "y": 460,
    "mapPoint": {
      "x": 571,
      "y": 460
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54114,
      "latitude": 34.818316
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-070L",
    "modelName": "TANK_112",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 481,
    "mapPoint": {
      "x": 544,
      "y": 481
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540853,
      "latitude": 34.818123
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-071L",
    "modelName": "TANK_113",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 123,
    "y": 380,
    "mapPoint": {
      "x": 123,
      "y": 380
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536239,
      "latitude": 34.81903
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-072L",
    "modelName": "TANK_114",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 92,
    "y": 171,
    "mapPoint": {
      "x": 92,
      "y": 171
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535906,
      "latitude": 34.820914
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-073L",
    "modelName": "TANK_116",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 671,
    "y": 465,
    "mapPoint": {
      "x": 671,
      "y": 465
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542233,
      "latitude": 34.818267
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-074L",
    "modelName": "TANK_119",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 514,
    "y": 244,
    "mapPoint": {
      "x": 514,
      "y": 244
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540525,
      "latitude": 34.820257
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-075L",
    "modelName": "TANK_121",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 177,
    "y": 245,
    "mapPoint": {
      "x": 177,
      "y": 245
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536832,
      "latitude": 34.820243
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-076L",
    "modelName": "TANK_124",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 39,
    "y": 468,
    "mapPoint": {
      "x": 39,
      "y": 468
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535324,
      "latitude": 34.818244
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-077L",
    "modelName": "TANK_127",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 245,
    "mapPoint": {
      "x": 748,
      "y": 245
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543078,
      "latitude": 34.820245
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-078L",
    "modelName": "TANK_130",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 756,
    "y": 226,
    "mapPoint": {
      "x": 756,
      "y": 226
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543171,
      "latitude": 34.820416
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-079L",
    "modelName": "TANK_131",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 898,
    "y": 370,
    "mapPoint": {
      "x": 898,
      "y": 370
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544722,
      "latitude": 34.819119
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-080L",
    "modelName": "TANK_132",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 370,
    "mapPoint": {
      "x": 936,
      "y": 370
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545135,
      "latitude": 34.819121
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-081L",
    "modelName": "TANK_134",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 927,
    "y": 359,
    "mapPoint": {
      "x": 927,
      "y": 359
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54504,
      "latitude": 34.819225
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-082L",
    "modelName": "TANK_135",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 927,
    "y": 380,
    "mapPoint": {
      "x": 927,
      "y": 380
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545041,
      "latitude": 34.819032
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-083L",
    "modelName": "TANK_143",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 861,
    "y": 477,
    "mapPoint": {
      "x": 861,
      "y": 477
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544313,
      "latitude": 34.818159
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-084L",
    "modelName": "TANK_151",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 861,
    "y": 459,
    "mapPoint": {
      "x": 861,
      "y": 459
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544312,
      "latitude": 34.818325
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-085L",
    "modelName": "TANK_158",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 886,
    "y": 409,
    "mapPoint": {
      "x": 886,
      "y": 409
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544588,
      "latitude": 34.818769
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-086L",
    "modelName": "TANK_163",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 854,
    "y": 419,
    "mapPoint": {
      "x": 854,
      "y": 419
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544243,
      "latitude": 34.818679
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-087L",
    "modelName": "TANK_169",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 854,
    "y": 400,
    "mapPoint": {
      "x": 854,
      "y": 400
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544242,
      "latitude": 34.818852
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-088L",
    "modelName": "TANK_170",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 837,
    "y": 410,
    "mapPoint": {
      "x": 837,
      "y": 410
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544052,
      "latitude": 34.818767
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-089L",
    "modelName": "TANK_187",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 933,
    "y": 479,
    "mapPoint": {
      "x": 933,
      "y": 479
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545106,
      "latitude": 34.818147
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-090L",
    "modelName": "TANK_213",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 933,
    "y": 459,
    "mapPoint": {
      "x": 933,
      "y": 459
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545105,
      "latitude": 34.818319
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-091L",
    "modelName": "TANK_224",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 856,
    "y": 339,
    "mapPoint": {
      "x": 856,
      "y": 339
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54426,
      "latitude": 34.8194
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-092L",
    "modelName": "TANK_225",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 871,
    "y": 339,
    "mapPoint": {
      "x": 871,
      "y": 339
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54443,
      "latitude": 34.8194
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-093L",
    "modelName": "TANK_226",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 856,
    "y": 327,
    "mapPoint": {
      "x": 856,
      "y": 327
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544259,
      "latitude": 34.819512
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-094L",
    "modelName": "TANK_227",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 871,
    "y": 327,
    "mapPoint": {
      "x": 871,
      "y": 327
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544429,
      "latitude": 34.819512
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-095L",
    "modelName": "TANK_228",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 733,
    "y": 464,
    "mapPoint": {
      "x": 733,
      "y": 464
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542911,
      "latitude": 34.818282
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-096L",
    "modelName": "TANK_260",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 802,
    "y": 117,
    "mapPoint": {
      "x": 802,
      "y": 117
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543666,
      "latitude": 34.821396
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-097L",
    "modelName": "TANK_262",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 866,
    "y": 152,
    "mapPoint": {
      "x": 866,
      "y": 152
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544373,
      "latitude": 34.821076
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-098L",
    "modelName": "TANK_265",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 952,
    "y": 370,
    "mapPoint": {
      "x": 952,
      "y": 370
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545316,
      "latitude": 34.819121
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-099L",
    "modelName": "TANK_272",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 836,
    "y": 499,
    "mapPoint": {
      "x": 836,
      "y": 499
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544038,
      "latitude": 34.817966
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-100L",
    "modelName": "TANK_289",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 835,
    "y": 501,
    "mapPoint": {
      "x": 835,
      "y": 501
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544028,
      "latitude": 34.817945
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-101L",
    "modelName": "TANK_296",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 623,
    "y": 499,
    "mapPoint": {
      "x": 623,
      "y": 499
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541715,
      "latitude": 34.817959
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-102L",
    "modelName": "TANK_313",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 622,
    "y": 502,
    "mapPoint": {
      "x": 622,
      "y": 502
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541705,
      "latitude": 34.817937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-103L",
    "modelName": "TANK_320",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 501,
    "mapPoint": {
      "x": 355,
      "y": 501
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538782,
      "latitude": 34.817948
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-104L",
    "modelName": "TANK_337",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 354,
    "y": 503,
    "mapPoint": {
      "x": 354,
      "y": 503
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538773,
      "latitude": 34.817926
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-105L",
    "modelName": "TANK_344",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 353,
    "y": 34,
    "mapPoint": {
      "x": 353,
      "y": 34
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538753,
      "latitude": 34.822139
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-106L",
    "modelName": "TANK_361",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 352,
    "y": 32,
    "mapPoint": {
      "x": 352,
      "y": 32
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538743,
      "latitude": 34.822161
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-107L",
    "modelName": "TANK_368",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 417,
    "y": 34,
    "mapPoint": {
      "x": 417,
      "y": 34
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539462,
      "latitude": 34.822142
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-108L",
    "modelName": "TANK_385",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 416,
    "y": 31,
    "mapPoint": {
      "x": 416,
      "y": 31
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539452,
      "latitude": 34.822163
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-109L",
    "modelName": "TANK_392",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 524,
    "y": 34,
    "mapPoint": {
      "x": 524,
      "y": 34
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540633,
      "latitude": 34.822144
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-110L",
    "modelName": "TANK_409",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 523,
    "y": 31,
    "mapPoint": {
      "x": 523,
      "y": 31
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540623,
      "latitude": 34.822165
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-111L",
    "modelName": "TANK_416",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 733,
    "y": 33,
    "mapPoint": {
      "x": 733,
      "y": 33
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54292,
      "latitude": 34.822146
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-112L",
    "modelName": "TANK_433",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 732,
    "y": 31,
    "mapPoint": {
      "x": 732,
      "y": 31
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54291,
      "latitude": 34.822168
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-113L",
    "modelName": "TANK_440",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 689,
    "y": 34,
    "mapPoint": {
      "x": 689,
      "y": 34
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542433,
      "latitude": 34.822144
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-114L",
    "modelName": "TANK_457",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 690,
    "y": 31,
    "mapPoint": {
      "x": 690,
      "y": 31
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542442,
      "latitude": 34.822166
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-115L",
    "modelName": "TANK_470",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 903,
    "y": 32,
    "mapPoint": {
      "x": 903,
      "y": 32
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544773,
      "latitude": 34.822159
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-116L",
    "modelName": "TANK_487",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 902,
    "y": 30,
    "mapPoint": {
      "x": 902,
      "y": 30
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544763,
      "latitude": 34.82218
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-117L",
    "modelName": "TANK_494",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 959,
    "y": 206,
    "mapPoint": {
      "x": 959,
      "y": 206
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545385,
      "latitude": 34.820596
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-118L",
    "modelName": "TANK_511",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 956,
    "y": 207,
    "mapPoint": {
      "x": 956,
      "y": 207
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545358,
      "latitude": 34.820588
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-119L",
    "modelName": "TANK_528",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 933,
    "y": 342,
    "mapPoint": {
      "x": 933,
      "y": 342
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5451,
      "latitude": 34.819372
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-120L",
    "modelName": "TANK_554",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 932,
    "y": 323,
    "mapPoint": {
      "x": 932,
      "y": 323
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545099,
      "latitude": 34.819544
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-121L",
    "modelName": "TANK_565",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 607,
    "y": 279,
    "mapPoint": {
      "x": 607,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541536,
      "latitude": 34.819939
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-122L",
    "modelName": "TANK_566",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 607,
    "y": 243,
    "mapPoint": {
      "x": 607,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541534,
      "latitude": 34.820265
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-123L",
    "modelName": "TANK_567",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 621,
    "y": 279,
    "mapPoint": {
      "x": 621,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541688,
      "latitude": 34.81994
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-124L",
    "modelName": "TANK_568",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 621,
    "y": 243,
    "mapPoint": {
      "x": 621,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541686,
      "latitude": 34.820266
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-125L",
    "modelName": "TANK_569",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 683,
    "y": 279,
    "mapPoint": {
      "x": 683,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542369,
      "latitude": 34.819942
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-126L",
    "modelName": "TANK_570",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 668,
    "y": 279,
    "mapPoint": {
      "x": 668,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542203,
      "latitude": 34.819942
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-127L",
    "modelName": "TANK_571",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 660,
    "y": 279,
    "mapPoint": {
      "x": 660,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542118,
      "latitude": 34.819941
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-128L",
    "modelName": "TANK_572",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 652,
    "y": 279,
    "mapPoint": {
      "x": 652,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542028,
      "latitude": 34.819941
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-129L",
    "modelName": "TANK_573",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 644,
    "y": 279,
    "mapPoint": {
      "x": 644,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541943,
      "latitude": 34.819941
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-130L",
    "modelName": "TANK_574",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 636,
    "y": 279,
    "mapPoint": {
      "x": 636,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541858,
      "latitude": 34.81994
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-131L",
    "modelName": "TANK_575",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 629,
    "y": 279,
    "mapPoint": {
      "x": 629,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541773,
      "latitude": 34.81994
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-132L",
    "modelName": "TANK_576",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 683,
    "y": 242,
    "mapPoint": {
      "x": 683,
      "y": 242
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542367,
      "latitude": 34.820268
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-133L",
    "modelName": "TANK_577",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 668,
    "y": 242,
    "mapPoint": {
      "x": 668,
      "y": 242
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542202,
      "latitude": 34.820268
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-134L",
    "modelName": "TANK_578",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 660,
    "y": 243,
    "mapPoint": {
      "x": 660,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542116,
      "latitude": 34.820267
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-135L",
    "modelName": "TANK_579",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 652,
    "y": 243,
    "mapPoint": {
      "x": 652,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542027,
      "latitude": 34.820267
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-136L",
    "modelName": "TANK_580",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 644,
    "y": 243,
    "mapPoint": {
      "x": 644,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541942,
      "latitude": 34.820267
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-137L",
    "modelName": "TANK_581",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 636,
    "y": 243,
    "mapPoint": {
      "x": 636,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541857,
      "latitude": 34.820266
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-138L",
    "modelName": "TANK_582",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 628,
    "y": 243,
    "mapPoint": {
      "x": 628,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541771,
      "latitude": 34.820266
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-139L",
    "modelName": "TANK_583",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 532,
    "y": 279,
    "mapPoint": {
      "x": 532,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540716,
      "latitude": 34.819936
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-140L",
    "modelName": "TANK_586",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 532,
    "y": 243,
    "mapPoint": {
      "x": 532,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540714,
      "latitude": 34.820262
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-141L",
    "modelName": "TANK_587",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 279,
    "mapPoint": {
      "x": 544,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540851,
      "latitude": 34.819937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-142L",
    "modelName": "TANK_589",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 243,
    "mapPoint": {
      "x": 544,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54085,
      "latitude": 34.820263
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-143L",
    "modelName": "TANK_591",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 600,
    "y": 279,
    "mapPoint": {
      "x": 600,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541456,
      "latitude": 34.819939
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-144L",
    "modelName": "TANK_594",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 586,
    "y": 279,
    "mapPoint": {
      "x": 586,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541309,
      "latitude": 34.819938
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-145L",
    "modelName": "TANK_595",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 579,
    "y": 279,
    "mapPoint": {
      "x": 579,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541234,
      "latitude": 34.819938
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-146L",
    "modelName": "TANK_597",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 572,
    "y": 279,
    "mapPoint": {
      "x": 572,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541154,
      "latitude": 34.819938
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-147L",
    "modelName": "TANK_599",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 565,
    "y": 279,
    "mapPoint": {
      "x": 565,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541078,
      "latitude": 34.819937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-148L",
    "modelName": "TANK_602",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 558,
    "y": 279,
    "mapPoint": {
      "x": 558,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541003,
      "latitude": 34.819937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-149L",
    "modelName": "TANK_603",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 551,
    "y": 279,
    "mapPoint": {
      "x": 551,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540927,
      "latitude": 34.819937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-150L",
    "modelName": "TANK_605",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 599,
    "y": 243,
    "mapPoint": {
      "x": 599,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541455,
      "latitude": 34.820265
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-151L",
    "modelName": "TANK_608",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 586,
    "y": 243,
    "mapPoint": {
      "x": 586,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541308,
      "latitude": 34.820264
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-152L",
    "modelName": "TANK_609",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 579,
    "y": 243,
    "mapPoint": {
      "x": 579,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541232,
      "latitude": 34.820264
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-153L",
    "modelName": "TANK_612",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 572,
    "y": 243,
    "mapPoint": {
      "x": 572,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541152,
      "latitude": 34.820264
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-154L",
    "modelName": "TANK_613",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 565,
    "y": 243,
    "mapPoint": {
      "x": 565,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541077,
      "latitude": 34.820263
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-155L",
    "modelName": "TANK_615",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 558,
    "y": 243,
    "mapPoint": {
      "x": 558,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541001,
      "latitude": 34.820263
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-156L",
    "modelName": "TANK_617",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 551,
    "y": 243,
    "mapPoint": {
      "x": 551,
      "y": 243
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540925,
      "latitude": 34.820263
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-157L",
    "modelName": "TANK_619",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 532,
    "y": 367,
    "mapPoint": {
      "x": 532,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54072,
      "latitude": 34.819148
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-158L",
    "modelName": "TANK_620",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 532,
    "y": 320,
    "mapPoint": {
      "x": 532,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540718,
      "latitude": 34.819571
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-159L",
    "modelName": "TANK_621",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 545,
    "y": 367,
    "mapPoint": {
      "x": 545,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540856,
      "latitude": 34.819148
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-160L",
    "modelName": "TANK_622",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 545,
    "y": 320,
    "mapPoint": {
      "x": 545,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540854,
      "latitude": 34.819571
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-161L",
    "modelName": "TANK_623",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 600,
    "y": 367,
    "mapPoint": {
      "x": 600,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541461,
      "latitude": 34.81915
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-162L",
    "modelName": "TANK_624",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 587,
    "y": 367,
    "mapPoint": {
      "x": 587,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541314,
      "latitude": 34.81915
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-163L",
    "modelName": "TANK_625",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 580,
    "y": 367,
    "mapPoint": {
      "x": 580,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541238,
      "latitude": 34.81915
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-164L",
    "modelName": "TANK_626",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 572,
    "y": 367,
    "mapPoint": {
      "x": 572,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541158,
      "latitude": 34.819149
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-165L",
    "modelName": "TANK_627",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 565,
    "y": 367,
    "mapPoint": {
      "x": 565,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541083,
      "latitude": 34.819149
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-166L",
    "modelName": "TANK_628",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 559,
    "y": 367,
    "mapPoint": {
      "x": 559,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541007,
      "latitude": 34.819149
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-167L",
    "modelName": "TANK_629",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 552,
    "y": 367,
    "mapPoint": {
      "x": 552,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540931,
      "latitude": 34.819148
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-168L",
    "modelName": "TANK_630",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 600,
    "y": 320,
    "mapPoint": {
      "x": 600,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541458,
      "latitude": 34.819573
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-169L",
    "modelName": "TANK_631",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 586,
    "y": 320,
    "mapPoint": {
      "x": 586,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541311,
      "latitude": 34.819573
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-170L",
    "modelName": "TANK_632",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 579,
    "y": 320,
    "mapPoint": {
      "x": 579,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541236,
      "latitude": 34.819573
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-171L",
    "modelName": "TANK_633",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 572,
    "y": 320,
    "mapPoint": {
      "x": 572,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541156,
      "latitude": 34.819572
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-172L",
    "modelName": "TANK_634",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 565,
    "y": 320,
    "mapPoint": {
      "x": 565,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54108,
      "latitude": 34.819572
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-173L",
    "modelName": "TANK_635",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 558,
    "y": 320,
    "mapPoint": {
      "x": 558,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541005,
      "latitude": 34.819572
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-174L",
    "modelName": "TANK_636",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 551,
    "y": 320,
    "mapPoint": {
      "x": 551,
      "y": 320
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540929,
      "latitude": 34.819571
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-175L",
    "modelName": "TANK_637",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 375,
    "mapPoint": {
      "x": 713,
      "y": 375
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542702,
      "latitude": 34.819074
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-176L",
    "modelName": "TANK_638",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 368,
    "mapPoint": {
      "x": 713,
      "y": 368
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542702,
      "latitude": 34.819144
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-177L",
    "modelName": "TANK_639",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 360,
    "mapPoint": {
      "x": 713,
      "y": 360
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542701,
      "latitude": 34.819214
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-178L",
    "modelName": "TANK_640",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 352,
    "mapPoint": {
      "x": 713,
      "y": 352
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542701,
      "latitude": 34.819284
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-179L",
    "modelName": "TANK_641",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 336,
    "mapPoint": {
      "x": 713,
      "y": 336
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5427,
      "latitude": 34.819424
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-180L",
    "modelName": "TANK_642",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 329,
    "mapPoint": {
      "x": 713,
      "y": 329
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5427,
      "latitude": 34.819494
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-181L",
    "modelName": "TANK_643",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 321,
    "mapPoint": {
      "x": 713,
      "y": 321
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542699,
      "latitude": 34.819564
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-182L",
    "modelName": "TANK_644",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 375,
    "mapPoint": {
      "x": 730,
      "y": 375
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542883,
      "latitude": 34.819075
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-183L",
    "modelName": "TANK_645",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 367,
    "mapPoint": {
      "x": 730,
      "y": 367
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542882,
      "latitude": 34.819145
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-184L",
    "modelName": "TANK_646",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 360,
    "mapPoint": {
      "x": 730,
      "y": 360
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542882,
      "latitude": 34.819215
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-185L",
    "modelName": "TANK_647",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 352,
    "mapPoint": {
      "x": 730,
      "y": 352
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542882,
      "latitude": 34.819285
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-186L",
    "modelName": "TANK_648",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 336,
    "mapPoint": {
      "x": 730,
      "y": 336
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542881,
      "latitude": 34.819425
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-187L",
    "modelName": "TANK_649",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 329,
    "mapPoint": {
      "x": 730,
      "y": 329
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542881,
      "latitude": 34.819494
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-188L",
    "modelName": "TANK_650",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 730,
    "y": 321,
    "mapPoint": {
      "x": 730,
      "y": 321
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54288,
      "latitude": 34.819564
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-189L",
    "modelName": "TANK_651",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 429,
    "y": 94,
    "mapPoint": {
      "x": 429,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53959,
      "latitude": 34.821602
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-190L",
    "modelName": "TANK_654",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 429,
    "y": 53,
    "mapPoint": {
      "x": 429,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539588,
      "latitude": 34.821973
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-191L",
    "modelName": "TANK_655",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 441,
    "y": 94,
    "mapPoint": {
      "x": 441,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539726,
      "latitude": 34.821603
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-192L",
    "modelName": "TANK_657",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 441,
    "y": 53,
    "mapPoint": {
      "x": 441,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539724,
      "latitude": 34.821973
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-193L",
    "modelName": "TANK_660",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 497,
    "y": 94,
    "mapPoint": {
      "x": 497,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540331,
      "latitude": 34.821605
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-194L",
    "modelName": "TANK_662",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 483,
    "y": 94,
    "mapPoint": {
      "x": 483,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540184,
      "latitude": 34.821605
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-195L",
    "modelName": "TANK_663",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 476,
    "y": 94,
    "mapPoint": {
      "x": 476,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540108,
      "latitude": 34.821604
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-196L",
    "modelName": "TANK_666",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 469,
    "y": 94,
    "mapPoint": {
      "x": 469,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540028,
      "latitude": 34.821604
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-197L",
    "modelName": "TANK_668",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 462,
    "y": 94,
    "mapPoint": {
      "x": 462,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539953,
      "latitude": 34.821604
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-198L",
    "modelName": "TANK_670",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 455,
    "y": 94,
    "mapPoint": {
      "x": 455,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539877,
      "latitude": 34.821603
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-199L",
    "modelName": "TANK_671",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 448,
    "y": 94,
    "mapPoint": {
      "x": 448,
      "y": 94
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539801,
      "latitude": 34.821603
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-200L",
    "modelName": "TANK_674",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 497,
    "y": 52,
    "mapPoint": {
      "x": 497,
      "y": 52
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540329,
      "latitude": 34.821976
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-201L",
    "modelName": "TANK_676",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 483,
    "y": 52,
    "mapPoint": {
      "x": 483,
      "y": 52
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540182,
      "latitude": 34.821975
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-202L",
    "modelName": "TANK_677",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 476,
    "y": 52,
    "mapPoint": {
      "x": 476,
      "y": 52
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540106,
      "latitude": 34.821975
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-203L",
    "modelName": "TANK_679",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 469,
    "y": 53,
    "mapPoint": {
      "x": 469,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540026,
      "latitude": 34.821974
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-204L",
    "modelName": "TANK_682",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 462,
    "y": 53,
    "mapPoint": {
      "x": 462,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539951,
      "latitude": 34.821974
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-205L",
    "modelName": "TANK_683",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 455,
    "y": 53,
    "mapPoint": {
      "x": 455,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539875,
      "latitude": 34.821974
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-206L",
    "modelName": "TANK_685",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 448,
    "y": 53,
    "mapPoint": {
      "x": 448,
      "y": 53
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539799,
      "latitude": 34.821974
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-207L",
    "modelName": "TANK_687",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 531,
    "y": 443,
    "mapPoint": {
      "x": 531,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540701,
      "latitude": 34.818463
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-208L",
    "modelName": "TANK_688",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 530,
    "y": 404,
    "mapPoint": {
      "x": 530,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540699,
      "latitude": 34.81882
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-209L",
    "modelName": "TANK_689",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 443,
    "mapPoint": {
      "x": 544,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540847,
      "latitude": 34.818463
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-210L",
    "modelName": "TANK_690",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 544,
    "y": 404,
    "mapPoint": {
      "x": 544,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540845,
      "latitude": 34.81882
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-211L",
    "modelName": "TANK_691",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 604,
    "y": 443,
    "mapPoint": {
      "x": 604,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541502,
      "latitude": 34.818466
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-212L",
    "modelName": "TANK_692",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 589,
    "y": 443,
    "mapPoint": {
      "x": 589,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541343,
      "latitude": 34.818465
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-213L",
    "modelName": "TANK_693",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 582,
    "y": 443,
    "mapPoint": {
      "x": 582,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541261,
      "latitude": 34.818465
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-214L",
    "modelName": "TANK_694",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 574,
    "y": 443,
    "mapPoint": {
      "x": 574,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541175,
      "latitude": 34.818465
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-215L",
    "modelName": "TANK_695",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 566,
    "y": 443,
    "mapPoint": {
      "x": 566,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541093,
      "latitude": 34.818464
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-216L",
    "modelName": "TANK_696",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 559,
    "y": 443,
    "mapPoint": {
      "x": 559,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541011,
      "latitude": 34.818464
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-217L",
    "modelName": "TANK_697",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 551,
    "y": 443,
    "mapPoint": {
      "x": 551,
      "y": 443
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540929,
      "latitude": 34.818464
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-218L",
    "modelName": "TANK_698",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 604,
    "y": 403,
    "mapPoint": {
      "x": 604,
      "y": 403
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5415,
      "latitude": 34.818823
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-219L",
    "modelName": "TANK_699",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 589,
    "y": 403,
    "mapPoint": {
      "x": 589,
      "y": 403
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541341,
      "latitude": 34.818822
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-220L",
    "modelName": "TANK_700",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 582,
    "y": 403,
    "mapPoint": {
      "x": 582,
      "y": 403
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541259,
      "latitude": 34.818822
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-221L",
    "modelName": "TANK_701",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 574,
    "y": 404,
    "mapPoint": {
      "x": 574,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541173,
      "latitude": 34.818821
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-222L",
    "modelName": "TANK_702",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 566,
    "y": 404,
    "mapPoint": {
      "x": 566,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541091,
      "latitude": 34.818821
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-223L",
    "modelName": "TANK_703",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 559,
    "y": 404,
    "mapPoint": {
      "x": 559,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541009,
      "latitude": 34.818821
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-224L",
    "modelName": "TANK_704",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 551,
    "y": 404,
    "mapPoint": {
      "x": 551,
      "y": 404
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540927,
      "latitude": 34.81882
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-225L",
    "modelName": "TANK_720",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 931,
    "y": 420,
    "mapPoint": {
      "x": 931,
      "y": 420
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54508,
      "latitude": 34.818675
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-226L",
    "modelName": "TANK_746",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 931,
    "y": 401,
    "mapPoint": {
      "x": 931,
      "y": 401
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545079,
      "latitude": 34.818847
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-227L",
    "modelName": "TANK_757",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 380,
    "mapPoint": {
      "x": 772,
      "y": 380
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543345,
      "latitude": 34.819035
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-228L",
    "modelName": "TANK_758",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 797,
    "y": 378,
    "mapPoint": {
      "x": 797,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543613,
      "latitude": 34.81905
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-229L",
    "modelName": "TANK_759",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 791,
    "y": 378,
    "mapPoint": {
      "x": 791,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543546,
      "latitude": 34.819049
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-230L",
    "modelName": "TANK_760",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 784,
    "y": 378,
    "mapPoint": {
      "x": 784,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543479,
      "latitude": 34.819049
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-231L",
    "modelName": "TANK_761",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 778,
    "y": 378,
    "mapPoint": {
      "x": 778,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543412,
      "latitude": 34.819049
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-232L",
    "modelName": "TANK_762",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 766,
    "y": 378,
    "mapPoint": {
      "x": 766,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543278,
      "latitude": 34.819048
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-233L",
    "modelName": "TANK_763",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 760,
    "y": 378,
    "mapPoint": {
      "x": 760,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543211,
      "latitude": 34.819048
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-234L",
    "modelName": "TANK_764",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 754,
    "y": 378,
    "mapPoint": {
      "x": 754,
      "y": 378
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543144,
      "latitude": 34.819048
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-235L",
    "modelName": "TANK_765",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 772,
    "y": 356,
    "mapPoint": {
      "x": 772,
      "y": 356
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543344,
      "latitude": 34.819246
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-236L",
    "modelName": "TANK_766",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 797,
    "y": 358,
    "mapPoint": {
      "x": 797,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543612,
      "latitude": 34.819233
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-237L",
    "modelName": "TANK_767",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 790,
    "y": 358,
    "mapPoint": {
      "x": 790,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543545,
      "latitude": 34.819233
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-238L",
    "modelName": "TANK_768",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 784,
    "y": 358,
    "mapPoint": {
      "x": 784,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543478,
      "latitude": 34.819233
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-239L",
    "modelName": "TANK_769",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 778,
    "y": 358,
    "mapPoint": {
      "x": 778,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543411,
      "latitude": 34.819232
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-240L",
    "modelName": "TANK_770",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 766,
    "y": 358,
    "mapPoint": {
      "x": 766,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543277,
      "latitude": 34.819232
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-241L",
    "modelName": "TANK_771",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 760,
    "y": 358,
    "mapPoint": {
      "x": 760,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54321,
      "latitude": 34.819232
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-242L",
    "modelName": "TANK_772",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 754,
    "y": 358,
    "mapPoint": {
      "x": 754,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543143,
      "latitude": 34.819231
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-243L",
    "modelName": "TANK_773",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 373,
    "y": 208,
    "mapPoint": {
      "x": 373,
      "y": 208
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538978,
      "latitude": 34.820573
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-244L",
    "modelName": "TANK_774",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 373,
    "y": 161,
    "mapPoint": {
      "x": 373,
      "y": 161
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538976,
      "latitude": 34.820996
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-245L",
    "modelName": "TANK_775",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 477,
    "y": 208,
    "mapPoint": {
      "x": 477,
      "y": 208
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540118,
      "latitude": 34.820578
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-246L",
    "modelName": "TANK_776",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 477,
    "y": 161,
    "mapPoint": {
      "x": 477,
      "y": 161
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540116,
      "latitude": 34.821001
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-247L",
    "modelName": "TANK_792",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 929,
    "y": 274,
    "mapPoint": {
      "x": 929,
      "y": 274
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545056,
      "latitude": 34.819985
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-248L",
    "modelName": "TANK_818",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 255,
    "mapPoint": {
      "x": 928,
      "y": 255
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545055,
      "latitude": 34.820157
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-249L",
    "modelName": "TANK_829",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 399,
    "y": 146,
    "mapPoint": {
      "x": 399,
      "y": 146
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539258,
      "latitude": 34.821133
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-250L",
    "modelName": "TANK_830",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 356,
    "y": 146,
    "mapPoint": {
      "x": 356,
      "y": 146
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538787,
      "latitude": 34.821132
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-251L",
    "modelName": "TANK_831",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 399,
    "y": 130,
    "mapPoint": {
      "x": 399,
      "y": 130
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539257,
      "latitude": 34.821277
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-252L",
    "modelName": "TANK_832",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 356,
    "y": 130,
    "mapPoint": {
      "x": 356,
      "y": 130
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538786,
      "latitude": 34.821275
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-253L",
    "modelName": "TANK_833",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 59,
    "mapPoint": {
      "x": 398,
      "y": 59
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539254,
      "latitude": 34.821916
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-254L",
    "modelName": "TANK_834",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 76,
    "mapPoint": {
      "x": 398,
      "y": 76
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539254,
      "latitude": 34.821761
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-255L",
    "modelName": "TANK_835",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 85,
    "mapPoint": {
      "x": 398,
      "y": 85
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539255,
      "latitude": 34.821681
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-256L",
    "modelName": "TANK_836",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 95,
    "mapPoint": {
      "x": 398,
      "y": 95
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539255,
      "latitude": 34.821596
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-257L",
    "modelName": "TANK_837",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 104,
    "mapPoint": {
      "x": 398,
      "y": 104
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539256,
      "latitude": 34.821516
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-258L",
    "modelName": "TANK_838",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 398,
    "y": 112,
    "mapPoint": {
      "x": 398,
      "y": 112
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539256,
      "latitude": 34.821436
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-259L",
    "modelName": "TANK_839",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 399,
    "y": 121,
    "mapPoint": {
      "x": 399,
      "y": 121
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539257,
      "latitude": 34.821356
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-260L",
    "modelName": "TANK_840",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 59,
    "mapPoint": {
      "x": 355,
      "y": 59
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538782,
      "latitude": 34.821914
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-261L",
    "modelName": "TANK_841",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 76,
    "mapPoint": {
      "x": 355,
      "y": 76
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538783,
      "latitude": 34.821759
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-262L",
    "modelName": "TANK_842",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 85,
    "mapPoint": {
      "x": 355,
      "y": 85
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538784,
      "latitude": 34.821679
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-263L",
    "modelName": "TANK_843",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 95,
    "mapPoint": {
      "x": 355,
      "y": 95
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538784,
      "latitude": 34.821594
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-264L",
    "modelName": "TANK_844",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 104,
    "mapPoint": {
      "x": 355,
      "y": 104
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538784,
      "latitude": 34.821515
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-265L",
    "modelName": "TANK_845",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 113,
    "mapPoint": {
      "x": 355,
      "y": 113
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538785,
      "latitude": 34.821435
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-266L",
    "modelName": "TANK_846",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 355,
    "y": 121,
    "mapPoint": {
      "x": 355,
      "y": 121
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538785,
      "latitude": 34.821355
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-267L",
    "modelName": "TANK_847",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 900,
    "y": 195,
    "mapPoint": {
      "x": 900,
      "y": 195
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544747,
      "latitude": 34.820693
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-268L",
    "modelName": "TANK_848",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 195,
    "mapPoint": {
      "x": 870,
      "y": 195
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544419,
      "latitude": 34.820692
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-269L",
    "modelName": "TANK_849",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 177,
    "mapPoint": {
      "x": 870,
      "y": 177
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544415,
      "latitude": 34.820854
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-270L",
    "modelName": "TANK_850",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 893,
    "y": 177,
    "mapPoint": {
      "x": 893,
      "y": 177
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544671,
      "latitude": 34.820855
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-271L",
    "modelName": "TANK_851",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 771,
    "y": 51,
    "mapPoint": {
      "x": 771,
      "y": 51
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543336,
      "latitude": 34.821986
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-272L",
    "modelName": "TANK_852",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 795,
    "y": 51,
    "mapPoint": {
      "x": 795,
      "y": 51
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543591,
      "latitude": 34.821987
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-273L",
    "modelName": "TANK_853",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 817,
    "y": 51,
    "mapPoint": {
      "x": 817,
      "y": 51
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543837,
      "latitude": 34.821988
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-274L",
    "modelName": "TANK_854",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 771,
    "y": 76,
    "mapPoint": {
      "x": 771,
      "y": 76
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543335,
      "latitude": 34.82176
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-275L",
    "modelName": "TANK_855",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 801,
    "y": 76,
    "mapPoint": {
      "x": 801,
      "y": 76
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543662,
      "latitude": 34.821761
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-276L",
    "modelName": "TANK_856",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 831,
    "y": 76,
    "mapPoint": {
      "x": 831,
      "y": 76
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543984,
      "latitude": 34.821762
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-277L",
    "modelName": "TANK_857",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 63,
    "mapPoint": {
      "x": 928,
      "y": 63
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54505,
      "latitude": 34.82188
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-278L",
    "modelName": "TANK_858",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 72,
    "mapPoint": {
      "x": 928,
      "y": 72
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54505,
      "latitude": 34.821802
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-279L",
    "modelName": "TANK_859",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 80,
    "mapPoint": {
      "x": 928,
      "y": 80
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545051,
      "latitude": 34.821724
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-280L",
    "modelName": "TANK_860",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 89,
    "mapPoint": {
      "x": 928,
      "y": 89
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545051,
      "latitude": 34.821646
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-281L",
    "modelName": "TANK_861",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 928,
    "y": 54,
    "mapPoint": {
      "x": 928,
      "y": 54
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545049,
      "latitude": 34.821958
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-282L",
    "modelName": "TANK_862",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 852,
    "y": 121,
    "mapPoint": {
      "x": 852,
      "y": 121
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544215,
      "latitude": 34.821356
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-283L",
    "modelName": "TANK_863",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 852,
    "y": 134,
    "mapPoint": {
      "x": 852,
      "y": 134
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544216,
      "latitude": 34.82124
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-284L",
    "modelName": "TANK_864",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 852,
    "y": 153,
    "mapPoint": {
      "x": 852,
      "y": 153
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544217,
      "latitude": 34.821068
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-285L",
    "modelName": "TANK_865",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 852,
    "y": 164,
    "mapPoint": {
      "x": 852,
      "y": 164
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544217,
      "latitude": 34.82097
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-286L",
    "modelName": "TANK_866",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 852,
    "y": 110,
    "mapPoint": {
      "x": 852,
      "y": 110
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544215,
      "latitude": 34.821457
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-287L",
    "modelName": "TANK_867",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 917,
    "y": 22,
    "mapPoint": {
      "x": 917,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544928,
      "latitude": 34.822251
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-288L",
    "modelName": "TANK_868",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 757,
    "y": 17,
    "mapPoint": {
      "x": 757,
      "y": 17
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543182,
      "latitude": 34.822294
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-289L",
    "modelName": "TANK_869",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 563,
    "y": 22,
    "mapPoint": {
      "x": 563,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541053,
      "latitude": 34.822245
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-290L",
    "modelName": "TANK_870",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 272,
    "y": 24,
    "mapPoint": {
      "x": 272,
      "y": 24
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537868,
      "latitude": 34.822233
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-291L",
    "modelName": "TANK_871",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 38,
    "y": 25,
    "mapPoint": {
      "x": 38,
      "y": 25
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53531,
      "latitude": 34.822223
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-292L",
    "modelName": "TANK_872",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 718,
    "y": 489,
    "mapPoint": {
      "x": 718,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542754,
      "latitude": 34.818055
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-293L",
    "modelName": "TANK_873",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 718,
    "y": 450,
    "mapPoint": {
      "x": 718,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542752,
      "latitude": 34.818402
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-294L",
    "modelName": "TANK_874",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 732,
    "y": 489,
    "mapPoint": {
      "x": 732,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542904,
      "latitude": 34.818055
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-295L",
    "modelName": "TANK_875",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 732,
    "y": 450,
    "mapPoint": {
      "x": 732,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542902,
      "latitude": 34.818402
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-296L",
    "modelName": "TANK_876",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 793,
    "y": 488,
    "mapPoint": {
      "x": 793,
      "y": 488
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543574,
      "latitude": 34.818058
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-297L",
    "modelName": "TANK_877",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 778,
    "y": 489,
    "mapPoint": {
      "x": 778,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543411,
      "latitude": 34.818057
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-298L",
    "modelName": "TANK_878",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 771,
    "y": 489,
    "mapPoint": {
      "x": 771,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543328,
      "latitude": 34.818057
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-299L",
    "modelName": "TANK_879",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 762,
    "y": 489,
    "mapPoint": {
      "x": 762,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543239,
      "latitude": 34.818057
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-300L",
    "modelName": "TANK_880",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 755,
    "y": 489,
    "mapPoint": {
      "x": 755,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543155,
      "latitude": 34.818056
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-301L",
    "modelName": "TANK_881",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 747,
    "y": 489,
    "mapPoint": {
      "x": 747,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543071,
      "latitude": 34.818056
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-302L",
    "modelName": "TANK_882",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 740,
    "y": 489,
    "mapPoint": {
      "x": 740,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542988,
      "latitude": 34.818056
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-303L",
    "modelName": "TANK_883",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 793,
    "y": 450,
    "mapPoint": {
      "x": 793,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543572,
      "latitude": 34.818405
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-304L",
    "modelName": "TANK_884",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 778,
    "y": 450,
    "mapPoint": {
      "x": 778,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543409,
      "latitude": 34.818404
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-305L",
    "modelName": "TANK_885",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 770,
    "y": 450,
    "mapPoint": {
      "x": 770,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543326,
      "latitude": 34.818404
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-306L",
    "modelName": "TANK_886",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 762,
    "y": 450,
    "mapPoint": {
      "x": 762,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543237,
      "latitude": 34.818404
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-307L",
    "modelName": "TANK_887",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 755,
    "y": 450,
    "mapPoint": {
      "x": 755,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543153,
      "latitude": 34.818403
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-308L",
    "modelName": "TANK_888",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 747,
    "y": 450,
    "mapPoint": {
      "x": 747,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54307,
      "latitude": 34.818403
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-309L",
    "modelName": "TANK_889",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 739,
    "y": 450,
    "mapPoint": {
      "x": 739,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542986,
      "latitude": 34.818403
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-310L",
    "modelName": "TANK_890",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 679,
    "y": 489,
    "mapPoint": {
      "x": 679,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542325,
      "latitude": 34.818053
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-311L",
    "modelName": "TANK_891",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 687,
    "y": 489,
    "mapPoint": {
      "x": 687,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542414,
      "latitude": 34.818054
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-312L",
    "modelName": "TANK_892",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 679,
    "y": 450,
    "mapPoint": {
      "x": 679,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542323,
      "latitude": 34.8184
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-313L",
    "modelName": "TANK_893",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 687,
    "y": 450,
    "mapPoint": {
      "x": 687,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542412,
      "latitude": 34.818401
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-314L",
    "modelName": "TANK_894",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 710,
    "y": 489,
    "mapPoint": {
      "x": 710,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542663,
      "latitude": 34.818055
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-315L",
    "modelName": "TANK_895",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 710,
    "y": 450,
    "mapPoint": {
      "x": 710,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542661,
      "latitude": 34.818401
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-316L",
    "modelName": "TANK_896",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 695,
    "y": 489,
    "mapPoint": {
      "x": 695,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542503,
      "latitude": 34.818054
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-317L",
    "modelName": "TANK_897",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 695,
    "y": 450,
    "mapPoint": {
      "x": 695,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542501,
      "latitude": 34.818401
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-318L",
    "modelName": "TANK_898",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 630,
    "y": 489,
    "mapPoint": {
      "x": 630,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54179,
      "latitude": 34.818051
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-319L",
    "modelName": "TANK_899",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 646,
    "y": 489,
    "mapPoint": {
      "x": 646,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541964,
      "latitude": 34.818052
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-320L",
    "modelName": "TANK_900",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 489,
    "mapPoint": {
      "x": 654,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542053,
      "latitude": 34.818052
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-321L",
    "modelName": "TANK_901",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 663,
    "y": 489,
    "mapPoint": {
      "x": 663,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542147,
      "latitude": 34.818053
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-322L",
    "modelName": "TANK_902",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 671,
    "y": 489,
    "mapPoint": {
      "x": 671,
      "y": 489
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542236,
      "latitude": 34.818053
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-323L",
    "modelName": "TANK_903",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 630,
    "y": 451,
    "mapPoint": {
      "x": 630,
      "y": 451
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541789,
      "latitude": 34.818398
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-324L",
    "modelName": "TANK_904",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 646,
    "y": 451,
    "mapPoint": {
      "x": 646,
      "y": 451
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541962,
      "latitude": 34.818399
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-325L",
    "modelName": "TANK_905",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 451,
    "mapPoint": {
      "x": 654,
      "y": 451
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542051,
      "latitude": 34.818399
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-326L",
    "modelName": "TANK_906",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 663,
    "y": 450,
    "mapPoint": {
      "x": 663,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542145,
      "latitude": 34.8184
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-327L",
    "modelName": "TANK_907",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 671,
    "y": 450,
    "mapPoint": {
      "x": 671,
      "y": 450
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542234,
      "latitude": 34.8184
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-328L",
    "modelName": "TANK_908",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 741,
    "y": 188,
    "mapPoint": {
      "x": 741,
      "y": 188
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543003,
      "latitude": 34.820758
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-329L",
    "modelName": "TANK_909",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 771,
    "y": 188,
    "mapPoint": {
      "x": 771,
      "y": 188
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54333,
      "latitude": 34.820759
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-330L",
    "modelName": "TANK_910",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 743,
    "y": 163,
    "mapPoint": {
      "x": 743,
      "y": 163
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543021,
      "latitude": 34.820979
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-331L",
    "modelName": "TANK_911",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 760,
    "y": 163,
    "mapPoint": {
      "x": 760,
      "y": 163
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543214,
      "latitude": 34.820978
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-332L",
    "modelName": "TANK_925",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 288,
    "mapPoint": {
      "x": 727,
      "y": 288
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542848,
      "latitude": 34.819858
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-333L",
    "modelName": "TANK_948",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 293,
    "mapPoint": {
      "x": 727,
      "y": 293
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542848,
      "latitude": 34.819814
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-334L",
    "modelName": "TANK_921",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 279,
    "mapPoint": {
      "x": 727,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542848,
      "latitude": 34.81994
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-335L",
    "modelName": "TANK_928",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 264,
    "mapPoint": {
      "x": 727,
      "y": 264
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542847,
      "latitude": 34.820077
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-336L",
    "modelName": "TANK_929",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 259,
    "mapPoint": {
      "x": 727,
      "y": 259
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542847,
      "latitude": 34.820122
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-337L",
    "modelName": "TANK_968",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 273,
    "mapPoint": {
      "x": 727,
      "y": 273
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542847,
      "latitude": 34.819996
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-338L",
    "modelName": "TANK_931",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 268,
    "mapPoint": {
      "x": 727,
      "y": 268
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542847,
      "latitude": 34.820036
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-339L",
    "modelName": "TANK_932",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 727,
    "y": 284,
    "mapPoint": {
      "x": 727,
      "y": 284
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542848,
      "latitude": 34.819899
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-340L",
    "modelName": "TANK_971",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 288,
    "mapPoint": {
      "x": 713,
      "y": 288
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542698,
      "latitude": 34.819858
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-341L",
    "modelName": "TANK_972",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 293,
    "mapPoint": {
      "x": 713,
      "y": 293
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542698,
      "latitude": 34.819813
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-342L",
    "modelName": "TANK_935",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 279,
    "mapPoint": {
      "x": 713,
      "y": 279
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542697,
      "latitude": 34.819939
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-343L",
    "modelName": "TANK_942",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 264,
    "mapPoint": {
      "x": 713,
      "y": 264
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542697,
      "latitude": 34.820077
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-344L",
    "modelName": "TANK_975",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 259,
    "mapPoint": {
      "x": 713,
      "y": 259
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542696,
      "latitude": 34.820121
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-345L",
    "modelName": "TANK_960",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 273,
    "mapPoint": {
      "x": 713,
      "y": 273
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542697,
      "latitude": 34.819995
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-346L",
    "modelName": "TANK_977",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 268,
    "mapPoint": {
      "x": 713,
      "y": 268
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542697,
      "latitude": 34.820036
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-347L",
    "modelName": "TANK_978",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 713,
    "y": 284,
    "mapPoint": {
      "x": 713,
      "y": 284
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542698,
      "latitude": 34.819899
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-348L",
    "modelName": "TANK_979",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 249,
    "y": 353,
    "mapPoint": {
      "x": 249,
      "y": 353
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537623,
      "latitude": 34.819276
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-349L",
    "modelName": "TANK_981",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 264,
    "y": 253,
    "mapPoint": {
      "x": 264,
      "y": 253
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537784,
      "latitude": 34.82017
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-350L",
    "modelName": "TANK_983",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 264,
    "y": 234,
    "mapPoint": {
      "x": 264,
      "y": 234
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537783,
      "latitude": 34.820342
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-351L",
    "modelName": "TANK_984",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 259,
    "y": 200,
    "mapPoint": {
      "x": 259,
      "y": 200
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537732,
      "latitude": 34.820653
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-352L",
    "modelName": "TANK_985",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 189,
    "y": 102,
    "mapPoint": {
      "x": 189,
      "y": 102
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536961,
      "latitude": 34.821526
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-353L",
    "modelName": "TANK_986",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 232,
    "y": 116,
    "mapPoint": {
      "x": 232,
      "y": 116
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537436,
      "latitude": 34.8214
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-354L",
    "modelName": "TANK_987",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 257,
    "y": 198,
    "mapPoint": {
      "x": 257,
      "y": 198
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537709,
      "latitude": 34.820669
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-355L",
    "modelName": "TANK_988",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 284,
    "y": 100,
    "mapPoint": {
      "x": 284,
      "y": 100
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538008,
      "latitude": 34.821549
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-356L",
    "modelName": "TANK_989",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 274,
    "y": 100,
    "mapPoint": {
      "x": 274,
      "y": 100
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537892,
      "latitude": 34.821549
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-357L",
    "modelName": "TANK_990",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 247,
    "y": 143,
    "mapPoint": {
      "x": 247,
      "y": 143
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537597,
      "latitude": 34.821161
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-358L",
    "modelName": "TANK_991",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 259,
    "y": 178,
    "mapPoint": {
      "x": 259,
      "y": 178
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537731,
      "latitude": 34.820847
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-359L",
    "modelName": "TANK_993",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 271,
    "y": 137,
    "mapPoint": {
      "x": 271,
      "y": 137
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537862,
      "latitude": 34.821211
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-360L",
    "modelName": "TANK_994",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 231,
    "y": 181,
    "mapPoint": {
      "x": 231,
      "y": 181
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537425,
      "latitude": 34.820816
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-361L",
    "modelName": "TANK_995",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 260,
    "y": 286,
    "mapPoint": {
      "x": 260,
      "y": 286
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537737,
      "latitude": 34.81988
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-362L",
    "modelName": "TANK_996",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 190,
    "y": 383,
    "mapPoint": {
      "x": 190,
      "y": 383
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536976,
      "latitude": 34.819002
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-363L",
    "modelName": "TANK_997",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 233,
    "y": 369,
    "mapPoint": {
      "x": 233,
      "y": 369
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537449,
      "latitude": 34.819132
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-364L",
    "modelName": "TANK_998",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 257,
    "y": 287,
    "mapPoint": {
      "x": 257,
      "y": 287
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537713,
      "latitude": 34.819864
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-365L",
    "modelName": "TANK_999",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 286,
    "y": 385,
    "mapPoint": {
      "x": 286,
      "y": 385
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538022,
      "latitude": 34.818986
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-366L",
    "modelName": "TANK_1000",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 275,
    "y": 385,
    "mapPoint": {
      "x": 275,
      "y": 385
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537906,
      "latitude": 34.818986
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-367L",
    "modelName": "TANK_1001",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 248,
    "y": 342,
    "mapPoint": {
      "x": 248,
      "y": 342
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537607,
      "latitude": 34.819371
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-368L",
    "modelName": "TANK_1002",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 232,
    "y": 304,
    "mapPoint": {
      "x": 232,
      "y": 304
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537431,
      "latitude": 34.819716
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-369L",
    "modelName": "TANK_1003",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 256,
    "y": 420,
    "mapPoint": {
      "x": 256,
      "y": 420
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537696,
      "latitude": 34.818671
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-370L",
    "modelName": "TANK_1004",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 241,
    "y": 474,
    "mapPoint": {
      "x": 241,
      "y": 474
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537538,
      "latitude": 34.818185
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-371L",
    "modelName": "TANK_1006",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 241,
    "y": 443,
    "mapPoint": {
      "x": 241,
      "y": 443
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537536,
      "latitude": 34.818466
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-372L",
    "modelName": "TANK_1008",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 201,
    "y": 68,
    "mapPoint": {
      "x": 201,
      "y": 68
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537092,
      "latitude": 34.821837
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-373L",
    "modelName": "TANK_1010",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 256,
    "y": 332,
    "mapPoint": {
      "x": 256,
      "y": 332
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537697,
      "latitude": 34.819467
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-374L",
    "modelName": "TANK_1011",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 240,
    "y": 65,
    "mapPoint": {
      "x": 240,
      "y": 65
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537517,
      "latitude": 34.821861
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-375L",
    "modelName": "TANK_1013",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 255,
    "y": 160,
    "mapPoint": {
      "x": 255,
      "y": 160
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537689,
      "latitude": 34.821013
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-376L",
    "modelName": "TANK_1015",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 181,
    "y": 454,
    "mapPoint": {
      "x": 181,
      "y": 454
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53688,
      "latitude": 34.818372
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-377L",
    "modelName": "TANK_1016",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 192,
    "y": 454,
    "mapPoint": {
      "x": 192,
      "y": 454
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537001,
      "latitude": 34.818369
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-378L",
    "modelName": "TANK_1018",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 204,
    "y": 454,
    "mapPoint": {
      "x": 204,
      "y": 454
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537123,
      "latitude": 34.81837
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-379L",
    "modelName": "TANK_1020",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 182,
    "y": 475,
    "mapPoint": {
      "x": 182,
      "y": 475
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53689,
      "latitude": 34.818179
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-380L",
    "modelName": "TANK_1021",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 198,
    "y": 475,
    "mapPoint": {
      "x": 198,
      "y": 475
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537057,
      "latitude": 34.818179
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-381L",
    "modelName": "TANK_1023",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 212,
    "y": 475,
    "mapPoint": {
      "x": 212,
      "y": 475
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.53722,
      "latitude": 34.81818
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-382L",
    "modelName": "TANK_1027",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 307,
    "y": 283,
    "mapPoint": {
      "x": 307,
      "y": 283
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538253,
      "latitude": 34.819908
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-383L",
    "modelName": "TANK_1028",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 307,
    "y": 271,
    "mapPoint": {
      "x": 307,
      "y": 271
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538257,
      "latitude": 34.820008
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-384L",
    "modelName": "TANK_1030",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 307,
    "y": 260,
    "mapPoint": {
      "x": 307,
      "y": 260
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538256,
      "latitude": 34.820109
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-385L",
    "modelName": "TANK_1032",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 282,
    "mapPoint": {
      "x": 328,
      "y": 282
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538488,
      "latitude": 34.819916
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-386L",
    "modelName": "TANK_1033",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 266,
    "mapPoint": {
      "x": 328,
      "y": 266
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538487,
      "latitude": 34.820054
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-387L",
    "modelName": "TANK_1035",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 251,
    "mapPoint": {
      "x": 328,
      "y": 251
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538486,
      "latitude": 34.820188
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-388L",
    "modelName": "TANK_1042",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 305,
    "y": 437,
    "mapPoint": {
      "x": 305,
      "y": 437
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538234,
      "latitude": 34.818516
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-389L",
    "modelName": "TANK_1043",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 305,
    "y": 426,
    "mapPoint": {
      "x": 305,
      "y": 426
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538238,
      "latitude": 34.818617
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-390L",
    "modelName": "TANK_1045",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 305,
    "y": 415,
    "mapPoint": {
      "x": 305,
      "y": 415
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538238,
      "latitude": 34.818717
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-391L",
    "modelName": "TANK_1047",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 327,
    "y": 474,
    "mapPoint": {
      "x": 327,
      "y": 474
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538479,
      "latitude": 34.818187
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-392L",
    "modelName": "TANK_1048",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 327,
    "y": 459,
    "mapPoint": {
      "x": 327,
      "y": 459
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538478,
      "latitude": 34.818324
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-393L",
    "modelName": "TANK_1050",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 327,
    "y": 444,
    "mapPoint": {
      "x": 327,
      "y": 444
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538478,
      "latitude": 34.818459
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-394L",
    "modelName": "TANK_1053",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 319,
    "y": 90,
    "mapPoint": {
      "x": 319,
      "y": 90
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538391,
      "latitude": 34.821637
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-395L",
    "modelName": "TANK_1055",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 320,
    "y": 126,
    "mapPoint": {
      "x": 320,
      "y": 126
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538393,
      "latitude": 34.821316
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-396L",
    "modelName": "TANK_1058",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 306,
    "y": 180,
    "mapPoint": {
      "x": 306,
      "y": 180
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538248,
      "latitude": 34.820827
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-397L",
    "modelName": "TANK_1059",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 307,
    "y": 169,
    "mapPoint": {
      "x": 307,
      "y": 169
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538252,
      "latitude": 34.820927
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-398L",
    "modelName": "TANK_1061",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 307,
    "y": 158,
    "mapPoint": {
      "x": 307,
      "y": 158
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538251,
      "latitude": 34.821028
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-399L",
    "modelName": "TANK_1063",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 179,
    "mapPoint": {
      "x": 328,
      "y": 179
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538483,
      "latitude": 34.820835
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-400L",
    "modelName": "TANK_1064",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 164,
    "mapPoint": {
      "x": 328,
      "y": 164
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538482,
      "latitude": 34.820973
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-401L",
    "modelName": "TANK_1066",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 328,
    "y": 149,
    "mapPoint": {
      "x": 328,
      "y": 149
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538481,
      "latitude": 34.821107
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-402L",
    "modelName": "TANK_1070",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 481,
    "y": 304,
    "mapPoint": {
      "x": 481,
      "y": 304
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540159,
      "latitude": 34.819716
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-403L",
    "modelName": "TANK_1072",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 481,
    "y": 267,
    "mapPoint": {
      "x": 481,
      "y": 267
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540157,
      "latitude": 34.820049
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-404L",
    "modelName": "TANK_1074",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 415,
    "y": 371,
    "mapPoint": {
      "x": 415,
      "y": 371
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539437,
      "latitude": 34.819115
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-405L",
    "modelName": "TANK_1076",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 380,
    "y": 371,
    "mapPoint": {
      "x": 380,
      "y": 371
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539058,
      "latitude": 34.819113
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-406L",
    "modelName": "TANK_1077",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 465,
    "y": 371,
    "mapPoint": {
      "x": 465,
      "y": 371
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539985,
      "latitude": 34.819117
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-407L",
    "modelName": "TANK_1079",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 450,
    "y": 371,
    "mapPoint": {
      "x": 450,
      "y": 371
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539821,
      "latitude": 34.819116
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-408L",
    "modelName": "TANK_1082",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 480,
    "y": 371,
    "mapPoint": {
      "x": 480,
      "y": 371
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540151,
      "latitude": 34.819112
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-409L",
    "modelName": "TANK_1083",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 465,
    "y": 404,
    "mapPoint": {
      "x": 465,
      "y": 404
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.539989,
      "latitude": 34.818815
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-410L",
    "modelName": "TANK_1084",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 66,
    "y": 232,
    "mapPoint": {
      "x": 66,
      "y": 232
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535621,
      "latitude": 34.820363
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-411L",
    "modelName": "TANK_1085",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 603,
    "y": 166,
    "mapPoint": {
      "x": 603,
      "y": 166
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541492,
      "latitude": 34.820951
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-412L",
    "modelName": "TANK_1087",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 603,
    "y": 151,
    "mapPoint": {
      "x": 603,
      "y": 151
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541492,
      "latitude": 34.821086
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-413L",
    "modelName": "TANK_1090",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 602,
    "y": 182,
    "mapPoint": {
      "x": 602,
      "y": 182
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541487,
      "latitude": 34.820814
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-414L",
    "modelName": "TANK_1091",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 644,
    "y": 334,
    "mapPoint": {
      "x": 644,
      "y": 334
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541941,
      "latitude": 34.819444
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-415L",
    "modelName": "TANK_1093",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 644,
    "y": 319,
    "mapPoint": {
      "x": 644,
      "y": 319
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54194,
      "latitude": 34.819578
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-416L",
    "modelName": "TANK_1096",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 643,
    "y": 350,
    "mapPoint": {
      "x": 643,
      "y": 350
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541936,
      "latitude": 34.819306
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-417L",
    "modelName": "TANK_1097",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 656,
    "y": 231,
    "mapPoint": {
      "x": 656,
      "y": 231
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542069,
      "latitude": 34.820375
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-418L",
    "modelName": "TANK_1099",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 641,
    "y": 231,
    "mapPoint": {
      "x": 641,
      "y": 231
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541905,
      "latitude": 34.820374
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-419L",
    "modelName": "TANK_1102",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 671,
    "y": 231,
    "mapPoint": {
      "x": 671,
      "y": 231
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542235,
      "latitude": 34.82037
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-420L",
    "modelName": "TANK_1103",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 492,
    "y": 135,
    "mapPoint": {
      "x": 492,
      "y": 135
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.540282,
      "latitude": 34.821232
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-421L",
    "modelName": "TANK_1105",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 372,
    "y": 270,
    "mapPoint": {
      "x": 372,
      "y": 270
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538964,
      "latitude": 34.820016
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-422L",
    "modelName": "TANK_1107",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 372,
    "y": 256,
    "mapPoint": {
      "x": 372,
      "y": 256
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538963,
      "latitude": 34.82015
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-423L",
    "modelName": "TANK_1110",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 371,
    "y": 286,
    "mapPoint": {
      "x": 371,
      "y": 286
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538958,
      "latitude": 34.819878
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-424L",
    "modelName": "TANK_1112",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 320,
    "y": 312,
    "mapPoint": {
      "x": 320,
      "y": 312
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538392,
      "latitude": 34.81964
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-425L",
    "modelName": "TANK_1113",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 320,
    "y": 343,
    "mapPoint": {
      "x": 320,
      "y": 343
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538393,
      "latitude": 34.819368
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-426L",
    "modelName": "TANK_1114",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 320,
    "y": 373,
    "mapPoint": {
      "x": 320,
      "y": 373
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538395,
      "latitude": 34.819098
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-427L",
    "modelName": "TANK_1115",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 137,
    "y": 280,
    "mapPoint": {
      "x": 137,
      "y": 280
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536392,
      "latitude": 34.819927
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-428L",
    "modelName": "TANK_1116",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 137,
    "y": 249,
    "mapPoint": {
      "x": 137,
      "y": 249
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536391,
      "latitude": 34.820207
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-429L",
    "modelName": "TANK_1117",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 107,
    "y": 279,
    "mapPoint": {
      "x": 107,
      "y": 279
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536064,
      "latitude": 34.819937
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-430L",
    "modelName": "TANK_1118",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 107,
    "y": 249,
    "mapPoint": {
      "x": 107,
      "y": 249
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536063,
      "latitude": 34.820206
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-431L",
    "modelName": "TANK_1119",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 107,
    "y": 310,
    "mapPoint": {
      "x": 107,
      "y": 310
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.536063,
      "latitude": 34.819663
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-432L",
    "modelName": "TANK_1120",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 170,
    "mapPoint": {
      "x": 833,
      "y": 170
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544008,
      "latitude": 34.820918
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-433L",
    "modelName": "TANK_1121",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 159,
    "mapPoint": {
      "x": 833,
      "y": 159
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544007,
      "latitude": 34.821017
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-434L",
    "modelName": "TANK_1122",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 148,
    "mapPoint": {
      "x": 833,
      "y": 148
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544007,
      "latitude": 34.821116
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-435L",
    "modelName": "TANK_1123",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 137,
    "mapPoint": {
      "x": 833,
      "y": 137
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544006,
      "latitude": 34.821215
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-436L",
    "modelName": "TANK_1124",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 126,
    "mapPoint": {
      "x": 833,
      "y": 126
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544006,
      "latitude": 34.821314
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-437L",
    "modelName": "TANK_1125",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 115,
    "mapPoint": {
      "x": 833,
      "y": 115
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544005,
      "latitude": 34.821413
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-438L",
    "modelName": "TANK_1126",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 833,
    "y": 104,
    "mapPoint": {
      "x": 833,
      "y": 104
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544005,
      "latitude": 34.821512
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-439L",
    "modelName": "TANK_1128",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 663,
    "y": 440,
    "mapPoint": {
      "x": 663,
      "y": 440
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542153,
      "latitude": 34.818496
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-440L",
    "modelName": "TANK_1130",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 683,
    "y": 440,
    "mapPoint": {
      "x": 683,
      "y": 440
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542374,
      "latitude": 34.818497
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-441L",
    "modelName": "TANK_1574",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 14,
    "y": 500,
    "mapPoint": {
      "x": 14,
      "y": 500
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535052,
      "latitude": 34.817953
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-442L",
    "modelName": "TANK_1971",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 54,
    "mapPoint": {
      "x": 936,
      "y": 54
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545134,
      "latitude": 34.821958
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-443L",
    "modelName": "TANK_1972",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 946,
    "y": 54,
    "mapPoint": {
      "x": 946,
      "y": 54
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545249,
      "latitude": 34.821959
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-444L",
    "modelName": "TANK_1974",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 938,
    "y": 54,
    "mapPoint": {
      "x": 938,
      "y": 54
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545156,
      "latitude": 34.821958
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-445L",
    "modelName": "TANK_1977",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 63,
    "mapPoint": {
      "x": 936,
      "y": 63
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545134,
      "latitude": 34.82188
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-446L",
    "modelName": "TANK_1978",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 946,
    "y": 63,
    "mapPoint": {
      "x": 946,
      "y": 63
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545249,
      "latitude": 34.821881
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-447L",
    "modelName": "TANK_1980",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 938,
    "y": 63,
    "mapPoint": {
      "x": 938,
      "y": 63
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545156,
      "latitude": 34.82188
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-448L",
    "modelName": "TANK_1983",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 72,
    "mapPoint": {
      "x": 936,
      "y": 72
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545134,
      "latitude": 34.821802
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-449L",
    "modelName": "TANK_1984",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 946,
    "y": 72,
    "mapPoint": {
      "x": 946,
      "y": 72
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545249,
      "latitude": 34.821803
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-450L",
    "modelName": "TANK_1986",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 938,
    "y": 72,
    "mapPoint": {
      "x": 938,
      "y": 72
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545157,
      "latitude": 34.821802
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-451L",
    "modelName": "TANK_1989",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 80,
    "mapPoint": {
      "x": 936,
      "y": 80
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545135,
      "latitude": 34.821724
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-452L",
    "modelName": "TANK_1990",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 946,
    "y": 80,
    "mapPoint": {
      "x": 946,
      "y": 80
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54525,
      "latitude": 34.821725
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-453L",
    "modelName": "TANK_1992",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 938,
    "y": 80,
    "mapPoint": {
      "x": 938,
      "y": 80
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545157,
      "latitude": 34.821724
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-454L",
    "modelName": "TANK_1995",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 936,
    "y": 89,
    "mapPoint": {
      "x": 936,
      "y": 89
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545135,
      "latitude": 34.821646
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-455L",
    "modelName": "TANK_1996",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 946,
    "y": 89,
    "mapPoint": {
      "x": 946,
      "y": 89
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54525,
      "latitude": 34.821647
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-456L",
    "modelName": "TANK_1998",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 938,
    "y": 89,
    "mapPoint": {
      "x": 938,
      "y": 89
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545158,
      "latitude": 34.821646
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-457L",
    "modelName": "TANK_2001",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 859,
    "y": 110,
    "mapPoint": {
      "x": 859,
      "y": 110
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544299,
      "latitude": 34.821458
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-458L",
    "modelName": "TANK_2002",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 110,
    "mapPoint": {
      "x": 870,
      "y": 110
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544414,
      "latitude": 34.821458
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-459L",
    "modelName": "TANK_2004",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 861,
    "y": 110,
    "mapPoint": {
      "x": 861,
      "y": 110
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544321,
      "latitude": 34.821458
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-460L",
    "modelName": "TANK_2007",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 859,
    "y": 121,
    "mapPoint": {
      "x": 859,
      "y": 121
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544299,
      "latitude": 34.821356
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-461L",
    "modelName": "TANK_2008",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 121,
    "mapPoint": {
      "x": 870,
      "y": 121
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544414,
      "latitude": 34.821356
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-462L",
    "modelName": "TANK_2010",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 861,
    "y": 121,
    "mapPoint": {
      "x": 861,
      "y": 121
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544322,
      "latitude": 34.821356
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-463L",
    "modelName": "TANK_2013",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 859,
    "y": 134,
    "mapPoint": {
      "x": 859,
      "y": 134
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.5443,
      "latitude": 34.82124
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-464L",
    "modelName": "TANK_2014",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 134,
    "mapPoint": {
      "x": 870,
      "y": 134
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544415,
      "latitude": 34.821241
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-465L",
    "modelName": "TANK_2016",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 861,
    "y": 134,
    "mapPoint": {
      "x": 861,
      "y": 134
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544322,
      "latitude": 34.82124
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-466L",
    "modelName": "TANK_2019",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 860,
    "y": 153,
    "mapPoint": {
      "x": 860,
      "y": 153
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544301,
      "latitude": 34.821069
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-467L",
    "modelName": "TANK_2020",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 153,
    "mapPoint": {
      "x": 870,
      "y": 153
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544416,
      "latitude": 34.821069
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-468L",
    "modelName": "TANK_2022",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 862,
    "y": 153,
    "mapPoint": {
      "x": 862,
      "y": 153
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544323,
      "latitude": 34.821069
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-469L",
    "modelName": "TANK_2025",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 860,
    "y": 164,
    "mapPoint": {
      "x": 860,
      "y": 164
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544301,
      "latitude": 34.820971
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-470L",
    "modelName": "TANK_2026",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 870,
    "y": 164,
    "mapPoint": {
      "x": 870,
      "y": 164
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544416,
      "latitude": 34.820971
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-471L",
    "modelName": "TANK_2028",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 862,
    "y": 164,
    "mapPoint": {
      "x": 862,
      "y": 164
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544324,
      "latitude": 34.820971
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-472L",
    "modelName": "TANK_2031",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 925,
    "y": 22,
    "mapPoint": {
      "x": 925,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545012,
      "latitude": 34.822252
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-473L",
    "modelName": "TANK_2032",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 935,
    "y": 22,
    "mapPoint": {
      "x": 935,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545127,
      "latitude": 34.822252
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-474L",
    "modelName": "TANK_2034",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 927,
    "y": 22,
    "mapPoint": {
      "x": 927,
      "y": 22
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.545034,
      "latitude": 34.822252
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-475L",
    "modelName": "TANK_2037",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 750,
    "y": 17,
    "mapPoint": {
      "x": 750,
      "y": 17
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543098,
      "latitude": 34.822293
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-476L",
    "modelName": "TANK_2038",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 739,
    "y": 17,
    "mapPoint": {
      "x": 739,
      "y": 17
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542983,
      "latitude": 34.822293
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-477L",
    "modelName": "TANK_2040",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 748,
    "y": 17,
    "mapPoint": {
      "x": 748,
      "y": 17
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543075,
      "latitude": 34.822293
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-478L",
    "modelName": "TANK_2043",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 570,
    "y": 22,
    "mapPoint": {
      "x": 570,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541137,
      "latitude": 34.822245
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-479L",
    "modelName": "TANK_2048",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 581,
    "y": 22,
    "mapPoint": {
      "x": 581,
      "y": 22
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541255,
      "latitude": 34.822246
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-480L",
    "modelName": "TANK_2045",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 572,
    "y": 22,
    "mapPoint": {
      "x": 572,
      "y": 22
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541159,
      "latitude": 34.822246
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-481L",
    "modelName": "TANK_2049",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 279,
    "y": 24,
    "mapPoint": {
      "x": 279,
      "y": 24
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537952,
      "latitude": 34.822234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-482L",
    "modelName": "TANK_2050",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 290,
    "y": 24,
    "mapPoint": {
      "x": 290,
      "y": 24
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.538067,
      "latitude": 34.822234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-483L",
    "modelName": "TANK_2052",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 281,
    "y": 24,
    "mapPoint": {
      "x": 281,
      "y": 24
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537974,
      "latitude": 34.822234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-484L",
    "modelName": "TANK_2055",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 46,
    "y": 25,
    "mapPoint": {
      "x": 46,
      "y": 25
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535394,
      "latitude": 34.822224
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-485L",
    "modelName": "TANK_2060",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 56,
    "y": 25,
    "mapPoint": {
      "x": 56,
      "y": 25
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535512,
      "latitude": 34.822224
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-486L",
    "modelName": "TANK_2057",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 48,
    "y": 25,
    "mapPoint": {
      "x": 48,
      "y": 25
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.535416,
      "latitude": 34.822224
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-487L",
    "modelName": "TANK_2063",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 849,
    "y": 307,
    "mapPoint": {
      "x": 849,
      "y": 307
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544185,
      "latitude": 34.819684
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-488L",
    "modelName": "TANK_2082",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 859,
    "y": 309,
    "mapPoint": {
      "x": 859,
      "y": 309
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544297,
      "latitude": 34.819672
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-489L",
    "modelName": "TANK_2083",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 864,
    "y": 309,
    "mapPoint": {
      "x": 864,
      "y": 309
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544352,
      "latitude": 34.819672
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-490L",
    "modelName": "TANK_2084",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 869,
    "y": 309,
    "mapPoint": {
      "x": 869,
      "y": 309
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544407,
      "latitude": 34.819673
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-491L",
    "modelName": "TANK_2085",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 874,
    "y": 309,
    "mapPoint": {
      "x": 874,
      "y": 309
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544461,
      "latitude": 34.819673
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-492L",
    "modelName": "TANK_2086",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 879,
    "y": 309,
    "mapPoint": {
      "x": 879,
      "y": 309
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544516,
      "latitude": 34.819673
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-493L",
    "modelName": "TANK_2096",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 849,
    "y": 295,
    "mapPoint": {
      "x": 849,
      "y": 295
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544184,
      "latitude": 34.819793
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-494L",
    "modelName": "TANK_2115",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 859,
    "y": 294,
    "mapPoint": {
      "x": 859,
      "y": 294
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544296,
      "latitude": 34.819806
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-495L",
    "modelName": "TANK_2116",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 864,
    "y": 294,
    "mapPoint": {
      "x": 864,
      "y": 294
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544351,
      "latitude": 34.819806
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-496L",
    "modelName": "TANK_2117",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 869,
    "y": 294,
    "mapPoint": {
      "x": 869,
      "y": 294
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544406,
      "latitude": 34.819807
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-497L",
    "modelName": "TANK_2118",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 874,
    "y": 294,
    "mapPoint": {
      "x": 874,
      "y": 294
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54446,
      "latitude": 34.819807
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-498L",
    "modelName": "TANK_2119",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 879,
    "y": 294,
    "mapPoint": {
      "x": 879,
      "y": 294
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.544515,
      "latitude": 34.819807
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-499L",
    "modelName": "TANK_2127",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 640,
    "y": 142,
    "mapPoint": {
      "x": 640,
      "y": 142
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541899,
      "latitude": 34.821168
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-500L",
    "modelName": "TANK_2128",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 640,
    "y": 135,
    "mapPoint": {
      "x": 640,
      "y": 135
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541899,
      "latitude": 34.821234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-501L",
    "modelName": "TANK_2129",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 135,
    "mapPoint": {
      "x": 654,
      "y": 135
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542053,
      "latitude": 34.821234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-502L",
    "modelName": "TANK_2130",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 647,
    "y": 135,
    "mapPoint": {
      "x": 647,
      "y": 135
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541976,
      "latitude": 34.821234
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-503L",
    "modelName": "TANK_2131",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 654,
    "y": 126,
    "mapPoint": {
      "x": 654,
      "y": 126
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542053,
      "latitude": 34.821316
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-504L",
    "modelName": "TANK_2132",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 741,
    "y": 235,
    "mapPoint": {
      "x": 741,
      "y": 235
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543005,
      "latitude": 34.820333
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-505L",
    "modelName": "TANK_2134",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 723,
    "y": 230,
    "mapPoint": {
      "x": 723,
      "y": 230
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542807,
      "latitude": 34.820376
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-506L",
    "modelName": "TANK_2135",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 723,
    "y": 235,
    "mapPoint": {
      "x": 723,
      "y": 235
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542807,
      "latitude": 34.820334
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-507L",
    "modelName": "TANK_2136",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 723,
    "y": 239,
    "mapPoint": {
      "x": 723,
      "y": 239
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542807,
      "latitude": 34.820296
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-508L",
    "modelName": "TANK_2137",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 754,
    "y": 230,
    "mapPoint": {
      "x": 754,
      "y": 230
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543149,
      "latitude": 34.820383
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-509L",
    "modelName": "TANK_2138",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 759,
    "y": 229,
    "mapPoint": {
      "x": 759,
      "y": 229
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543205,
      "latitude": 34.820391
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-510L",
    "modelName": "TANK_2139",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 765,
    "y": 229,
    "mapPoint": {
      "x": 765,
      "y": 229
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54327,
      "latitude": 34.820392
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-511L",
    "modelName": "TANK_2140",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 771,
    "y": 229,
    "mapPoint": {
      "x": 771,
      "y": 229
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.543327,
      "latitude": 34.820391
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-512L",
    "modelName": "TANK_2141",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 640,
    "y": 126,
    "mapPoint": {
      "x": 640,
      "y": 126
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541898,
      "latitude": 34.821316
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-513L",
    "modelName": "TANK_2142",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 686,
    "y": 125,
    "mapPoint": {
      "x": 686,
      "y": 125
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542404,
      "latitude": 34.821326
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-514L",
    "modelName": "TANK_2143",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 647,
    "y": 126,
    "mapPoint": {
      "x": 647,
      "y": 126
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541975,
      "latitude": 34.821316
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-515L",
    "modelName": "TANK_2144",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 686,
    "y": 130,
    "mapPoint": {
      "x": 686,
      "y": 130
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542405,
      "latitude": 34.821282
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-516L",
    "modelName": "TANK_2146",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 719,
    "y": 416,
    "mapPoint": {
      "x": 719,
      "y": 416
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.54276,
      "latitude": 34.818708
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-517L",
    "modelName": "TANK_2147",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 718,
    "y": 432,
    "mapPoint": {
      "x": 718,
      "y": 432
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.542755,
      "latitude": 34.818567
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-518L",
    "modelName": "TANK_2149",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 562,
    "y": 234,
    "mapPoint": {
      "x": 562,
      "y": 234
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541044,
      "latitude": 34.820343
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-519L",
    "modelName": "TANK_2150",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 573,
    "y": 234,
    "mapPoint": {
      "x": 573,
      "y": 234
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541166,
      "latitude": 34.820344
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-520L",
    "modelName": "TANK_2153",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 577,
    "y": 401,
    "mapPoint": {
      "x": 577,
      "y": 401
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541211,
      "latitude": 34.818848
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-521L",
    "modelName": "TANK_2154",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 583,
    "y": 401,
    "mapPoint": {
      "x": 583,
      "y": 401
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541274,
      "latitude": 34.818848
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-522L",
    "modelName": "TANK_2155",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 589,
    "y": 401,
    "mapPoint": {
      "x": 589,
      "y": 401
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541343,
      "latitude": 34.818848
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-523L",
    "modelName": "TANK_2156",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 596,
    "y": 400,
    "mapPoint": {
      "x": 596,
      "y": 400
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541416,
      "latitude": 34.818849
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-524L",
    "modelName": "TANK_2157",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 571,
    "y": 401,
    "mapPoint": {
      "x": 571,
      "y": 401
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.541144,
      "latitude": 34.818848
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-525L",
    "modelName": "TANK_2158",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 272,
    "y": 348,
    "mapPoint": {
      "x": 272,
      "y": 348
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537872,
      "latitude": 34.819324
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-526L",
    "modelName": "TANK_2159",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 260,
    "y": 307,
    "mapPoint": {
      "x": 260,
      "y": 307
    },
    "priority": 1,
    "risk": 0.9,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537738,
      "latitude": 34.819687
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
  {
    "id": "TK-527L",
    "modelName": "TANK_2160",
    "facilityId": "tank-pump-area",
    "sensorModel": "fixed-gas-low",
    "x": 284,
    "y": 358,
    "mapPoint": {
      "x": 284,
      "y": 358
    },
    "priority": 1,
    "risk": 0.7,
    "installationHeight": 0.5,
    "effectiveRange": 4,
    "observedProps": "CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)",
    "gasCodes": [
      "CH4",
      "CO",
      "NH3",
      "O2"
    ],
    "wgs84": {
      "longitude": 113.537999,
      "latitude": 34.819229
    },
    "alarmLow": 10,
    "alarmHigh": 25
  },
]

export const MODEL_MONITOR_POINT_COUNT = 583
