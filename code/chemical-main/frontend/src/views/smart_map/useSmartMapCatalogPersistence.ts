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
import {
  reqAddSensor,
  reqDeleteSensor,
  reqSensorList,
  reqUpdateSensor,
  type SensorRecord,
  type SensorSavePayload,
} from '@/api/sensor'

export type SmartMapCatalogSensor = SensorRecord & DiffusionSensor

interface SmartMapCatalogPersistenceOptions<TSensor extends SmartMapCatalogSensor, TFrame> {
  sensors: Ref<TSensor[]>
  gases: Ref<GasRecord[]>
  diffusionFrames: Ref<TFrame[]>
  buildActiveSensorSeries: (sourceSensors: SensorRecord[], frames: TFrame[]) => TSensor[]
  generateBaseStandardLayout: () => SensorRecord[]
  realSensorLayoutCount: number
  computeRiskGrid: () => void
  calcCoverage: () => void
  render: () => void
  getErrorMessage: (err: unknown, fallback?: string) => string
}

export function useSmartMapCatalogPersistence<TSensor extends SmartMapCatalogSensor, TFrame>(
  options: SmartMapCatalogPersistenceOptions<TSensor, TFrame>,
) {
  const applyProjectDefaultSensors = (reason: string) => {
    if (options.sensors.value.length) return
    options.sensors.value = options.buildActiveSensorSeries(
      options.generateBaseStandardLayout(),
      options.diffusionFrames.value,
    )
    options.computeRiskGrid()
    options.calcCoverage()
    options.render()
    console.warn(reason)
  }

  const fetchSensorsFromDB = async () => {
    try {
      const resp = await reqSensorList()
      if (resp.code === 200 && Array.isArray(resp.data)) {
        const sourceSensors = resp.data.length ? resp.data : options.generateBaseStandardLayout()
        options.sensors.value = options.buildActiveSensorSeries(sourceSensors, options.diffusionFrames.value)
        options.computeRiskGrid()
        options.calcCoverage()
        options.render()
        if (!resp.data.length) {
          console.warn(`数据库未返回传感器，已使用真实 DOM 默认布点 ${options.realSensorLayoutCount} 个`)
        }
      }
    } catch (err: unknown) {
      console.warn('从数据库加载传感器失败:', options.getErrorMessage(err))
      applyProjectDefaultSensors('数据库传感器加载失败，已使用真实地图默认布点')
    }
  }

  const saveSensorToDB = async (sensor: SensorSavePayload) => {
    try {
      const result = await reqAddSensor(sensor)
      if (result.code === 200) return true
      console.warn('保存传感器到数据库失败:', result.message)
      return false
    } catch (err: unknown) {
      console.warn('保存传感器到数据库失败:', options.getErrorMessage(err))
      return false
    }
  }

  const updateSensorToDB = async (sensor: SensorSavePayload) => {
    try {
      const result = await reqUpdateSensor(sensor)
      if (result.code !== 200) {
        console.warn('更新传感器到数据库失败:', result.message)
      }
    } catch (err: unknown) {
      console.warn('更新传感器到数据库失败:', options.getErrorMessage(err))
    }
  }

  const deleteSensorFromDB = async (id: string) => {
    try {
      const result = await reqDeleteSensor(id)
      if (result.code !== 200) {
        console.warn('从数据库删除传感器失败:', result.message)
      }
    } catch (err: unknown) {
      console.warn('从数据库删除传感器失败:', options.getErrorMessage(err))
    }
  }

  const deleteAllSensorsFromDB = async () => {
    for (const sensor of options.sensors.value) {
      await deleteSensorFromDB(sensor.id)
    }
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
