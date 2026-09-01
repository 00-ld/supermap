import type { RouteRecordRaw } from 'vue-router'

// 对外暴露配置路由(常量路由):全部用户都可以访问到的路由
export const constantRoute: RouteRecordRaw[] = [
  {
    // 登录
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    name: 'login',
    meta: {
      title: '登录', // 菜单标题
      hidden: true, // 代表路由标题在菜单中是否隐藏  true:隐藏 false:不隐藏
      icon: 'Promotion', // 菜单文字左侧的图标,支持 element-plus 全部图标
    },
  },
  {
    // 注册
    path: '/register',
    component: () => import('@/views/register/index.vue'),
    name: 'register',
    meta: {
      title: '注册',
      hidden: true,
      icon: 'UserFilled',
    },
  },
  {
    // 登录成功以后展示数据的路由
    path: '/',
    component: () => import('@/layout/index.vue'),
    name: 'layout',
    meta: {
      title: '',
      hidden: false,
      icon: '',
    },
    redirect: '/home',
    children: [
      {
        path: '/home',
        component: () => import('@/views/home/index.vue'),
        meta: {
          title: '首页',
          hidden: false,// 是否在菜单中隐藏
          icon: 'HomeFilled',
        },
      },
    ],
  },
  {
    // 404
    path: '/404',
    component: () => import('@/views/404/index.vue'),
    name: '404',
    meta: {
      title: '404',
      hidden: true,
      icon: 'DocumentDelete',
    },
  },
  {
    path: '/screen',
    component: () => import('@/views/screen/index.vue'),
    name: 'Screen',
    meta: {
      hidden: false,
      title: '数字园区',
      icon: 'Platform',
    },
  },

  //预警与智巡
  {
    path: '/thing',
    component: () => import('@/layout/index.vue'),
    name: 'Car',//Thing
    meta: {
      title: '预警与智巡',
      hidden: false,
      icon: 'Tickets',
    },
    redirect: '/thing/monitor_history',
    children: [
      {
        path: '/thing/monitor_history',
        component: () => import('@/views/thing/monitor_history/index.vue'),
        name: 'monitor_history',
        meta: {
          title: '实时预警',
          icon: 'Tickets',
          hidden: false,
        },
      },
      {
        path: '/car/home', // 子路由路径（小写规范）
        component: () => import('@/views/car/CarHome.vue'),
        name: 'CarInspectionHome',
        meta: {
          title: '智巡监测', // 菜单标题
          icon: 'Van', // 填充版小车图标
          hidden: false,
        },
      },
      {
        path: '/car/:id',
        component: () => import('@/views/car/CarDetail.vue'),
        name: 'CarDetail',
        meta: {
          title: '小车详情',
          icon: 'InfoFilled',
          hidden: true,
        },
      }
    ]
  },
  // 人员审批（首页）
  {
    path: '/person',
    component: () => import('@/layout/index.vue'),
    name: 'Person',
    meta: {
      title: '人员管理',
      hidden: true, // 复用acl的菜单，这里隐藏
      icon: 'User',
    },
    redirect: '/person/approval',
    children: [
      {
        path: '/person/approval',
        component: () => import('@/views/acl/employee/index.vue'), // 复用员工信息管理页面
        name: 'PersonApproval',
        meta: {
          title: '人员审批',
          icon: 'UserCheck',
          hidden: false,
        },
      },
    ],
  },
  // 人员信息管理
  {
    path: '/acl',
    component: () => import('@/layout/index.vue'),
    name: 'Acl',
    meta: {
      title: '人员信息管理',
      icon: 'Lock',
      hidden: false,
    },
    redirect: '/acl/role',
    children: [
      {
        path: '/acl/role',
        component: () => import('@/views/acl/role/index.vue'),
        name: 'Role',
        meta: {
          title: '管理员管理',
          icon: 'UserFilled',
          hidden: false,
        },
      },
      {
        path: '/acl/employee',
        name: 'AclEmployee',
        component: () => import('@/views/acl/employee/index.vue'),
        meta: {
          title: '员工信息管理',
          icon: 'User',
          hidden: false,
        },
      },
    ],
  },
  // yolo 智能监测
  {
    path: '/yolo',
    component: () => import('@/layout/index.vue'),
    name: 'YoloMonitor',
    meta: {
      title: 'YOLO智能监测',
      icon: 'Monitor',
      hidden: false, // 显示在菜单
    },
    children: [
      {
        path: '/yolo',
        component: () => import('@/views/yolo/Home.vue'),
        name: 'YoloInspection',
        meta: {
          title: '厂区图像巡检',
          icon: 'VideoMonitor',
        },
      },
    ],
  },

];

// 任意路由
export const anyRoute: RouteRecordRaw = {
  // 任意路由
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  name: 'Any',
  meta: {
    title: '任意路由',
    hidden: true,
    icon: 'DataLine',
  },
};
