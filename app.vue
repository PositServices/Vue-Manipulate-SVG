<template>
  <div id="splashpage">
    <div id="loadingPopup" v-show="!pageLoaded">The site is loading, please wait.</div>
    <div ref="svgAnchor"></div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import {
  useWindowSize,
  useDevicePixelRatio,
  useImage,
  watchDebounced,
  watchOnce,
  useElementBounding,
} from "@vueuse/core";
import { select, zoom } from "d3";

// TODO:  Make each element's 'isLoaded' bubble up as promises for the anchor to resolve

// https://www.petercollingridge.co.uk/tutorials/svg/interactive/pan-and-zoom/
// https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
const pageLoaded = ref(false);

/**
 * Constructs the SVG_anchor class
 * This Class attaches to the ref of 'div' to manage the svg content below.
 * The provided class argument should be used to dimension the 'div' in the page's layout.
 *
 * On page load, the div is hidden.  After all content has loaded it unhides.
 */
class SVG_anchor {
  #el = {};
  #children = {};
  #watchers = {};
  /**
   * @param {ref} anchor_ref a `const svg_anchor = ref()`, attached to the element.
   * @param {CSSclass} css_class The class that the svg_anchor should use.
   */
  constructor({ anchor_ref = "", css_class = "" }) {
    this.#el.ref = select(anchor_ref.value);
    this.#el.width = useElementBounding(anchor_ref).width;
    this.#el.height = useElementBounding(anchor_ref).height;
    this.#el.isLoading = ref();
    this.#el.visibility = computed(() =>
      this.#el.isLoading.value ? "hidden" : "visible"
    );
    // Prepare the anchor for attachments
    this.#el.id = `ANCHOR_${crypto.randomUUID()}`;
    this.#el.ref.attr("id", this.#el.id).classed(css_class, true);
    // Watch visibility
    this.#watchers.visibility = watch(this.#el.isLoading, current => {
      this.#el.ref.attr("visibility", this.#el.visibility.value);
    });
    this.#el.isLoading.value = true;
  }

  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get width() {
    return this.#el.width;
  }
  get height() {
    return this.#el.height;
  }
  get size() {
    return computed(() => ({
      width: this.#el.width.value,
      height: this.#el.height.value,
    }));
  }
}

/**
 * Constructs an svg element and manages svg content below it.
 */
class SVG_element {
  #parent = {};
  #el = {};
  #children = {};
  #watchers = {};
  /**
   * @param {svgAnchor} svgAnchor the instance of SVG_anchor.
   * @param {Integer} x offset relative to the parent's viewbox
   * @param {Integer} y offset relative to the parent's viewbox
   * @param {ref} width the width of the svg element
   * @param {ref} height the height of the svg element
   * @param {Array} viewBox An array of 4 reactive variables: [offset_x, offset_y, width, height]
   * @param {String} preserveAspectRatio Aspect ratio config string:
   *        https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio
   */
  constructor({
    parent = "",
    x = 0,
    y = 0,
    width = ref("auto"),
    height = ref("auto"),
    viewBox = [ref(0), ref(0), ref(0), ref(0)],
    preserveAspectRatio = "none",
  }) {
    this.#parent = parent;
    this.#el.id = `SVG_${crypto.randomUUID()}`;
    this.#el.ref = this.#parent.ref.append("svg");
    this.#el.ref.attr("id", this.#el.id).attr("preserveAspectRatio", preserveAspectRatio);
    // Set the style to margin: auto; to center the svg in the div.
    this.#el.ref.attr("style", "margin: 0 auto; display: block;");

    // Handling x & y - https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/x
    this.#el.x = ref(x);
    this.#el.y = ref(y);
    // Handling width & height - https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/width#svg
    this.#el.width = width;
    this.#el.height = height;
    // Handling the viewBox
    this.#el.viewBox = viewBox;
    this.#el.viewBoxText = computed(
      () =>
        `${viewBox[0].value} ${viewBox[1].value} ${viewBox[2].value} ${viewBox[3].value}`
    );
    // Watch the dimensions and adjust.
    this.#watchers.dimensions = watchDebounced(
      reactive({
        x: this.#el.x,
        y: this.#el.y,
        width: this.#el.width,
        height: this.#el.height,
        viewBox: this.#el.viewBoxText,
      }),
      current => {
        Object.keys(current).forEach(key => {
          this.#el.ref.attr(key, current[key]);
        });
      },
      { debounce: 10, maxWait: 20 }
    );
  }

  get parent() {
    return this.#parent;
  }
  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get size() {
    return this.#el.viewBox;
  }
}

