import Memory from "../memory";
import Stack from "../stack";
import { isHexString, arrayify, hexlify } from "@ethersproject/bytes";
import { InvalidByteCode, InvalidJump, InvalidProgramCounterIndex, UnknownOpcode } from "./errors";
import Instruction from "../instruction";
import Opcodes from "../../opcodes";
import { Trie } from "@ethereumjs/trie";

class ExecutionContext {
    private readonly code: Uint8Array;
    public stack: Stack;
    public memory: Memory;
    private pc: number;
    private stopped: boolean;
    public output: bigint = BigInt(0);
    public storage: Trie

    constructor(code: string, storage: Trie) {
        /**
         * e.g. code: 0x12
         */
        if(!isHexString(code) || code.length % 2 !== 0)
            throw new InvalidByteCode();
        
        this.code = arrayify(code);
        this.stack = new Stack();
        this.memory = new Memory();
        this.pc = 0;
        this.stopped = false;
        this.storage = storage;
    }

    public stop(): void {
        this.stopped = true;
    }

    public async run() {
        while(!this.stopped) {
            const currentPc = this.pc;

            const instruction = this.fetchInstruction();
            await instruction.execute(this);

            console.info(`${instruction.name}\t @pc=${currentPc}`)

            this.memory.print();
            this.stack.print();
            console.log("");
        }

        console.log("Output:\t", hexlify(this.output));
        console.log("Root:\t", hexlify(this.storage.root()));
    }

    private fetchInstruction(): Instruction {
        if(this.pc >= this.code.length) return Opcodes[0];

        if(this.pc < 0) throw new InvalidProgramCounterIndex();

        const opcode = this.readBytesFromCode(1);

        const instruction = Opcodes[Number(opcode)]

        if(!instruction) throw new UnknownOpcode();

        return instruction;
    }

    public readBytesFromCode(bytes = 1): bigint {
        // Slice a piece of bytes
        const hexValues = this.code.slice(this.pc, this.pc + bytes);
        const values = BigInt(hexlify(hexValues));

        this.pc += bytes;

        return values;
    }

    public jump(destination: bigint): void {
        if(!this.isValidJump(destination)) throw new InvalidJump();
        this.pc = Number(destination);
    }

    private isValidJump(destination: bigint): boolean {
        //JUMPDEST
        return this.code[Number(destination) - 1] === Opcodes[0x5b].opcode;
    }
}

export default ExecutionContext;