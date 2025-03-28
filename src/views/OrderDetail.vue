<template>
  <div class="order-detail">
    <h2>📦 訂單詳情</h2>

    <div v-if="order">
       <!-- 🔹 訂單狀態（動態計算） -->
          <div class="order-status">
            <span>訂單狀態：{{ order.status }}</span>
          </div>
      <p>{{ order.customer_info?.name || "未知顧客" }}</p>
      <p>{{ order.customer_info?.phone || "未提供" }}</p>
      <p>{{ order.customer_info?.store || "未指定" }}</p>
          <div class="model1" >
       <div>
          <label>箱數：</label>
          <!-- 顯示 -->
            <span @click="startEditing" v-if="!editing">{{ order.boxCount || 0 }}</span>
            <!-- 編輯模式 -->
            <input v-if="editing" v-model="order.boxCount" type="number" @blur="stopEditing" min="1" />

        </div>
        <div>
         <button @click="copyOrderDetails">📋 複製訂單</button>
        
    <!-- 揀貨模式開關 -->
      <button @click="togglePickingMode" v-if="order.status !== '✅ 已完成'">
          {{ isPickingMode ? "關閉揀貨模式" : "揀貨模式" }}
        </button>
        <button @click="completeOrder" v-if="allItemsCompleted && order.status !== '✅ 已完成' && isPickingMode === false ">完成訂單</button>
    </div>
    </div>
      <!-- 🔹 商品列表 -->
      <table class="order-table" v-if="!(isPickingMode && isMobile)">
        <thead>
          <tr>
            <th>#</th>
            <th>商品</th>
            <th v-if=" isPickingMode === false">單價</th>
            <th>數量</th>
            <th  v-if=" isPickingMode === false">小計</th>
            <th v-if="order.status !== '✅ 已完成'">狀態</th>
            <th v-if="order.status !== '✅ 已完成'">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in order.items" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <img :src="item.image || 'https://via.placeholder.com/50'" class="product-img" />
              {{ item.name || "未知商品" }}
            </td>
              <!-- 🔹 價格 -->
              <td v-if="isPickingMode === false">
                <span v-if="!item.editingPrice" @click="editPrice(item)">{{ item.price }}</span>
                <input v-else type="number" v-model.number="item.newPrice" min="0" @blur="saveItemChange(item, 'price')" />
              </td>

              <!-- 🔹 數量（可編輯） -->
              <td>
                <span v-if="!item.editingQuantity" @click="editQuantity(item)">
                  {{ item.quantity }}
                </span>
                <input v-else type="number" v-model.number="item.newQuantity" min="0" @blur="saveItemChange(item, 'quantity')" />
              </td>

            <td  v-if=" isPickingMode === false">{{ item.price * item.quantity }}</td>
            <td v-if="order.status !== '✅ 已完成'">{{item.itemStatus}}<span v-if="item.missingQuantity > 0 && item.itemStatus === '❌ 缺貨'">{{ item.missingQuantity }}</span></td>
            <td v-if="order.status !== '✅ 已完成'">
              <button @click="setPicked(item)">✔️</button>
              <button @click="setOutOfStock(item)">❌</button>
              <button @click="removeItem(item)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
<!-- 手機揀貨模式 -->
<div v-if="isPickingMode && isMobile" class="picking-mode-mobile">
  <Swiper
    :slides-per-view="1"
    :space-between="10"
    :navigation="true"
    :modules="modules"
  >
    <SwiperSlide v-for="(item, index) in order.items" :key="index">
      <div class="card-image">
        <img :src="item.image || 'https://via.placeholder.com/150'" class="product-img" />
      </div>
      <div class="card-content">
        <div class="item-name">{{ item.name || "未知商品" }}</div>
        <div class="item-quantity">
          <span>數量: {{ item.quantity || 0 }}</span>
        </div>
        <div class="item-status">
          <span>狀態: {{ item.itemStatus || '待揀貨' }}</span>
        </div>
      </div>
      <div class="card-actions">
        <button @click="setPicked(item)">✔️</button>
        <button @click="setOutOfStock(item)">❌</button>
      </div>
    </SwiperSlide>
  </Swiper>
</div>


      <p>🛒 訂單總額：NT$ {{ orderTotal }}</p>
      <p>🚚 運費：NT$ {{ shippingFee }} 箱數：{{ order.boxCount }} X 38</p>
      <p>💰 總計：NT$ {{ grandTotal }}</p>

    </div>

    <p v-else>📌 訂單載入中...</p>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import supabase from "../supabase"; // 連接 Supabase
import { useProductStore } from "../store";
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from "swiper/modules";



