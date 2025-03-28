<template>
  <div class="container mt-4">
    <h2>👥 顧客管理</h2>

    <!-- ➕ 新增顧客按鈕 -->
    <button class="btn btn-primary mb-3" @click="openCustomerModal(null)">
      ➕ 新增顧客
    </button>

    <!-- 📌 顧客列表（表格呈現） -->
    <div class="table-responsive">
      <div class="table-container">
        <table class="table table-striped table-hover">
          <thead class="table-dark">
            <tr>
              <th>名稱</th>
              <th>電話</th>
              <th>門市</th>
              <th>門市編號</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(customer, index) in store.customers" :key="customer.id">
              <td>{{ customer.name }} ({{ customer.nickname }})</td>
              <td>{{ customer.phone }}</td>
              <td>{{ customer.store }}</td>
              <td>{{ customer.storenum }}</td>
              <td>
                <div class="btn-group">
                  <button class="btn btn-sm btn-warning" @click="openCustomerModal(customer)">✏️</button>
                  <button class="btn btn-sm btn-danger" @click="deleteCustomer(customer.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 📌 顧客新增 / 編輯模態框 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ editingCustomer ? '編輯顧客' : '新增顧客' }}</h2>
        <div class="modal-content">
          <label>姓名：</label>
          <input v-model="customerData.name" type="text" required />

          <label>暱稱：</label>
          <input v-model="customerData.nickname" type="text" />

          <label>電話：</label>
          <input v-model="customerData.phone" type="text" required />

          <label>門市：</label>
          <input v-model="customerData.store" type="text" />

          <label>門市編號：</label>
          <input v-model="customerData.storenum" type="text" />

          <div class="modal-buttons">
            <button @click="saveCustomer">{{ editingCustomer ? '儲存修改' : '新增顧客' }}</button>
            <button @click="closeModal">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useProductStore } from "../store";

const store = useProductStore();
const showModal = ref(false);
const editingCustomer = ref(null);
const customerData = ref({ name: "", nickname: "", phone: "", store: "", storenum: "" });

// 🔹 頁面載入時，讀取 Supabase 內的顧客
onMounted(() => {
  store.fetchCustomers();
});

// 🔹 開啟新增 / 編輯模態框
const openCustomerModal = (customer) => {
  editingCustomer.value = customer ? customer.id : null;
  customerData.value = customer ? { ...customer } : { name: "", nickname: "", phone: "", store: "", storenum: "" };
  showModal.value = true;
};

// 🔹 儲存顧客（新增或更新）
const saveCustomer = async () => {
  if (!customerData.value.name || !customerData.value.phone) {
    alert("❌ 姓名和電話為必填！");
    return;
  }

  if (editingCustomer.value) {
    await store.updateCustomer(editingCustomer.value, customerData.value);
  } else {
    await store.addCustomer(customerData.value);
  }

  closeModal();
};

// 🔹 關閉模態框
const closeModal = () => {
  showModal.value = false;
  editingCustomer.value = null;
  customerData.value = { name: "", nickname: "", phone: "", store: "", storenum: "" };
};

// 🔹 刪除顧客
const deleteCustomer = async (id) => {
  const customer = store.customers.find(c => c.id === id);
  if (customer && confirm(`確定要刪除顧客：${customer.name}？`)) {
    await store.deleteCustomer(id);
  }
};
</script>

<style scoped>
/* Modal 樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}

.modal-content label {
  display: block;
  margin-top: 10px;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

button {
  padding: 8px 12px;
  cursor: pointer;
  background-color:rgb(215, 220, 224);
}

.table {
  width: 100%;
  table-layout: fixed;
}

th, td {
  text-align: center;
  vertical-align: middle;
  padding: 10px;
  word-wrap: break-word;
}

.table-responsive {
  max-height: 650px;
  overflow-y: auto;
  border: 1px solid #ddd;
}

thead {
  position: sticky;
  top: 0;
  background-color: #343a40;
  color: white;
  z-index: 100;
}
  .table tbody tr:nth-child(odd) {
   background-color: #ffffff; /* 數行的背景色（白色） */
}
.table tbody tr:nth-child(even) {
 
  background-color:rgb(205, 205, 205); /* 數行的背景色（淺灰） */
} 
/* 在小螢幕上調整 */
@media (max-width: 768px) {
  .table {
    table-layout: auto; /* 自動調整列寬 */
    white-space: nowrap; /* 文字不換行 */
    font-size: 0.75rem; /* 小螢幕字體縮小 */
     border-collapse: collapse; /* 讓格線合併，避免雙線 */
  }
  
  /* 讓操作按鈕變小 */
  .actions {
    flex-wrap: wrap; /* 避免超出範圍 */
    justify-content: center;
  }

  .btn {
    font-size: 0.75rem;
    padding: 4px 6px;
  }
  .table th, .table td {
  border: 1px solid #dee2e6; /* 設定格線顏色 */
  padding: 8px;
  text-align: center;
  }
.table-responsive {
  max-height: 650px; /* 限制表格最大高度，可自行調整 */
  overflow-y: auto;  /* 當內容超過時出現滾動條 */
  border: 1px solid #ddd; /* 增加邊框讓表格更清晰 */
}
thead {
  position: sticky;
  top: 0;
  background-color: #343a40; /* 讓表頭顏色與 Bootstrap `table-dark` 一致 */
  color: white;
  z-index: 100; /* 確保表頭在最上層 */
}

}
</style>
