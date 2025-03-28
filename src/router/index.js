import { createRouter, createWebHistory } from 'vue-router';
import ProductPage from '../views/ProductPage.vue';
import OrdersPage from '../views/OrdersPage.vue';
import OrderPage from '../views/OrderPage.vue';
import CustomersPage from '../views/CustomersPage.vue';
import OrderDetail from "../views/OrderDetail.vue";

const routes = [
  { path: '/', redirect: '/products' },  // 預設導向商品管理
  { path: '/products', component: ProductPage },
  { path: '/orders', component: OrdersPage },
  { path: '/order', component: OrderPage },
  { path: '/Customers', component: CustomersPage },
  { path: '/orders/:id', component: OrderDetail, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
