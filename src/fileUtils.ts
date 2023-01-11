
export type LogicalDisplayState = {
  bytesPerRow: number
}
export type EditorDisplayState = {
  encoding: BufferEncoding,
  start: number,
  end: number,
  cursor: number,
  radix: number
}
export class DisplayState {
    public logicalDisplay: LogicalDisplayState
    public editorDisplay: EditorDisplayState

  constructor(){
    this.logicalDisplay = { bytesPerRow: 16 }
    this.editorDisplay = { encoding: 'utf-8', start: 0, end: 0, cursor: 0, radix: 16 }
  }
  public updateLogicalDisplayState(state: LogicalDisplayState) {
    this.logicalDisplay = {
      bytesPerRow: state.bytesPerRow
    }
  }
  public updateEditorDisplayState(state: EditorDisplayState) {
    this.editorDisplay = state
  }
}

export function fileExtensionType(filename: string): string {
    return filename.substring( filename.lastIndexOf('.') )
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