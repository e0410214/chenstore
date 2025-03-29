<template>
  <div class="order-page">
    <h2>🛒 訂購系統</h2>

    <!-- 🔹 顧客選擇 -->
    <div class="odtoolbar">
      <label style="font-size: 24pt;">顧客</label>
      <select id="customer-select" style="font-size: 24pt;" v-model="selectedCustomer" @change="handleCustomerChange">
        <option selected>請選擇顧客</option>
        <option v-for="customer in customers" :key="customer.id" :value="customer.name">
          {{ customer.name }}
        </option>
      </select>
      <button v-if="isMobile" @click="toggleCart" class="cart-toggle">🛒</button>
    </div>

    <div class="order-page1">
      <!-- 🔹 商品列表 -->
      <div class="product-list">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          mode="order"
          @add-to-cart="addToCart"
        />
      </div>

      <!-- 🔹 右側 購物清單 -->
      <div v-show="showCart || !isMobile" class="cart-container">
        <h3>🛒 購物清單</h3>

        <div class="cart-content">
          <div v-if="items.length === 0" class="empty-cart">尚未選購商品</div>
          <CartItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @updateQuantity="updateQuantity"
            @remove="removeFromCart"
          />
        </div>

        <!-- 🔹 總計 -->
        <div class="cart-total">
          <div class= "totalWeight" v-if="totalWeight >= 4200">
            <h3>重量: {{ totalWeight }}</h3>
          </div>
          <h3>總計: {{ totalPrice }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProductCard from "../components/ProductCard.vue";
import CartItemCard from "../components/CartItemCard.vue";
import { useProductStore } from '../store';
import { computed, ref, watch, onMounted, onUnmounted ,onBeforeUnmount } from "vue";

export default {
  components: { ProductCard, CartItemCard },
  setup() {
    const store = useProductStore();
    const selectedCustomer = ref(""); // 綁定顧客選擇
    const showCart = ref(false);
    const isMobile = ref(window.innerWidth <= 900);

    onMounted(() => {
      window.addEventListener("resize", checkMobile);
      store.fetchCustomers();
      store.fetchProducts();
      store.items = []; // ✅ 清空購物車
      store.currentCustomer = null;
      store.currentOrderNumber = null;  // ✅ 清除訂單編號
    });

    onUnmounted(() => {
      window.removeEventListener("resize", checkMobile);
    });


    // 🔹 當顧客變更時，載入該顧客的訂單
    const handleCustomerChange = async () => {
      if (selectedCustomer.value) {
        await store.setCustomer(selectedCustomer.value);
      }
       
    };

    // 🔹 加入購物車
    const addToCart = async (productId, quantity) => {
      await store.addToCart(productId, quantity);
    };

    // 🔹 刪除購物車內商品
    const removeFromCart = async (productId) => {
      await store.removeFromCart(productId);
    };

    // 🔹 更新購物車數量
    const updateQuantity = async (productId, newQuantity) => {
       const product = store.products.find(p => p.id === productId);
      const cartItem = store.iem.find(item => item.id === productId);
    };

    // 🔹 手機版購物車切換
    const toggleCart = () => {
      showCart.value = !showCart.value;
    };

    // 🔹 判斷是否為手機
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 900;
    };

    return {
      store,
      selectedCustomer,
      handleCustomerChange,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleCart,
      showCart,
      isMobile,
      totalWeight: computed(() => store.items.reduce((sum, item) => sum + item.weight * item.quantity, 0)),
      totalPrice: computed(() => store.items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      customers: computed(() => store.customers),
      filteredProducts: computed(() => store.products),
      items: computed(() => store.items), // 🔥 確保購物車正確讀取
    };
  },
};
</script>

<style scoped>
.order-page1 {
  display: flex;
  height: 85vh;
  overflow: hidden;
}
.odtoolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
  padding: 4px 5px;
}
.cart-item {
  margin: 10px 0;
}
button {
  margin-left: 10px;
}
.product-list {
  overflow-y: auto;
  max-height: 85vh; /* ✅ 超過高度時顯示滾動條 */
  align-content: flex-start;
}
.totalWeight{
  background:rgb(238, 200, 200);
}
@media (min-width: 901px) {
  .product-list {
  overflow-y: auto;
  max-height: 83vh; /* ✅ 超過高度時顯示滾動條 */
  align-content: flex-start;
}
  .cart-container {
    flex-direction: column;
    display: flex;
    width: 20%;
    background: #f8f8f8;
    padding: 15px;
    border-radius: 8px;
    max-height: 85vh;
    overflow-y: auto;
  }
  .cart-content {
    flex-grow: 1;
  }
  .cart-total {
    position: sticky;
    bottom: 0;
    background: #e3e3e3;
    padding: 10px;
    text-align: center;
    font-weight: bold;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  }
}
@media (max-width: 786px) {
  .product-list {
    max-height: 82vh; /* ✅ 超過高度時顯示滾動條 */

  }
  .cart-container {
    position: fixed;
    top: 50px;
    right: 10px;
    width: 90%;
    max-width: 300px;
    background: white;
    border: 1px solid #ddd;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
    max-height: 75vh;
    overflow-y: auto;
  }
  .cart-toggle {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #007bff;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    z-index: 1;
  }
}
</style>
