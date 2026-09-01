import { ref } from 'vue'
import { formatGeoCoord } from '@/data/coordinate'

export function useSmartMapRuntimeDisplay() {
  const clock = ref('--:--:--')
  const coordLongitude = ref('118.780000°E')
  const coordLatitude = ref('32.040000°N')
  const coordAltitude = ref('18.0m')

  function updateCoordDisplay(wx: number, wy: number) {
    const geo = formatGeoCoord(wx, wy)
    coordLongitude.value = geo.longitude
    coordLatitude.value = geo.latitude
    coordAltitude.value = geo.altitude
  }

  function updateClock() {
    clock.value = new Date().toTimeString().split(' ')[0]
  }

  return {
    clock,
    coordAltitude,
    coordLatitude,
    coordLongitude,
    updateClock,
    updateCoordDisplay,
  }
}
