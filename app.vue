<template>
  <svg
    class="splashmenu"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
    @mousedown.exact.prevent="(e) => startDrag(e)"
    @mousemove.prevent="(e) => doDrag(e)"
    @mouseup="(e) => stopDrag(e)"
    @mouseleave.prevent="(e) => stopDrag(e)"
  >
  <g :transform="`matrix(${transformMatrix.join(' ')})`">
    <image ref="navigationMap" x="0" y="0" href="~/assets/img/pexels-arnie-chou-1229042.jpg"></image>
  </g>
  </svg>
</template>

<script setup>
// https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/
// https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
const height = ref(0)
const width = ref(0)
const navigationMap=ref()
const transformMatrix = ref([1, 0, 0, 1, 0, 0])
// Handle panning with the mouse or touch
let isPanning = false;
let panX = 0;
let panY = 0;
const startDrag = (e) => {
  isPanning = true;
  panX = e.clientX;
  panY = e.clientY;
};
const stopDrag = (e) => {
  panX = e.clientX;
  panY = e.clientY;
  isPanning = false
}
const doDrag = (e) => {
  if (!isPanning) return
  let bBox = navigationMap.value.getBBox()
  // Horizontal bounding
  let dX = e.clientX - panX
  let newX = transformMatrix.value[4] + dX
  let maxX = width.value - bBox.width; // attach to the right side of the screen
  panX = e.clientX;
  //console.log(`dX: ${dX} | newX: ${newX} | maxX: ${maxX}`)
  if (newX <= 0 && newX >= maxX) transformMatrix.value[4] += dX
  // Vertical bounding
  let dY = e.clientY - panY
  let newY = transformMatrix.value[5] + dY
  let maxY = height.value - bBox.height; // attach to the bottom of the screen
  panY = e.clientY;
  //console.log(`dY: ${dY} | newY: ${newY} | maxY: ${maxY}`)
  if (newY <= 0 && newY >= maxY) transformMatrix.value[5] += dY
  //console.log(`matrix(${transformMatrix.value.join(' ')})`)
}
// Handle zooming with the mousewheel or touch

// TODO: browser zoom level should only impact the text size on components, not the svg viewBox
// TODO: use the mouse scrollwheel to zoom in & out

// Handle the window size dynamically
onMounted(() => {
  window.addEventListener("resize", windowResizeHandler);
  windowResizeHandler()
})
onUnmounted(() => {
  window.removeEventListener("resize", windowResizeHandler);
})
const windowResizeHandler = (e = "") => {
  height.value = window.innerHeight
  width.value = window.innerWidth
}

</script>
<style global>
html, body {
  margin: 0px;
    padding: 0px;
    width: 100%;
    height: 100vh;
}
</style>
<style scoped>
.splashmenu {
  margin: 0;
  padding: 0;
  display: block;
}
</style>