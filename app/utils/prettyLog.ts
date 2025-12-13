// prettyLog.ts
export const prettyLog = (...args: any[]) => {
  const options = {
    spacing: 2,
    color: true,
    maxDepth: 10,
  };

  // Helper to detect object type
  const getType = (value: any): string => {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  };

  // ANSI colors
  const colors = {
    reset: "\x1b[0m",
    key: "\x1b[37m", // white
    string: "\x1b[32m", // green
    number: "\x1b[33m", // yellow
    boolean: "\x1b[35m", // magenta
    null: "\x1b[90m", // gray
  };

  const indent = (level: number) => " ".repeat(level * options.spacing);

  const formatValue = (value: any, depth: number): string => {
    const type = getType(value);

    if (type === "string")
      return options.color
        ? `${colors.string}"${value}"${colors.reset}`
        : `"${value}"`;

    if (type === "number")
      return options.color
        ? `${colors.number}${value}${colors.reset}`
        : String(value);

    if (type === "boolean")
      return options.color
        ? `${colors.boolean}${value}${colors.reset}`
        : String(value);

    if (type === "null")
      return options.color ? `${colors.null}null${colors.reset}` : "null";

    if (type === "array") {
      if (depth >= options.maxDepth) return "[Array]";
      if (value.length === 0) return "[]";

      const items = value.map((v: any) => formatValue(v, depth + 1));
      return `[\n${indent(depth + 1)}${items.join(
        `,\n${indent(depth + 1)}`
      )}\n${indent(depth)}]`;
    }

    if (type === "object") {
      if (depth >= options.maxDepth) return "[Object]";
      const entries = Object.entries(value);
      if (entries.length === 0) return "{}";

      const props = entries.map(([k, v]) => {
        const key = options.color ? `${colors.key}${k}${colors.reset}` : k;
        return `${key}: ${formatValue(v, depth + 1)}`;
      });

      return `{\n${indent(depth + 1)}${props.join(
        `,\n${indent(depth + 1)}`
      )}\n${indent(depth)}}`;
    }

    return String(value);
  };

  // ✅ Handle multiple arguments like console.log
  const output = args
    .map((arg) => (typeof arg === "object" ? formatValue(arg, 0) : String(arg)))
    .join(" ");

  console.log(output);
};
