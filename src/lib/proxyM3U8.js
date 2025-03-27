import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 8080;
const web_server_url = process.env.PUBLIC_URL || `https://proxy.animoon.me`;

export default async function proxyM3U8(url, headers, res) {
  try {
    // Fetch the original M3U8 content
    const response = await axios.get(url, { headers });

    // Process the M3U8 file
    const m3u8 = response.data
      .split("\n")
      .filter((line) => !line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO"))
      .join("\n");

    const lines = m3u8.split("\n");
    const newLines = [];

    for (const line of lines) {
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-KEY:")) {
          const regex = /https?:\/\/[^\""\s]+/g;
          const keyUrlMatch = regex.exec(line);
          if (keyUrlMatch) {
            const keyUrl = `${web_server_url}/ts-proxy?url=${
              encodeURIComponent(keyUrlMatch[0])
            }&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            newLines.push(line.replace(regex, keyUrl));
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else {
        const uri = new URL(line, url);
        newLines.push(
          `${web_server_url}/ts-proxy?url=${encodeURIComponent(uri.href)}&headers=${encodeURIComponent(
            JSON.stringify(headers)
          )}`
        );
      }
    }

    // **Remove existing CORS headers before setting them**
    [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials",
      "Access-Control-Expose-Headers",
      "Origin",
      "Vary",
      "Referer",
      "Server",
      "x-cache",
      "via",
      "x-amz-cf-pop",
      "x-amz-cf-id",
    ].forEach((header) => res.removeHeader(header));

    // **Set correct CORS headers**
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.end(newLines.join("\n"));
  } catch (error) {
    res.writeHead(500);
    res.end(`Error fetching M3U8: ${error.message}`);
  }
}
