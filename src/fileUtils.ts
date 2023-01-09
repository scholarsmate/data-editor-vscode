
export type AddressState = {
  start: number,
  end: number,
  stride: number,
  radix: number
}
export type PhysicalDisplayState = {
  radix: number,
  bytesPerRow: number
}
export type OffsetState = {
  radix: number,
  spread: number
}
export type LogicalDisplayState = {
  bytesPerRow: number
}
export type EditorDisplayState = {
  encoding: BufferEncoding,
  start: number,
  end: number,
  cursor: number
}
export class DisplayState {
    public address: AddressState
    public physicalOffset: OffsetState
    public physicalDisplay: PhysicalDisplayState
    public logicalOffset: OffsetState
    public logicalDisplay: LogicalDisplayState
    public editorDisplay: EditorDisplayState

  constructor(){
    this.address = { start: 0, end: 0, stride: 16, radix: 10 }
    this.physicalOffset = { radix: 10, spread: 2 }
    this.physicalDisplay = { radix: 16, bytesPerRow: 16 }
    this.logicalOffset = { radix: 10, spread: 1 }
    this.logicalDisplay = { bytesPerRow: 16 }
    this.editorDisplay = { encoding: 'utf-8', start: 0, end: 0, cursor: 0 }
  }
  public updateAddressState(state: AddressState) {
    this.address = {
      start: state.start,
      end: state.end,
      stride: state.stride,
      radix: state.radix
    }
  }
  public updatePhysicalOffsetState(state: OffsetState) {
    this.physicalOffset = {
      radix: state.radix,
      spread: state.spread
    }
  }
  public updatePhysicalDisplayState(state: PhysicalDisplayState) {
    this.physicalDisplay = {
      radix: state.radix,
      bytesPerRow: state.bytesPerRow
    }
  }
  public updateLogicalOffsetState(state: OffsetState) {
    this.logicalOffset = {
      radix: state.radix,
      spread: state.spread
    }
  }
  public updateLogicalDisplayState(state: LogicalDisplayState) {
    this.logicalDisplay = {
      bytesPerRow: state.bytesPerRow
    }
  }
  public updateEditorDisplayState(state: EditorDisplayState) {
    this.editorDisplay = state
  }
  public updateEditorCurserPOS(pos: number) {
    this.editorDisplay.cursor = pos;
  }
}

export function fileExtensionType(filename: string): string {
    return filename.substring( filename.lastIndexOf('.') )
}

export function makeOffsetRange(state: OffsetState): string {
    return ((radix_: number): string => {
        switch (radix_) {
        // @formatter:off
        case 16:
            return (
            '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 A B C D E F'
            )
        case 10:
            return (
            '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5'
            )
        case 8:
            return (
            '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1  <br/>' +
            '0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7'
            )
        case 2:
            return (
            '00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666  <br/>' +
            '01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123  '
            )
        case -2:
            return '0 0 0 0 0 0 0 0 <br>' + '0 1 2 3 4 5 6 7'
        // @formatter:on
        }
        return 'unhandled radix'
    })(state.radix).replaceAll(' ', '&nbsp;'.repeat(state.spread))
}

export function makeAddressRange(state: AddressState): string {
  let i = state.start
  let result = (i * state.stride).toString(state.radix)
  for (++i; i < state.end; ++i) {
    result += '\n' + (i * state.stride).toString(state.radix)
  }
  return result
}

function radixBytePad(radix: number): number {
    switch (radix) {
      case 2:
        return 8
      case 8:
        return 3
      case 10:
        return 3
      case 16:
        return 2
    }
    return 0
}

export function encodeForDisplay(
    arr: Uint8Array,
    physicalDisplay: PhysicalDisplayState
  ): string {
    let result = ''
    if (arr.byteLength > 0) {
      const pad = radixBytePad(physicalDisplay.radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < physicalDisplay.bytesPerRow; ++col) {
          result += arr[i++].toString(physicalDisplay.radix).padStart(pad, '0') + ' '
        }
        result = result.slice(0, result.length - 1)
        if (i === arr.byteLength) {
          break
        }
        result += '\n'
      }
    }
    return result
}

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

export function logicalDisplay(bytes: ArrayBuffer, logicalDisplay: LogicalDisplayState): string {
  const undefinedCharStandIn = '�'
  let result = ''
  if (bytes.byteLength > 0) {
    const data = Buffer.from(bytes).toString('latin1').replaceAll('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < logicalDisplay.bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}