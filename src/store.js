import supabase from "./supabase"; // ✅ 引入 Supabase 連線
import { defineStore } from 'pinia';

export const useProductStore = defineStore('product', {
  state: () => ({
    uploading: false, // 上傳狀態
    products:  ([]),
    customers: [],
      items: [], // 確保購物車已定義
      completedOrders: {},    // 已完成的訂單
      ordersByCustomer: {}, // ✅ 確保這是響應式對象
      currentOrder: { // ✅ 讓 `currentOrder` 也是響應式的
      currentCustomer: null, // 需要初始化這個屬性
      customer: null,
      orderCountByDate: {}, // 記錄每天的訂單計數
      status: "🟡 待揀貨",
      searchQuery: '', // 新增 searchQuery
      boxCount: 1,
      }
    }),
  getters: {
      getCustomerById: (state) => (id) => {
        return state.customers.find(c => c.id === id);
      }

  },
  
  actions: {
    // 🔹 讀取特定顧客的訂單
    async fetchOrdersByCustomer(customer_id) {
     
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customer_id)
        .order("created_at", { ascending: false });
    
      if (error) {
        console.error("❌ 無法獲取顧客訂單:", error);
        return null;
      }
    
      if (data.length === 0) {
        console.warn("⚠️ 該顧客沒有現有訂單");
        return null;
      }
    
      
    
      return data[0];
    },
    
    // 🔹 讀取顧客資料
    async fetchCustomers() {
      const { data, error } = await supabase.from("customers").select("*");
      if (error) console.error("❌ 無法獲取顧客:", error);
      else this.customers = data;
    },

    // 🔹 新增顧客
    async addCustomer(customer) {
      const { data, error } = await supabase.from("customers").insert([customer]).select();
      if (error) console.error("❌ 新增顧客失敗:", error);
      else this.customers.push(data[0]);
    },
    
    // 🔹 更新顧客資料
    async updateCustomer(id, updatedData) {
      const { error } = await supabase.from("customers").update(updatedData).eq("id", id);
      if (error) {
        console.error("❌ 更新顧客失敗:", error);
      } else {
        // ✅ **更新 Vue Store 內的 customers 陣列**
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
          this.customers[index] = { ...this.customers[index], ...updatedData };
          this.customers = [...this.customers]; // 🔥 讓 Vue 監測到變更
        }
      }
    },

    // 🔹 刪除顧客
    async deleteCustomer(id) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) console.error("❌ 刪除顧客失敗:", error);
      else this.customers = this.customers.filter(c => c.id !== id);
    },

    async fetchProducts() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("❌ 無法獲取商品:", error);
      } else {
        this.products = data;
      }
    },

    // 🔹 設定商品已揀貨
    async setPicked(orderNumber, itemId) {

      const order = this.ordersByCustomer[orderNumber];
      if (!order) {
        console.error("❌ 找不到訂單:", orderNumber);
       
        return;
      }
    
      const item = order.items.find((i) => i.id === itemId);
      if (!item) {
        console.error("❌ 找不到商品:", itemId);
        return;
      }
    
      item.itemStatus = "✅ 完成";
      this.ordersByCustomer = { ...this.ordersByCustomer }; // ✅ **確保 Vue 監測變更**
      await this.updateOrderStatus(orderNumber);
    },
    
    // 🔹 設定商品缺貨
    async setOutOfStock(orderNumber, itemId ,missingQuantity) {
     

      const order = this.ordersByCustomer[orderNumber];
      if (!order) {
        console.error("❌ 訂單不存在:", orderNumber);
        return;
      }

      const item = order.items.find((i) => i.id === itemId);
      if (!item) {
        console.error("❌ 找不到商品:", itemId);
        return;
      }

      item.itemStatus = "❌ 缺貨";
      item.missingQuantity = missingQuantity;
      this.ordersByCustomer = { ...this.ordersByCustomer }; // ✅ **確保 Vue 監測變更**
      this.updateOrderStatus(orderNumber);
    },

    // 🔹 刪除商品
    async removeItem(orderNumber, itemId) {
     
    
      const order = this.ordersByCustomer[orderNumber];
      if (!order) {
        console.error("❌ 訂單不存在:", orderNumber);
        return;
      }
    
      // ✅ 找到被刪除的商品
      const removedItem = order.items.find((i) => i.id === itemId);
      if (!removedItem) {
        console.warn("⚠️ 找不到商品:", itemId);
        return;
      }
    
      // ✅ **恢復庫存**
      const product = this.products.find(p => p.id === itemId);
      
      if (product) {
        product.stock += removedItem.quantity;
        await this.updateStockInSupabase(itemId,product.stock);
      }
      // ✅ **從訂單移除商品**
      order.items = order.items.filter((i) => i.id !== itemId);
    

    
      // ✅ **同步到 Supabase**
      await this.syncOrderWithSupabase2(orderNumber);
      await this.updateOrderStatus(orderNumber);
      
      // ✅ **確保 Vue 監測變更**
      this.ordersByCustomer = { ...this.ordersByCustomer };
    
     
    },    

    //移出購物車商品
    async removeFromCart(productId) {
      
      // 確保顧客存在
      if (!this.currentCustomer || !this.ordersByCustomer[this.currentCustomer]) {
        return;
      }
    
      const productIndex = this.items.findIndex(item => item.id === productId);
      if (productIndex === -1) return; // 如果商品不在購物車中，則不執行
    
      // 更新庫存
      const productIndexInStore = this.products.findIndex(p => p.id === productId);
      if (productIndexInStore !== -1) {
        this.products[productIndexInStore].stock += this.items[productIndex].quantity; // 恢復庫存
        await this.updateStockInSupabase(productId,this.products[productIndexInStore].stock);
      }
    
      // 從購物車移除商品
      this.items.splice(productIndex, 1);
    
      // 更新顧客的訂單
      const order = this.ordersByCustomer[this.currentCustomer];
      order.items = [...this.items]; // 更新訂單中的商品清單
      await this.syncOrderWithSupabase();
      // 更新資料以觸發 Vue 的視圖更新
      this.ordersByCustomer = { ...this.ordersByCustomer };
    },
    async updateProduct(id, updatedData) {
      const { error } = await supabase.from("products").update(updatedData).eq("id", id);
      if (error) {
        console.error("❌ 更新商品失敗:", error);
      } else {
        // ✅ 在本地同步更新
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = { ...this.products[index], ...updatedData };
        }
      }
    },
    
    async deleteProduct(id) {
      try {
        this.uploading = true;  // 開始顯示進度
    
        // 🔍 查詢商品資訊，確保獲取 `image` URL
        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("image")
          .eq("id", id)
          .single();
    
        if (fetchError) {
          console.error("❌ 查詢商品失敗:", fetchError);
          return;
        }
    
        // 🔥 **先刪除圖片**
        if (product.image) {
          await this.deleteImageFromStorage(product.image);
        }
    
        // 🔥 **再刪除商品**
        const { error: deleteError } = await supabase.from("products").delete().eq("id", id);
        if (deleteError) {
          console.error("❌ 刪除商品失敗:", deleteError);
        } else {
          this.products = this.products.filter(p => p.id !== id); // ✅ 本地同步刪除
          }
    
      } catch (err) {
        console.error("❌ 刪除過程發生錯誤:", err.message || err);
      } finally {
        this.uploading = false; // 停止進度顯示
      }
    },
    
    async deleteImageFromStorage(imageUrl) {
      try {
        this.uploading = true;  // 開始顯示進度
    
        if (!imageUrl.includes("/storage/v1/object/public/")) {
          console.warn("⚠️ 圖片 URL 不是 Supabase Storage 內部資源，無需刪除:", imageUrl);
          return;
        }
    
        // ✅ 解析檔案路徑，取得完整路徑
        const pathParts = imageUrl.split("/storage/v1/object/public/123/")[1];
    
        if (!pathParts) {
          console.error("❌ 解析圖片路徑失敗:", imageUrl);
          return;
        }
    
        // ✅ 執行 Supabase 刪除 API
        const { data, error } = await supabase.storage.from("123").remove([pathParts]);
    
        if (error) {
          console.error("❌ 刪除圖片失敗:", error);
        }
    
      } catch (err) {
        console.error("❌ 刪除圖片過程發生錯誤:", err.message || err);
      } finally {
        this.uploading = false; // 停止進度顯示
      }
    },
    
    
    
    //設定訂單編號
    generateOrderNumber() {
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, ""); // 取得 YYYYMMDD 格式
    
      // 從 localStorage 中讀取當前的序號，如果沒有則設置為 1
      let currentOrderNumber = localStorage.getItem(`${yyyymmdd}_orderNumber`);
      if (!currentOrderNumber) {
        currentOrderNumber = 1;
      } else {
        currentOrderNumber = Number(currentOrderNumber) + 1; // 依次遞增
      }
    
      // 更新 localStorage 中的序號
      localStorage.setItem(`${yyyymmdd}_orderNumber`, currentOrderNumber);
    
      // 將序號格式化為 3 位數字，並返回結合日期的訂單號
      const orderNumber = `${yyyymmdd}${String(currentOrderNumber).padStart(3, '0')}`;
    
      return orderNumber;
    },
    
  // 🔹 設定當前顧客，並載入訂單
  async setCustomer(customerName) {
    if (!customerName) {
      alert("❌ 必須選擇顧客！");
      return;
    }
  
    // 🔹 切換顧客
    this.currentCustomer = customerName;
  
    // 🔹 初始化該顧客的訂單
    await this.initializeOrderForCustomer();
  
    // 🔹 確保 `ordersByCustomer` 內有該顧客的訂單
    if (!this.ordersByCustomer[this.currentCustomer]) {
      console.error("❌ 訂單初始化失敗，無法取得 `cart`");
      return;
    }
  
    // 🔹 解析 `cart` 和 `items`，確保是陣列
    try {
      this.ordersByCustomer[this.currentCustomer].items =
        typeof this.ordersByCustomer[this.currentCustomer].items === "string"
          ? JSON.parse(this.ordersByCustomer[this.currentCustomer].items)
          : this.ordersByCustomer[this.currentCustomer].items || [];
    } catch (error) {
      console.error("❌ 無法解析 `cart` 或 `items`:", error);

      this.ordersByCustomer[this.currentCustomer].items = [];
    }
  
    // 🔹 設定購物車內容（確保 `cart` 是陣列）
    this.items = [...this.ordersByCustomer[this.currentCustomer].items];
  
    
  },
  
  
  // 🔹 初始化訂單（如果顧客沒有訂單）
  async initializeOrderForCustomer() {
    const customer = this.customers.find(c => c.name === this.currentCustomer);
    if (!customer) {
      console.error("❌ 找不到顧客:", this.currentCustomer);
      return;
    }
  
    // 🔹 **確保查詢所有「未完成」的訂單**
    let { data: existingOrder, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .in("status", ["🟡 待揀貨", "🟢 已揀貨", "❌ 缺貨"]) // ✅ 修正 `eq()` → `in()`
      .maybeSingle(); // ✅ `maybeSingle()` 允許查無資料時不會拋出錯誤
  
    if (error) {
      console.error("❌ 查詢訂單失敗:", error);
      return;
    }
  
    // 🔹 **如果已有訂單，就載入該訂單**
    if (existingOrder) {
      
    } else {
      console.warn("⚠️ 沒有找到現有訂單，將建立新訂單...");
  
      // 🔹 **建立新訂單**
      const newOrder = {
        customer_id: customer.id,
        customer_info: {
          name: customer.name,
          nickname: customer.nickname,
          phone: customer.phone || "",
          store: customer.store || "",
          storenum: customer.storenum || "",
        },
        items: "[]",
        order_number: this.generateOrderNumber(),
        status: "🟡 待揀貨",
        total_price: 0,
        history: [],
        boxCount:1,
      };
  
      let { data, error } = await supabase.from("orders").insert([newOrder]).select();
      if (error) {
        console.error("❌ 無法新增訂單:", error);
        return;
      }
      existingOrder = data[0];
    }
  
    // 🔹 解析 `cart` 和 `items`
    try {
      existingOrder.items = existingOrder.items ? JSON.parse(existingOrder.items) : [];
    } catch (err) {
      console.error("❌ 解析 cart/items 失敗:", err);
      existingOrder.items = [];
    }
  
    // 🔹 存入 `ordersByCustomer`
    this.ordersByCustomer[this.currentCustomer] = existingOrder;
  },
  
  
    
    
// 🔹 上傳圖片到 Supabase Storage
async uploadImage(file) {
      this.uploading = true;  // 開啟進度狀態

      try {
        // 生成檔名和儲存路徑
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`;
        const filePath = `123/${fileName}`;

        // 上傳圖片到 Supabase Storage
        const { data, error } = await supabase.storage.from('123').upload(filePath, file);

        if (error) {
          console.error('❌ 上傳圖片失敗:', error.message);
          throw new Error('圖片上傳失敗，請稍後再試');
        }

        // 取得圖片的公共 URL
        const publicURL = `https://upzyauibhzsjzkbabpne.supabase.co/storage/v1/object/public/123/${filePath}`;
        this.imageUrl = publicURL;  // 儲存圖片的公共 URL

        return publicURL;  // 返回公共 URL
      } catch (err) {
        console.error('❌ 圖片上傳異常:', err.message);
        return null;
      } finally {
        this.uploading = false;  // 結束上傳中狀態
      }
    },

// 🔹 新增商品（上傳圖片並存入資料庫）
async addProduct(product) {
  try {
    this.uploading = true; // 🔥 開啟進度狀態 (可綁定 UI spinner)

    let imageUrl = product.image;

    // ✅ 如果是檔案，則上傳圖片
    if (product.image instanceof File) {
      imageUrl = await this.uploadImage(product.image);

      if (!imageUrl) {
        throw new Error("圖片上傳失敗，無法新增商品");
      }
    }

    // ✅ 插入商品資料
    const newProduct = { ...product, image: imageUrl };
    const { data, error } = await supabase.from("products").insert([newProduct]).select();

    if (error) {
      console.error("❌ 新增商品失敗:", error.message);
      throw new Error("商品新增失敗，請稍後再試");
    }

    // ✅ 更新本地商品列表
    this.products.push(data[0]);
    

  } catch (err) {
    console.error("❌ 商品新增過程發生錯誤:", err.message || err);
  } finally {
    this.uploading = false; // ✅ 關閉進度狀態
  }
},


async addToCart(productId, quantity) {
  if (!this.currentCustomer) {
    alert("❌ 請先選擇顧客，才能加入購物車！");
    return;
  }

  const productIndex = this.products.findIndex(p => p.id === productId);
  if (productIndex === -1) return;

  let product = this.products[productIndex];

  if (product.stock < quantity) {
    alert("庫存不足！");
    return;
  }

  await this.initializeOrderForCustomer();

  let cartItem = this.items.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity += quantity;
    cartItem.itemStatus = "🟡 待揀貨";
  } else {
    this.items.push({
      id: productId,
      name: product.name,
      price: product.price,
      quantity,
      weight: product.weight,
      image: product.image,
      itemStatus: "🟡 待揀貨",
    });
  }

  product.stock -= quantity;


  this.ordersByCustomer[this.currentCustomer].items = [...this.items];

  // ✅ 修正這行，確保使用正確的計算方式
  this.ordersByCustomer[this.currentCustomer].total_price = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.ordersByCustomer[this.currentCustomer].status = "🟡 待揀貨";

  await this.syncOrderWithSupabase();
  await this.updateStockInSupabase(productId, product.stock);
   // ✅ **新增商品後，立即更新訂單狀態**
},


