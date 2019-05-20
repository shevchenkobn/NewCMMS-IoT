"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const token = config.get('token');
function getProtectedData(tag) {
    return tag.uid.startsWith('08:') ? token : null;
}
exports.getProtectedData = getProtectedData;
//# sourceMappingURL=index.js.map