export default {
   components: { Swiper, SwiperSlide },
    data() {
    return {
      editing: false, // 控制是否進入編輯模式
      isPickingMode: false, // 揀貨模式開關
      isMobile: false, // 手機端檢測
    };
  },
  mounted() {
  this.checkIfMobile();
  window.addEventListener("resize", this.checkIfMobile); // 監聽窗口大小改變
    },
    beforeDestroy() {
      window.removeEventListener("resize", this.checkIfMobile); // 移除監聽
    },
  methods: {
    // 開始編輯數字
    startEditing() {
      this.editing = true;
    },
    // 停止編輯數字
      async stopEditing() {
        this.editing = false;

        // 假設您已經在 Vue 的 data 中有 order 物件，並且它包含 order_number 和 boxCount 欄位
        const { data, error } = await supabase
          .from('orders') // 假設資料表名稱為 orders
          .update({ boxCount: this.order.boxCount }) // 更新箱數
          .eq('order_number', this.order.order_number); // 根據訂單號查找要更新的訂單

        if (error) {
          console.error("❌ 儲存訂單箱數失敗:", error.message);
        }
      },
      checkIfMobile() {
        this.isMobile = window.innerWidth <= 768; // 設置為您認為的手機最大寬度
      },
      togglePickingMode() {
        this.isPickingMode = !this.isPickingMode; // 換模式時切換
      },
      
  },
  setup() {
    const route = useRoute();
    const store = useProductStore();
    const order = ref(null);
    const orderNumber = computed(() => Number(route.params.id)); // ✅ 確保是數字
    const isPickingMode = ref(false);
    
    
    // 切換揀貨模式

    // 切換揀貨模式
    const togglePickingMode = () => {
      isPickingMode.value = !isPickingMode.value;
    };

    
    // 🔹 讀取訂單
    onMounted(async () => {

      if (!orderNumber.value) {
        console.error("❌ 訂單編號無效");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber.value)
        .single();

      if (error) {
        console.error("❌ 讀取訂單失敗：", error);
        return;
      }

      // ✅ 確保 `items` 是有效的 JSON 陣列
      try {
        data.items = typeof data.items === "string" ? JSON.parse(data.items) : data.items || [];
        data.history = typeof data.history === "string" ? JSON.parse(data.history) : data.history || [];
      } catch (err) {
        console.error("❌ items JSON 解析失敗：", err);
        data.items = [];
        data.history = [];
      }

      order.value = data;

      // ✅ 存入 Store，讓整個應用可用
      store.ordersByCustomer[orderNumber.value] = order.value;

      
      store.fetchCustomers();
      store.fetchProducts();
    });



    // 🔹 計算總價
    const orderTotal = computed(() =>
      order.value?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
    );
    const shippingFee = computed(() => order.value.boxCount * 38); // 運費固定 38 元
    const grandTotal = computed(() => orderTotal.value + shippingFee.value);

    // 🔹 設定商品已揀貨
      const setPicked = async (item) => {
        if (!order.value) return;

        // 🔹 弹出确认框，询问用户是否确定完成揀貨
        const confirmed = window.confirm("您確定完成揀貨嗎？");

        if (confirmed) {
          // ✅ 更新 Vue Store
          store.setPicked(order.value.order_number, item.id);
          console.log("揀貨已完成");
        } else {
          console.log("揀貨取消");
        }
      };

const setOutOfStock = async (item) => {
  if (!order.value) return;

  // 🔹 弹出确认框，询问用户是否确定将商品设置为缺貨
  const amount = prompt(`請輸入缺貨數量：`);
  const missingQuantity = parseInt(amount, 10);

  if (!isNaN(missingQuantity) && missingQuantity > 0) {
    // ✅ 用户确认后更新 Vue Store
    store.setOutOfStock(order.value.order_number, item.id,missingQuantity);
    console.log("商品已設為缺貨");
  } else {
    console.log("取消設為缺貨");
  }
};


// 🔹 刪除商品
const removeItem = async (item) => {
  if (!order.value) return;

  // 🔥 顯示確認對話框
  const isConfirmed = confirm("確定要刪除這個商品嗎？");
  if (isConfirmed) {
    // ✅ 更新 Vue Store
    store.removeItem(order.value.order_number, item.id);
  }
};


    const allItemsCompleted = computed(() => {
      return order.value?.items.every(item => store.getItemStatus(item) === "✅ 完成");
    });
    

    // 編輯價格
    const editPrice = (item) => {
      item.editingPrice = true;
      item.newPrice = item.price; // 將原價格帶入
    };

    // 編輯數量
    const editQuantity = (item) => {
      item.editingQuantity = true;
      item.newQuantity = item.quantity; // 將原數量帶入
    };

    // 保存變更
    const saveItemChange = async (item, changeType) => {
      const oldQuantity = item.quantity;
      const oldPrice = item.price;

      const product = store.products.find(p => p.id === item.id);
      if (!product) {
        console.error("❌ 找不到對應商品");
        return;
      }

      // 根據不同類型變更數據
      if (changeType === 'quantity') {
        const newQuantity = Number(item.newQuantity) || 0; // 確保數量為有效數字
        item.quantity = newQuantity;
        item.pickedQuantity = null;
        item.editingQuantity = false;

        // 計算庫存差異，確保庫存不會變成負數
        const quantityDiff = newQuantity - oldQuantity;
        if (quantityDiff !== 0) {
          const newStock = product.stock - quantityDiff;
          
          if (newStock < 0) {
            console.warn("⚠️ 庫存不足，無法更新商品數量");
            alert(`庫存剩餘 ${product.stock}，無法更新商品數量`); // 使用 alert 顯示警告
            item.quantity = oldQuantity; // 恢復到舊數量
            return; // 停止操作
          }

          // 更新庫存
          await store.updateProductStock(item.id, quantityDiff);
        }
      } else if (changeType === 'price') {
        const newPrice = Number(item.newPrice) || 0; // 確保價格為有效數字
        item.price = newPrice;
        item.editingPrice = false;
      }

      // 更新訂單中的商品資料
      await store.updateOrderItem(order.value.order_number, item);
    };


    // 🔹 完成訂單
    const completeOrder = async () => {
      if (!order.value) return;

      const { error } = await supabase
        .from("orders")
        .update({ status: "✅ 已完成" })
        .eq("order_number", order.value.order_number);

      if (error) {
        console.error("❌ 更新訂單失敗：", error);
        return;
      }

      // ✅ 本地同步更新
      order.value.status = "✅ 已完成";
      store.completeOrder(order.value.order_number);
      console.log("✅ 訂單已完成:", order.value.order_number);
    };

// ✅ 確保 copyOrderDetails 正確掛載
const copyOrderDetails = () => {
  if (order.value.status !== "🟢 已揀貨" && order.value.status !== "✅ 已完成" ) {
        alert("❌ 請先完成揀貨");
        return;
      }  
  if (!order.value) return;
  
  const orderText = `${order.value.customer_info?.name || "未知顧客"}\n` +
                    `${order.value.customer_info?.phone || "未知顧客"}\n` +
                    `${order.value.customer_info?.store || "未知顧客"}\n` +
                    `以下是您的訂單明細\n` +
                    order.value.items.map(item => 
                      `${item.name} ${item.quantity}x${item.price}=${item.quantity * item.price} `
                    ).join("\n") + 
                    `\n`+
                    `\n小計:${orderTotal.value}+運費:${shippingFee.value}(${order.value.boxCount}箱)`+
                    `\n總計:${grandTotal.value}`+
                    `\n確認後幫您出貨`;

  navigator.clipboard.writeText(orderText).then(() => {
    alert("訂單資訊已複製！");
  }).catch(err => {
    console.error("❌ 複製失敗:", err);
  });
};


// 🔹 備用的 `textarea` 複製方式（適用於 Clipboard API 失敗的情況）
window.fallbackCopyText = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  alert("📋 訂單內容已複製！");
};

    return {
      modules: [Navigation],
      editPrice,
      editQuantity,
      saveItemChange,
      togglePickingMode,
      allItemsCompleted,
      copyOrderDetails,
      isPickingMode,
      order,
      orderTotal,
      shippingFee,
      grandTotal,
      setPicked,
      setOutOfStock,
      removeItem,
      completeOrder,
    };
  },
};
</script>