class SVG_group {
  #parent = {};
  #el = {};
  #children = {};
  #watchers = {};

  constructor({ parent }) {
    this.#parent = parent;
    this.#el.id = `G_${crypto.randomUUID()}`;
    this.#el.ref = this.#parent.ref.append("g");
    this.#el.ref.attr("id", this.#el.id);
  }

  get parent() {
    return this.#parent;
  }
  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get size() {
    return this.#parent.size;
  }
}

class SVG_filter {
  #parent = {};
  #el = {};
  #children = {};
  #watchers = {};

  constructor({
    parent,
    x = ref(0),
    y = ref(0),
    width = ref("auto"),
    height = ref("auto"),
    filter = "",
  }) {
    console.log(height.value);
    this.#parent = parent;
    this.#el.id = `FILTER_${crypto.randomUUID()}`;
    this.#el.ref = this.#parent.ref.append("filter");
    // <filter id='roughpaper' x='0%' y='0%' width='100%' height="100%">
    this.#el.ref
      .attr("id", this.#el.id)
      .attr("x", x.value)
      .attr("y", y.value)
      .attr("width", width.value)
      .attr("height", height.value);
    if (filter !== "") {
      this.#el.ref.html(filter);
    }
  }

  get parent() {
    return this.#parent;
  }
  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get size() {
    return this.#parent.size;
  }
}

class SVG_element_image {
  #parent = {};
  #el = {};
  #children = {};
  #watchers = {};

