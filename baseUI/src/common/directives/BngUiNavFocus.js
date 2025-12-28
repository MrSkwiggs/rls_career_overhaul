import { nextTick } from "vue"
import { wantsFocus, unwantsFocus } from "@/services/uiNavFocus"

const reg = (elm, { value }) => nextTick(() => elm && wantsFocus(elm, value))

export default {
  mounted: reg,
  updated: reg,
  beforeUnmount: unwantsFocus,
}
