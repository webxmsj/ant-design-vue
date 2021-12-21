<template>
  <a-space class="good" :class="{ word: true }" style="background: green">
    Space
    <a-button type="primary">
      Button
    </a-button>
    <a-button type="primary">
      Button
    </a-button>
  </a-space>
</template>
<script>
export default {
  data() {
    return {
      text: `A dog is a type of domesticated animal. Known for its loyalty and faithfulness, it can be found as a welcome guest in many households across the world.`,
    };
  },
};
</script>

<style lang="less">
.good {
  background: red;
}
</style>