  constructor({
    parent,
    href = "",
    height = ref(0),
    width = ref(0),
    normalizePixelRatio = true,
    zoomable = false,
  }) {
    this.#parent = parent;
    this.#el.id = `IMG_${crypto.randomUUID()}`;
    this.#el.ref = this.#parent.ref.append("image");
    this.#el.ref.attr("id", this.#el.id);
    this.#el.href = ref("");
    this.#el.zoomable = zoomable;
    this.#el.w = {};
    this.#el.w.box = width;
    this.#el.w.natural = ref(0);
    this.#el.w.pixel = computed(
      () => this.#el.w.natural.value / useDevicePixelRatio().pixelRatio.value
    );
    this.#el.h = {};
    this.#el.h.box = height;
    this.#el.h.natural = ref(0);
    this.#el.h.pixel = computed(
      () => this.#el.h.natural.value / useDevicePixelRatio().pixelRatio.value
    );
    this.#watchers.size = watchDebounced(
      [this.#el.w.pixel, this.#el.h.pixel],
      () => {
        console.log("updating size");
        this.#el.ref
          .attr(
            "width",
            normalizePixelRatio ? this.#el.w.pixel.value : this.#el.w.natural.value
          )
          .attr(
            "height",
            normalizePixelRatio ? this.#el.h.pixel.value : this.#el.h.natural.value
          );
        this.#addZoomCapability();
      },
      { debounce: 10, maxWait: 20 }
    );
    // Make sure to update the image's natural dimensions when the href changes
    this.#loadImage(href);
  }
  // Creates a watcher that adds functionality when the image changes
  #loadImage(href) {
    this.#watchers.href = watch(this.#el.href, current => {
      this.#el.ref.attr("href", current);
      watchOnce(useImage({ src: this.#el.href }).isLoading, current => {
        if (current === true) return;
        var img = new Image();
        img.onload = async e => {
          // Update the natural size of the image
          this.#el.w.natural.value = e.originalTarget.naturalWidth;
          this.#el.h.natural.value = e.originalTarget.naturalHeight;
          // Add zoom capability if requested
        };
        img.src = href;
      });
    });
    this.#el.href.value = href;
  }

  #addZoomCapability() {
    if (!this.#el.zoomable) return;
    console.log(this.#el.ref.node().nearestViewportElement);
    this.#el.zoom = select(this.#el.ref.node().nearestViewportElement)
      .call(
        zoom()
          .on("zoom", ({ transform }) => this.#parent.ref.attr("transform", transform))
          .translateExtent([
            [0, 0],
            [this.#el.w.pixel.value, this.#el.h.pixel.value],
          ])
          .scaleExtent([
            Math.min(
              this.#el.w.box.value / this.#el.w.pixel.value,
              this.#el.h.box.value / this.#el.h.pixel.value
            ),
            Math.max(
              (this.#el.w.natural.value * 2) / this.#el.w.box.value,
              (this.#el.h.natural.value * 2) / this.#el.h.box.value
            ),
          ])
      )
      .on("wheel", event => event.preventDefault());
  }

  get parent() {
    return this.#parent;
  }
  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get size() {
    return this.#parent.size;
  }
  get imageSize() {
    return this.#el.ref.attr("naturalWidth");
  }
}

class SVG_element_rect {
  #parent = {};
  #el = {};
  #children = {};
  #watchers = {};

  constructor({
    parent,
    normalizePixelRatio = true,
    zoomable = false,
    filter = "none",
    fill = "none",
  }) {
    this.#parent = parent;
    this.#el.id = `IMG_${crypto.randomUUID()}`;
    this.#el.ref = this.#parent.ref.append("rect");
    this.#el.ref.attr("id", this.#el.id);
    this.#el.ref.attr("filter", filter);
    this.#el.ref.attr("fill", fill);
    this.#el.href = ref("");
    this.#el.zoomable = zoomable;
    this.#el.w = {};
    this.#el.w.natural = ref(0);
    this.#el.w.pixel = computed(
      () => this.#el.w.natural.value / useDevicePixelRatio().pixelRatio.value
    );
    this.#el.h = {};
    this.#el.h.natural = ref(0);
    this.#el.h.pixel = computed(
      () => this.#el.h.natural.value / useDevicePixelRatio().pixelRatio.value
    );
    this.#watchers.size = watchDebounced(
      [this.#el.w.pixel, this.#el.h.pixel],
      () => {
        console.log("updating size");
        this.#el.ref
          .attr(
            "width",
            normalizePixelRatio ? this.#el.w.pixel.value : this.#el.w.natural.value
          )
          .attr(
            "height",
            normalizePixelRatio ? this.#el.h.pixel.value : this.#el.h.natural.value
          );
        this.#addZoomCapability();
      },
      { debounce: 10, maxWait: 20 }
    );
    // Make sure to update the image's natural dimensions when the href changes
  }

  #addZoomCapability() {
    if (!this.#el.zoomable) return;
    console.log(this.#el.ref.node().nearestViewportElement);
    this.#el.zoom = select(this.#el.ref.node().nearestViewportElement)
      .call(
        zoom()
          .on("zoom", ({ transform }) => this.#parent.ref.attr("transform", transform))
          .translateExtent([
            [0, 0],
            [this.#el.w.pixel.value, this.#el.h.pixel.value],
          ])
          .scaleExtent([0.5, 5])
      )
      .on("wheel", event => event.preventDefault());
  }

  get parent() {
    return this.#parent;
  }
  get id() {
    return this.#el.id;
  }
  get ref() {
    return this.#el.ref;
  }
  get size() {
    return this.#parent.size;
  }
  get imageSize() {
    return this.#el.ref.attr("naturalWidth");
  }
}

const svgAnchor = ref();
const svg = {};
onMounted(async () => {
  await nextTick();
  svg.anchor = new SVG_anchor({
    anchor_ref: svgAnchor,
    css_class: "svgAnchor",
  });
  svg.svg = new SVG_element({
    parent: svg.anchor,
    width: computed(() => svg.anchor.width.value),
    height: computed(() => svg.anchor.height.value),
    viewBox: [
      ref(-1),
      ref(-1),
      computed(() => svg.anchor.width.value - 1),
      computed(() => svg.anchor.height.value - 1),
    ],
    preserveAspectRatio: "xMidYMid slice",
  });
  svg.g = new SVG_group({ parent: svg.svg });
  svg.mapImage = new SVG_element_image({
    parent: svg.g,
    href: "assets/img/map.jpg",
    width: computed(() => svg.anchor.width.value),
    height: computed(() => svg.anchor.height.value),
    normalizePixelRatio: true,
    zoomable: true,
  });
  // last
  pageLoaded.value = true;
});
</script>

<style global>
html,
body {
  margin: 0px;
  padding: 0px;
  width: 100%;
  height: 100vh;
}
</style>
<style scoped>
#splashpage {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
}
.svgAnchor {
  display: flex;
  align-items: center;
  background-color: #644740;
  height: 100%;
}
</style>
