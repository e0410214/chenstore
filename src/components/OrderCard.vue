<template>
  <div class="order-card" @click="goToOrderDetail">
    <div class = "customerinfo">
    <h3>顧客：{{ customerData.name }} {{ customerData.nickname ? `(${customerData.nickname})` : '' }}</h3>
    <p>建立時間：{{ formatTimestamp(order.timestamp) }}</p>
    <p >訂單編號：{{ order.order_number }}</p>
    <p class="order-status">訂單狀態：{{ order.status || "未知狀態" }}</p>
    </div>
    <!-- 🔹 商品列表 -->
    <ul v-if="orderItems.length > 0">
      <li v-for="(item, index) in orderItems.slice(0, 2)" :key="index" class="order-item">
        <img :src="item.image || 'https://via.placeholder.com/100'" alt="商品圖片" class="item-image" />
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-quantity">x {{ item.quantity }}</span>
          <span class="item-status">{{ getItemStatus(item) }}</span>
        </div>
      </li>
    </ul>

    <!-- 展開按鈕 -->
    <button v-if="orderItems.length > 2" @click.stop="toggleExpand">
      {{ isExpanded ? "收起" : "展開更多" }}
    </button>

    <!-- 展開完整清單 -->
    <ul v-if="isExpanded">
      <li v-for="(item, index) in orderItems.slice(2)" :key="index" class="order-item">
        <img :src="item.image || 'https://via.placeholder.com/100'" alt="商品圖片" class="item-image" />
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-quantity">x {{ item.quantity }}</span>
          <span class="item-status">{{ getItemStatus(item) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useProductStore } from "../store";

export default {
  props: {
    items: {
      type: [Array, String], // ✅ 可能是 JSON 字串
      default: () => []
    },
    order_number: [Number, String],
    customer: {
      type: Object,
      default: () => ({ name: "未知顧客", nickname: "" })
    },
    order: {
      type: Object,
      required: true
    },
    status: String,
    timestamp: String
  },
  setup(props) {
    const store = useProductStore();
    const isExpanded = ref(false);

    // 🔹 確保 `customer_info` 存在
    const customerData = computed(() => {
      if (props.order.customer_info) {
        return typeof props.order.customer_info === "string"
          ? JSON.parse(props.order.customer_info) // ✅ 如果是 JSON 格式字串，解析
          : props.order.customer_info;
      }
      return { name: "未知顧客" };
    });

    // 🔹 確保 `items` 是陣列
    const orderItems = computed(() => {
      if (!props.order.items) return []; // 如果 `items` 為 `null`，回傳空陣列
      if (typeof props.order.items === "string") {
        try {
          return JSON.parse(props.order.items);
        } catch (error) {
          console.error("❌ `order.items` 解析失敗:", error);
          return [];
        }
      }
      return Array.isArray(props.order.items) ? props.order.items : [];
    });

    // 🔹 確保 `itemStatus` 存在
    const getItemStatus = (item) => {
      return item.itemStatus || item.status || "🟡 待揀貨"; // ✅ 若 `itemStatus` 為空，預設 "🟡 待揀貨"
    };

    return { store, isExpanded, orderItems, customerData, getItemStatus };
  },
  methods: {

    formatTimestamp(timestamp) {
    if (!timestamp) return "未知時間"; // 確保 timestamp 存在
    const date = new Date(timestamp); // 將 timestamp 轉為 Date 物件
    return date.toLocaleString(); // 返回當地時間的格式
  },
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    goToOrderDetail() {
      if (!this.order || !this.order.order_number) {
        console.error("❌ 無效的訂單資料:", this.order);
        return;
      }

      // ✅ 確保顧客資料存在
      let customerData = this.customer || { name: "未知顧客" };

      if (!customerData.name) {
        const completedOrder = this.store.completedOrders[this.order.order_number];
        if (completedOrder && completedOrder.customer) {
          customerData = completedOrder.customer;
        }
      }

      if (!customerData.name) {
        console.warn("⚠️ 找不到顧客資料，設定為『未知顧客』");
        customerData = { name: "未知顧客" };
      }

      this.store.currentCustomer = customerData.name;
      this.$router.push(`/orders/${this.order.order_number}`);

    // ✅ 強制重新整理網頁
    setTimeout(() => {
    window.location.reload();
  }, 100);
    }
  }
};
</script>

<style scoped>
.order-card {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-bottom-style: dashed;
  font-size: 22px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}

.item-image {
  width: 100px;
  height: 100px;
  border-radius: 5px;
  object-fit: cover;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: bold;
}

.item-quantity {
  color: #666;
}

@media (max-width: 786px) {
.customerinfo{
  white-space: nowrap; /* 文字不換行 */
}

}
</style>
