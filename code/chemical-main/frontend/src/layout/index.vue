<template>
  <div class="layout_container">
    <!-- 顶部导航栏 -->
    <header class="header_nav">
      <div class="header_wrap">
        <!-- Logo -->
        <Logo style="margin: auto"></Logo>
        <!-- 导航菜单 -->
        <nav class="header_menu">
          <el-menu
            mode="horizontal"
            :default-active="$route.path"
            @select="handleMenuSelect"
            background-color="#000"
            text-color="#fff"
            active-text-color="#9aa8b8"
            class="top_menu"
            :ellipsis="false"
          >
            <!-- 首页（无下拉） -->
            <el-menu-item index="/home">首页</el-menu-item>

            <!-- 数字园区（无下拉） -->
            <el-menu-item index="/screen">数字园区</el-menu-item>

            <!-- 智慧地图（无下拉） -->
            <el-menu-item index="/smart-map">智慧地图</el-menu-item>

            <!-- 预警与智巡（有子菜单） -->
            <el-sub-menu index="/warning-patrol">
              <template #title>预警与智巡</template>
              <el-menu-item index="/thing/monitor_history">实时监控</el-menu-item>
              <el-menu-item index="/car/home">智巡监测</el-menu-item>
            </el-sub-menu>

            <!-- 厂区图像巡检（无下拉） -->
            <el-menu-item index="/yolo">厂区图像巡检</el-menu-item>

            <!-- 人员信息管理（有子菜单） -->
            <el-sub-menu v-if="userStore.isAdmin" index="/personnel-manage">
              <template #title>人员信息管理</template>
              <el-menu-item index="/acl/role">管理员管理</el-menu-item>
              <el-menu-item index="/acl/employee">员工信息管理</el-menu-item>
            </el-sub-menu>

            <!-- 退出登录（无下拉） -->
            <el-menu-item index="logout" class="logout-item">
              退出登录
            </el-menu-item>
          </el-menu>
        </nav>

        <!-- 右侧个人头像区域 -->
        <div class="user_info">
          <div class="avatar_box">
            <el-avatar :size="48" class="user_avatar">
              <span class="avatar_text">{{ avatarText }}</span>
            </el-avatar>
          </div>
        </div>
      </div>
    </header>

    <!-- 顶部tabbar（移出header_nav，单独布局） -->
    <div class="layout_tabbar" :class="{ fold: LayOutSettingStore?.fold }">
      <Tabbar></Tabbar>
    </div>

    <!-- 内容区域 -->
    <main class="layout_main">
      <Main />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElAvatar } from 'element-plus'
// 引入子组件
import Main from './main/index.vue'
import Logo from './logo/index.vue'
import Tabbar from './tabbar/index.vue'
import useUserStore from '@/store/modules/user'
import useLayOutSettingStore from '@/store/modules/setting'

defineOptions({
  name: 'Layout',
})

// 获取路由实例
const $router = useRouter()
const $route = useRoute()
const userStore = useUserStore()
const avatarText = computed(() => Array.from(userStore.displayName).slice(0, 4).join('') || '用户')

// 接入真实的 Pinia 布局仓库，与 breadcrumb / main 组件共享同一折叠状态。
const LayOutSettingStore = useLayOutSettingStore()

// 菜单选中事件
const handleMenuSelect = (index: string) => {
  if (index === $route.path) return

  if (index === 'logout') {
    // 走 store 的 logout：清除内存与本地存储(TOKEN)
    userStore.logout()
    $router
      .push('/login')
      .catch((err) => console.warn('退出登录跳转失败:', err))
    return
  }

  $router.push(index).catch((err) => console.warn('菜单跳转失败:', err))
}
</script>

<style scoped lang="scss">
// 全局变量定义（解决未定义变量问题）
$base-menu-width: 200px; // 菜单展开宽度
$base-menu-min-width: 64px; // 菜单折叠宽度
$base-tabbar-height: 48px; // tabbar高度
$header-height: 76px; // 顶部导航高度

