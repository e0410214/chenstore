<template>
<!-- 顯示進度條或轉圈圈 -->
<div v-if="store.uploading" class="loading-container">
  <!-- 使用 CSS 實現轉圈圈 -->
  <div class="spinner"></div>
  <!-- 或者使用進度條 -->
  <!-- <div class="progress-bar" :style="{ width: progress + '%' }"></div> -->
</div>
  <div class="product-page">
    <h2>📔 商品管理</h2>

    <div class="toolbar">
      <button @click="showModal = true">新增商品</button>
    </div>

    <!-- 🔹 商品列表 -->
    <div class="product-list">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
        mode="manage"
        @edit-product="openEditModal"
        @delete-product="deleteProduct"
      />
    </div>

    <!-- 🔹 新增商品 Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>新增商品</h2>
        <div class="modal-content">
          <label>商品名稱：</label>
          <input v-model="newProduct.name" type="text" placeholder="輸入商品名稱" />

          <label>價格：</label>
          <input v-model="newProduct.price" type="number" placeholder="輸入價格" />

          <label>庫存：</label>
          <input v-model="newProduct.stock" type="number" placeholder="輸入庫存" />

          <label>重量：</label>
          <input v-model="newProduct.weight" type="number" placeholder="輸入重量(g)" />

          <!-- 📌 拖曳 / 貼上圖片 -->
          <label>商品圖片：</label>
          <div class="drop-area" @dragover.prevent @drop="handleDrop" @paste="handlePaste">
            <p v-if="!imagePreview">拖曳圖片到此區，或按 Ctrl + V 貼上截圖</p>
            <img v-if="imagePreview" :src="imagePreview" class="preview-img" />
          </div>
          <input type="file" accept="image/*" @change="handleImageUpload" />

          <div class="modal-buttons">
            <button @click="addProduct">確認新增</button>
            <button @click="closeAddProductModal">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔹 編輯商品 Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal">
        <h2>修改商品</h2>
        <div class="modal-content">
          <label>名稱：</label>
          <input v-model="editedProduct.name" type="text" />

          <label>價格：</label>
          <input v-model="editedProduct.price" type="number" />

          <label>庫存：</label>
          <input v-model="editedProduct.stock" type="number" />

          <label>重量：</label>
          <input v-model="editedProduct.weight" type="number" />

          <div class="modal-buttons">
            <button @click="saveEdit">儲存</button>
            <button @click="showEditModal = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useProductStore } from "../store";
import ProductCard from "../components/ProductCard.vue";
import imageCompression from 'browser-image-compression';

const store = useProductStore();
const products = computed(() => store.products);


const showModal = ref(false);
const showEditModal = ref(false);
const imagePreview = ref(null);

const newProduct = ref({
  name: "",
  price: 0,
  stock: 0,
  weight: 0,
  image: null
});

const editedProduct = ref({});

// 🔹 頁面載入時，讀取 Supabase 內的商品
onMounted(() => {
  store.fetchProducts();
});

// 🔹 新增商品（支援圖片上傳）
const addProduct = async () => {
  if (!newProduct.value.name || newProduct.value.price <= 0 || newProduct.value.stock < 0) {
    alert("❌ 請輸入有效的商品資訊");
    return;
  }

  await store.addProduct(newProduct.value); // ✅ 存入 Supabase
  closeAddProductModal();
};

// 🔹 刪除商品（同步到 Supabase）
const deleteProduct = async (id) => {
  if (confirm("確定要刪除這個商品嗎？")) {
    await store.deleteProduct(id);
  }
};


// 🔹 開啟編輯 Modal
const openEditModal = (product) => {
  editedProduct.value = { ...product };
  showEditModal.value = true;
};

// 🔹 儲存編輯（同步到 Supabase）
const saveEdit = async () => {
  await store.updateProduct(editedProduct.value.id, editedProduct.value);
  showEditModal.value = false;
};

// 🔹 關閉新增商品 Modal
const closeAddProductModal = () => {
  showModal.value = false;
  newProduct.value = { name: "", price: 0, stock: 0, weight: 0, image: null };
  imagePreview.value = null;
};

// 📌 拖曳 & 貼上圖片功能
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    readFile(file);
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    readFile(file);
  }
};

const handlePaste = (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      readFile(file);
    }
  }
};


const readFile = async (file) => {
  if (!file.type.startsWith("image/")) {
    alert("❌ 請選擇圖片檔案");
    return;
  }

  const options = {
    maxSizeMB: 0.3,          // 壓縮後檔案最大 300KB
    maxWidthOrHeight: 800,   // 最長邊不超過 800px
    useWebWorker: true,      // 開啟背景壓縮
  };

  try {
    // 壓縮圖片
    const compressedFile = await imageCompression(file, options);

    // 顯示壓縮後的圖片預覽
    const imageUrl = URL.createObjectURL(compressedFile);
    imagePreview.value = imageUrl;  // 顯示圖片預覽

    // 將壓縮後的 Blob 轉換為 File 類型，方便上傳
    const compressedFileWithName = new File([compressedFile], file.name, { type: file.type });

    // 更新新的圖片（壓縮後的圖片）
    newProduct.value.image = compressedFileWithName;  // 儲存壓縮後的圖片
    console.log('壓縮後圖片大小：', (compressedFile.size / 1024).toFixed(2), 'KB');

  } catch (error) {
    console.error('圖片壓縮失敗', error);
  }
};

</script>

<style scoped>
.product-list {
  overflow-y: auto;
  max-height: 85vh; /* ✅ 超過高度時顯示滾動條 */
}

.drop-area {
  width: 100%;
  max-width: 320px;
  height: 200px;
  border: 2px dashed #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ccc;
}
/* Loading Spinner */
/* 進度顯示容器 */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5); /* 半透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 轉圈圈的樣式 */
.spinner {
  border: 8px solid #f3f3f3; /* 灰色背景 */
  border-top: 8px solid #3498db; /* 藍色 */
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

/* 旋轉動畫 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (max-width: 786px) {
    .product-list {
    max-height: 83vh; /* ✅ 超過高度時顯示滾動條 */

  }
}

</style>