<style scoped>
html, body {
    overflow-x: hidden;
    overflow-y: hidden; /* 或 auto / hidden 視情況 */
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
}

.order-detail {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* ✅ 超過高度時，顯示滾動條 */
  overflow-x: hidden; /* ✅ 超過高度時，顯示滾動條 */
  max-height: 85vh; /* ✅ 超過高度時顯示滾動條 */
}

.order-table {
  table-layout: auto; /* 自動調整列寬 */
  width: 100%;
  border-collapse: collapse;
  
}

.order-table th,
.order-table td {
  border-bottom: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.product-img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}

button {
  margin-right: 5px;
  padding: 2px 5px;
  border-radius: 5px;
  cursor: pointer;
}
@media (max-width: 1150px) {
button {
  font-size: 0.6rem;
  padding: 0px 0px;
  margin-right: 1px;
}

}
@media (max-width: 786px) {
.order-detail {
  font-size:18px;
}
input{
  width:15px;
}
button {
  font-size: 0.75rem;
    padding: 4px 6px;
}
/* 手機端揀貨模式的樣式 */
.picking-mode-mobile {
  
}

.swiper-container {
  width: 100%;
  height: auto;
}

.swiper-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  box-sizing: border-box;
  height: 300px; /* 可依需求調整 */
}

.card-image {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-content {
  text-align: center;
  margin-bottom: 0.5rem;
}

.item-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.item-quantity,
.item-status {
  font-size: 0.9rem;
}

.card-actions {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 0.5rem;
}

.card-actions button {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: none;
  background: #007bff;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}

.card-actions button:hover {
  background: #0056b3;
}


  .swiper-container {
    width: 100%;
    height: auto;
  }

  .swiper-slide {
    margin: 0 auto;
  }
}



</style>
