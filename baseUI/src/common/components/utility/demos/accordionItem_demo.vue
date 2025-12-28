

<script>

// Demo Metadata
// -------------------------------------------------------
import source from "./accordionItem_demo.vue?raw"
export default {
  noDemoView: true,
  source,
  title: "An accordion item",
  description: "An item for an [`<Accordion>`](#/components/Accordion) component",
  propInfo: [
    {
      name: "static",
      type: "Boolean",
      desc: "Switch to make the item static (expanded with no way to collapse)",
    },
    {
      name: "expanded",
      type: "Boolean",
      desc: "Switch to make the item initially expanded",
    },
    {
      name: "disabled",
      type: "Boolean",
      desc: "Switch to disable/enable the item",
    },
    {
      name: "animated",
      type: "Boolean",
      desc: "Switch to enable/disable animation on expand/collapse for the item",
    },
    {
      name: "selectable",
      type: "Boolean/Object",
      desc: "Switch to make the item selectable. Use an object with a `multi` prop set to `true` to allow multiple selections",
    },
    {
      name: "selected",
      type: "Boolean",
      desc: "Switch to make the item selected/unselected",
    },
    {
      name: "data",
      type: "Any",
      desc: "Optional data to store with the item",
    },
    {
      name: "navigable",
      type: "Boolean/Object",
      desc: "Set to `true` to make the item navigable with game controller (can optionally pass in a UI scope name as a `scope` property on an object if required)",
    },
    {
      name: "arrowBig",
      type: "Boolean",
      desc: "Switch to make the leading arrow of the item big",
    },
  ],
  attrInfo: [

  ],
}

</script>

