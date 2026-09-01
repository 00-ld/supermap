import { ref } from 'vue'

export interface SmartMapWeatherState {
  windSpeed: number
  windDir: number
  temp: number
  rain: number
  humidity: number
  pressure: number
  windSpeedKmh: number
  obsTime: string
}

export type SmartMapWeatherSource = 'simulated' | 'real'

export function useSmartMapWeatherState() {
  const weatherState = ref<SmartMapWeatherState>({
    windSpeed: 2,
    windDir: 135,
    temp: 28,
    rain: 0,
    humidity: 60,
    pressure: 1013,
    windSpeedKmh: 0,
    obsTime: '',
  })
  const weatherSource = ref<SmartMapWeatherSource>('simulated')

  function initializeWeatherData() {
    weatherSource.value = 'simulated'
    weatherState.value = {
      ...weatherState.value,
      windSpeedKmh: 0,
      obsTime: '',
    }
  }

  return {
    initializeWeatherData,
    weatherSource,
    weatherState,
  }
}
