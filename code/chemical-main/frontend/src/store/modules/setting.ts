import { defineStore } from 'pinia'

const useLayOutSettingStore = defineStore('SettingStore', {
  state: () => {
    return {
      fold: false,
    }
  },
})

export default useLayOutSettingStore
