export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export function toPlainJSON<T>(value: T): JSONValue {
  if (value === null || value === undefined) {
    return null;
  }

  const t = typeof value;

  if (t === 'string' || t === 'number' || t === 'boolean') {
    return value as unknown as JSONValue;
  }

  if (t === 'bigint') {
    // 避免精度丢失，使用字符串
    return (value as unknown as bigint).toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainJSON(item)) as JSONValue;
  }

  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const result: { [key: string]: JSONValue } = {};
    
    for (const [k, v] of Object.entries(obj)) {
      // 跳过 undefined（JSON 不支持）
      if (typeof v === 'undefined') continue;
      result[k] = toPlainJSON(v);
    }
    
    // 优化图片URL：如果有ossUrl，优先使用ossUrl作为imageUrl
    if (result.ossUrl && result.imageUrl) {
      result.imageUrl = result.ossUrl;
    }
    
    return result;
  }

  // 其他不可序列化类型（如函数、symbol），转字符串兜底
  return String(value) as unknown as JSONValue;
}