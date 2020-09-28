"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMd = void 0;
function requireMd(path) {
    return require(`!!mustache-loader!html-loader!markdown-loader!${path}`);
}
exports.requireMd = requireMd;
