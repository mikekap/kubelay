"use strict";

export function first(v) {
    for (var p in v) {
        if (v.hasOwnProperty(p)) {
            return v[p];
        }
    }
    return null;
}
