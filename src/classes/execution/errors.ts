class InvalidByteCode extends Error {}

class InvalidProgramCounterIndex extends Error {}

class UnknownOpcode extends Error {}

class InvalidJump extends Error {}

export { InvalidByteCode, InvalidProgramCounterIndex, UnknownOpcode, InvalidJump }