.layout_container {
  width: 100%;
  min-height: 100vh;
  background: #07111f;
}
// 顶部导航栏（独立布局）
.header_nav {
  width: 100%;
  height: $header-height;
  background:
    linear-gradient(90deg, rgba(4, 13, 28, 0.96), rgba(10, 31, 51, 0.92)),
    rgba(5, 16, 31, 0.94);
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999; // 高于tabbar，避免遮挡
  border-bottom: 1px solid rgba(154, 168, 184, 0.18);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(16px);

  .header_wrap {
    max-width: 1920px;
    width: 100%; // 占满宽度
    height: 100%;
    margin: 0 auto;
    display: flex;
    align-items: stretch;
    justify-content: flex-start; // 整体左对齐，最大化菜单空间
    padding: 0 clamp(16px, 2vw, 32px);
    box-sizing: border-box; // 防止padding撑大容器
  }

  // 导航菜单
  .header_menu {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    margin-left: 10px;
    /* 移除右侧margin，彻底释放菜单宽度 */
    // margin-right: 80px;

    .top_menu {
      border-bottom: none;
      background-color: transparent !important;
      width: 100%;
      display: flex;
      flex-wrap: nowrap; // 禁止菜单项换行
      min-width: 0;

      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        color: rgba(230, 240, 246, 0.84);
        font-size: 15px;
        padding: 0 18px;
        height: $header-height;
        line-height: $header-height;
        transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        // 禁止文字换行
        white-space: nowrap;
        box-sizing: border-box;
        border-bottom: 0;

        &:hover,
        &.is-active {
          color: #c6d0dc;
          border-bottom: 0;
          background-color: rgba(154, 168, 184, 0.08) !important;
          box-shadow: inset 0 -3px 0 rgba(154, 168, 184, 0.70);
        }
      }

      // 退出登录样式突出
      :deep(.logout-item) {
        color: #d6a0a0;
        margin-left: auto;

        &:hover {
          color: #e2b6b6;
          box-shadow: inset 0 -3px 0 rgba(199, 130, 130, 0.72);
        }
      }

      :deep(.el-sub-menu__icon-arrow) {
        color: #fff;
        margin-left: 5px;
        //display: none;
      }

      // 下拉子菜单样式
      :deep(.el-sub-menu .el-menu) {
        background-color: rgba(6, 18, 36, 0.98) !important;
        border: 1px solid rgba(154, 168, 184, 0.16);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);

        :deep(.el-menu-item) {
          height: 48px;
          line-height: 48px;
          padding-left: 30px !important;
          border-bottom: none !important;

          &:hover {
            background-color: rgba(154, 168, 184, 0.10) !important;
            color: #c6d0dc;
          }
        }
      }
    }
  }

  // 右侧个人头像
  .user_info {
    display: flex;
    align-items: center;
    margin-left: 20px;
    margin-right: 15px;
    flex-shrink: 0; // 防止头像被压缩

    .avatar_box {
      .user_avatar {
        cursor: pointer;
        border: 2px solid #7f8d9d;
        background: linear-gradient(135deg, rgba(154, 168, 184, 0.18), rgba(127, 141, 157, 0.14));
        box-shadow: 0 0 0 4px rgba(154, 168, 184, 0.08);
        transition: transform 0.2s ease, border-color 0.2s ease;

        &:hover {
          transform: scale(1.05);
          border-color: #aab6c4;
        }

        .avatar_text {
          font-size: 12px;
          color: #fff;
        }
      }
    }
  }
}

// 顶部tabbar（独立布局，避免和header嵌套）
.layout_tabbar {
  position: fixed;
  top: $header-height;
  left: 0;
  width: 100%;
  height: $base-tabbar-height;
  background: rgba(8, 22, 40, 0.88);
  z-index: 998;
  transition: all 0.3s;
  border-bottom: 1px solid rgba(154, 168, 184, 0.12);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(12px);

  &.fold {
    left: $base-menu-min-width;
    width: calc(100% - #{$base-menu-min-width});
  }
}

// 内容区域（适配header+tabbar高度）
.layout_main {
  margin-top: calc($header-height + $base-tabbar-height);
  padding: clamp(18px, 2.4vw, 32px) clamp(18px, 5vw, 96px);
  min-height: calc(100vh - $header-height - $base-tabbar-height);
  max-width: 1920px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  position: relative; /* 必须加 */
  overflow-x: hidden;
  overflow-y: auto;
  background:
    radial-gradient(circle at 85% 0%, rgba(230, 162, 60, 0.11), transparent 30%),
    linear-gradient(135deg, rgba(7, 17, 31, 0.94), rgba(8, 31, 40, 0.9));

  /* 背景图 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('@/assets/images/background2.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
    /* 0=不模糊，3=轻微，5=适中，8=很模糊，10=非常模糊 */
    filter: blur(10px) saturate(1.05);
    opacity: 0.38;
    transform: scale(1.03);
  }

  /* 让内容在模糊层上面 */
  & > * {
    position: relative;
    z-index: 1;
  }
}
// 小屏幕适配
@media (max-width: 1440px) {
  .header_menu :deep(.el-menu-item),
  .header_menu :deep(.el-sub-menu__title) {
    font-size: 14px;
    padding: 0 10px;
  }
}

@media (max-width: 1100px) {
  .header_nav {
    .header_wrap {
      padding: 0 12px;
    }

    .header_menu {
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .user_info {
      margin-left: 10px;
      margin-right: 0;
    }
  }

  .layout_main {
    padding: 16px;
  }
}
</style>
