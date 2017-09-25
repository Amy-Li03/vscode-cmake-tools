import * as path from 'path';

import * as vscode from 'vscode';

import config from './config';

/**
 * Escape a string so it can be used as a regular expression
 */
export function escapeStringForRegex(str: string): string {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}

/**
 * Replace all occurrences of `needle` in `str` with `what`
 * @param str The input string
 * @param needle The search string
 * @param what The value to insert in place of `needle`
 * @returns The modified string
 */
export function replaceAll(str: string, needle: string, what: string) {
  const pattern = escapeStringForRegex(needle);
  const re = new RegExp(pattern, 'g');
  return str.replace(re, what);
}

/**
 * Remove all occurrences of a list of strings from a string.
 * @param str The input string
 * @param patterns Strings to remove from `str`
 * @returns The modified string
 */
export function removeAllPatterns(str: string, patterns: string[]): string {
  return patterns.reduce((acc, needle) => { return replaceAll(acc, needle, ''); }, str);
}

/**
 * Completely normalize/canonicalize a path.
 * Using `path.normalize` isn't sufficient. We want convert all paths to use
 * POSIX separators, remove redundant separators, and sometimes normalize the
 * case of the path.
 *
 * @param p The input path
 * @param normalize_case Whether we should normalize the case of the path
 * @returns The normalized path
 */
export function normalizePath(p: string, normalize_case = true): string {
  let norm = path.normalize(p);
  while (path.sep !== path.posix.sep && norm.includes(path.sep)) {
    norm = norm.replace(path.sep, path.posix.sep);
  }
  if (normalize_case && process.platform === 'win32') {
    norm = norm.toLocaleLowerCase().normalize();
  }
  norm = norm.replace(/\/$/, '');
  while (norm.includes('//')) {
    norm = replaceAll(norm, '//', '/');
  }
  return norm;
}

/**
 * Replace variable references with the corresponding variables
 * @param str The input string
 */
export function replaceVars(str: string): string {
  const replacements: {[key: string] : string} = {
    ['${workspaceRoot}'] : vscode.workspace.rootPath || '.',
    ['${workspaceRootFolderName}'] : path.basename(vscode.workspace.rootPath || '.'),
    ['${toolset}'] : config.toolset || 'unknown',
  };
  return Object.keys(replacements)
      .reduce((acc, key) => replaceAll(acc, key, replacements[key]), str);
}

/**
 * Check if a value is "truthy" according to CMake's own language rules
 * @param value The value to check
 */
export function isTruthy(value: (boolean | string | null | undefined | number)) {
  if (typeof value === 'string') {
    return !([ '', 'FALSE', 'OFF', '0', 'NOTFOUND', 'NO', 'N', 'IGNORE' ].indexOf(value) >= 0
             || value.endsWith('-NOTFOUND'));
  }
  // Numbers/bools/etc. follow common C-style truthiness
  return !!value;
}

/**
 * Generate an array of key-value pairs from an object using
 * `getOwnPropertyNames`
 * @param obj The object to iterate
 */
export function objectPairs<V>(obj: {[key: string] : V}): [ string, V ][] {
  return Object.getOwnPropertyNames(obj).map(key => ([ key, obj[key] ] as[string, V]));
}