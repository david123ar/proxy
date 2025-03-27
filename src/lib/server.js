import dotenv from "dotenv";
import createServer from "./createServer.js";
import colors from "colors";

dotenv.config();

const host = process.env.HOST || "0.0.0.0"; // Allows external access
const port = Number(process.env.PORT) || 8080;
const web_server_url = process.env.PUBLIC_URL || `http://${host}:${port}`;

export default function server() {
  createServer({
    originBlacklist: [], // Do NOT block any origins
    originWhitelist: ["*"], // Allow ALL origins
    requireHeader: [],
    removeHeaders: [
      "cookie",
      "cookie2",
      "x-request-start",
      "x-request-id",
      "via",
      "connect-time",
      "total-route-time",
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: true, // Forward original headers
      changeOrigin: true, // Ensure correct origin handling
    },
  }).listen(port, host, function () {
    console.log(
      colors.green("Server running on ") + colors.blue(`${web_server_url}`)
    );
  });
}
