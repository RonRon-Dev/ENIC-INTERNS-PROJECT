import NProgress from "nprogress"
import "nprogress/nprogress.css"

NProgress.configure({
  showSpinner: true,
  minimum: 0.08,
  trickleSpeed: 200,
})

export default NProgress