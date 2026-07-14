import SvgIcon from './SvgIcon/index.vue'
import type { App, Component } from 'vue'

import {
  ArrowRight,
  DataLine,
  Delete,
  DocumentDelete,
  Edit,
  Expand,
  Fold,
  FullScreen,
  HomeFilled,
  InfoFilled,
  Lock,
  Monitor,
  MoonNight,
  Platform,
  Plus,
  Promotion,
  Setting,
  Sunny,
  Tickets,
  User,
  UserFilled,
  Van,
  VideoCamera,
} from '@element-plus/icons-vue'

const allGloablComponent: Record<string, Component> = { SvgIcon }

const globalElementIcons: Record<string, Component> = {
  ArrowRight,
  DataLine,
  Delete,
  DocumentDelete,
  Edit,
  Expand,
  Fold,
  FullScreen,
  HomeFilled,
  InfoFilled,
  Lock,
  Monitor,
  MoonNight,
  Platform,
  Plus,
  Promotion,
  Setting,
  Sunny,
  Tickets,
  User,
  UserCheck: UserFilled,
  UserFilled,
  Van,
  VideoCamera,
  VideoMonitor: Monitor,
}

export default {
  install(app: App) {
    Object.keys(allGloablComponent).forEach((key) => {
      app.component(key, allGloablComponent[key])
    })
    for (const [key, component] of Object.entries(globalElementIcons)) {
      app.component(key, component)
    }
  },
}
