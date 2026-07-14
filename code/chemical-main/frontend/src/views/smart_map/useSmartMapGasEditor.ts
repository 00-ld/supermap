import { reactive, ref, type Ref } from 'vue'
import type { GasRecord, GasSavePayload } from '@/api/gas'

interface SmartMapGasEditorOptions<TGas extends GasRecord> {
  gases: Ref<TGas[]>
  saveGasToDB: (gas: GasSavePayload) => Promise<unknown>
  updateGasToDB: (gas: GasSavePayload) => Promise<unknown>
  deleteGasFromDB: (id: string) => Promise<unknown>
  confirmDelete?: (message: string) => boolean
  showToast: (message: string, type: 'success' | 'warn' | 'error' | 'danger') => void
}

const DEFAULT_GAS_DRAFT: GasSavePayload = {
  id: '',
  name: '',
  detectionRange: '',
  installationHeight: 1.5,
  effectiveRange: 30,
  installRemark: '',
  priority: 3,
  risk: 0.3,
  type: 'gas',
  mode: 'auto',
}

function assignGasDraft(target: GasSavePayload, source: GasSavePayload) {
  target.id = source.id
  target.name = source.name
  target.detectionRange = source.detectionRange || ''
  target.installationHeight = source.installationHeight ?? 1.5
  target.effectiveRange = source.effectiveRange ?? 30
  target.installRemark = source.installRemark || ''
  target.priority = source.priority ?? 3
  target.risk = source.risk ?? 0.3
  target.type = source.type || 'gas'
  target.mode = source.mode || 'auto'
}

export function useSmartMapGasEditor<TGas extends GasRecord>(
  options: SmartMapGasEditorOptions<TGas>,
) {
  const gasPanelVisible = ref(false)
  const gasEditDraft = reactive<GasSavePayload>({ ...DEFAULT_GAS_DRAFT })

  function confirmGasDelete(message: string) {
    return options.confirmDelete ? options.confirmDelete(message) : confirm(message)
  }

  function editGas(gas: TGas) {
    assignGasDraft(gasEditDraft, {
      ...DEFAULT_GAS_DRAFT,
      ...gas,
    })
    gasPanelVisible.value = true
  }

  async function removeGas(id: string) {
    if (!confirmGasDelete('确定删除气体类型 ' + id + ' 吗？')) return
    await options.deleteGasFromDB(id)
  }

  function resetGasDraft() {
    assignGasDraft(gasEditDraft, DEFAULT_GAS_DRAFT)
    gasPanelVisible.value = true
  }

  async function saveGasDraft() {
    if (!gasEditDraft.id || !gasEditDraft.name) {
      options.showToast('请填写气体编号和名称', 'warn')
      return
    }
    const payload: GasSavePayload = {
      id: gasEditDraft.id,
      name: gasEditDraft.name,
      detectionRange: gasEditDraft.detectionRange,
      installationHeight: gasEditDraft.installationHeight,
      effectiveRange: gasEditDraft.effectiveRange,
      installRemark: gasEditDraft.installRemark,
      priority: gasEditDraft.priority,
      risk: gasEditDraft.risk,
      type: 'gas',
      mode: 'auto',
    }
    const existing = options.gases.value.find(gas => gas.id === gasEditDraft.id)
    if (existing) {
      await options.updateGasToDB(payload)
      options.showToast('气体类型已更新', 'success')
      return
    }
    await options.saveGasToDB(payload)
    options.showToast('气体类型已添加', 'success')
  }

  return {
    editGas,
    gasEditDraft,
    gasPanelVisible,
    removeGas,
    resetGasDraft,
    saveGasDraft,
  }
}
