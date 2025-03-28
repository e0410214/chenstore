<template>
  <div class="container mt-4">
    <h2>📜 訂單管理</h2>

    <!-- 🔹 Tab 選單 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: selectedTab === tab.value }"
        @click="selectedTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 🔹 訂單列表 -->
    <div v-if="filteredOrders.length > 0" class="orders-list">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.order_Number"
        :items="order.items || []"
        :customer="order.customer"
        :order="order"
        :status="order.status"
        @reload="fetchOrders"
      />
    </div>

    <p v-else>⚠️ 沒有符合條件的訂單</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import supabase from "../supabase"; // 連接 Supabase
import OrderCard from "../components/OrderCard.vue";

export default {
  components: { OrderCard },
  setup() {
    const orders = ref([]); // 訂單列表
    const selectedTab = ref("🟡 待揀貨");

    // 🔹 設定 Tabs
    const tabs = [
      { label: "全部", value: "all" },
      { label: "待揀貨", value: "🟡 待揀貨" },
      { label: "已揀貨", value: "🟢 已揀貨" },
      { label: "缺貨", value: "❌ 缺貨" },
      { label: "已完成", value: "✅ 已完成" }
    ];

    // 🔹 讀取 Supabase 訂單
    const fetchOrders = async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) {
        console.error("❌ 無法讀取訂單:", error);
        return;
      }

      // 🔥 確保 `cart` 和 `items` 是陣列
      orders.value = data.map((order) => ({
        ...order,
        items: order.items ? JSON.parse(order.items) : []
      }));

      
    };

const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    // ✅ 確保訂單有商品
    const hasItems = order.items && order.items.length > 0 && order.items.some(item => item.quantity > 0);

    // ✅ 確保符合篩選條件
    const statusMatch = selectedTab.value === "all" || order.status === selectedTab.value;

    return hasItems && statusMatch; // 只有符合條件且有商品的訂單才顯示
  });
});


    // 🔹 當元件掛載時，讀取訂單
    onMounted(fetchOrders);
    

    return {
      orders,
      tabs,
      selectedTab,
      filteredOrders,
      fetchOrders, // 讓 `OrderCard` 可以重新讀取訂單
    };
  },
};
</script>

<style scoped>
/* 🔹 Tab 樣式 */
.tabs {
  display: flex;
  gap: 10px;
}
.tabs button {
  padding: 8px 15px;
  border: none;
  background: #ddd;
  cursor: pointer;
  border-radius: 5px;
}
.tabs button.active {
  background: #007bff;
  color: white;
}
.orders-list {
  overflow-y: auto;
  max-height: 85vh;
}
@media (max-width: 786px) {
.tabs button{
  font-size:18px;
  white-space: nowrap; /* 文字不換行 */
  
}
.tabs{
  gap:1px;
}
.tabs button{
  padding: 4px 12px;
}
}
</style>
