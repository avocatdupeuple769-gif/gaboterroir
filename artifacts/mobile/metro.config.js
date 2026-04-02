const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Exclude Firebase temp folders and _tmp_ paths that cause Metro watcher errors
const { blockList } = config.resolver || {};
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
    // Block Firebase temp files that get created/deleted during install
    /.*_tmp_\d+.*/,
    /.*\/\.pnpm\/.*_tmp_.*/,
  ],
};

// Monorepo: watch root node_modules if it exists (pnpm workspace local dev)
// On EAS Build servers, only the local node_modules exists
const watchFolders = [path.resolve(__dirname, "node_modules")];
const rootNodeModules = path.resolve(__dirname, "../../node_modules");
if (fs.existsSync(rootNodeModules)) {
  watchFolders.unshift(rootNodeModules);
}
config.watchFolders = watchFolders;

module.exports = config;
