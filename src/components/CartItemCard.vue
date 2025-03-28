<template>
  <div class="col-md-4 mb-3">
    <div class="card shadow-sm">
      <div class="card-body">
        <img :src="item.image || '/default.jpg'" class="cart-image" />
        <div class="card-info">
        <h5 class="card-title">{{ item.name }}</h5>
        <div class="card-text">
          <span>${{ item.price }}</span>
          <span>x{{ item.quantity }}</span>
          <div class="price">
          <span>${{ item.price * item.quantity }}</span>
          </div>
        </div>
        <button @click="removeFromCart(item.id)" class="remove-btn">❌ 移除</button> <!-- 🔥 加上刪除按鈕 -->
      </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from "vue";

export default {
  props: ["item"],
  emits: ["remove"],
  setup(props, { emit }) {

    // 移除商品
    const removeFromCart = () => {
      emit("remove", props.item.id);
    };

    return {  removeFromCart };
  }
};
</script>

<style scoped>
.card-text{
  display:flex;
}
.card {
  transition: transform 0.2s;
}
.card:hover {
  transform: scale(1.05);
}
.cart-image{

    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
    border-radius: 5px;
}
.price{
  margin:auto;
}
.card-body{
  display:flex;
  justify-content: space-around;
  border-bottom-style: dashed;

}
.card-title{
  font-size:30px;
}
.card-info{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.card-text{
  font-size:24px;
}
</style>
