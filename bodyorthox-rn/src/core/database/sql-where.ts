/**
 * Minimal WHERE-clause evaluator shared by the on-device shims
 * (`database.native.ts` / `database.web.ts`).
 *
 * Supports the subset of SQL the repositories actually emit: `col = ?` and
 * `col LIKE ?` predicates combined with AND / OR, no parentheses, evaluated
 * left to right. Placeholders are bound positionally, once, up front — the
 * returned predicate is then applied to every candidate row.
 */

type RowPredicate = (row: Record<string, unknown>) => boolean;

function parseClause(clause: string, params: unknown[], index: { i: number }): RowPredicate {
  const trimmed = clause.trim();

  // col = ?
  const eqMatch = trimmed.match(/^(\w+)\s*=\s*\?$/i);
  if (eqMatch) {
    const col = eqMatch[1];
    const val = params[index.i++];
    return (row) => row[col] === val;
  }

  // col LIKE ?
  const likeMatch = trimmed.match(/^(\w+)\s+LIKE\s+\?$/i);
  if (likeMatch) {
    const col = likeMatch[1];
    const pattern = String(params[index.i++]).replace(/%/g, "").toLowerCase();
    return (row) => String(row[col]).toLowerCase().includes(pattern);
  }

  // Unrecognized clause — consume its placeholder if present and never restrict.
  if (trimmed.includes("?")) index.i++;
  return () => true;
}

/**
 * Build a row predicate from a WHERE condition string and its bound params.
 */
export function matchesWhere(
  condition: string,
  params: unknown[],
): RowPredicate {
  // Split while keeping the AND/OR connectors: [clause, op, clause, op, ...].
  const tokens = condition.split(/\s+(AND|OR)\s+/i);
  const index = { i: 0 };

  const predicates: RowPredicate[] = [];
  const operators: string[] = [];
  tokens.forEach((token, pos) => {
    if (pos % 2 === 0) {
      predicates.push(parseClause(token, params, index));
    } else {
      operators.push(token.toUpperCase());
    }
  });

  return (row) => {
    let acc = predicates[0](row);
    for (let k = 0; k < operators.length; k++) {
      const next = predicates[k + 1](row);
      acc = operators[k] === "OR" ? acc || next : acc && next;
    }
    return acc;
  };
}
