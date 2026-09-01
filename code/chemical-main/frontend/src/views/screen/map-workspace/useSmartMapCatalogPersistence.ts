import type { Ref } from 'vue'
import type { DiffusionSensor } from '@/data/phase1Config'
import {
  reqAddGas,
  reqDeleteGas,
  reqGasList,
  reqUpdateGas,
  type GasRecord,
  type GasSavePayload,
} from '@/api/gas'
import type { SensorRecord, SensorSavePayload } from '@/types/sensor'

export type SmartMapCatalogSensor = SensorRecord & DiffusionSensor

interface SmartMapCatalogPersistenceOptions<
  TSensor extends SmartMapCatalogSensor,
  TFrame,
> {
  sensors: Ref<TSensor[]>
  gases: Ref<GasRecord[]>
  diffusionFrames: Ref<TFrame[]>
  buildActiveSensorSeries: (
    sourceSensors: SensorRecord[],
    frames: TFrame[],
  ) => TSensor[]
  generateBaseStandardLayout: () => SensorRecord[]
  computeRiskGrid: () => void
  calcCoverage: () => void
  render: () => void
  getErrorMessage: (err: unknown, fallback?: string) => string
}

export function useSmartMapCatalogPersistence<
  TSensor extends SmartMapCatalogSensor,
  TFrame,
>(options: SmartMapCatalogPersistenceOptions<TSensor, TFrame>) {
  // 后端 sensor 表与 /sensor/* 接口已下线：传感器仅保存在前端内存。
  // 已有布点时重建扩散采样时序；无布点时使用真实地图默认布点作为初始传感器源。
  const fetchSensorsFromDB = () => {
    const sourceSensors = options.sensors.value.length
      ? options.sensors.value
      : options.generateBaseStandardLayout()
    options.sensors.value = options.buildActiveSensorSeries(
      sourceSensors,
      options.diffusionFrames.value,
    )
    options.computeRiskGrid()
    options.calcCoverage()
    options.render()
  }

  // 以下写接口原为后端 sensor 表持久化，现本地无持久化需求，保留调用契约（返回成功）以免上层中断。
  const saveSensorToDB = async (sensor: SensorSavePayload) => {
    void sensor
    return true
  }

  const updateSensorToDB = async (sensor: SensorSavePayload) => {
    void sensor
    /* 本地传感器已由上层直接更新，无需额外持久化 */
  }

  const deleteSensorFromDB = async (id: string) => {
    void id
    /* 本地传感器已由上层直接从列表中移除 */
  }

  const deleteAllSensorsFromDB = async () => {
    /* 清空由上层统一处理（clearAllSensor 已置空 sensors 列表） */
  }

  const fetchGasList = async () => {
    try {
      const resp = await reqGasList()
      if (resp.code === 200 && Array.isArray(resp.data)) {
        options.gases.value = resp.data
      }
    } catch (err: unknown) {
      console.warn('从数据库加载气体类型失败:', options.getErrorMessage(err))
    }
  }

  const saveGasToDB = async (gas: GasSavePayload) => {
    try {
      const result = await reqAddGas(gas)
      if (result.code === 200) {
        await fetchGasList()
      } else {
        console.warn('保存气体类型到数据库失败:', result.message)
      }
    } catch (err: unknown) {
      console.warn('保存气体类型到数据库失败:', options.getErrorMessage(err))
    }
  }

  const updateGasToDB = async (gas: GasSavePayload) => {
    try {
      const result = await reqUpdateGas(gas)
      if (result.code === 200) {
        await fetchGasList()
      } else {
        console.warn('更新气体类型到数据库失败:', result.message)
      }
    } catch (err: unknown) {
      console.warn('更新气体类型到数据库失败:', options.getErrorMessage(err))
    }
  }

  const deleteGasFromDB = async (id: string) => {
    try {
      const result = await reqDeleteGas(id)
      if (result.code === 200) {
        await fetchGasList()
      }
    } catch (err: unknown) {
      console.warn('从数据库删除气体类型失败:', options.getErrorMessage(err))
    }
  }

  return {
    deleteAllSensorsFromDB,
    deleteGasFromDB,
    deleteSensorFromDB,
    fetchGasList,
    fetchSensorsFromDB,
    saveGasToDB,
    saveSensorToDB,
    updateGasToDB,
    updateSensorToDB,
  }
}
