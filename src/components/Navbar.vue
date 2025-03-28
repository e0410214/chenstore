<template>
  <nav class="navbar">
    <div class="container-fluid">
        <div class="navbar-collapse" id="navbarNav">
             <ul class="navbar-nav">
      <li class="nav-item">
        <router-link to="/" class="nav-link">商品管理</router-link>  
      </li>
      <li class="nav-item">
        <router-link to="/order" class="nav-link">訂購系統</router-link>
      </li>
      <li class="nav-item">
        <router-link to="/orders" class="nav-link">訂單管理</router-link>
      </li>
      <li class="nav-item">
        <router-link to="/customers" class="nav-link">顧客管理</router-link>
      </li>
    </ul>
    </div>
  </div>
  <div>
  
  </div>
</nav>

</template>
<script>


export default {
  emits: ["change-page"], // ✅ 定義事件
  props:{
  currentPage: String
},
  
  components: {  },
  name: "Navbar",
};
</script>