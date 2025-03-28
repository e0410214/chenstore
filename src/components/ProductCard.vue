<template>
  <div v-if="product" class="product-card">
    <div class="product-image">
      <img v-if="product.image" :src="product.image" alt="商品圖片" />
      <div v-else>無圖片</div> <!-- ✅ 商品沒圖片時顯示 -->
    </div>

    <div class="product-info">
      <p class="product-name" :title="product.name || '無名稱'">{{ product.name || '無名稱' }}</p>
      <div class="product-info2">
        <p class="product-price">價格: ${{ product.price || 0 }}</p>
        <p class="product-stock">庫存: {{ product.stock || 0 }}</p>
        <p v-if="mode === 'manage'" class="product-weight">重量: {{ product.weight || 0 }}</p>
      </div>
    </div>

    <!-- 按鈕區塊 -->
    <div class="button-group">
      <div v-if="mode === 'manage'" class="button-tool">
        <button @click="$emit('edit-product', product)">修改</button>
        <button @click="deleteProduct">刪除</button> <!-- ✅ 直接同步 Supabase -->
      </div>

      <!-- ✅ 訂購模式 -->
      <div v-if="mode === 'order'" class="order-mode">
        <div class="quantity-container">
          <label for="quantity">數量:</label>
          <input type="number" v-model="localQuantity" min="1" @input="updateQuantity" />
        </div>
        <button @click="addToCart">加入購物車</button>
      </div>
    </div>
  </div>
</template>
  
 <script setup>
import { ref, computed, watch } from "vue";
import { useProductStore } from "../store"; // ✅ 引入 Store

const store = useProductStore(); // ✅ 使用商品數據

const props = defineProps({
  product: { type: Object, required: true },
  mode: { type: String, default: "manage" }
});

const emit = defineEmits(["edit-product", "delete-product", "add-to-cart"]);

const localQuantity = ref(1);

// ✅ 限制最大可購買數量
const maxQuantity = computed(() => props.product.stock || 0);

watch(localQuantity, (newVal) => {
  const quantity = Math.max(1, Math.min(newVal, maxQuantity.value)); // 限制範圍
  localQuantity.value = quantity;
});

// ✅ 加入購物車
const addToCart = () => {
  emit("add-to-cart", props.product.id, localQuantity.value);
  localQuantity.value = 1; // 重設數量
};

// 🔹 刪除商品（同步到 Supabase）
const deleteProduct = async (id) => {
  if (confirm("確定要刪除這個商品嗎？")) {
    await store.deleteProduct(id);
  }
};
</script>
  
  <style scoped>
  
  .product-card {
    width: 230px;
    height: 260px;
    padding: 10px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 244px;
    min-width: 197px;
    max-height: 400px;
    min-height: 310px;
  }
  
  .product-card:hover {
    transform: scale(1.05);
  }
  
  .product-image {
    width: auto;
    height: 150px;
    background-color: #f0f0f0; /* ✅ 預設灰色背景 */
    object-fit: cover;
    border-radius: 5px;
  }
  
  .product-info {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
  }
  
  .product-name {
    white-space: nowrap; /* 文字不換行 */
    font-size: 2vh;
    font-weight: bold;
    overflow: hidden; /* 隱藏超出的文字 */
    text-overflow: ellipsis; /* 顯示省略號 (...) 來表示文字被截斷 */
  }
  
  .product-barcode, .product-price, .product-stock, .product-weight {
    display: flex;
    justify-content: flex-start;
    font-size: 24px;
    color: #666;
  }
  .product-image img {
  width: 100%; /* ✅ 讓圖片適應容器 */
  max-width: 100%; /* ✅ 確保圖片不超過商品框 */
  max-height: 150px; /* ✅ 限制最大高度，避免過大 */
  object-fit: contain; /* ✅ 保持圖片完整，不變形 */
  border-radius: 5px; /* ✅ 圓角，讓 UI 更美觀 */
}
.product-image {
  width: 100%;
  height: 150px; /* ✅ 設定固定高度，確保圖片大小一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* ✅ 確保圖片不會超出 */
  background-color: #f0f0f0; /* ✅ 預設背景色，避免無圖時影響排版 */
}
.product-info2 { 
  display: flex;

}
  </style>
  