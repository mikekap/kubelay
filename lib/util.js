// @flow

import {map, toArray} from 'iterlib';

export function pairs<K, V>(): Iterable<[K, V]> {
    const that: Map<K, V> = this;
    return that.keys()::map(k => [k, that.get(k)]);
}

export function toMap<T>(): Map<T> {
    const that: Iterable<T> = this;
    return new Map(that::toArray());
}

export function tap<T>(fn): Iterable<T> {
    const that: Iterable<T> = this;
    return that::map(i => {fn(i); return i});
}

export function maybeStripSuffix(str: string, suffix: string): string {
    if (str.endsWith(suffix)) {
        return str.substring(0, str.length - suffix.length);
    }
    return str;
}
