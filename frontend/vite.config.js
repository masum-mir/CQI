import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; 
import path from 'path'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Automatically splits node_modules dependencies into separate vendor chunks
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
            }
          ]
        }
      }
    }
    },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 5173,
  },
});