async updateStockInSupabase(productId, newStock) {
  const { error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", productId);

  if (error) {
    console.error("❌ 庫存更新失敗:", error);
  }
},

async syncOrderWithSupabase() {
  
  const order = this.ordersByCustomer[this.currentCustomer];
  if (!order) return;

  const { error } = await supabase
    .from("orders")
    .update({
      items: JSON.stringify(order.items), 
      total_price: order.total_price,
      status: order.status
    })
    .eq("id", order.id);

  if (error) {
    console.error("❌ 訂單同步失敗:", error);
  }
},
async syncOrderWithSupabase2(identifier, status) {
  
  let order = null;
  let customerName = null;

  // **🔍 先嘗試用 `orderNumber` 找顧客名稱**
  if (typeof identifier === "number" || !isNaN(identifier)) {
    customerName = Object.keys(this.ordersByCustomer).find(
      key => this.ordersByCustomer[key].order_number === String(identifier)
    );
  } else {
    // **🔍 如果 `identifier` 不是數字，直接當作 `customerName` 使用**
    customerName = identifier;
  }

  // **🔍 嘗試取得訂單**
  if (customerName && this.ordersByCustomer[customerName]) {
    order = this.ordersByCustomer[customerName];
  }

  if (!order) {
    console.error("❌ 找不到訂單:", identifier);
    return;
  }

  // **✅ 更新資料庫**
  const { error } = await supabase
    .from("orders")
    .update({
      items: JSON.stringify(order.items), 
      total_price: order.total_price,
      status: order.status
    })
    .eq("order_number", order.order_number);

  if (error) {
    console.error("❌ 訂單同步失敗:", error);
  }
},



    //更新訂單
    updateOrder() {
      this.currentOrder.items = this.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));
    
      if (this.ordersByCustomer[this.currentCustomer]) {
        this.ordersByCustomer[this.currentCustomer].items = [...this.currentOrder.items];
      }
      this.ordersByCustomer = { ...this.ordersByCustomer }; // 🔥 讓 Vue 偵測變化
      },

  async updateOrderStatus(orderNumber) {
    for (const customerName in this.ordersByCustomer) {
       const order = this.ordersByCustomer[customerName];
      
      if (order.order_number === orderNumber) {
            
      
        let hasPending = false;
        let hasShortage = false;
        let allCompleted = true;
      
         for (const item of order.items) {
          const status = this.getItemStatus(item);
           
            if (status.includes("🟡 待揀貨")) hasPending = true;
            if (status.includes("❌ 缺貨")) hasShortage = true;
            if (!status.includes("✅ 完成")) allCompleted = false;
          }
      
            if (hasPending) order.status = "🟡 待揀貨";
            else if (hasShortage) order.status = "❌ 缺貨";
            else if (allCompleted) order.status = "🟢 已揀貨";
            else order.status = "❓ 未知狀態";
            this.ordersByCustomer = { ...this.ordersByCustomer };

            // 🔥 **同步更新 Supabase**
            this.syncOrderWithSupabase2(orderNumber);
            return;
          }
        }
        console.error(`❌ 找不到訂單 ${orderNumber}，無法更新`);
    },
      
      getItemStatus(item) {
      
      
        if (item.itemStatus === "🟡 待揀貨") return "🟡 待揀貨"; 
        if (item.itemStatus === "✅ 完成") return "✅ 完成";  
        if (item.itemStatus === "❌ 缺貨") return `❌ 缺貨 ${item.missingQuantity || 0}`;  
        return "❓ 未知狀態";
      },
      async updateOrderItem(orderNumber, updatedItem) {
        
      
        // 🔹 找到對應的訂單
        const order = Object.values(this.ordersByCustomer).find(o => o.order_number === orderNumber);
        if (!order) {
          console.error("❌ 找不到訂單:", orderNumber);
          return;
        }
      
        // 🔹 找到對應的商品
        const itemIndex = order.items.findIndex(item => item.id === updatedItem.id);
        if (itemIndex === -1) {
          console.warn("⚠️ 找不到商品:", updatedItem.id);
          return;
        }
      
        // 🔹 **計算庫存變化**
        const oldQuantity = order.items[itemIndex].quantity;  // 舊的數量
        const newQuantity = updatedItem.quantity;  // 新的數量

        
        // ✅ **同步更新購物車**
        const cartItem = order.items.find(c => c.id === updatedItem.id);
        if (cartItem) {
          cartItem.price = updatedItem.price;
          cartItem.quantity = newQuantity;
          cartItem.itemStatus = "🟡 待揀貨";
          order.status = "🟡 待揀貨";
        }
      
      

        // ✅ **同步 Supabase 訂單**
        await this.syncOrderWithSupabase2(orderNumber);
      
        // ✅ **確保 Vue 監測到變更**
        this.ordersByCustomer = { ...this.ordersByCustomer };
      
  
      },
      
      
        completeOrder(orderNumber) {
          const customerName = this.currentCustomer;
        
          // 1️⃣ 確保該顧客有訂單
          const customerOrders = this.ordersByCustomer[customerName];
          if (!customerOrders) {
            console.warn(`⚠️ 找不到顧客 ${customerName} 的訂單`);
            return;
          }
        
          let order = null;
        
          // 2️⃣ 如果是「陣列」則尋找該訂單
          if (Array.isArray(customerOrders)) {
            const orderIndex = customerOrders.findIndex(o => o.orderNumber === orderNumber);
            if (orderIndex === -1) {
              console.warn(`⚠️ 找不到訂單 #${orderNumber}`);
              return;
            }
            order = customerOrders[orderIndex];
        
            // ✅ 從 `ordersByCustomer` 移除該訂單
            customerOrders.splice(orderIndex, 1);
        
            // 如果該顧客的訂單已清空，則刪除該顧客
            if (customerOrders.length === 0) {
              delete this.ordersByCustomer[customerName];
            }
          }
          // 3️⃣ 如果是「單一物件」，直接比對 `orderNumber`
          else if (customerOrders.orderNumber === orderNumber) {
            order = customerOrders;
        
            // ✅ 直接刪除該顧客的訂單
            delete this.ordersByCustomer[customerName];
          }
        
          if (!order) {
            console.warn(`⚠️ 找不到訂單 #${orderNumber}`);
            return;
          }
        
          // 4️⃣ 設定訂單狀態為已完成
          order.status = "✅ 已完成";
          order.completedAt = new Date().toLocaleString(); // 加上完成時間
        
          // ✅ 存入 `completedOrders`
          this.completedOrders[orderNumber] = order;
        

          // ✅ 確保 `OrderDetail.vue` 仍能讀取該訂單
          this.order = this.completedOrders[orderNumber];
        },
        
    
        async updateOrderHistory(orderNumber, change) {
          
          for (const customer in this.ordersByCustomer) {
            const order = this.ordersByCustomer[customer];
        
            if (order.orderNumber === orderNumber) {
              if (!order.history) {
                order.history = [];
              }
        
          // 統一歷史紀錄格式
          const record = {
            timestamp: new Date().toLocaleString(),
            itemName: change.name,
          };
        
          let isModified = false; // 確保只有當有變動時才紀錄
        
          // ✅ **紀錄數量變更**
          if (change.oldQuantity !== change.newQuantity) {
            record.oldQuantity = change.oldQuantity;
            record.newQuantity = change.newQuantity;
            isModified = true;
          }
        
          // ✅ **紀錄價格變更**
          if (change.oldPrice !== change.newPrice) {
            record.oldPrice = change.oldPrice;
            record.newPrice = change.newPrice;
            isModified = true;
          }
        
          // **只有當有變更時，才將該紀錄加入**
          if (isModified) {
            order.history.push(record);
        
            // ✅ **同步更新到 Supabase**
            await this.updateOrderHistory(orderNumber);
          }
        
          // 🔥 **確保 Vue 能偵測變更**
          this.ordersByCustomer = { ...this.ordersByCustomer };
        
        
        }
       }
      },
async updateProductStock(productId, quantityDiff) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
         // 確保庫存不小於 0
        const newStock = product.stock - quantityDiff;
        if (newStock < 0) {
          console.error("❌ 庫存數量不能小於 0");
          return; // 如果庫存不足，則返回並不執行更新
        }

        product.stock -= quantityDiff;
        await this.updateStockInSupabase(productId, product.stock);

      },

    },
});
