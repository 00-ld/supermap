<template>
    <div class="logo" v-if="setting.showLogo">
        <img :src="setting.logo" alt="">
        <p>{{ setting.title }}</p>
    </div>
</template>

<script setup lang="ts">
//引入设置标题与logo这配置文件
import setting from '@/setting';
</script>
<style scoped lang="scss">
.logo {
    width: 100%;
    height: $base-menu-logo-height;
    color: white;
    display: flex;
    border-radius: 50%;
    align-items: center;
    padding: 11px;
    img{
        width: 40px;
        height: 40px;
         border-radius: 50%; // 圆形核心：圆角设为宽高的一半
        overflow: hidden;   // 隐藏超出圆形的部分
        object-fit: cover;  // 保证图片比例不变，填满圆形区域
    }
    p{
       font-size: 18px; 
       margin-left: 10px;
    }
}
</style>
