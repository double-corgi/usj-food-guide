import { crawlUsjFoods } from "./crawl-usj-foods";

const source = process.argv[2] || "all";
void crawlUsjFoods(source as never);
