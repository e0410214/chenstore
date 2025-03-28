<template>
<div class="container">
    <Navbar />
    <router-view />  
    </div>
     
    
</template>
<script>
import ProductCard from "./components/ProductCard.vue";
import Navbar from "./components/Navbar.vue";
import OrderPage from "./views/OrderPage.vue";
import OrdersPage from "./views/OrdersPage.vue";


export default {
  props: {
    product: Object
    
    },
  components: { 
    Navbar,
    OrderPage,
    ProductCard,
     },
}
</script>