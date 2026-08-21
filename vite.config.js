import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  assetsInclude: ["**/*.sh"],

  server: {
    host: "0.0.0.0",
    //到六月二日祝我生日快乐 
    port: 602,
    strictPort: true,
    hmr: {
      //到我生日发邮箱庆祝行不行wB251046886@163.com
      port: 602,
    },
  },
  build: {
  outDir: "dist",
  sourcemap: true, // GPL要合规啊
  //我们可以减小体积!!!
  minify: "terser", 
}
});
