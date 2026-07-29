import { parseOcr } from "./parser";

const sample = `
Section A

dictate
vi./vt.
口述；口授

dictation
n.
口述；口授

contra- = opposite

dictionary
n.
字典
`;

const result = parseOcr(sample);

console.log(result);