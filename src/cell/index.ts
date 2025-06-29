import z from "zod/v4";
import Counter from "./Counter";
import Coerce from "./Coerce";
import Column from "./Column";
import Literal from "./Literal";
import Replace from "./Replace";
import Trim from "./Trim";
import assert from "node:assert";
import Reference from "./Reference";
import Character from "./Character";
import Multiply from "./Multiply";
import Meta from "./Meta";
import Add from "./Add";
import Equals from "./Equals";
import Concat from "./Concat";

const REGISTERED = [
  Coerce,
  Column,
  Counter,
  Literal,
  Replace,
  Trim,
  Reference,
  Character,
  Multiply,
  Meta,
  Add,
  Equals,
  Concat
] as const;

export const _Schema = z.discriminatedUnion("type", [
  REGISTERED[0].schema,
  ...REGISTERED.slice(1).map(r => r.schema)
]);
type CellTransformation = z.infer<typeof _Schema>;

export async function _runOnce(transformation: CellTransformation, value: string, row: Row, context: Context) {
  const transformer = REGISTERED.find(r => r.name === transformation.type);
  assert.ok(transformer != null, `Cell transformer ${transformation.type} not found.`);

  // We assume that the transformer takes the schema as valid input.
  return transformer.run(transformation as never, value, row, context);
}

export async function _runMany(transformations: CellTransformation[], row: Row, context: Context) {
  let final = "";

  for (const transformation of transformations) {
    final = await _runOnce(transformation, final, row, context);
  }

  return final;
}

/** ------------------------------------------------------------------------- */

const CellTransformation = {
  Schema: _Schema,
  runOnce: _runOnce,
  runMany: _runMany,
}

export default CellTransformation;
