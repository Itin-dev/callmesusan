import { createCn } from 'cn/config'

/** Custom font sizes from index.css (@theme --text-*), so merging does not mistake them for colours. */
const TYPE_SCALE = ['display', 'hero', 'title', 'heading', 'body', 'small', 'caption']

export const cn = createCn({
  extend: { classGroups: { 'font-size': [{ text: TYPE_SCALE }] } },
})
